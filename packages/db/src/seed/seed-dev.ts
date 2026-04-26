import { inArray } from 'drizzle-orm';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  createDatabase,
  createDatabaseClient,
  createEnrichmentRepository,
  createSourceItemsRepository,
  createSourcesRepository,
  createStockSnapshotsRepository,
  createTickerCorrectionsRepository,
  stockSnapshots,
  type Database,
} from '../index';
import { loadConfigFromEnv } from '@stocker/config';
import { migrateDatabase } from '../migrate';

import { sampleData } from './sample-data';

function resolveDatabaseUrl(databasePath: string): string {
  if (databasePath.startsWith('file:')) {
    return databasePath;
  }

  return `file:${path.resolve(databasePath)}`;
}

async function clearSeedSnapshots(database: Database): Promise<void> {
  const snapshotIds = sampleData.snapshots.map((snapshot) => snapshot.id);
  if (snapshotIds.length === 0) {
    return;
  }

  await database
    .delete(stockSnapshots)
    .where(inArray(stockSnapshots.id, snapshotIds));
}

export async function seedDevelopmentDatabase(
  database: Database,
): Promise<void> {
  const sources = createSourcesRepository(database);
  const items = createSourceItemsRepository(database);
  const enrichments = createEnrichmentRepository(database);
  const snapshots = createStockSnapshotsRepository(database);
  const corrections = createTickerCorrectionsRepository(database);

  for (const source of sampleData.sources) {
    await sources.upsertConfiguredSource(source);
  }

  for (const item of sampleData.items) {
    await items.upsertFromSource(item);
  }

  for (const { itemId, companies } of sampleData.companies) {
    await enrichments.replaceItemCompanies(itemId, companies);
  }

  for (const enrichment of sampleData.enrichments) {
    await enrichments.upsertItemEnrichment(enrichment);
  }

  await clearSeedSnapshots(database);
  for (const snapshot of sampleData.snapshots) {
    await snapshots.insertSnapshot(snapshot);
  }

  for (const correction of sampleData.corrections) {
    await corrections.upsertCorrection(correction);
  }
}

export async function main(): Promise<void> {
  const config = await loadConfigFromEnv();
  const databaseUrl = resolveDatabaseUrl(
    process.env.STOCKER_DATABASE_URL ?? config.app.databasePath,
  );

  await migrateDatabase({ databaseUrl });

  const client = createDatabaseClient(databaseUrl);
  try {
    const database = createDatabase(client);
    await seedDevelopmentDatabase(database);
    console.log(
      `Seeded ${sampleData.sources.length} sources, ${sampleData.items.length} items, ${sampleData.corrections.length} corrections, and ${sampleData.snapshots.length} stock snapshots.`,
    );
  } finally {
    await client.close();
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  await main();
}
