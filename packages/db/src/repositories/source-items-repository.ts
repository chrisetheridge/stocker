import {
  and,
  desc,
  eq,
  inArray,
  or,
  sql,
  type SQL,
  type InferSelectModel,
} from 'drizzle-orm';

import {
  sourceItems,
  itemCompanies,
  itemEnrichments,
  stockSnapshots,
} from '../schema';
import type { Database } from '../client';
import type {
  InboxFilters,
  ItemDetailRecord,
  ItemCompanyRecord,
  SourceItemRecord,
  SourceItemUpsertInput,
  ItemEnrichmentRecord,
  StockSnapshotRecord,
} from '../types';
import {
  parseJsonRecord,
  stringifyJsonRecord,
  toNullableText,
  toNullableBoolean,
  withSqliteBusyRetry,
} from './helpers';

type SourceItemRow = InferSelectModel<typeof sourceItems>;
type ItemCompanyRow = InferSelectModel<typeof itemCompanies>;
type ItemEnrichmentRow = InferSelectModel<typeof itemEnrichments>;
type StockSnapshotRow = InferSelectModel<typeof stockSnapshots>;

function mapSourceItem(row: SourceItemRow): SourceItemRecord {
  return {
    id: row.id,
    sourceId: row.sourceId,
    externalId: row.externalId,
    canonicalUrl: row.canonicalUrl,
    title: row.title,
    summary: row.summary ?? null,
    author: row.author ?? null,
    publishedAt: row.publishedAt ?? null,
    fetchedAt: row.fetchedAt,
    sourceMetadata: parseJsonRecord(row.sourceMetadataJson),
    readState: row.readState,
    savedForResearch: row.savedForResearch,
    enrichmentState: row.enrichmentState,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapItemCompany(row: ItemCompanyRow): ItemCompanyRecord {
  return {
    id: row.id,
    sourceItemId: row.sourceItemId,
    companyName: row.companyName,
    ticker: row.ticker ?? null,
    exchange: row.exchange ?? null,
    relationshipType: row.relationshipType,
    relevanceExplanation: row.relevanceExplanation,
    confidence: row.confidence,
    matchStatus: row.matchStatus,
    evidenceText: row.evidenceText ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapItemEnrichment(row: ItemEnrichmentRow): ItemEnrichmentRecord {
  return {
    id: row.id,
    sourceItemId: row.sourceItemId,
    state: row.state,
    summary: row.summary ?? null,
    modelProvider: row.modelProvider ?? null,
    modelName: row.modelName ?? null,
    promptVersion: row.promptVersion ?? null,
    completedAt: row.completedAt ?? null,
    errorMessage: row.errorMessage ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapStockSnapshot(row: StockSnapshotRow): StockSnapshotRecord {
  return {
    id: row.id,
    ticker: row.ticker,
    exchange: row.exchange ?? null,
    companyName: row.companyName ?? null,
    price: row.price ?? null,
    currency: row.currency ?? null,
    dailyChange: row.dailyChange ?? null,
    dailyChangePercent: row.dailyChangePercent ?? null,
    marketCap: row.marketCap ?? null,
    sector: row.sector ?? null,
    provider: row.provider,
    capturedAt: row.capturedAt,
    staleAfter: row.staleAfter,
    raw: parseJsonRecord(row.rawJson),
    createdAt: row.createdAt,
  };
}

function toSearchPattern(query: string): string {
  return `%${query.trim().toLowerCase()}%`;
}

async function loadSnapshotsForCompanies(
  database: Database,
  companies: ItemCompanyRecord[],
): Promise<StockSnapshotRecord[]> {
  const tickers = companies
    .map((company) => company.ticker)
    .filter((ticker): ticker is string => Boolean(ticker));

  if (tickers.length === 0) {
    return [];
  }

  const rows = await database
    .select()
    .from(stockSnapshots)
    .where(inArray(stockSnapshots.ticker, tickers))
    .orderBy(desc(stockSnapshots.capturedAt));

  const latestByTicker = new Map<string, StockSnapshotRecord>();
  for (const row of rows) {
    if (!latestByTicker.has(row.ticker)) {
      latestByTicker.set(row.ticker, mapStockSnapshot(row));
    }
  }

  return tickers
    .map((ticker) => latestByTicker.get(ticker))
    .filter((snapshot): snapshot is StockSnapshotRecord => Boolean(snapshot));
}

export class SourceItemsRepository {
  constructor(private readonly database: Database) {}

  async upsertFromSource(
    input: SourceItemUpsertInput,
  ): Promise<SourceItemRecord> {
    const [row] = await withSqliteBusyRetry(() =>
      this.database
        .insert(sourceItems)
        .values({
          id: input.id,
          sourceId: input.sourceId,
          externalId: input.externalId,
          canonicalUrl: input.canonicalUrl,
          title: input.title,
          summary: toNullableText(input.summary),
          author: toNullableText(input.author),
          publishedAt: toNullableText(input.publishedAt),
          fetchedAt: input.fetchedAt,
          sourceMetadataJson: stringifyJsonRecord(input.sourceMetadata),
          readState: input.readState,
          savedForResearch: toNullableBoolean(input.savedForResearch) ?? false,
          enrichmentState: input.enrichmentState,
          createdAt: input.createdAt,
          updatedAt: input.updatedAt,
        })
        .onConflictDoUpdate({
          target: [sourceItems.sourceId, sourceItems.externalId],
          set: {
            canonicalUrl: input.canonicalUrl,
            title: input.title,
            summary: toNullableText(input.summary),
            author: toNullableText(input.author),
            publishedAt: toNullableText(input.publishedAt),
            fetchedAt: input.fetchedAt,
            sourceMetadataJson: stringifyJsonRecord(input.sourceMetadata),
            updatedAt: input.updatedAt,
          },
        })
        .returning(),
    );

    if (!row) {
      throw new Error('Failed to upsert source item');
    }

    return mapSourceItem(row);
  }

  async listInboxItems(
    filters: InboxFilters = {},
  ): Promise<ItemDetailRecord[]> {
    return withSqliteBusyRetry(async () => {
      const matchingIds = await this.findMatchingItemIds(filters);
      if (matchingIds.length === 0) {
        return [];
      }

      const rows = await this.database
        .select()
        .from(sourceItems)
        .where(inArray(sourceItems.id, matchingIds))
        .orderBy(desc(sourceItems.fetchedAt), desc(sourceItems.createdAt));

      const items = await Promise.all(
        rows.map((row) => this.loadItemDetail(row.id)),
      );
      return items.filter((item): item is ItemDetailRecord => Boolean(item));
    });
  }

  async getItemDetail(itemId: string): Promise<ItemDetailRecord | null> {
    return withSqliteBusyRetry(() => this.loadItemDetail(itemId));
  }

  async findBySourceAndExternalId(
    sourceId: string,
    externalId: string,
  ): Promise<SourceItemRecord | null> {
    const [row] = await this.database
      .select()
      .from(sourceItems)
      .where(
        and(
          eq(sourceItems.sourceId, sourceId),
          eq(sourceItems.externalId, externalId),
        ),
      )
      .limit(1);

    return row ? mapSourceItem(row) : null;
  }

  async listItemIdsBySourceId(sourceId: string): Promise<string[]> {
    const rows = await withSqliteBusyRetry(() =>
      this.database
        .select({ id: sourceItems.id })
        .from(sourceItems)
        .where(eq(sourceItems.sourceId, sourceId))
        .orderBy(desc(sourceItems.fetchedAt), desc(sourceItems.createdAt)),
    );

    return rows.map((row) => row.id);
  }

  async markReadState(
    itemId: string,
    readState: string,
  ): Promise<SourceItemRecord | null> {
    const [row] = await withSqliteBusyRetry(() =>
      this.database
        .update(sourceItems)
        .set({ readState, updatedAt: new Date().toISOString() })
        .where(eq(sourceItems.id, itemId))
        .returning(),
    );

    return row ? mapSourceItem(row) : null;
  }

  async setSavedForResearch(
    itemId: string,
    saved: boolean,
  ): Promise<SourceItemRecord | null> {
    const [row] = await withSqliteBusyRetry(() =>
      this.database
        .update(sourceItems)
        .set({
          savedForResearch: saved,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(sourceItems.id, itemId))
        .returning(),
    );

    return row ? mapSourceItem(row) : null;
  }

  async setEnrichmentState(
    itemId: string,
    state: string,
  ): Promise<SourceItemRecord | null> {
    const [row] = await withSqliteBusyRetry(() =>
      this.database
        .update(sourceItems)
        .set({
          enrichmentState: state,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(sourceItems.id, itemId))
        .returning(),
    );

    return row ? mapSourceItem(row) : null;
  }

  private async loadItemDetail(
    itemId: string,
  ): Promise<ItemDetailRecord | null> {
    const [itemRow] = await withSqliteBusyRetry(() =>
      this.database
        .select()
        .from(sourceItems)
        .where(eq(sourceItems.id, itemId))
        .limit(1),
    );

    if (!itemRow) {
      return null;
    }

    const [enrichmentRow] = await withSqliteBusyRetry(() =>
      this.database
        .select()
        .from(itemEnrichments)
        .where(eq(itemEnrichments.sourceItemId, itemId))
        .limit(1),
    );

    const companyRows = await withSqliteBusyRetry(() =>
      this.database
        .select()
        .from(itemCompanies)
        .where(eq(itemCompanies.sourceItemId, itemId))
        .orderBy(desc(itemCompanies.createdAt)),
    );

    const companies = companyRows.map(mapItemCompany);
    const snapshots = await loadSnapshotsForCompanies(this.database, companies);

    return {
      item: mapSourceItem(itemRow),
      companies,
      enrichment: enrichmentRow ? mapItemEnrichment(enrichmentRow) : null,
      snapshots,
    };
  }

  private async findMatchingItemIds(filters: InboxFilters): Promise<string[]> {
    const companyConditions: SQL[] = [];
    const query = filters.query?.trim();

    if (filters.ticker) {
      companyConditions.push(eq(itemCompanies.ticker, filters.ticker));
    }

    if (filters.companyName) {
      companyConditions.push(
        sql`lower(${itemCompanies.companyName}) = lower(${filters.companyName})`,
      );
    }

    if (query) {
      const pattern = toSearchPattern(query);
      const companyQueryCondition = or(
        sql`lower(${itemCompanies.companyName}) like ${pattern}`,
        sql`lower(coalesce(${itemCompanies.ticker}, '')) like ${pattern}`,
      );

      if (companyQueryCondition) {
        companyConditions.push(companyQueryCondition);
      }
    }

    const baseConditions: SQL[] = [];
    if (filters.sourceId) {
      baseConditions.push(eq(sourceItems.sourceId, filters.sourceId));
    }
    if (filters.readState) {
      baseConditions.push(eq(sourceItems.readState, filters.readState));
    }
    if (typeof filters.savedForResearch === 'boolean') {
      baseConditions.push(
        eq(sourceItems.savedForResearch, filters.savedForResearch),
      );
    }
    if (filters.enrichmentState) {
      baseConditions.push(
        eq(sourceItems.enrichmentState, filters.enrichmentState),
      );
    }

    const candidateIds = new Set<string>();
    if (companyConditions.length > 0) {
      const companyWhereCondition =
        companyConditions.length === 1
          ? companyConditions[0]
          : and(...companyConditions);

      if (!companyWhereCondition) {
        return [];
      }

      const companyRows = await withSqliteBusyRetry(() =>
        this.database
          .selectDistinct({
            sourceItemId: itemCompanies.sourceItemId,
          })
          .from(itemCompanies)
          .where(companyWhereCondition),
      );

      for (const row of companyRows) {
        candidateIds.add(row.sourceItemId);
      }
    }

    if (query) {
      const pattern = toSearchPattern(query);
      const sourceRows = await withSqliteBusyRetry(() =>
        this.database
          .select({ id: sourceItems.id })
          .from(sourceItems)
          .where(
            or(
              sql`lower(${sourceItems.title}) like ${pattern}`,
              sql`lower(coalesce(${sourceItems.summary}, '')) like ${pattern}`,
              sql`lower(coalesce(${sourceItems.author}, '')) like ${pattern}`,
              sql`lower(${sourceItems.canonicalUrl}) like ${pattern}`,
            ),
          ),
      );

      for (const row of sourceRows) {
        candidateIds.add(row.id);
      }
    }

    if (query && candidateIds.size === 0) {
      return [];
    }

    const conditions =
      candidateIds.size > 0 ? [inArray(sourceItems.id, [...candidateIds])] : [];
    conditions.push(...baseConditions);

    const orderBy = [
      desc(sourceItems.fetchedAt),
      desc(sourceItems.createdAt),
    ] as const;

    let rows: Array<{
      id: string;
    }> = [];

    if (conditions.length === 0) {
      rows = await withSqliteBusyRetry(() =>
        this.database
          .select({ id: sourceItems.id })
          .from(sourceItems)
          .orderBy(...orderBy)
          .limit(filters.limit ?? 100)
          .offset(filters.offset ?? 0),
      );
    } else if (conditions.length === 1) {
      rows = await withSqliteBusyRetry(() =>
        this.database
          .select({ id: sourceItems.id })
          .from(sourceItems)
          .where(conditions[0])
          .orderBy(...orderBy)
          .limit(filters.limit ?? 100)
          .offset(filters.offset ?? 0),
      );
    } else {
      rows = await withSqliteBusyRetry(() =>
        this.database
          .select({ id: sourceItems.id })
          .from(sourceItems)
          .where(and(...conditions))
          .orderBy(...orderBy)
          .limit(filters.limit ?? 100)
          .offset(filters.offset ?? 0),
      );
    }

    return rows.map((row) => row.id);
  }
}

export function createSourceItemsRepository(
  database: Database,
): SourceItemsRepository {
  return new SourceItemsRepository(database);
}
