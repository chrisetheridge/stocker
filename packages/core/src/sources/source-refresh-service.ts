import { randomUUID } from 'node:crypto';

import type {
  SourceRecord,
  SourcesRepository,
  SourceItemsRepository,
} from '@stocker/db';
import type {
  SourceAdapterRegistry,
  SourceAdapterType,
  SourceFetchContext,
  SourceFetchLogger,
} from '@stocker/source-adapters';

import type { JobService } from '../jobs/job-service';
import { createSourceScheduler, SourceScheduler } from './source-scheduler';
import {
  createSourceStatusService,
  SourceStatusService,
} from './source-status-service';
import type { SourceRefreshJobPayload } from '../jobs/job-payloads';

export type SourceRefreshTrigger = SourceRefreshJobPayload['trigger'];

export type SourceRefreshSucceeded = {
  readonly status: 'succeeded';
  readonly sourceId: string;
  readonly sourceName: string;
  readonly fetchedAt: string;
  readonly itemsFetched: number;
  readonly newItems: number;
  readonly jobsEnqueued: number;
  readonly warnings: string[];
};

export type SourceRefreshSkipped = {
  readonly status: 'skipped';
  readonly sourceId: string;
  readonly sourceName: string;
  readonly reason: 'disabled';
};

export type SourceRefreshFailed = {
  readonly status: 'failed';
  readonly sourceId: string;
  readonly sourceName: string;
  readonly errorMessage: string;
  readonly warnings: string[];
};

export type SourceRefreshResult =
  | SourceRefreshSucceeded
  | SourceRefreshSkipped
  | SourceRefreshFailed;

export type SourceRefreshServiceDependencies = {
  readonly sourcesRepository: Pick<
    SourcesRepository,
    'listSourceStatus' | 'markFetchSuccess' | 'markFetchFailure'
  >;
  readonly sourceItemsRepository: Pick<
    SourceItemsRepository,
    'findBySourceAndExternalId' | 'upsertFromSource'
  >;
  readonly jobService: Pick<
    JobService,
    'enqueueItemEnrichment' | 'enqueueSourceRefresh'
  >;
  readonly sourceAdapters: SourceAdapterRegistry;
  readonly now?: () => string;
  readonly fetch?: typeof fetch;
  readonly logger?: SourceFetchLogger;
  readonly scheduler?: SourceScheduler;
  readonly statusService?: SourceStatusService;
};

const defaultNow = (): string => new Date().toISOString();

function resolveNow(now?: () => string): string {
  return (now ?? defaultNow)();
}

function formatErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unknown source refresh failure';
}

function resolveFetch(fetchImpl?: typeof fetch): typeof fetch {
  return fetchImpl ?? globalThis.fetch.bind(globalThis);
}

export class SourceRefreshService {
  private readonly scheduler: SourceScheduler;
  private readonly statusService: SourceStatusService;

  constructor(private readonly dependencies: SourceRefreshServiceDependencies) {
    this.scheduler =
      dependencies.scheduler ??
      createSourceScheduler({
        sourcesRepository: dependencies.sourcesRepository,
        jobService: dependencies.jobService,
        sourceAdapters: dependencies.sourceAdapters,
        logger: dependencies.logger,
      });
    this.statusService =
      dependencies.statusService ??
      createSourceStatusService({
        sourcesRepository: dependencies.sourcesRepository,
      });
  }

