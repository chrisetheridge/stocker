import YahooFinance from 'yahoo-finance2';

import type { MarketDataProvider } from '../types';
import { normalizeSearchResult, normalizeSnapshot } from './yahoo-normalize';

export type YahooFinanceClient = {
  search(query: string, ...args: unknown[]): Promise<unknown>;
  quote(ticker: string, ...args: unknown[]): Promise<unknown>;
  quoteSummary(ticker: string, ...args: unknown[]): Promise<unknown>;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function resolveSearchResults(value: unknown): Record<string, unknown>[] {
  const raw = asRecord(value);
  if ('quotes' in raw) {
    return asArray(raw.quotes).map(asRecord);
  }

  if ('news' in raw) {
    return [];
  }

  return asArray(value).map(asRecord);
}

function resolveQuoteSummary(value: unknown): Record<string, unknown> | null {
  const raw = asRecord(value);
  if ('quoteSummary' in raw) {
    const quoteSummary = asRecord(raw.quoteSummary);
    if ('result' in quoteSummary) {
      const result = asArray(quoteSummary.result)[0];
      return result ? asRecord(result) : null;
    }
  }

  return Object.keys(raw).length > 0 ? raw : null;
}

export class YahooFinanceMarketDataProvider implements MarketDataProvider {
  readonly type = 'yahoo-finance2' as const;

  constructor(
    private readonly client: YahooFinanceClient = new YahooFinance(),
  ) {}

  async searchCompanies(query: string, universe: string) {
    const response = await this.client.search(query);
    const candidates = resolveSearchResults(response)
      .map((candidate) => normalizeSearchResult(candidate, query))
      .filter((candidate): candidate is NonNullable<typeof candidate> =>
        Boolean(candidate),
      )
      .filter((candidate) =>
        universe.toLowerCase() === 'us'
          ? candidate.confidence > 0 || Boolean(candidate.exchange)
          : true,
      );

    return candidates;
  }

  async getSnapshot(input: {
    ticker: string;
    exchange?: string;
    universe: string;
  }) {
    const quoteResponse = await this.client.quote(input.ticker);
    const quote = asRecord(quoteResponse);

    const quoteSummaryResponse = await this.client.quoteSummary(input.ticker, {
      modules: ['assetProfile'],
    });
    const quoteSummary = resolveQuoteSummary(quoteSummaryResponse);
    const capturedAt = new Date().toISOString();

    return normalizeSnapshot(quote, quoteSummary, input, capturedAt);
  }
}

export function createYahooFinanceMarketDataProvider(
  client?: YahooFinanceClient,
): YahooFinanceMarketDataProvider {
  return new YahooFinanceMarketDataProvider(client);
}
