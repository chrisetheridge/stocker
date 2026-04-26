import {
  type CompanySearchResult,
  type StockSnapshotInput,
  type StockLookupInput,
} from '../types';

function readString(
  value: Record<string, unknown>,
  keys: string[],
): string | undefined {
  for (const key of keys) {
    const candidate = value[key];
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate;
    }
  }

  return undefined;
}

function readNumber(
  value: Record<string, unknown>,
  keys: string[],
): number | undefined {
  for (const key of keys) {
    const candidate = value[key];
    if (typeof candidate === 'number' && Number.isFinite(candidate)) {
      return candidate;
    }
  }

  return undefined;
}

function normalizeConfidence(
  candidate: Record<string, unknown>,
  query: string,
) {
  const rawScore = readNumber(candidate, ['score']);
  if (typeof rawScore === 'number') {
    return rawScore > 1 ? Math.min(rawScore / 100, 1) : rawScore;
  }

  const symbol = readString(candidate, ['symbol']);
  const name = readString(candidate, ['longname', 'shortname', 'name']);
  const normalizedQuery = query.trim().toLowerCase();
  if (symbol?.toLowerCase() === normalizedQuery) {
    return 1;
  }

  if (name?.toLowerCase().includes(normalizedQuery)) {
    return 0.85;
  }

  return 0.5;
}

export function normalizeSearchResult(
  candidate: Record<string, unknown>,
  query: string,
): CompanySearchResult | null {
  if (!isEquityLike(candidate)) {
    return null;
  }

  const ticker = readString(candidate, ['symbol']);
  const companyName = readString(candidate, [
    'longname',
    'shortname',
    'displayName',
    'name',
    'symbol',
  ]);

  if (!ticker || !companyName) {
    return null;
  }

  const exchange = readString(candidate, ['exchange', 'exchDisp']);
  const sector = readString(candidate, ['sector']);

  return {
    companyName,
    ticker,
    exchange,
    sector,
    confidence: normalizeConfidence(candidate, query),
    raw: candidate,
  };
}

function isEquityLike(candidate: Record<string, unknown>): boolean {
  const quoteType = readString(candidate, ['quoteType', 'typeDisp']);
  if (!quoteType) {
    return true;
  }

  return quoteType.toLowerCase() === 'equity';
}

function readQuoteSummarySector(
  summary: Record<string, unknown>,
): string | undefined {
  const assetProfile = summary.assetProfile;
  if (
    assetProfile &&
    typeof assetProfile === 'object' &&
    assetProfile !== null
  ) {
    const sector = (assetProfile as Record<string, unknown>).sector;
    if (typeof sector === 'string' && sector.trim().length > 0) {
      return sector;
    }
  }

  return undefined;
}

export function normalizeSnapshot(
  quote: Record<string, unknown>,
  summary: Record<string, unknown> | null,
  input: StockLookupInput,
  capturedAt: string,
): StockSnapshotInput | null {
  if (!isEquityLike(quote)) {
    return null;
  }

  const ticker = readString(quote, ['symbol']) ?? input.ticker;
  const companyName = readString(quote, [
    'longName',
    'shortName',
    'displayName',
  ]);
  const exchange = readString(quote, ['exchange', 'fullExchangeName']);
  const sector = readQuoteSummarySector(summary ?? {});

  return {
    ticker,
    exchange,
    companyName,
    price: readNumber(quote, ['regularMarketPrice']),
    currency: readString(quote, ['currency']),
    dailyChange: readNumber(quote, ['regularMarketChange']),
    dailyChangePercent: readNumber(quote, ['regularMarketChangePercent']),
    marketCap: readNumber(quote, ['marketCap']),
    sector,
    provider: 'yahoo-finance2',
    capturedAt,
    staleAfter: new Date(
      new Date(capturedAt).getTime() + 15 * 60 * 1000,
    ).toISOString(),
    raw: {
      quote,
      summary: summary ?? {},
      lookup: input,
    },
  };
}
