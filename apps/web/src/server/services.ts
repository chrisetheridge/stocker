import { loadConfigFromEnv } from '@stocker/config';
import {
  createAppServices,
  type AppServices,
} from '@stocker/core';
import {
  createEnrichmentRepository,
  createJobsRepository,
  createSourceItemsRepository,
  createSourcesRepository,
  createStockSnapshotsRepository,
  createTickerCorrectionsRepository,
} from '@stocker/db';
import {
  createMarketDataProviderRegistry,
  createYahooFinanceMarketDataProvider,
} from '@stocker/market-data';
import {
  createOpenAiCompatibleLlmProvider,
} from '@stocker/llm';
import {
  createSourceAdapterRegistry,
  redditAdapter,
  rssAdapter,
} from '@stocker/source-adapters';

import { db } from '~/server/db';

let appServicesPromise: Promise<AppServices> | null = null;

async function initializeAppServices(): Promise<AppServices> {
  const config = await loadConfigFromEnv();
  const now = new Date().toISOString();

  const jobsRepository = createJobsRepository(db);
  const sourcesRepository = createSourcesRepository(db);
  const sourceItemsRepository = createSourceItemsRepository(db);
  const enrichmentRepository = createEnrichmentRepository(db);
  const stockSnapshotsRepository = createStockSnapshotsRepository(db);
  const tickerCorrectionsRepository = createTickerCorrectionsRepository(db);

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
  const sourceAdapters = createSourceAdapterRegistry([rssAdapter, redditAdapter]);
  const llmProvider = createOpenAiCompatibleLlmProvider({
    baseURL: config.llm.provider.baseUrl,
    apiKey: process.env[config.llm.provider.apiKeyEnv],
    modelName: config.llm.provider.model,
    providerName: config.llm.provider.type,
    promptOverride: config.llm.prompts.enrichmentSystem,
  });

  return createAppServices({
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
}

export function getAppServices(): Promise<AppServices> {
  appServicesPromise ??= initializeAppServices();
  return appServicesPromise;
}
