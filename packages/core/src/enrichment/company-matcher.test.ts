import { describe, expect, it, vi } from 'vitest';

import type {
  TickerCorrectionRecord,
} from '@stocker/db';
import type { CompanySearchResult, StockSnapshotInput } from '@stocker/market-data';

import { createCompanyMatcher } from './company-matcher';

function createCorrection(overrides: Partial<TickerCorrectionRecord> = {}): TickerCorrectionRecord {
  return {
    id: 'correction-1',
    companyName: 'Apple Inc.',
    correctTicker: 'AAPL',
    correctExchange: 'NASDAQ',
    notes: null,
    enabled: true,
    createdAt: '2026-04-25T10:00:00.000Z',
    updatedAt: '2026-04-25T10:00:00.000Z',
    ...overrides,
  };
}

function createSnapshot(overrides: Partial<StockSnapshotInput> = {}): StockSnapshotInput {
  return {
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
    capturedAt: '2026-04-25T10:00:00.000Z',
    staleAfter: '2026-04-25T10:15:00.000Z',
    raw: { symbol: 'AAPL' },
    ...overrides,
  };
}

function createDependencies(options: {
  correction?: TickerCorrectionRecord | null;
  searchResults?: CompanySearchResult[];
  snapshot?: StockSnapshotInput | null;
}) {
  const findEnabledCorrection = vi.fn().mockResolvedValue(
    options.correction ?? null,
  );
  const searchCompanies = vi.fn().mockResolvedValue(options.searchResults ?? []);
  const getSnapshot = vi.fn().mockResolvedValue(options.snapshot ?? null);

  const matcher = createCompanyMatcher({
    tickerCorrectionsRepository: {
      findEnabledCorrection,
    },
    marketDataProvider: {
      searchCompanies,
      getSnapshot,
    },
    now: () => '2026-04-25T10:05:00.000Z',
  });

  return { matcher, findEnabledCorrection, searchCompanies, getSnapshot };
}

describe('CompanyMatcher', () => {
  it('uses enabled corrections before provider guesses', async () => {
    const { matcher, findEnabledCorrection, getSnapshot, searchCompanies } =
      createDependencies({
        correction: createCorrection(),
        snapshot: createSnapshot(),
      });

    const result = await matcher.matchCompanies({
      sourceItemId: 'item-1',
      candidates: [
        {
          companyName: 'Apple Inc.',
          relationshipType: 'mentioned',
          relevanceExplanation: 'Apple is mentioned in the article.',
          confidence: 0.5,
        },
      ],
    });

    expect(findEnabledCorrection).toHaveBeenCalledWith('Apple Inc.');
    expect(searchCompanies).not.toHaveBeenCalled();
    expect(getSnapshot).toHaveBeenCalledWith({
      ticker: 'AAPL',
      exchange: 'NASDAQ',
      universe: 'US',
    });
    expect(result[0]).toMatchObject({
      sourceItemId: 'item-1',
      companyName: 'Apple Inc.',
      ticker: 'AAPL',
      exchange: 'NASDAQ',
      matchStatus: 'validated',
    });
  });

  it('validates a strong ticker hint when market data confirms it', async () => {
    const { matcher, searchCompanies } = createDependencies({
      snapshot: createSnapshot(),
    });

    const result = await matcher.matchCompanies({
      sourceItemId: 'item-1',
      candidates: [
        {
          companyName: 'Apple',
          tickerHint: 'aapl',
          relationshipType: 'mentioned',
          relevanceExplanation: 'Apple is discussed.',
          confidence: 0.9,
        },
      ],
    });

    expect(searchCompanies).not.toHaveBeenCalled();
    expect(result[0]).toMatchObject({
      companyName: 'Apple',
      ticker: 'AAPL',
      exchange: 'NASDAQ',
      matchStatus: 'validated',
    });
  });

  it('validates ambiguous search results with the best provider match', async () => {
    const { matcher, searchCompanies } = createDependencies({
      searchResults: [
        {
          companyName: 'Apple Inc.',
          ticker: 'AAPL',
          exchange: 'NASDAQ',
          sector: 'Technology',
          confidence: 0.9,
          raw: {},
        },
        {
          companyName: 'Apple Hospitality REIT',
          ticker: 'APLE',
          exchange: 'NYSE',
          sector: 'Real Estate',
          confidence: 0.8,
          raw: {},
        },
      ],
    });

    const result = await matcher.matchCompanies({
      sourceItemId: 'item-1',
      candidates: [
        {
          companyName: 'Apple',
          relationshipType: 'mentioned',
          relevanceExplanation: 'Apple is mentioned.',
          confidence: 0.9,
        },
      ],
    });

    expect(searchCompanies).toHaveBeenCalledWith('Apple', 'US');
    expect(result[0]).toMatchObject({
      companyName: 'Apple Inc.',
      matchStatus: 'validated',
      ticker: 'AAPL',
    });
  });

  it('validates an exact provider match even when other plausible results exist', async () => {
    const { matcher, searchCompanies } = createDependencies({
      searchResults: [
        {
          companyName: 'NVIDIA Corporation',
          ticker: 'NVDA',
          exchange: 'NASDAQ',
          sector: 'Technology',
          confidence: 0.98,
          raw: {},
        },
        {
          companyName: 'NVIDIA Corp.',
          ticker: 'NVDC',
          exchange: 'OTC',
          sector: 'Technology',
          confidence: 0.82,
          raw: {},
        },
      ],
    });

    const result = await matcher.matchCompanies({
      sourceItemId: 'item-1',
      candidates: [
        {
          companyName: 'NVIDIA Corporation',
          relationshipType: 'mentioned',
          relevanceExplanation: 'NVIDIA is mentioned.',
          confidence: 0.92,
        },
      ],
    });

    expect(searchCompanies).toHaveBeenCalledWith('NVIDIA Corporation', 'US');
    expect(result[0]).toMatchObject({
      companyName: 'NVIDIA Corporation',
      matchStatus: 'validated',
      ticker: 'NVDA',
      exchange: 'NASDAQ',
    });
  });

  it('keeps uncertain matches visible when market data is unavailable', async () => {
    const { matcher } = createDependencies({
      searchResults: [],
      snapshot: null,
    });

    const result = await matcher.matchCompanies({
      sourceItemId: 'item-1',
      candidates: [
        {
          companyName: 'Unknown Company',
          relationshipType: 'mentioned',
          relevanceExplanation: 'This might be a company.',
          confidence: 0.2,
        },
      ],
    });

    expect(result[0]).toMatchObject({
      companyName: 'Unknown Company',
      matchStatus: 'validated',
      ticker: undefined,
    });
  });
});
