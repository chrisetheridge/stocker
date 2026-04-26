import { randomUUID } from 'node:crypto';

import type {
  EnrichmentRepository,
  ItemCompanyInput,
  ItemCompanyRecord,
  ItemEnrichmentRecord,
  SourceItemsRepository,
  StockSnapshotRecord,
  StockSnapshotsRepository,
  StockSnapshotInput as DbStockSnapshotInput,
} from '@stocker/db';
import type { EnrichmentOutput, LlmProvider } from '@stocker/llm';
import type {
  MarketDataProvider,
  StockSnapshotInput as MarketSnapshotInput,
} from '@stocker/market-data';

import { createCompanyMatcher, type CompanyMatcher } from './company-matcher';

export type ItemEnrichmentTrigger =
  | 'manual'
  | 'scheduled'
  | 'source-refresh'
  | 'item-open'
  | 'retry';

export type ItemEnrichmentSucceeded = {
  readonly status: 'succeeded';
  readonly sourceItemId: string;
  readonly enrichmentState: 'complete';
  readonly runId: string;
  readonly enrichment: ItemEnrichmentRecord;
  readonly companies: ItemCompanyRecord[];
  readonly snapshots: StockSnapshotRecord[];
};

export type ItemEnrichmentFailed = {
  readonly status: 'failed';
  readonly sourceItemId: string;
  readonly errorMessage: string;
};

export type ItemEnrichmentResult =
  | ItemEnrichmentSucceeded
  | ItemEnrichmentFailed;

export type ItemEnrichmentServiceDependencies = {
  readonly sourceItemsRepository: Pick<
    SourceItemsRepository,
    'getItemDetail' | 'setEnrichmentState'
  >;
  readonly enrichmentRepository: Pick<
    EnrichmentRepository,
    | 'startRun'
    | 'completeRun'
    | 'failRun'
    | 'upsertItemEnrichment'
    | 'replaceItemCompanies'
  >;
  readonly stockSnapshotsRepository: Pick<
    StockSnapshotsRepository,
    'insertSnapshot' | 'getLatestSnapshot'
  >;
  readonly llmProvider: LlmProvider;
  readonly companyMatcher: Pick<CompanyMatcher, 'matchCompanies'>;
  readonly marketDataProvider: Pick<MarketDataProvider, 'getSnapshot'>;
  readonly now?: () => string;
  readonly universe?: string;
  readonly logger?: Pick<Console, 'info' | 'warn' | 'error' | 'debug'>;
};

const defaultNow = (): string => new Date().toISOString();

function resolveNow(now?: () => string): string {
  return (now ?? defaultNow)();
}

function formatErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown enrichment failure';
}

function resolveLogger(
  logger?: Pick<Console, 'info' | 'warn' | 'error' | 'debug'>,
): Pick<Console, 'info' | 'warn' | 'error' | 'debug'> {
  return logger ?? console;
}

function toStoredSnapshot(
  snapshot: MarketSnapshotInput,
  now: string,
): DbStockSnapshotInput {
  return {
    ...snapshot,
    createdAt: now,
  };
}

function summarizeCompanies(companies: ItemCompanyInput[]): string | null {
  if (companies.length === 0) {
    return 'No public companies detected';
  }

  return companies.map((company) => company.companyName).join(', ');
}

async function resolveSnapshotForTicker(
  dependencies: ItemEnrichmentServiceDependencies,
  ticker: string,
  now: string,
): Promise<StockSnapshotRecord | null> {
  try {
    const liveSnapshot = await dependencies.marketDataProvider.getSnapshot({
      ticker,
      universe: dependencies.universe ?? 'US',
    });

    if (liveSnapshot) {
      return dependencies.stockSnapshotsRepository.insertSnapshot(
        toStoredSnapshot(liveSnapshot, now),
      );
    }
  } catch {
    // fall through to cache
  }

  return dependencies.stockSnapshotsRepository.getLatestSnapshot(ticker);
}

export class ItemEnrichmentService {
  constructor(
    private readonly dependencies: ItemEnrichmentServiceDependencies,
  ) {}

