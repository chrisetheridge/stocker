import { z } from 'zod';

export type MarketDataProviderType = 'yahoo-finance2';

export type StockLookupInput = {
  ticker: string;
  exchange?: string;
  universe: string;
};

export type StockSnapshotInput = {
  ticker: string;
  exchange?: string;
  companyName?: string;
  price?: number;
  currency?: string;
  dailyChange?: number;
  dailyChangePercent?: number;
  marketCap?: number;
  sector?: string;
  provider: MarketDataProviderType;
  capturedAt: string;
  staleAfter: string;
  raw: Record<string, unknown>;
};

export type CompanySearchResult = {
  companyName: string;
  ticker: string;
  exchange?: string;
  sector?: string;
  confidence: number;
  raw: Record<string, unknown>;
};

const jsonRecordSchema = z.record(z.string(), z.unknown());

export const stockLookupInputSchema = z.object({
  ticker: z.string().min(1),
  exchange: z.string().min(1).optional(),
  universe: z.string().min(1),
});

export const companySearchResultSchema = z.object({
  companyName: z.string().min(1),
  ticker: z.string().min(1),
  exchange: z.string().min(1).optional(),
  sector: z.string().min(1).optional(),
  confidence: z.number().finite().min(0).max(1),
  raw: jsonRecordSchema,
});

export const stockSnapshotInputSchema = z.object({
  ticker: z.string().min(1),
  exchange: z.string().min(1).optional(),
  companyName: z.string().min(1).optional(),
  price: z.number().finite().optional(),
  currency: z.string().min(1).optional(),
  dailyChange: z.number().finite().optional(),
  dailyChangePercent: z.number().finite().optional(),
  marketCap: z.number().finite().optional(),
  sector: z.string().min(1).optional(),
  provider: z.literal('yahoo-finance2'),
  capturedAt: z.string().datetime({ offset: true }),
  staleAfter: z.string().datetime({ offset: true }),
  raw: jsonRecordSchema,
});

export const companySearchResultsSchema = z.array(companySearchResultSchema);

export type MarketDataProvider = {
  readonly type: MarketDataProviderType;
  searchCompanies(
    query: string,
    universe: string,
  ): Promise<CompanySearchResult[]>;
  getSnapshot(input: StockLookupInput): Promise<StockSnapshotInput | null>;
};
