import { desc, eq, inArray, type InferSelectModel } from "drizzle-orm";
import { randomUUID } from "node:crypto";

import { stockSnapshots } from "../schema";
import type { Database } from "../client";
import type { StockSnapshotInput, StockSnapshotRecord } from "../types";
import { parseJsonRecord, stringifyJsonRecord, toNullableText } from "./helpers";

type StockSnapshotRow = InferSelectModel<typeof stockSnapshots>;

function mapSnapshot(row: StockSnapshotRow): StockSnapshotRecord {
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

export class StockSnapshotsRepository {
  constructor(private readonly database: Database) {}

  async insertSnapshot(input: StockSnapshotInput): Promise<StockSnapshotRecord> {
    const [row] = await this.database
      .insert(stockSnapshots)
      .values({
        id: input.id ?? randomUUID(),
        ticker: input.ticker,
        exchange: toNullableText(input.exchange),
        companyName: toNullableText(input.companyName),
        price: input.price,
        currency: toNullableText(input.currency),
        dailyChange: input.dailyChange,
        dailyChangePercent: input.dailyChangePercent,
        marketCap: input.marketCap,
        sector: toNullableText(input.sector),
        provider: input.provider,
        capturedAt: input.capturedAt,
        staleAfter: input.staleAfter,
        rawJson: stringifyJsonRecord(input.raw),
        createdAt: input.createdAt,
      })
      .returning();

    if (!row) {
      throw new Error("Failed to insert stock snapshot");
    }

    return mapSnapshot(row);
  }

  async getLatestSnapshot(ticker: string): Promise<StockSnapshotRecord | null> {
    const [row] = await this.database
      .select()
      .from(stockSnapshots)
      .where(eq(stockSnapshots.ticker, ticker))
      .orderBy(desc(stockSnapshots.capturedAt))
      .limit(1);

    return row ? mapSnapshot(row) : null;
  }

  async getLatestSnapshots(
    tickers: string[],
  ): Promise<StockSnapshotRecord[]> {
    if (tickers.length === 0) {
      return [];
    }

    const rows = await this.database
      .select()
      .from(stockSnapshots)
      .where(inArray(stockSnapshots.ticker, tickers))
      .orderBy(desc(stockSnapshots.capturedAt));

    const latestByTicker = new Map<string, StockSnapshotRecord>();
    for (const row of rows) {
      if (!latestByTicker.has(row.ticker)) {
        latestByTicker.set(row.ticker, mapSnapshot(row));
      }
    }

    return tickers
      .map((ticker) => latestByTicker.get(ticker))
      .filter((snapshot): snapshot is StockSnapshotRecord => Boolean(snapshot));
  }
}

export function createStockSnapshotsRepository(
  database: Database,
): StockSnapshotsRepository {
  return new StockSnapshotsRepository(database);
}
