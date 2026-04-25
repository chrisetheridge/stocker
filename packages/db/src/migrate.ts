import { migrate } from 'drizzle-orm/libsql/migrator';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { createDatabase, createDatabaseClient } from './client';

export const migrationsFolder = fileURLToPath(
  new URL('../migrations', import.meta.url),
);

export type MigrateOptions = {
  databaseUrl?: string;
  migrationsFolder?: string;
};

export async function migrateDatabase(
  options: MigrateOptions = {},
): Promise<void> {
  const databaseUrl =
    options.databaseUrl ??
    process.env.STOCKER_DATABASE_URL ??
    process.env.DATABASE_URL ??
    'file:./stocker.sqlite';

  const client = createDatabaseClient(databaseUrl);
  try {
    const database = createDatabase(client);
    await migrate(database, {
      migrationsFolder: options.migrationsFolder ?? migrationsFolder,
    });
  } finally {
    await client.close();
  }
}

export async function main(): Promise<void> {
  await migrateDatabase();
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  await main();
}
