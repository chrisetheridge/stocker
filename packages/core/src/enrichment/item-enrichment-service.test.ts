import { describe, expect, it, vi } from 'vitest';

import type {
  EnrichmentRunRecord,
  ItemCompanyInput,
  ItemCompanyRecord,
  ItemDetailRecord,
  ItemEnrichmentRecord,
  SourceItemRecord,
  StockSnapshotRecord,
} from '@stocker/db';

import { createItemEnrichmentService } from './item-enrichment-service';
import type { CompanyMatcher } from './company-matcher';

function createItem(): ItemDetailRecord {
  const item: SourceItemRecord = {
    id: 'item-1',
    sourceId: 'source-1',
    externalId: 'external-1',
    canonicalUrl: 'https://example.com/item-1',
    title: 'Apple announces new laptop',
    summary: 'Apple and Broadcom were mentioned.',
    author: 'Reporter',
    publishedAt: '2026-04-25T09:00:00.000Z',
    fetchedAt: '2026-04-25T10:00:00.000Z',
    sourceMetadata: { feedTitle: 'Morning Feed' },
    readState: 'unread',
    savedForResearch: false,
    enrichmentState: 'pending',
    createdAt: '2026-04-25T10:00:00.000Z',
    updatedAt: '2026-04-25T10:00:00.000Z',
  };

  return {
    item,
    companies: [],
    enrichment: null,
    snapshots: [],
  };
}

function createSnapshot(overrides: Partial<StockSnapshotRecord> = {}): StockSnapshotRecord {
  return {
    id: 'snapshot-1',
    ticker: 'AAPL',
    exchange: 'NASDAQ',
    companyName: 'Apple Inc.',
    price: 200,
    currency: 'USD',
    dailyChange: 1,
    dailyChangePercent: 0.5,
    marketCap: 3_000_000_000_000,
    sector: 'Technology',
    provider: 'yahoo-finance2',
    capturedAt: '2026-04-25T10:05:00.000Z',
    staleAfter: '2026-04-25T10:20:00.000Z',
    raw: { symbol: 'AAPL' },
    createdAt: '2026-04-25T10:05:00.000Z',
    ...overrides,
  };
}

function createMatcher(
  output: ItemCompanyInput[],
): Pick<CompanyMatcher, 'matchCompanies'> {
  return {
    matchCompanies: async () =>
      output.map((company) => ({
        id: company.id,
        sourceItemId: company.sourceItemId,
        companyName: company.companyName,
        ticker: company.ticker ?? undefined,
        exchange: company.exchange ?? undefined,
        relationshipType: company.relationshipType as
          | 'mentioned'
          | 'competitor'
          | 'customer'
          | 'supplier',
        relevanceExplanation: company.relevanceExplanation,
        confidence: company.confidence,
        matchStatus: company.matchStatus as 'validated' | 'needs_review',
        evidenceText: company.evidenceText ?? undefined,
        createdAt: company.createdAt,
        updatedAt: company.updatedAt,
      })),
  };
}

