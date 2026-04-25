import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { beforeEach, describe, expect, it } from "vitest";

import { createDatabase, createDatabaseClient } from "./client";
import { migrateDatabase } from "./migrate";
import { sourceItems, sources } from "./schema";
import { parseJsonRecord } from "./repositories/helpers";

describe("db schema and migrations", () => {
  let tempDir: string;
  let databaseUrl: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "stocker-db-"));
    databaseUrl = `file:${path.join(tempDir, "stocker.sqlite")}`;
  });

  it("migrates an empty database and round-trips source data", async () => {
    await migrateDatabase({ databaseUrl });

    const client = createDatabaseClient(databaseUrl);
    const database = createDatabase(client);

    try {
      await database.insert(sources).values({
        id: "source_1",
        type: "rss",
        name: "Example Feed",
        enabled: true,
        configJson: JSON.stringify({ url: "https://example.com/rss" }),
        createdAt: "2026-04-25T12:00:00.000Z",
        updatedAt: "2026-04-25T12:00:00.000Z",
      });

      await database.insert(sourceItems).values({
        id: "item_1",
        sourceId: "source_1",
        externalId: "external-1",
        canonicalUrl: "https://example.com/articles/1",
        title: "Example article",
        fetchedAt: "2026-04-25T12:00:00.000Z",
        sourceMetadataJson: JSON.stringify({ feedTitle: "Example Feed" }),
        readState: "unread",
        savedForResearch: false,
        enrichmentState: "pending",
        createdAt: "2026-04-25T12:00:00.000Z",
        updatedAt: "2026-04-25T12:00:00.000Z",
      });

      const [sourceRow] = await database.select().from(sources);
      expect(sourceRow).toMatchObject({
        id: "source_1",
        type: "rss",
        name: "Example Feed",
      });

      const [itemRow] = await database.select().from(sourceItems);
      expect(itemRow).toMatchObject({
        id: "item_1",
        sourceId: "source_1",
        externalId: "external-1",
        title: "Example article",
      });
      expect(parseJsonRecord(itemRow.sourceMetadataJson)).toEqual({
        feedTitle: "Example Feed",
      });
    } finally {
      await client.close();
    }
  });
});
