import { createCorrectionService } from '../corrections/correction-service';
import { createCompanyMatcher } from '../enrichment/company-matcher';
import { createItemEnrichmentService } from '../enrichment/item-enrichment-service';
import { createInboxService } from '../inbox/inbox-service';
import { createItemService } from '../items/item-service';
import { createJobService } from '../jobs/job-service';
import { createStockRefreshService } from '../market/stock-refresh-service';
import {
  createSourceRefreshService,
} from '../sources/source-refresh-service';
import { createSourceStatusService } from '../sources/source-status-service';
import type { AppServices, AppServicesDependencies } from './app-services';

export function createAppServices(
  dependencies: AppServicesDependencies,
): AppServices {
  const marketDataProvider = dependencies.marketDataProviderRegistry.get(
    dependencies.config.market.provider.type,
  );

  const jobService = createJobService({
    jobsRepository: dependencies.jobsRepository,
    now: dependencies.now,
  });

  const correctionService = createCorrectionService({
    tickerCorrectionsRepository: dependencies.tickerCorrectionsRepository,
    now: dependencies.now,
  });

  const stockRefreshService = createStockRefreshService({
    stockSnapshotsRepository: dependencies.stockSnapshotsRepository,
    marketDataProvider,
    now: dependencies.now,
    universe: dependencies.config.market.defaultUniverse,
  });

  const companyMatcher = createCompanyMatcher({
    tickerCorrectionsRepository: dependencies.tickerCorrectionsRepository,
    marketDataProvider,
    now: dependencies.now,
    universe: dependencies.config.market.defaultUniverse,
  });

  const itemEnrichmentService = createItemEnrichmentService({
    sourceItemsRepository: dependencies.sourceItemsRepository,
    enrichmentRepository: dependencies.enrichmentRepository,
    stockSnapshotsRepository: dependencies.stockSnapshotsRepository,
    llmProvider: dependencies.llmProvider,
    companyMatcher,
    marketDataProvider,
    now: dependencies.now,
    universe: dependencies.config.market.defaultUniverse,
  });

  const sourceRefreshService = createSourceRefreshService({
    sourcesRepository: dependencies.sourcesRepository,
    sourceItemsRepository: dependencies.sourceItemsRepository,
    jobService,
    sourceAdapters: dependencies.sourceAdapters,
    now: dependencies.now,
    fetch: dependencies.fetch,
    logger: dependencies.logger,
  });

  const sourceStatusService = createSourceStatusService({
    sourcesRepository: dependencies.sourcesRepository,
  });

  const inboxService = createInboxService({
    sourceItemsRepository: dependencies.sourceItemsRepository,
    sourcesRepository: dependencies.sourcesRepository,
  });

  const itemService = createItemService({
    sourceItemsRepository: dependencies.sourceItemsRepository,
    sourcesRepository: dependencies.sourcesRepository,
    jobService,
  });

  return {
    inboxService,
    itemService,
    sourceRefreshService,
    sourceStatusService,
    jobService,
    itemEnrichmentService,
    stockRefreshService,
    correctionService,
    marketDataProvider,
  };
}
