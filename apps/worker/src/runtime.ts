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
};

export type WorkerRuntime = WorkerRuntimeOptions & {
  readonly runOnce: () => ReturnType<JobService['claimAndRunNextJob']>;
  readonly runLoop: (signal?: AbortSignal) => Promise<void>;
};

export function createWorkerRuntime(
  options: WorkerRuntimeOptions,
): WorkerRuntime {
  const runtime: WorkerRuntime = {
    ...options,
    runOnce: async () => {
      return options.jobService.claimAndRunNextJob(
        options.workerId,
        options.handlers,
      );
    },
    runLoop: async (signal?: AbortSignal) => {
      while (!signal?.aborted) {
        await runtime.runOnce();

        if (signal?.aborted) {
          break;
        }

        await sleep(options.pollingIntervalMs);
      }
    },
  };

  return runtime;
}
