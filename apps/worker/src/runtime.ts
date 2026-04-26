import type { StockerConfig } from '@stocker/config';
import type { Database } from '@stocker/db';
import type { JobService } from '@stocker/core';
import type { JobHandlers } from '@stocker/core';

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export type WorkerRuntimeOptions = {
  readonly config: StockerConfig;
  readonly database: Database;
  readonly jobService: JobService;
  readonly handlers: JobHandlers;
  readonly workerId: string;
  readonly pollingIntervalMs: number;
  readonly logger?: Pick<Console, 'info' | 'warn' | 'error' | 'debug'>;
};

export type WorkerRuntime = WorkerRuntimeOptions & {
  readonly runOnce: () => ReturnType<JobService['claimAndRunNextJob']>;
  readonly runLoop: (signal?: AbortSignal) => Promise<void>;
};

export function createWorkerRuntime(
  options: WorkerRuntimeOptions,
): WorkerRuntime {
  const logger = options.logger ?? console;

  const runtime: WorkerRuntime = {
    ...options,
    runOnce: async () => {
      const result = await options.jobService.claimAndRunNextJob(
        options.workerId,
        options.handlers,
      );

      if (result.status === 'succeeded') {
        logger.info(
          `[${options.workerId}] completed ${result.job.type} job ${result.job.id}`,
        );
      } else if (result.status === 'retry_scheduled') {
        logger.warn(
          `[${options.workerId}] retried ${result.job.type} job ${result.job.id}; next run at ${result.nextRunAfter}; last error: ${result.job.lastErrorMessage ?? 'unknown error'}`,
        );
      } else if (result.status === 'failed') {
        logger.error(
          `[${options.workerId}] failed ${result.job.type} job ${result.job.id}; last error: ${result.errorMessage}`,
        );
      }

      return result;
    },
    runLoop: async (signal?: AbortSignal) => {
      logger.info(
        `[${options.workerId}] worker loop started with ${options.pollingIntervalMs}ms poll interval`,
      );

      while (!signal?.aborted) {
        try {
          await runtime.runOnce();
        } catch (error) {
          logger.error(
            `[${options.workerId}] worker iteration failed: ${
              error instanceof Error ? error.message : 'Unknown worker failure'
            }`,
          );
        }

        if (signal?.aborted) {
          break;
        }

        await sleep(options.pollingIntervalMs);
      }

      logger.info(`[${options.workerId}] worker loop stopped`);
    },
  };

  return runtime;
}
