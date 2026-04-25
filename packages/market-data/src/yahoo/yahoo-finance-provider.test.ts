import { describe, expect, it, vi } from 'vitest';

import {
  yahooQuoteFixture,
  yahooQuoteSummaryFixture,
  yahooSearchFixture,
} from './yahoo-fixtures';
import { YahooFinanceMarketDataProvider } from './yahoo-finance-provider';

describe('YahooFinanceMarketDataProvider', () => {
  it('normalizes search results', async () => {
    const provider = new YahooFinanceMarketDataProvider({
      search: async () => ({ quotes: [yahooSearchFixture] }),
      quote: async () => yahooQuoteFixture,
      quoteSummary: async () => yahooQuoteSummaryFixture,
    });

    const results = await provider.searchCompanies('Apple', 'US');

    expect(results).toEqual([
      {
        companyName: 'Apple Inc.',
        ticker: 'AAPL',
        exchange: 'NMS',
        sector: 'Technology',
        confidence: 0.98,
        raw: yahooSearchFixture,
      },
    ]);
  });

  it('normalizes equity snapshots and preserves raw payloads', async () => {
    const provider = new YahooFinanceMarketDataProvider({
      search: async () => ({ quotes: [] }),
      quote: async () => yahooQuoteFixture,
      quoteSummary: async () => yahooQuoteSummaryFixture,
    });

    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-25T10:00:00.000Z'));

    const snapshot = await provider.getSnapshot({
      ticker: 'AAPL',
      universe: 'US',
    });

    expect(snapshot).toMatchObject({
      ticker: 'AAPL',
      exchange: undefined,
      companyName: 'Apple Inc.',
      price: 200.12,
      currency: 'USD',
      dailyChange: 1.23,
      dailyChangePercent: 0.62,
      marketCap: 3_000_000_000_000,
      sector: 'Technology',
      provider: 'yahoo-finance2',
      capturedAt: '2026-04-25T10:00:00.000Z',
      staleAfter: '2026-04-25T10:15:00.000Z',
    });
    expect(snapshot?.raw).toEqual({
      quote: yahooQuoteFixture,
      summary: yahooQuoteSummaryFixture,
      lookup: { ticker: 'AAPL', universe: 'US' },
    });

    vi.useRealTimers();
  });

  it('returns null for non-equity snapshots', async () => {
    const provider = new YahooFinanceMarketDataProvider({
      search: async () => ({ quotes: [] }),
      quote: async () => ({
        symbol: 'BTC-USD',
        quoteType: 'CRYPTOCURRENCY',
      }),
      quoteSummary: async () => ({}),
    });

    const snapshot = await provider.getSnapshot({
      ticker: 'BTC-USD',
      universe: 'US',
    });

    expect(snapshot).toBeNull();
  });
});
