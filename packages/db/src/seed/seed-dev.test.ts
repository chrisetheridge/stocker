import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { createDatabase, createDatabaseClient } from '../client';
import { migrateDatabase, migrationsFolder } from '../migrate';
import { createSourceItemsRepository } from '../repositories/source-items-repository';
import { createSourcesRepository } from '../repositories/sources-repository';
import { createStockSnapshotsRepository } from '../repositories/stock-snapshots-repository';
import { createTickerCorrectionsRepository } from '../repositories/ticker-corrections-repository';
import { seedDevelopmentDatabase } from './seed-dev';

describe('seedDevelopmentDatabase', () => {
  it('seeds deterministic sample data without duplication', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'stocker-seed-'));
    const databaseUrl = `file:${path.join(tempDir, 'stocker.sqlite')}`;
    await migrateDatabase({ databaseUrl, migrationsFolder });

    const client = createDatabaseClient(databaseUrl);
    const database = createDatabase(client);
    const items = createSourceItemsRepository(database);
    const sources = createSourcesRepository(database);
    const snapshots = createStockSnapshotsRepository(database);
    const corrections = createTickerCorrectionsRepository(database);

    try {
      await seedDevelopmentDatabase(database);
      await seedDevelopmentDatabase(database);

      const allItems = await items.listInboxItems();
      const allSources = await sources.listSourceStatus();
      const allCorrections = await corrections.listCorrections();
      const msftSnapshot = await snapshots.getLatestSnapshot('MSFT');

      expect(allSources).toHaveLength(2);
      expect(allItems).toHaveLength(4);
      expect(
        allItems.filter((item) => item.item.savedForResearch),
      ).toHaveLength(1);
      expect(
        allItems.filter((item) => item.item.enrichmentState === 'pending'),
      ).toHaveLength(1);
      expect(
        allItems.filter((item) => item.item.enrichmentState === 'failed'),
      ).toHaveLength(1);
      expect(
        allItems.filter((item) => item.item.enrichmentState === 'needs_review'),
      ).toHaveLength(1);
      expect(
        allItems.filter((item) => item.item.enrichmentState === 'complete'),
      ).toHaveLength(1);
      expect(allCorrections).toHaveLength(1);
      expect(msftSnapshot?.staleAfter).toBe('2026-04-25T09:00:00.000Z');
    } finally {
      await client.close();
    }
  });
});
