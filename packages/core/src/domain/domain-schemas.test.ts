import { describe, expect, it } from 'vitest';

import {
  companyMatchStatusSchema,
  enrichmentStateSchema,
  itemReadStateSchema,
  jobStateSchema,
  jobTypeSchema,
  relationshipTypeSchema,
  sourceTypeSchema,
} from './enums';
import { itemCompanySchema, tickerCorrectionSchema } from './company';
import { itemEnrichmentSchema } from './enrichment';
import { jobSchema } from './job';
import { sourceItemSchema } from './source-item';
import { stockSnapshotSchema } from './stock';

const isoNow = '2026-04-25T12:00:00.000Z';
const isoLater = '2026-04-25T12:15:00.000Z';

describe('shared domain schemas', () => {
  it('parses a valid source item', () => {
    const sourceItem = {
      id: 'item_123',
      sourceId: 'source_123',
      externalId: 'external_123',
      canonicalUrl: 'https://example.com/articles/123',
      title: 'Example headline',
      summary: 'A short summary',
      author: 'Jane Reporter',
      publishedAt: isoNow,
      fetchedAt: isoNow,
      sourceMetadata: {
        feedTitle: 'Example Feed',
        categories: ['markets', 'news'],
      },
      readState: 'unread',
      savedForResearch: false,
      enrichmentState: 'pending',
      createdAt: isoNow,
      updatedAt: isoNow,
    } as const;

    expect(sourceItemSchema.parse(sourceItem)).toEqual(sourceItem);
  });

  it('parses a valid item enrichment', () => {
    const enrichment = {
      id: 'enrichment_123',
      sourceItemId: 'item_123',
      state: 'complete',
      summary: 'The item mentions a public software company.',
      modelProvider: 'openai-compatible',
      modelName: 'local-model',
      promptVersion: 'v1',
      completedAt: isoLater,
      createdAt: isoNow,
      updatedAt: isoLater,
    } as const;

    expect(itemEnrichmentSchema.parse(enrichment)).toEqual(enrichment);
  });

  it('parses a valid item company', () => {
    const itemCompany = {
      id: 'company_123',
      sourceItemId: 'item_123',
      companyName: 'Acme Corp',
      ticker: 'ACME',
      exchange: 'NASDAQ',
      relationshipType: 'mentioned',
      relevanceExplanation: "The article discusses Acme's new product launch.",
      confidence: 0.91,
      matchStatus: 'validated',
      evidenceText: 'Acme Corp announced a quarterly update.',
      createdAt: isoNow,
      updatedAt: isoLater,
    } as const;

    expect(itemCompanySchema.parse(itemCompany)).toEqual(itemCompany);
  });

  it('parses a valid stock snapshot', () => {
    const stockSnapshot = {
      id: 'snapshot_123',
      ticker: 'ACME',
      exchange: 'NASDAQ',
      companyName: 'Acme Corp',
      price: 123.45,
      currency: 'USD',
      dailyChange: 1.23,
      dailyChangePercent: 1.01,
      marketCap: 123456789,
      sector: 'Technology',
      provider: 'yahoo-finance2',
      capturedAt: isoNow,
      staleAfter: isoLater,
      raw: {
        symbol: 'ACME',
        regularMarketPrice: 123.45,
      },
      createdAt: isoNow,
    } as const;

    expect(stockSnapshotSchema.parse(stockSnapshot)).toEqual(stockSnapshot);
  });

  it('parses a valid ticker correction shaped object', () => {
    const tickerCorrection = {
      id: 'correction_123',
      companyName: 'Acme Corp',
      correctTicker: 'ACME',
      correctExchange: 'NASDAQ',
      notes: 'Manual correction from the user.',
      enabled: true,
      createdAt: isoNow,
      updatedAt: isoLater,
    } as const;

    expect(tickerCorrectionSchema.parse(tickerCorrection)).toEqual(
      tickerCorrection,
    );
  });

  it('parses a valid job', () => {
    const job = {
      id: 'job_123',
      type: 'item.enrich',
      state: 'queued',
      payload: {
        sourceItemId: 'item_123',
        trigger: 'source-refresh',
      },
      attemptCount: 0,
      maxAttempts: 3,
      runAfter: isoNow,
      createdAt: isoNow,
      updatedAt: isoLater,
    } as const;

    expect(jobSchema.parse(job)).toEqual(job);
  });

  it.each([
    ['source type', sourceTypeSchema, 'unknown'],
    ['read state', itemReadStateSchema, 'processing'],
    ['enrichment state', enrichmentStateSchema, 'done'],
    ['company match status', companyMatchStatusSchema, 'unknown'],
    ['relationship type', relationshipTypeSchema, 'unknown'],
    ['job type', jobTypeSchema, 'unknown'],
    ['job state', jobStateSchema, 'processing'],
  ] as const)('rejects invalid %s values', (_label, schema, value) => {
    expect(schema.safeParse(value).success).toBe(false);
  });
});
