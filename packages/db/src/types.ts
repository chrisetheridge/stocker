export type JsonRecord = Record<string, unknown>;

export type SourceRecord = {
  id: string;
  type: string;
  name: string;
  enabled: boolean;
  config: JsonRecord;
  lastFetchedAt: string | null;
  lastSuccessAt: string | null;
  lastErrorAt: string | null;
  lastErrorMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SourceUpsertInput = Omit<
  SourceRecord,
  | 'config'
  | 'lastFetchedAt'
  | 'lastSuccessAt'
  | 'lastErrorAt'
  | 'lastErrorMessage'
> & {
  config: JsonRecord;
  lastFetchedAt?: string | null;
  lastSuccessAt?: string | null;
  lastErrorAt?: string | null;
  lastErrorMessage?: string | null;
};

export type SourceItemRecord = {
  id: string;
  sourceId: string;
  externalId: string;
  canonicalUrl: string;
  title: string;
  summary: string | null;
  author: string | null;
  publishedAt: string | null;
  fetchedAt: string;
  sourceMetadata: JsonRecord;
  readState: string;
  savedForResearch: boolean;
  enrichmentState: string;
  createdAt: string;
  updatedAt: string;
};

export type SourceItemUpsertInput = Omit<
  SourceItemRecord,
  'sourceMetadata' | 'summary' | 'author' | 'publishedAt'
> & {
  sourceMetadata: JsonRecord;
  summary?: string | null;
  author?: string | null;
  publishedAt?: string | null;
};

export type ItemCompanyRecord = {
  id: string;
  sourceItemId: string;
  companyName: string;
  ticker: string | null;
  exchange: string | null;
  relationshipType: string;
  relevanceExplanation: string;
  confidence: number;
  matchStatus: string;
  evidenceText: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ItemCompanyInput = Omit<
  ItemCompanyRecord,
  'ticker' | 'exchange' | 'evidenceText'
> & {
  ticker?: string | null;
  exchange?: string | null;
  evidenceText?: string | null;
};

export type ItemEnrichmentRecord = {
  id: string;
  sourceItemId: string;
  state: string;
  summary: string | null;
  modelProvider: string | null;
  modelName: string | null;
  promptVersion: string | null;
  completedAt: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ItemEnrichmentInput = Omit<
  ItemEnrichmentRecord,
  | 'summary'
  | 'modelProvider'
  | 'modelName'
  | 'promptVersion'
  | 'completedAt'
  | 'errorMessage'
> & {
  summary?: string | null;
  modelProvider?: string | null;
  modelName?: string | null;
  promptVersion?: string | null;
  completedAt?: string | null;
  errorMessage?: string | null;
};

export type EnrichmentRunRecord = {
  id: string;
  sourceItemId: string;
  state: string;
  startedAt: string;
  finishedAt: string | null;
  errorMessage: string | null;
  rawLlmOutput: JsonRecord | null;
  createdAt: string;
};

export type EnrichmentRunStartInput = {
  sourceItemId: string;
  startedAt: string;
  createdAt: string;
  id?: string;
};

export type StockSnapshotRecord = {
  id: string;
  ticker: string;
  exchange: string | null;
  companyName: string | null;
  price: number | null;
  currency: string | null;
  dailyChange: number | null;
  dailyChangePercent: number | null;
  marketCap: number | null;
  sector: string | null;
  provider: string;
  capturedAt: string;
  staleAfter: string;
  raw: JsonRecord;
  createdAt: string;
};

export type StockSnapshotInput = {
  id?: string;
  ticker: string;
  exchange?: string | null;
  companyName?: string | null;
  price?: number | null;
  currency?: string | null;
  dailyChange?: number | null;
  dailyChangePercent?: number | null;
  marketCap?: number | null;
  sector?: string | null;
  provider: string;
  capturedAt: string;
  staleAfter: string;
  raw: JsonRecord;
  createdAt: string;
};

export type TickerCorrectionRecord = {
  id: string;
  companyName: string;
  correctTicker: string;
  correctExchange: string | null;
  notes: string | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TickerCorrectionInput = Omit<
  TickerCorrectionRecord,
  'correctExchange' | 'notes' | 'enabled'
> & {
  id?: string;
  correctExchange?: string | null;
  notes?: string | null;
  enabled?: boolean;
};

export type JobRecord = {
  id: string;
  type: string;
  state: string;
  payload: JsonRecord;
  attemptCount: number;
  maxAttempts: number;
  runAfter: string;
  lockedAt: string | null;
  lockedBy: string | null;
  lastErrorMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

export type JobEnqueueOptions = {
  id?: string;
  runAfter?: string;
  maxAttempts?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type InboxFilters = {
  sourceId?: string;
  ticker?: string;
  companyName?: string;
  readState?: string;
  savedForResearch?: boolean;
  enrichmentState?: string;
  query?: string;
  limit?: number;
  offset?: number;
};

export type ItemDetailRecord = {
  item: SourceItemRecord;
  companies: ItemCompanyRecord[];
  enrichment: ItemEnrichmentRecord | null;
  snapshots: StockSnapshotRecord[];
};