  async enrichItem(
    sourceItemId: string,
    _trigger: ItemEnrichmentTrigger,
  ): Promise<ItemEnrichmentResult> {
    const now = resolveNow(this.dependencies.now);
    const logger = resolveLogger(this.dependencies.logger);
    const detail =
      await this.dependencies.sourceItemsRepository.getItemDetail(sourceItemId);

    if (!detail) {
      logger.error(`[item:${sourceItemId}] item not found`);
      return {
        status: 'failed',
        sourceItemId,
        errorMessage: `Item not found: ${sourceItemId}`,
      };
    }

    const run = await this.dependencies.enrichmentRepository.startRun(
      sourceItemId,
      now,
    );
    logger.info(
      `[item:${sourceItemId}] started enrichment run ${run.id} for "${detail.item.title}"`,
    );

    try {
      logger.debug(
        `[item:${sourceItemId}] requesting LLM extraction from ${this.dependencies.llmProvider.providerName ?? this.dependencies.llmProvider.type}/${this.dependencies.llmProvider.modelName ?? 'unknown-model'}`,
      );
      const llmOutput: EnrichmentOutput =
        await this.dependencies.llmProvider.extractStockRelevance({
          title: detail.item.title,
          summary: detail.item.summary ?? undefined,
          author: detail.item.author ?? undefined,
          canonicalUrl: detail.item.canonicalUrl,
          sourceMetadata: detail.item.sourceMetadata,
        });

      const matchedCompanies =
        await this.dependencies.companyMatcher.matchCompanies({
          sourceItemId,
          candidates: llmOutput.companies,
        });
      logger.debug(
        `[item:${sourceItemId}] matched ${matchedCompanies.length} companies`,
      );

      const companyRecords =
        await this.dependencies.enrichmentRepository.replaceItemCompanies(
          sourceItemId,
          matchedCompanies,
        );

      const snapshots: StockSnapshotRecord[] = [];
      for (const company of matchedCompanies) {
        if (!company.ticker) {
          continue;
        }

        const snapshot = await resolveSnapshotForTicker(
          this.dependencies,
          company.ticker,
          now,
        );
        if (snapshot) {
          snapshots.push(snapshot);
        }
      }

      const enrichmentState = 'complete' as const;

      const enrichment =
        await this.dependencies.enrichmentRepository.upsertItemEnrichment({
          id: randomUUID(),
          sourceItemId,
          state: enrichmentState,
          summary: summarizeCompanies(matchedCompanies),
          modelProvider:
            this.dependencies.llmProvider.providerName ??
            this.dependencies.llmProvider.type,
          modelName: this.dependencies.llmProvider.modelName,
          promptVersion:
            this.dependencies.llmProvider.promptVersion ?? '2026-04-25',
          completedAt: now,
          errorMessage: null,
          createdAt: now,
          updatedAt: now,
        });

      await this.dependencies.enrichmentRepository.completeRun(
        run.id,
        llmOutput,
        now,
      );
      await this.dependencies.sourceItemsRepository.setEnrichmentState(
        sourceItemId,
        enrichmentState,
      );
      logger.info(
        `[item:${sourceItemId}] completed enrichment run ${run.id} as ${enrichmentState}`,
      );

      return {
        status: 'succeeded',
        sourceItemId,
        enrichmentState,
        runId: run.id,
        enrichment,
        companies: companyRecords,
        snapshots,
      };
    } catch (error) {
      const errorMessage = formatErrorMessage(error);
      logger.error(
        `[item:${sourceItemId}] failed enrichment run ${run.id}: ${errorMessage}`,
      );

      await this.dependencies.enrichmentRepository.failRun(
        run.id,
        errorMessage,
        now,
      );
      await this.dependencies.enrichmentRepository.upsertItemEnrichment({
        id: randomUUID(),
        sourceItemId,
        state: 'failed',
        summary: null,
        modelProvider:
          this.dependencies.llmProvider.providerName ??
          this.dependencies.llmProvider.type,
        modelName: this.dependencies.llmProvider.modelName,
        promptVersion:
          this.dependencies.llmProvider.promptVersion ?? '2026-04-25',
        completedAt: now,
        errorMessage,
        createdAt: now,
        updatedAt: now,
      });
      await this.dependencies.sourceItemsRepository.setEnrichmentState(
        sourceItemId,
        'failed',
      );

      return {
        status: 'failed',
        sourceItemId,
        errorMessage,
      };
    }
  }
}

export function createItemEnrichmentService(
  dependencies: ItemEnrichmentServiceDependencies,
): ItemEnrichmentService {
  return new ItemEnrichmentService(dependencies);
}
