import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { beforeEach, describe, expect, it } from 'vitest';

import { createDatabase, createDatabaseClient } from '../client';
import { migrateDatabase, migrationsFolder } from '../migrate';
import { createEnrichmentRepository } from './enrichment-repository';
import { createJobsRepository } from './jobs-repository';
import { createSourceItemsRepository } from './source-items-repository';
import { createSourcesRepository } from './sources-repository';
import { createStockSnapshotsRepository } from './stock-snapshots-repository';
import { createTickerCorrectionsRepository } from './ticker-corrections-repository';

const now = '2026-04-25T12:00:00.000Z';
const later = '2026-04-25T12:15:00.000Z';

describe('repository layer', () => {
  let databaseUrl: string;

  beforeEach(async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'stocker-repos-'));
    databaseUrl = `file:${path.join(tempDir, 'stocker.sqlite')}`;
    await migrateDatabase({ databaseUrl, migrationsFolder });
  });

  it('round-trips source, inbox, and filter data', async () => {
    const client = createDatabaseClient(databaseUrl);
    const database = createDatabase(client);
    const sources = createSourcesRepository(database);
    const items = createSourceItemsRepository(database);
    const enrichments = createEnrichmentRepository(database);
    const snapshots = createStockSnapshotsRepository(database);

    try {
      await sources.upsertConfiguredSource({
        id: 'hacker-news',
        type: 'rss',
        name: 'Hacker News',
        enabled: true,
        config: {
          url: 'https://news.ycombinator.com/rss',
        },
        createdAt: now,
        updatedAt: now,
      });

      await items.upsertFromSource({
        id: 'item-1',
        sourceId: 'hacker-news',
        externalId: 'external-1',
        canonicalUrl: 'https://example.com/articles/1',
        title: 'Acme launches a new product',
        summary: 'Acme made a new announcement.',
        author: 'Jane Reporter',
        publishedAt: now,
        fetchedAt: now,
        sourceMetadata: {
          feedTitle: 'Hacker News',
        },
        readState: 'unread',
        savedForResearch: false,
        enrichmentState: 'pending',
        createdAt: now,
        updatedAt: now,
      });

      await items.upsertFromSource({
        id: 'item-2',
        sourceId: 'hacker-news',
        externalId: 'external-2',
        canonicalUrl: 'https://example.com/articles/2',
        title: 'Other company update',
        fetchedAt: later,
        sourceMetadata: {
          feedTitle: 'Hacker News',
        },
        readState: 'read',
        savedForResearch: true,
        enrichmentState: 'complete',
        createdAt: later,
        updatedAt: later,
      });

      await enrichments.replaceItemCompanies('item-1', [
        {
          id: 'company-1',
          sourceItemId: 'item-1',
          companyName: 'Acme Corp',
          ticker: 'ACME',
          exchange: 'NASDAQ',
          relationshipType: 'mentioned',
          relevanceExplanation: 'The article names Acme directly.',
          confidence: 0.9,
          matchStatus: 'validated',
          evidenceText: 'Acme launches a new product',
          createdAt: now,
          updatedAt: now,
        },
      ]);

      await enrichments.upsertItemEnrichment({
        id: 'enrichment-1',
        sourceItemId: 'item-1',
        state: 'complete',
        summary: 'The item mentions Acme.',
        modelProvider: 'openai-compatible',
        modelName: 'local-model',
        promptVersion: 'v1',
        completedAt: later,
        errorMessage: null,
        createdAt: now,
        updatedAt: later,
      });

      await snapshots.insertSnapshot({
        id: 'snapshot-1',
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
        capturedAt: later,
        staleAfter: '2026-04-25T13:00:00.000Z',
        raw: {
          symbol: 'ACME',
        },
        createdAt: later,
      });

      const inboxByTicker = await items.listInboxItems({ ticker: 'ACME' });
      expect(inboxByTicker).toHaveLength(1);
      expect(inboxByTicker[0]?.item.id).toBe('item-1');
      expect(inboxByTicker[0]?.companies[0]?.ticker).toBe('ACME');
      expect(inboxByTicker[0]?.enrichment?.summary).toBe(
        'The item mentions Acme.',
      );
      expect(inboxByTicker[0]?.snapshots[0]?.ticker).toBe('ACME');

      const inboxBySavedState = await items.listInboxItems({
        savedForResearch: true,
      });
      expect(inboxBySavedState).toHaveLength(1);
      expect(inboxBySavedState[0]?.item.id).toBe('item-2');

      const inboxByReadState = await items.listInboxItems({
        readState: 'read',
      });
      expect(inboxByReadState).toHaveLength(1);
      expect(inboxByReadState[0]?.item.id).toBe('item-2');

      const inboxBySource = await items.listInboxItems({
        sourceId: 'hacker-news',
      });
      expect(inboxBySource).toHaveLength(2);

      const status = await sources.listSourceStatus();
      expect(status[0]?.enabled).toBe(true);

      await sources.markFetchSuccess('hacker-news', later);
      await sources.markFetchFailure('hacker-news', 'boom', later);
      const updatedStatus = await sources.listSourceStatus();
      expect(updatedStatus[0]?.lastErrorMessage).toBe('boom');

      const sourceItem = await items.getItemDetail('item-1');
      expect(sourceItem?.item.title).toBe('Acme launches a new product');

      const updatedItem = await items.markReadState('item-1', 'read');
      expect(updatedItem?.readState).toBe('read');

      const savedItem = await items.setSavedForResearch('item-1', true);
      expect(savedItem?.savedForResearch).toBe(true);

      const enrichmentStateItem = await items.setEnrichmentState(
        'item-1',
        'needs_review',
      );
      expect(enrichmentStateItem?.enrichmentState).toBe('needs_review');
    } finally {
      await client.close();
    }
  });

  it('claims, retries, and fails jobs deterministically', async () => {
    const client = createDatabaseClient(databaseUrl);
    const database = createDatabase(client);
    const jobs = createJobsRepository(database);

    try {
      const queued = await jobs.enqueue(
        'item.enrich',
        {
          sourceItemId: 'item-1',
          trigger: 'source-refresh',
        },
        {
          id: 'job-1',
          runAfter: now,
          createdAt: now,
          updatedAt: now,
        },
      );

      expect(queued.state).toBe('queued');

      const claimed = await jobs.claimNext('worker-1', now);
      expect(claimed?.state).toBe('running');
      expect(claimed?.lockedBy).toBe('worker-1');

      const succeeded = await jobs.markSucceeded('job-1', later);
      expect(succeeded?.state).toBe('succeeded');

      const retried = await jobs.reschedule(
        'job-1',
        later,
        'temporary failure',
        later,
      );
      expect(retried?.state).toBe('queued');
      expect(retried?.attemptCount).toBe(1);

      const failed = await jobs.markFailed('job-1', 'terminal failure', later);
      expect(failed?.state).toBe('failed');
      expect(failed?.lastErrorMessage).toBe('terminal failure');
    } finally {
      await client.close();
    }
  });

  it('supports enrichment snapshots and ticker corrections', async () => {
    const client = createDatabaseClient(databaseUrl);
    const database = createDatabase(client);
    const enrichments = createEnrichmentRepository(database);
    const corrections = createTickerCorrectionsRepository(database);
    const snapshots = createStockSnapshotsRepository(database);
    const items = createSourceItemsRepository(database);
    const sources = createSourcesRepository(database);

    try {
      await sources.upsertConfiguredSource({
        id: 'source-1',
        type: 'rss',
        name: 'Source',
        enabled: true,
        config: {},
        createdAt: now,
        updatedAt: now,
      });

      await items.upsertFromSource({
        id: 'item-1',
        sourceId: 'source-1',
        externalId: 'external-1',
        canonicalUrl: 'https://example.com/articles/1',
        title: 'Company update',
        fetchedAt: now,
        sourceMetadata: {},
        readState: 'unread',
        savedForResearch: false,
        enrichmentState: 'pending',
        createdAt: now,
        updatedAt: now,
      });

      const enrichmentRun = await enrichments.startRun('item-1', now);
      expect(enrichmentRun.state).toBe('running');

      const finishedRun = await enrichments.completeRun(
        enrichmentRun.id,
        {
          raw: true,
        },
        later,
      );
      expect(finishedRun?.state).toBe('complete');

      const enrichment = await enrichments.upsertItemEnrichment({
        id: 'enrichment-1',
        sourceItemId: 'item-1',
        state: 'complete',
        summary: 'Summary',
        modelProvider: 'openai-compatible',
        modelName: 'local-model',
        promptVersion: 'v1',
        completedAt: later,
        createdAt: now,
        updatedAt: later,
      });
      expect(enrichment.summary).toBe('Summary');

      const correction = await corrections.upsertCorrection({
        id: 'correction-1',
        companyName: 'Acme Corp',
        correctTicker: 'ACME',
        correctExchange: 'NASDAQ',
        notes: 'Manual fix',
        createdAt: now,
        updatedAt: now,
      });
      expect(correction.enabled).toBe(true);

      const foundCorrection =
        await corrections.findEnabledCorrection('Acme Corp');
      expect(foundCorrection?.correctTicker).toBe('ACME');

      const disabled = await corrections.disableCorrection('correction-1');
      expect(disabled?.enabled).toBe(false);

      const snapshot = await snapshots.insertSnapshot({
        id: 'snapshot-1',
        ticker: 'ACME',
        provider: 'yahoo-finance2',
        capturedAt: later,
        staleAfter: '2026-04-25T13:00:00.000Z',
        raw: {
          symbol: 'ACME',
        },
        createdAt: later,
      });
      expect(snapshot.ticker).toBe('ACME');

      const latestSnapshot = await snapshots.getLatestSnapshot('ACME');
      expect(latestSnapshot?.id).toBe('snapshot-1');

      const latestSnapshots = await snapshots.getLatestSnapshots(['ACME']);
      expect(latestSnapshots).toHaveLength(1);

      const correctionsList = await corrections.listCorrections();
      expect(correctionsList).toHaveLength(1);
    } finally {
      await client.close();
    }
  });
});
