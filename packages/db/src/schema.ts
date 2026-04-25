import {
  index,
  integer,
  real,
  sqliteTable,
  uniqueIndex,
  text,
} from 'drizzle-orm/sqlite-core';

export const sources = sqliteTable(
  'sources',
  {
    id: text('id').primaryKey(),
    type: text('type').notNull(),
    name: text('name').notNull(),
    enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
    configJson: text('config_json').notNull(),
    lastFetchedAt: text('last_fetched_at'),
    lastSuccessAt: text('last_success_at'),
    lastErrorAt: text('last_error_at'),
    lastErrorMessage: text('last_error_message'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [index('sources_type_idx').on(table.type)],
);

export const sourceItems = sqliteTable(
  'source_items',
  {
    id: text('id').primaryKey(),
    sourceId: text('source_id')
      .notNull()
      .references(() => sources.id),
    externalId: text('external_id').notNull(),
    canonicalUrl: text('canonical_url').notNull(),
    title: text('title').notNull(),
    summary: text('summary'),
    author: text('author'),
    publishedAt: text('published_at'),
    fetchedAt: text('fetched_at').notNull(),
    sourceMetadataJson: text('source_metadata_json').notNull(),
    readState: text('read_state').notNull().default('unread'),
    savedForResearch: integer('saved_for_research', {
      mode: 'boolean',
    })
      .notNull()
      .default(false),
    enrichmentState: text('enrichment_state').notNull().default('pending'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    uniqueIndex('source_items_source_external_unique').on(
      table.sourceId,
      table.externalId,
    ),
    index('source_items_enrichment_state_idx').on(table.enrichmentState),
    index('source_items_saved_for_research_idx').on(table.savedForResearch),
    index('source_items_read_state_idx').on(table.readState),
    index('source_items_published_at_idx').on(table.publishedAt),
  ],
);

export const jobs = sqliteTable(
  'jobs',
  {
    id: text('id').primaryKey(),
    type: text('type').notNull(),
    state: text('state').notNull().default('queued'),
    payloadJson: text('payload_json').notNull(),
    attemptCount: integer('attempt_count').notNull().default(0),
    maxAttempts: integer('max_attempts').notNull().default(3),
    runAfter: text('run_after').notNull(),
    lockedAt: text('locked_at'),
    lockedBy: text('locked_by'),
    lastErrorMessage: text('last_error_message'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    index('jobs_state_idx').on(table.state),
    index('jobs_run_after_idx').on(table.runAfter),
  ],
);

export const enrichmentRuns = sqliteTable('enrichment_runs', {
  id: text('id').primaryKey(),
  sourceItemId: text('source_item_id')
    .notNull()
    .references(() => sourceItems.id),
  state: text('state').notNull(),
  startedAt: text('started_at').notNull(),
  finishedAt: text('finished_at'),
  errorMessage: text('error_message'),
  rawLlmOutputJson: text('raw_llm_output_json'),
  createdAt: text('created_at').notNull(),
});

export const itemEnrichments = sqliteTable(
  'item_enrichments',
  {
    id: text('id').primaryKey(),
    sourceItemId: text('source_item_id')
      .notNull()
      .references(() => sourceItems.id),
    state: text('state').notNull(),
    summary: text('summary'),
    modelProvider: text('model_provider'),
    modelName: text('model_name'),
    promptVersion: text('prompt_version'),
    completedAt: text('completed_at'),
    errorMessage: text('error_message'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    uniqueIndex('item_enrichments_source_item_unique').on(table.sourceItemId),
  ],
);

export const itemCompanies = sqliteTable(
  'item_companies',
  {
    id: text('id').primaryKey(),
    sourceItemId: text('source_item_id')
      .notNull()
      .references(() => sourceItems.id),
    companyName: text('company_name').notNull(),
    ticker: text('ticker'),
    exchange: text('exchange'),
    relationshipType: text('relationship_type').notNull(),
    relevanceExplanation: text('relevance_explanation').notNull(),
    confidence: real('confidence').notNull(),
    matchStatus: text('match_status').notNull(),
    evidenceText: text('evidence_text'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    index('item_companies_source_item_idx').on(table.sourceItemId),
    index('item_companies_ticker_idx').on(table.ticker),
  ],
);

export const stockSnapshots = sqliteTable(
  'stock_snapshots',
  {
    id: text('id').primaryKey(),
    ticker: text('ticker').notNull(),
    exchange: text('exchange'),
    companyName: text('company_name'),
    price: real('price'),
    currency: text('currency'),
    dailyChange: real('daily_change'),
    dailyChangePercent: real('daily_change_percent'),
    marketCap: real('market_cap'),
    sector: text('sector'),
    provider: text('provider').notNull(),
    capturedAt: text('captured_at').notNull(),
    staleAfter: text('stale_after').notNull(),
    rawJson: text('raw_json').notNull(),
    createdAt: text('created_at').notNull(),
  },
  (table) => [index('stock_snapshots_ticker_idx').on(table.ticker)],
);

export const tickerCorrections = sqliteTable(
  'ticker_corrections',
  {
    id: text('id').primaryKey(),
    companyName: text('company_name').notNull(),
    correctTicker: text('correct_ticker').notNull(),
    correctExchange: text('correct_exchange'),
    notes: text('notes'),
    enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    uniqueIndex('ticker_corrections_unique').on(
      table.companyName,
      table.correctTicker,
      table.correctExchange,
    ),
  ],
);

export const schema = {
  sources,
  sourceItems,
  jobs,
  enrichmentRuns,
  itemEnrichments,
  itemCompanies,
  stockSnapshots,
  tickerCorrections,
} as const;

export const sourceTableNames = Object.keys(schema) as Array<
  keyof typeof schema
>;
