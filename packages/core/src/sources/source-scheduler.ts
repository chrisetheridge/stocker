import type { JobRecord, SourceRecord, SourcesRepository } from '@stocker/db';

import type { JobService } from '../jobs/job-service';
import type {
  SourceAdapterRegistry,
  SourceFetchLogger,
  SourceAdapterType,
} from '@stocker/source-adapters';

type SourceSchedulerDependencies = {
  readonly sourcesRepository: Pick<SourcesRepository, 'listSourceStatus'>;
  readonly jobService: Pick<JobService, 'enqueueSourceRefresh'>;
  readonly sourceAdapters: SourceAdapterRegistry;
  readonly logger?: SourceFetchLogger;
};

function isDue(
  source: SourceRecord,
  now: string,
  refreshMinutes: number,
): boolean {
  if (!source.lastFetchedAt) {
    return true;
  }

  const elapsedMs = Date.parse(now) - Date.parse(source.lastFetchedAt);
  if (!Number.isFinite(elapsedMs)) {
    return true;
  }

  return elapsedMs >= refreshMinutes * 60_000;
}

export class SourceScheduler {
  constructor(private readonly dependencies: SourceSchedulerDependencies) {}

  async scheduleDueSourceRefreshJobs(now: string): Promise<JobRecord[]> {
    const sources =
      await this.dependencies.sourcesRepository.listSourceStatus();
    const scheduledJobs: JobRecord[] = [];
    const logger = this.dependencies.logger ?? console;

    for (const source of sources) {
      if (!source.enabled) {
        continue;
      }

      try {
        const adapter = this.dependencies.sourceAdapters.get(
          source.type as SourceAdapterType,
        );
        const config = adapter.validateConfig(source.config) as {
          refreshMinutes: number;
        };
        if (!isDue(source, now, config.refreshMinutes)) {
          continue;
        }

        scheduledJobs.push(
          await this.dependencies.jobService.enqueueSourceRefresh(
            source.id,
            'scheduled',
            {
              runAfter: now,
            },
          ),
        );
      } catch (error) {
        logger.error(
          `Failed to schedule source refresh for ${source.id}: ${
            error instanceof Error
              ? error.message
              : 'Unknown scheduling failure'
          }`,
        );
      }
    }

    return scheduledJobs;
  }
}

export function createSourceScheduler(
  dependencies: SourceSchedulerDependencies,
): SourceScheduler {
  return new SourceScheduler(dependencies);
}
