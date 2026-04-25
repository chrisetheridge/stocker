import { loadConfigFromEnv } from '@stocker/config';
import {
  createJobService,
  createJobHandlers,
  createSourceRefreshJobHandler,
  createSourceRefreshService,
} from '@stocker/core';
import {
  createDatabase,
  createDatabaseClient,
  createJobsRepository,
  createSourceItemsRepository,
  createSourcesRepository,
} from '@stocker/db';
import {
  createSourceAdapterRegistry,
  redditAdapter,
  rssAdapter,
} from '@stocker/source-adapters';
import path from 'node:path';

import { createWorkerRuntime } from './runtime';

function toDatabaseUrl(databasePath: string): string {
  if (databasePath.startsWith('file:')) {
    return databasePath;
  }

  return `file:${path.resolve(databasePath)}`;
}

async function main(): Promise<void> {
  const config = await loadConfigFromEnv();
  const client = createDatabaseClient(toDatabaseUrl(config.app.databasePath));
  const database = createDatabase(client);
  const jobsRepository = createJobsRepository(database);
  const sourcesRepository = createSourcesRepository(database);
  const sourceItemsRepository = createSourceItemsRepository(database);
  const jobService = createJobService({ jobsRepository });
  const now = new Date().toISOString();

  for (const source of config.sources) {
    await sourcesRepository.upsertConfiguredSource({
      id: source.id,
      type: source.type,
      name: source.name,
      enabled: source.enabled,
      config: source,
      createdAt: now,
      updatedAt: now,
    });
  }

  const sourceRefreshService = createSourceRefreshService({
    sourcesRepository,
    sourceItemsRepository,
    jobService,
    sourceAdapters: createSourceAdapterRegistry([rssAdapter, redditAdapter]),
  });

  const handlers = createJobHandlers({
    sourceRefresh: createSourceRefreshJobHandler({
      sourceRefreshService,
    }),
    itemEnrich: async () => {
      throw new Error('item.enrich handler is not wired yet');
    },
    stockRefresh: async () => {
      throw new Error('stock.refresh handler is not wired yet');
    },
  });

  const runtime = createWorkerRuntime({
    config,
    database,
    jobService,
    handlers,
    workerId: `worker-${process.pid}`,
    pollingIntervalMs: 1_000,
  });

  console.log(`[${runtime.workerId}] started in polling mode`);

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
