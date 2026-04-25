import { z } from 'zod';

const isoTimestampSchema = z.string().datetime({ offset: true });
const jsonRecordSchema = z.record(z.string(), z.unknown());

export const stockSnapshotSchema = z.object({
  id: z.string().min(1),
  ticker: z.string().min(1),
  exchange: z.string().min(1).optional(),
  companyName: z.string().min(1).optional(),
  price: z.number().finite().optional(),
  currency: z.string().min(1).optional(),
  dailyChange: z.number().finite().optional(),
  dailyChangePercent: z.number().finite().optional(),
  marketCap: z.number().finite().optional(),
  sector: z.string().min(1).optional(),
  provider: z.string().min(1),
  capturedAt: isoTimestampSchema,
  staleAfter: isoTimestampSchema,
  raw: jsonRecordSchema,
  createdAt: isoTimestampSchema,
});

export type StockSnapshot = z.infer<typeof stockSnapshotSchema>;
