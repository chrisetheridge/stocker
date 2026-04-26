import type { StockerConfig } from '@stocker/config';
import type { LlmProvider } from '@stocker/llm';
import type {
  MarketDataProviderRegistry,
  MarketDataProvider,
} from '@stocker/market-data';
import type { SourceAdapterRegistry } from '@stocker/source-adapters';
import type {
  EnrichmentRepository,
  JobsRepository,
  SourceItemsRepository,
  SourcesRepository,
  StockSnapshotsRepository,
  TickerCorrectionsRepository,
} from '@stocker/db';

import type { CorrectionService } from '../corrections/correction-service';
import type { InboxService } from '../inbox/inbox-service';
import type { ItemService } from '../items/item-service';
import type { JobService } from '../jobs/job-service';
import type { ItemEnrichmentService } from '../enrichment/item-enrichment-service';
import type { StockRefreshService } from '../market/stock-refresh-service';
import type { SourceRefreshService } from '../sources/source-refresh-service';
import type { SourceStatusService } from '../sources/source-status-service';

export type AppServicesDependencies = {
  readonly config: StockerConfig;
  readonly sourceItemsRepository: SourceItemsRepository;
  readonly sourcesRepository: SourcesRepository;
  readonly enrichmentRepository: EnrichmentRepository;
  readonly stockSnapshotsRepository: StockSnapshotsRepository;
  readonly tickerCorrectionsRepository: TickerCorrectionsRepository;
  readonly jobsRepository: JobsRepository;
  readonly sourceAdapters: SourceAdapterRegistry;
  readonly marketDataProviderRegistry: MarketDataProviderRegistry;
  readonly llmProvider: LlmProvider;
  readonly logger?: Pick<Console, 'info' | 'warn' | 'error' | 'debug'>;
  readonly now?: () => string;
  readonly fetch?: typeof fetch;
};

export type AppServices = {
  readonly inboxService: InboxService;
  readonly itemService: ItemService;
  readonly sourceRefreshService: SourceRefreshService;
  readonly sourceStatusService: SourceStatusService;
  readonly jobService: JobService;
  readonly itemEnrichmentService: ItemEnrichmentService;
  readonly stockRefreshService: StockRefreshService;
  readonly correctionService: CorrectionService;
  readonly marketDataProvider: MarketDataProvider;
};