function createDependencies(options: {
  llmOutput?: unknown;
  matchedCompanies?: ItemCompanyInput[];
  item?: ItemDetailRecord | null;
  marketSnapshot?: StockSnapshotRecord | null;
  cachedSnapshot?: StockSnapshotRecord | null;
}) {
  const item = options.item ?? createItem();
  const run: EnrichmentRunRecord = {
    id: 'run-1',
    sourceItemId: item.item.id,
    state: 'running',
    startedAt: '2026-04-25T10:05:00.000Z',
    finishedAt: null,
    errorMessage: null,
    rawLlmOutput: null,
    createdAt: '2026-04-25T10:05:00.000Z',
  };

  const itemEnrichment: ItemEnrichmentRecord | null = null;
  const companies = options.matchedCompanies ?? [];
  const companyRecords: ItemCompanyRecord[] = [];
  const snapshots: StockSnapshotRecord[] = options.cachedSnapshot
    ? [options.cachedSnapshot]
    : [];

  const sourceItemsRepository = {
    getItemDetail: async (itemId: string) =>
      item?.item.id === itemId ? item : null,
    setEnrichmentState: async (
      itemId: string,
      enrichmentState: string,
    ) => ({
      ...item.item,
      id: itemId,
      enrichmentState,
    }),
  };

  const enrichmentRepository = {
    startRun: async () => run,
    completeRun: async (runId: string, rawOutput: unknown) => ({
      ...run,
      id: runId,
      rawLlmOutput: rawOutput as Record<string, unknown>,
      state: 'complete',
      finishedAt: '2026-04-25T10:06:00.000Z',
    }),
    failRun: async (runId: string, errorMessage: string) => ({
      ...run,
      id: runId,
      state: 'failed',
      errorMessage,
      finishedAt: '2026-04-25T10:06:00.000Z',
    }),
    upsertItemEnrichment: async (input: Record<string, unknown>) => ({
      id: (input.id as string) ?? 'enrichment-1',
      sourceItemId: input.sourceItemId as string,
      state: input.state as string,
      summary: (input.summary as string | null) ?? null,
      modelProvider: (input.modelProvider as string | null) ?? null,
      modelName: (input.modelName as string | null) ?? null,
      promptVersion: (input.promptVersion as string | null) ?? null,
      completedAt: (input.completedAt as string | null) ?? null,
      errorMessage: (input.errorMessage as string | null) ?? null,
      createdAt: input.createdAt as string,
      updatedAt: input.updatedAt as string,
    }),
    replaceItemCompanies: async (
      _itemId: string,
      items: ItemCompanyInput[],
    ) => {
      const nextRecords = items.map((company) => ({
        id: company.id,
        sourceItemId: company.sourceItemId,
        companyName: company.companyName,
        ticker: company.ticker ?? null,
        exchange: company.exchange ?? null,
        relationshipType: company.relationshipType,
        relevanceExplanation: company.relevanceExplanation,
        confidence: company.confidence,
        matchStatus: company.matchStatus,
        evidenceText: company.evidenceText ?? null,
        createdAt: company.createdAt,
        updatedAt: company.updatedAt,
      }));

      companyRecords.splice(0, companyRecords.length, ...nextRecords);
      return companyRecords;
    },
  };

  const stockSnapshotsRepository = {
    insertSnapshot: async (input: Record<string, unknown>) => ({
      id: 'snapshot-live',
      ticker: input.ticker as string,
      exchange: (input.exchange as string | null) ?? null,
      companyName: (input.companyName as string | null) ?? null,
      price: (input.price as number | null) ?? null,
      currency: (input.currency as string | null) ?? null,
      dailyChange: (input.dailyChange as number | null) ?? null,
      dailyChangePercent: (input.dailyChangePercent as number | null) ?? null,
      marketCap: (input.marketCap as number | null) ?? null,
      sector: (input.sector as string | null) ?? null,
      provider: input.provider as string,
      capturedAt: input.capturedAt as string,
      staleAfter: input.staleAfter as string,
      raw: input.raw as Record<string, unknown>,
      createdAt: input.createdAt as string,
    }),
    getLatestSnapshot: async () => options.cachedSnapshot ?? null,
  };

  const llmProvider = {
    type: 'openai-compatible',
    providerName: 'openai-compatible',
    modelName: 'local-model',
    promptVersion: '2026-04-25',
    extractStockRelevance: async () => options.llmOutput as never,
  };

  const matcher = createMatcher(companies);

  const service = createItemEnrichmentService({
    sourceItemsRepository,
    enrichmentRepository,
    stockSnapshotsRepository,
    llmProvider,
    companyMatcher: matcher,
    marketDataProvider: {
      getSnapshot: vi.fn().mockResolvedValue(options.marketSnapshot ?? null),
    },
    now: () => '2026-04-25T10:05:00.000Z',
  });

  return { service, sourceItemsRepository, enrichmentRepository };
}

