import { eq, type InferSelectModel } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';

import { enrichmentRuns, itemCompanies, itemEnrichments } from '../schema';
import type { Database } from '../client';
import type {
  EnrichmentRunRecord,
  ItemCompanyInput,
  ItemCompanyRecord,
  ItemEnrichmentInput,
  ItemEnrichmentRecord,
  JsonRecord,
} from '../types';
import {
  parseJsonRecord,
  stringifyJsonRecord,
  toNullableText,
} from './helpers';

type EnrichmentRunRow = InferSelectModel<typeof enrichmentRuns>;
type ItemEnrichmentRow = InferSelectModel<typeof itemEnrichments>;
type ItemCompanyRow = InferSelectModel<typeof itemCompanies>;

function mapRun(row: EnrichmentRunRow): EnrichmentRunRecord {
  return {
    id: row.id,
    sourceItemId: row.sourceItemId,
    state: row.state,
    startedAt: row.startedAt,
    finishedAt: row.finishedAt ?? null,
    errorMessage: row.errorMessage ?? null,
    rawLlmOutput: row.rawLlmOutputJson
      ? parseJsonRecord(row.rawLlmOutputJson)
      : null,
    createdAt: row.createdAt,
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

export class EnrichmentRepository {
  constructor(private readonly database: Database) {}

  async startRun(itemId: string, now: string): Promise<EnrichmentRunRecord> {
    const [row] = await this.database
      .insert(enrichmentRuns)
      .values({
        id: randomUUID(),
        sourceItemId: itemId,
        state: 'running',
        startedAt: now,
        finishedAt: null,
        errorMessage: null,
        rawLlmOutputJson: null,
        createdAt: now,
      })
      .returning();

    if (!row) {
      throw new Error('Failed to start enrichment run');
    }

    return mapRun(row);
  }

  async completeRun(
    runId: string,
    rawOutput: JsonRecord,
    now: string,
  ): Promise<EnrichmentRunRecord | null> {
    const [row] = await this.database
      .update(enrichmentRuns)
      .set({
        state: 'complete',
        finishedAt: now,
        errorMessage: null,
        rawLlmOutputJson: stringifyJsonRecord(rawOutput),
      })
      .where(eq(enrichmentRuns.id, runId))
      .returning();

    return row ? mapRun(row) : null;
  }

  async failRun(
    runId: string,
    errorMessage: string,
    now: string,
  ): Promise<EnrichmentRunRecord | null> {
    const [row] = await this.database
      .update(enrichmentRuns)
      .set({
        state: 'failed',
        finishedAt: now,
        errorMessage,
      })
      .where(eq(enrichmentRuns.id, runId))
      .returning();

    return row ? mapRun(row) : null;
  }

  async upsertItemEnrichment(
    input: ItemEnrichmentInput,
  ): Promise<ItemEnrichmentRecord> {
    const [row] = await this.database
      .insert(itemEnrichments)
      .values({
        id: input.id,
        sourceItemId: input.sourceItemId,
        state: input.state,
        summary: toNullableText(input.summary),
        modelProvider: toNullableText(input.modelProvider),
        modelName: toNullableText(input.modelName),
        promptVersion: toNullableText(input.promptVersion),
        completedAt: toNullableText(input.completedAt),
        errorMessage: toNullableText(input.errorMessage),
        createdAt: input.createdAt,
        updatedAt: input.updatedAt,
      })
      .onConflictDoUpdate({
        target: itemEnrichments.sourceItemId,
        set: {
          state: input.state,
          summary: toNullableText(input.summary),
          modelProvider: toNullableText(input.modelProvider),
          modelName: toNullableText(input.modelName),
          promptVersion: toNullableText(input.promptVersion),
          completedAt: toNullableText(input.completedAt),
          errorMessage: toNullableText(input.errorMessage),
          updatedAt: input.updatedAt,
        },
      })
      .returning();

    if (!row) {
      throw new Error('Failed to upsert item enrichment');
    }

    return mapItemEnrichment(row);
  }

  async replaceItemCompanies(
    itemId: string,
    companies: ItemCompanyInput[],
  ): Promise<ItemCompanyRecord[]> {
    return this.database.transaction(async (transaction) => {
      await transaction
        .delete(itemCompanies)
        .where(eq(itemCompanies.sourceItemId, itemId));

      if (companies.length === 0) {
        return [];
      }

      const rows = await transaction
        .insert(itemCompanies)
        .values(
          companies.map((company) => ({
            id: company.id,
            sourceItemId: itemId,
            companyName: company.companyName,
            ticker: toNullableText(company.ticker),
            exchange: toNullableText(company.exchange),
            relationshipType: company.relationshipType,
            relevanceExplanation: company.relevanceExplanation,
            confidence: company.confidence,
            matchStatus: company.matchStatus,
            evidenceText: toNullableText(company.evidenceText),
            createdAt: company.createdAt,
            updatedAt: company.updatedAt,
          })),
        )
        .returning();

      return rows.map(mapItemCompany);
    });
  }
}

export function createEnrichmentRepository(
  database: Database,
): EnrichmentRepository {
  return new EnrichmentRepository(database);
}
