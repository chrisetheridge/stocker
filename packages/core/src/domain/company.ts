import { z } from "zod";

import {
  companyMatchStatusSchema,
  relationshipTypeSchema,
} from "./enums";

const isoTimestampSchema = z.string().datetime({ offset: true });

export const itemCompanySchema = z.object({
  id: z.string().min(1),
  sourceItemId: z.string().min(1),
  companyName: z.string().min(1),
  ticker: z.string().min(1).optional(),
  exchange: z.string().min(1).optional(),
  relationshipType: relationshipTypeSchema,
  relevanceExplanation: z.string().min(1),
  confidence: z.number().finite().min(0).max(1),
  matchStatus: companyMatchStatusSchema,
  evidenceText: z.string().min(1).optional(),
  createdAt: isoTimestampSchema,
  updatedAt: isoTimestampSchema,
});

export type ItemCompany = z.infer<typeof itemCompanySchema>;

export const tickerCorrectionSchema = z.object({
  id: z.string().min(1),
  companyName: z.string().min(1),
  correctTicker: z.string().min(1),
  correctExchange: z.string().min(1).optional(),
  notes: z.string().min(1).optional(),
  enabled: z.boolean(),
  createdAt: isoTimestampSchema,
  updatedAt: isoTimestampSchema,
});

export type TickerCorrection = z.infer<typeof tickerCorrectionSchema>;