describe('ItemEnrichmentService', () => {
  it('persists complete enrichment results', async () => {
    const { service } = createDependencies({
      llmOutput: {
        companies: [
          {
            companyName: 'Apple Inc.',
            relationshipType: 'mentioned',
            relevanceExplanation: 'Apple is mentioned.',
            confidence: 0.95,
          },
        ],
      },
      matchedCompanies: [
        {
          id: 'company-1',
          sourceItemId: 'item-1',
          companyName: 'Apple Inc.',
          ticker: 'AAPL',
          exchange: 'NASDAQ',
          relationshipType: 'mentioned',
          relevanceExplanation: 'Apple is mentioned.',
          confidence: 0.95,
          matchStatus: 'validated',
          evidenceText: 'Apple ...',
          createdAt: '2026-04-25T10:05:00.000Z',
          updatedAt: '2026-04-25T10:05:00.000Z',
        },
      ],
      marketSnapshot: createSnapshot(),
    });

    const result = await service.enrichItem('item-1', 'manual');

    expect(result.status).toBe('succeeded');
    if (result.status === 'succeeded') {
      expect(result.enrichmentState).toBe('complete');
      expect(result.companies).toHaveLength(1);
      expect(result.snapshots).toHaveLength(1);
    }
  });

  it('persists needs-review enrichment results', async () => {
    const { service } = createDependencies({
      llmOutput: {
        companies: [
          {
            companyName: 'Apple Inc.',
            relationshipType: 'mentioned',
            relevanceExplanation: 'Apple is mentioned.',
            confidence: 0.4,
          },
        ],
      },
      matchedCompanies: [
        {
          id: 'company-1',
          sourceItemId: 'item-1',
          companyName: 'Apple Inc.',
          relationshipType: 'mentioned',
          relevanceExplanation: 'Apple is mentioned.',
          confidence: 0.4,
          matchStatus: 'needs_review',
          createdAt: '2026-04-25T10:05:00.000Z',
          updatedAt: '2026-04-25T10:05:00.000Z',
        },
      ],
    });

    const result = await service.enrichItem('item-1', 'manual');

    expect(result.status).toBe('succeeded');
    if (result.status === 'succeeded') {
      expect(result.enrichmentState).toBe('needs_review');
    }
  });

  it('fails cleanly when the LLM provider throws', async () => {
    const { service } = createDependencies({
      llmOutput: undefined,
    });

    const result = await service.enrichItem('item-1', 'manual');

    expect(result.status).toBe('failed');
  });

  it('uses cached snapshots when live market data fails', async () => {
    const cachedSnapshot = createSnapshot({
      id: 'snapshot-cached',
      createdAt: '2026-04-25T09:55:00.000Z',
    });
    const { service } = createDependencies({
      llmOutput: {
        companies: [
          {
            companyName: 'Apple Inc.',
            relationshipType: 'mentioned',
            relevanceExplanation: 'Apple is mentioned.',
            confidence: 0.95,
          },
        ],
      },
      matchedCompanies: [
        {
          id: 'company-1',
          sourceItemId: 'item-1',
          companyName: 'Apple Inc.',
          ticker: 'AAPL',
          relationshipType: 'mentioned',
          relevanceExplanation: 'Apple is mentioned.',
          confidence: 0.95,
          matchStatus: 'validated',
          createdAt: '2026-04-25T10:05:00.000Z',
          updatedAt: '2026-04-25T10:05:00.000Z',
        },
      ],
      marketSnapshot: null,
      cachedSnapshot,
    });

    const result = await service.enrichItem('item-1', 'manual');

    expect(result.status).toBe('succeeded');
    if (result.status === 'succeeded') {
      expect(result.snapshots[0]?.id).toBe('snapshot-cached');
    }
  });
});
