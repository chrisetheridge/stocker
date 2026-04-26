import {
  createItemEnrichJobHandler,
  createJobHandlers,
  createSourceRefreshJobHandler,
  createStockRefreshJobHandler,
} from '@stocker/core';

import { createWorkerRuntime } from './runtime';
import { createWorkerServicesBundle } from './services';

async function main(): Promise<void> {
  const { config, client, database, services } =
    await createWorkerServicesBundle();

  const handlers = createJobHandlers({
    sourceRefresh: createSourceRefreshJobHandler({
      sourceRefreshService: services.sourceRefreshService,
    }),
    itemEnrich: createItemEnrichJobHandler({
      itemEnrichmentService: services.itemEnrichmentService,
    }),
    stockRefresh: createStockRefreshJobHandler({
      stockRefreshService: services.stockRefreshService,
    }),
  });

  const runtime = createWorkerRuntime({
    config,
    database,
    jobService: services.jobService,
    handlers,
    workerId: `worker-${process.pid}`,
    pollingIntervalMs: 1_000,
    logger: console,
  });

  const abortController = new AbortController();
  const stop = (): void => abortController.abort();
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);

  try {
    await runtime.runLoop(abortController.signal);
  } finally {
    process.off('SIGINT', stop);
    process.off('SIGTERM', stop);
    await client.close();
  }
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
