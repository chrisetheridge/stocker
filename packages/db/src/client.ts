import fs from 'node:fs';
import path from 'node:path';

import { createClient, type Client } from '@libsql/client';
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql';

import * as schema from './schema';

export type DatabaseClient = Client;
export type Database = LibSQLDatabase<typeof schema>;

const globalForDb = globalThis as unknown as {
  client: Client | undefined;
};

export function createDatabaseClient(url: string): Client {
  if (url.startsWith('file:')) {
    const filePath = url.slice('file:'.length);
    const absolutePath = path.isAbsolute(filePath)
      ? filePath
      : path.resolve(filePath);
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  }

  return createClient({ url });
}

export function createDatabase(client: Client): Database {
  return drizzle(client, { schema });
}

export function getSharedDatabaseClient(url: string): Client {
  const client = globalForDb.client ?? createDatabaseClient(url);
  if (globalForDb.client === undefined) {
    globalForDb.client = client;
  }
  return client;
}

export function resetSharedDatabaseClient(): void {
  globalForDb.client = undefined;
}