  async refreshSource(
    sourceId: string,
    trigger: SourceRefreshTrigger,
  ): Promise<SourceRefreshResult> {
    const source = await this.loadSource(sourceId);
    if (!source) {
      throw new Error(`Source not found: ${sourceId}`);
    }

    if (!source.enabled) {
      return {
        status: 'skipped',
        sourceId: source.id,
        sourceName: source.name,
        reason: 'disabled',
      };
    }

    const now = resolveNow(this.dependencies.now);
    const logger = this.dependencies.logger ?? console;
    logger.info(
      `Refreshing source ${source.id} (${source.name}) via ${trigger} trigger`,
    );

    try {
      const adapter = this.dependencies.sourceAdapters.get(
        source.type as SourceAdapterType,
      );
      const config = adapter.validateConfig(source.config);
      const fetchContext: SourceFetchContext = {
        sourceId: source.id,
        sourceName: source.name,
        now,
        fetch: resolveFetch(this.dependencies.fetch),
        logger,
      };
      const fetchResult = await adapter.fetchItems(config, fetchContext);

      let newItems = 0;
      let jobsEnqueued = 0;
      for (const item of fetchResult.items) {
        const existing =
          await this.dependencies.sourceItemsRepository.findBySourceAndExternalId(
            source.id,
            item.externalId,
          );

        const sourceItem =
          await this.dependencies.sourceItemsRepository.upsertFromSource({
            id: existing?.id ?? randomUUID(),
            sourceId: source.id,
            externalId: item.externalId,
            canonicalUrl: item.canonicalUrl,
            title: item.title,
            summary: item.summary,
            author: item.author,
            publishedAt: item.publishedAt,
            fetchedAt: fetchResult.fetchedAt,
            sourceMetadata: item.sourceMetadata,
            readState: existing?.readState ?? 'unread',
            savedForResearch: existing?.savedForResearch ?? false,
            enrichmentState: existing?.enrichmentState ?? 'pending',
            createdAt: existing?.createdAt ?? now,
            updatedAt: now,
          });

        if (!existing) {
          newItems += 1;
          jobsEnqueued += 1;
          await this.dependencies.jobService.enqueueItemEnrichment(
            sourceItem.id,
            'source-refresh',
          );
        }
      }

      await this.dependencies.sourcesRepository.markFetchSuccess(
        source.id,
        fetchResult.fetchedAt,
      );

      return {
        status: 'succeeded',
        sourceId: source.id,
        sourceName: source.name,
        fetchedAt: fetchResult.fetchedAt,
        itemsFetched: fetchResult.items.length,
        newItems,
        jobsEnqueued,
        warnings: fetchResult.warnings,
      };
    } catch (error) {
      const errorMessage = formatErrorMessage(error);
      await this.dependencies.sourcesRepository.markFetchFailure(
        source.id,
        errorMessage,
        now,
      );

      return {
        status: 'failed',
        sourceId: source.id,
        sourceName: source.name,
        errorMessage,
        warnings: [],
      };
    }
  }

  async refreshAllEnabledSources(
    trigger: SourceRefreshTrigger,
  ): Promise<SourceRefreshResult[]> {
    const sources =
      await this.dependencies.sourcesRepository.listSourceStatus();
    const results: SourceRefreshResult[] = [];

    for (const source of sources) {
      if (!source.enabled) {
        continue;
      }

      try {
        results.push(await this.refreshSource(source.id, trigger));
      } catch (error) {
        results.push({
          status: 'failed',
          sourceId: source.id,
          sourceName: source.name,
          errorMessage: formatErrorMessage(error),
          warnings: [],
        });
      }
    }

    return results;
  }

  async scheduleDueSourceRefreshJobs(
    now: string,
  ): Promise<
    Awaited<ReturnType<SourceScheduler['scheduleDueSourceRefreshJobs']>>
  > {
    return this.scheduler.scheduleDueSourceRefreshJobs(now);
  }

  async listSourceStatus(): Promise<SourceRecord[]> {
    return this.statusService.listSourceStatus();
  }

  private async loadSource(sourceId: string): Promise<SourceRecord | null> {
    const sources =
      await this.dependencies.sourcesRepository.listSourceStatus();
    return sources.find((source) => source.id === sourceId) ?? null;
  }
}

export function createSourceRefreshService(
  dependencies: SourceRefreshServiceDependencies,
): SourceRefreshService {
  return new SourceRefreshService(dependencies);
}
