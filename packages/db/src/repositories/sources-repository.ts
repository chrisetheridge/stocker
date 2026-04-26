import { eq, type InferSelectModel } from 'drizzle-orm';

import { sources } from '../schema';
import type { Database } from '../client';
import type { SourceRecord, SourceUpsertInput } from '../types';
import {
  parseJsonRecord,
  stringifyJsonRecord,
  toNullableText,
  withSqliteBusyRetry,
} from './helpers';

type SourceRow = InferSelectModel<typeof sources>;

function mapSource(row: SourceRow): SourceRecord {
  return {
    id: row.id,
    type: row.type,
    name: row.name,
    enabled: row.enabled,
    config: parseJsonRecord(row.configJson),
    lastFetchedAt: row.lastFetchedAt ?? null,
    lastSuccessAt: row.lastSuccessAt ?? null,
    lastErrorAt: row.lastErrorAt ?? null,
    lastErrorMessage: row.lastErrorMessage ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class SourcesRepository {
  constructor(private readonly database: Database) {}

  async upsertConfiguredSource(
    input: SourceUpsertInput,
  ): Promise<SourceRecord> {
    const [row] = await withSqliteBusyRetry(() =>
      this.database
        .insert(sources)
        .values({
          id: input.id,
          type: input.type,
          name: input.name,
          enabled: input.enabled,
          configJson: stringifyJsonRecord(input.config),
          lastFetchedAt: toNullableText(input.lastFetchedAt),
          lastSuccessAt: toNullableText(input.lastSuccessAt),
          lastErrorAt: toNullableText(input.lastErrorAt),
          lastErrorMessage: toNullableText(input.lastErrorMessage),
          createdAt: input.createdAt,
          updatedAt: input.updatedAt,
        })
        .onConflictDoUpdate({
          target: sources.id,
          set: {
            type: input.type,
            name: input.name,
            enabled: input.enabled,
            configJson: stringifyJsonRecord(input.config),
            lastFetchedAt: toNullableText(input.lastFetchedAt),
            lastSuccessAt: toNullableText(input.lastSuccessAt),
            lastErrorAt: toNullableText(input.lastErrorAt),
            lastErrorMessage: toNullableText(input.lastErrorMessage),
            updatedAt: input.updatedAt,
          },
        })
        .returning(),
    );

    if (!row) {
      throw new Error('Failed to upsert configured source');
    }

    return mapSource(row);
  }

  async listEnabledSources(): Promise<SourceRecord[]> {
    const rows = await withSqliteBusyRetry(() =>
      this.database.select().from(sources).where(eq(sources.enabled, true)),
    );

    return rows.map(mapSource);
  }

  async markFetchSuccess(
    sourceId: string,
    fetchedAt: string,
  ): Promise<SourceRecord | null> {
    const [row] = await withSqliteBusyRetry(() =>
      this.database
        .update(sources)
        .set({
          lastFetchedAt: fetchedAt,
          lastSuccessAt: fetchedAt,
          lastErrorAt: null,
          lastErrorMessage: null,
          updatedAt: fetchedAt,
        })
        .where(eq(sources.id, sourceId))
        .returning(),
    );

    return row ? mapSource(row) : null;
  }

  async markFetchFailure(
    sourceId: string,
    errorMessage: string,
    failedAt: string,
  ): Promise<SourceRecord | null> {
    const [row] = await withSqliteBusyRetry(() =>
      this.database
        .update(sources)
        .set({
          lastErrorAt: failedAt,
          lastErrorMessage: errorMessage,
          updatedAt: failedAt,
        })
        .where(eq(sources.id, sourceId))
        .returning(),
    );

    return row ? mapSource(row) : null;
  }

  async listSourceStatus(): Promise<SourceRecord[]> {
    const rows = await withSqliteBusyRetry(() => this.database.select().from(sources));
    return rows.map(mapSource);
  }
}

export function createSourcesRepository(database: Database): SourcesRepository {
  return new SourcesRepository(database);
}
