import fs from 'node:fs/promises';
import path from 'node:path';

import { loadConfigFromEnv } from '@stocker/config';
import { createAppServices, type AppServices } from '@stocker/core';
import {
  createDatabase,
  createDatabaseClient,
  createEnrichmentRepository,
  createJobsRepository,
  createSourceItemsRepository,
  createSourcesRepository,
  createStockSnapshotsRepository,
  createTickerCorrectionsRepository,
} from '@stocker/db';
import { migrateDatabase } from '@stocker/db/migrate';
import {
  createMarketDataProviderRegistry,
  createYahooFinanceMarketDataProvider,
} from '@stocker/market-data';
import { createOpenAiCompatibleLlmProvider } from '@stocker/llm';
import {
  createSourceAdapterRegistry,
  redditAdapter,
  rssAdapter,
} from '@stocker/source-adapters';

export type WorkerServicesBundle = {
  config: Awaited<ReturnType<typeof loadConfigFromEnv>>;
  client: ReturnType<typeof createDatabaseClient>;
  database: ReturnType<typeof createDatabase>;
  services: AppServices;
};

async function resolveWorkspaceRoot(startDir = process.cwd()): Promise<string> {
  let currentDir = path.resolve(startDir);

  for (;;) {
    try {
      await fs.access(path.join(currentDir, 'pnpm-workspace.yaml'));
      return currentDir;
    } catch {
      const parentDir = path.dirname(currentDir);
      if (parentDir === currentDir) {
        return path.resolve(startDir);
      }

      currentDir = parentDir;
    }
  }
}

function toDatabaseUrl(databasePath: string, workspaceRoot: string): string {
  if (databasePath.startsWith('file:')) {
    return databasePath;
  }

  return `file:${path.resolve(workspaceRoot, databasePath)}`;
}

export async function createWorkerServicesBundle(): Promise<WorkerServicesBundle> {
  const config = await loadConfigFromEnv();
  const workspaceRoot = await resolveWorkspaceRoot();
  const databaseUrl = toDatabaseUrl(config.app.databasePath, workspaceRoot);
  await migrateDatabase({ databaseUrl });
  const client = createDatabaseClient(databaseUrl);
  const database = createDatabase(client);
  const now = new Date().toISOString();

  const jobsRepository = createJobsRepository(database);
  const sourcesRepository = createSourcesRepository(database);
  const sourceItemsRepository = createSourceItemsRepository(database);
  const enrichmentRepository = createEnrichmentRepository(database);
  const stockSnapshotsRepository = createStockSnapshotsRepository(database);
  const tickerCorrectionsRepository =
    createTickerCorrectionsRepository(database);

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

  const marketDataProviderRegistry = createMarketDataProviderRegistry([
    createYahooFinanceMarketDataProvider(),
  ]);
  const sourceAdapters = createSourceAdapterRegistry([
    rssAdapter,
    redditAdapter,
  ]);
  const llmProvider = createOpenAiCompatibleLlmProvider({
    baseURL: config.llm.provider.baseUrl,
    apiKey: process.env[config.llm.provider.apiKeyEnv],
    modelName: config.llm.provider.model,
    providerName: config.llm.provider.type,
    promptOverride: config.llm.prompts.enrichmentSystem,
  });

  const services = createAppServices({
    config,
    sourceItemsRepository,
    sourcesRepository,
    enrichmentRepository,
    stockSnapshotsRepository,
    tickerCorrectionsRepository,
    jobsRepository,
    sourceAdapters,
    marketDataProviderRegistry,
    llmProvider,
    logger: console,
  });

  return {
    config,
    client,
    database,
    services,
  };
}
