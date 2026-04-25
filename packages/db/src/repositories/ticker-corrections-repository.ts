import { eq, type InferSelectModel, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";

import { tickerCorrections } from "../schema";
import type { Database } from "../client";
import type {
  TickerCorrectionInput,
  TickerCorrectionRecord,
} from "../types";
import { toNullableText } from "./helpers";

type TickerCorrectionRow = InferSelectModel<typeof tickerCorrections>;

function mapCorrection(row: TickerCorrectionRow): TickerCorrectionRecord {
  return {
    id: row.id,
    companyName: row.companyName,
    correctTicker: row.correctTicker,
    correctExchange: row.correctExchange ?? null,
    notes: row.notes ?? null,
    enabled: row.enabled,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class TickerCorrectionsRepository {
  constructor(private readonly database: Database) {}

  async upsertCorrection(
    input: TickerCorrectionInput,
  ): Promise<TickerCorrectionRecord> {
    const [row] = await this.database
      .insert(tickerCorrections)
      .values({
        id: input.id ?? randomUUID(),
        companyName: input.companyName,
        correctTicker: input.correctTicker,
        correctExchange: toNullableText(input.correctExchange),
        notes: toNullableText(input.notes),
        enabled: input.enabled ?? true,
        createdAt: input.createdAt,
        updatedAt: input.updatedAt,
      })
      .onConflictDoUpdate({
        target: [
          tickerCorrections.companyName,
          tickerCorrections.correctTicker,
          tickerCorrections.correctExchange,
        ],
        set: {
          notes: toNullableText(input.notes),
          enabled: input.enabled ?? true,
          updatedAt: input.updatedAt,
        },
      })
      .returning();

    if (!row) {
      throw new Error("Failed to upsert ticker correction");
    }

    return mapCorrection(row);
  }

  async disableCorrection(correctionId: string): Promise<TickerCorrectionRecord | null> {
    const [row] = await this.database
      .update(tickerCorrections)
      .set({
        enabled: false,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(tickerCorrections.id, correctionId))
      .returning();

    return row ? mapCorrection(row) : null;
  }

  async findEnabledCorrection(
    companyName: string,
  ): Promise<TickerCorrectionRecord | null> {
    const [row] = await this.database
      .select()
      .from(tickerCorrections)
      .where(
        sql`lower(${tickerCorrections.companyName}) = lower(${companyName}) and ${tickerCorrections.enabled} = 1`,
      )
      .limit(1);

    return row ? mapCorrection(row) : null;
  }

  async listCorrections(): Promise<TickerCorrectionRecord[]> {
    const rows = await this.database.select().from(tickerCorrections);
    return rows.map(mapCorrection);
  }
}

export function createTickerCorrectionsRepository(
  database: Database,
): TickerCorrectionsRepository {
  return new TickerCorrectionsRepository(database);
}
