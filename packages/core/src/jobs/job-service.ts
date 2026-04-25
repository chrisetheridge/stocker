import type { JobRecord, JobsRepository, JsonRecord } from '@stocker/db';
import { ZodError } from 'zod';

import type { JobType } from '../domain/enums';
import type { JobHandlers } from './job-handlers';
import {
  jobPayloadSchemas,
  parseJobPayload,
  type ItemEnrichJobPayload,
  type JobPayload,
  type SourceRefreshJobPayload,
  type StockRefreshJobPayload,
} from './job-payloads';

export type JobServiceDependencies = {
  readonly jobsRepository: JobsRepository;
  readonly now?: () => string;
};

export type EnqueueOptions = {
  readonly runAfter?: string;
  readonly maxAttempts?: number;
};

export type JobExecutionResult =
  | { readonly status: 'idle' }
  | { readonly status: 'succeeded'; readonly job: JobRecord }
  | {
      readonly status: 'retry_scheduled';
      readonly job: JobRecord;
      readonly nextRunAfter: string;
    }
  | {
      readonly status: 'failed';
      readonly job: JobRecord;
      readonly errorMessage: string;
    };

const defaultNow = (): string => new Date().toISOString();

function resolveNow(now?: () => string): string {
  return (now ?? defaultNow)();
}

function formatErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unknown job failure';
}

function zodErrorMessage(error: ZodError): string {
  return error.issues.map((issue) => issue.message).join('; ');
}

function nextAttemptCount(job: JobRecord): number {
  return job.attemptCount + 1;
}

export class JobService {
  constructor(private readonly dependencies: JobServiceDependencies) {}

  async enqueueSourceRefresh(
    sourceId: string,
    trigger: SourceRefreshJobPayload['trigger'],
    options: EnqueueOptions = {},
  ): Promise<JobRecord> {
    const payload = jobPayloadSchemas['source.refresh'].parse({
      sourceId,
      trigger,
    });
    const now = resolveNow(this.dependencies.now);

    return this.dependencies.jobsRepository.enqueue(
      'source.refresh',
      payload as JsonRecord,
      {
        runAfter: options.runAfter,
        maxAttempts: options.maxAttempts,
        createdAt: now,
        updatedAt: now,
      },
    );
  }

  async enqueueItemEnrichment(
    sourceItemId: string,
    trigger: ItemEnrichJobPayload['trigger'],
    options: EnqueueOptions = {},
  ): Promise<JobRecord> {
    const payload = jobPayloadSchemas['item.enrich'].parse({
      sourceItemId,
      trigger,
    });
    const now = resolveNow(this.dependencies.now);

    return this.dependencies.jobsRepository.enqueue(
      'item.enrich',
      payload as JsonRecord,
      {
        runAfter: options.runAfter,
        maxAttempts: options.maxAttempts,
        createdAt: now,
        updatedAt: now,
      },
    );
  }

  async enqueueStockRefresh(
    sourceItemId: string,
    ticker: string,
    trigger: StockRefreshJobPayload['trigger'],
    options: EnqueueOptions = {},
  ): Promise<JobRecord> {
    const payload = jobPayloadSchemas['stock.refresh'].parse({
      sourceItemId,
      ticker,
      trigger,
    });
    const now = resolveNow(this.dependencies.now);

    return this.dependencies.jobsRepository.enqueue(
      'stock.refresh',
      payload as JsonRecord,
      {
        runAfter: options.runAfter,
        maxAttempts: options.maxAttempts,
        createdAt: now,
        updatedAt: now,
      },
    );
  }

  async claimAndRunNextJob(
    workerId: string,
    handlers: JobHandlers,
  ): Promise<JobExecutionResult> {
    const now = resolveNow(this.dependencies.now);
    const job = await this.dependencies.jobsRepository.claimNext(workerId, now);
    if (!job) {
      return { status: 'idle' };
    }

    const payloadResult = parseJobPayload(job.type, job.payload);
    if (!payloadResult.success) {
      const errorMessage = zodErrorMessage(payloadResult.error);
      await this.dependencies.jobsRepository.markFailed(
        job.id,
        errorMessage,
        now,
      );
      return {
        status: 'failed',
        job,
        errorMessage,
      };
    }

    try {
      await this.runJob(job.type as JobType, payloadResult.data, handlers);
      const completed = await this.dependencies.jobsRepository.markSucceeded(
        job.id,
        now,
      );
      return {
        status: 'succeeded',
        job: completed ?? job,
      };
    } catch (error) {
      const errorMessage = formatErrorMessage(error);
      const shouldRetry = nextAttemptCount(job) < job.maxAttempts;
      if (shouldRetry) {
        const nextRunAfter = now;
        const retried = await this.dependencies.jobsRepository.reschedule(
          job.id,
          nextRunAfter,
          errorMessage,
          now,
        );
        return {
          status: 'retry_scheduled',
          job: retried ?? job,
          nextRunAfter,
        };
      }

      const failed = await this.dependencies.jobsRepository.markFailed(
        job.id,
        errorMessage,
        now,
      );
      return {
        status: 'failed',
        job: failed ?? job,
        errorMessage,
      };
    }
  }

  private async runJob(
    type: JobType,
    payload: JobPayload,
    handlers: JobHandlers,
  ): Promise<void> {
    if (type === 'source.refresh') {
      await handlers.sourceRefresh(payload as SourceRefreshJobPayload);
      return;
    }

    if (type === 'item.enrich') {
      await handlers.itemEnrich(payload as ItemEnrichJobPayload);
      return;
    }

    if (type === 'stock.refresh') {
      await handlers.stockRefresh(payload as StockRefreshJobPayload);
      return;
    }

    const _exhaustiveCheck: never = type;
    return _exhaustiveCheck;
  }
}

export function createJobService(
  dependencies: JobServiceDependencies,
): JobService {
  return new JobService(dependencies);
}
