import { z } from "zod";

import { enrichmentStateSchema, itemReadStateSchema } from "./enums";

const isoTimestampSchema = z.string().datetime({ offset: true });
const jsonRecordSchema = z.record(z.string(), z.unknown());

export const sourceItemSchema = z.object({
  id: z.string().min(1),
  sourceId: z.string().min(1),
  externalId: z.string().min(1),
  canonicalUrl: z.string().url(),
  title: z.string().min(1),
  summary: z.string().min(1).optional(),
  author: z.string().min(1).optional(),
  publishedAt: isoTimestampSchema.optional(),
  fetchedAt: isoTimestampSchema,
  sourceMetadata: jsonRecordSchema,
  readState: itemReadStateSchema,
  savedForResearch: z.boolean(),
  enrichmentState: enrichmentStateSchema,
  createdAt: isoTimestampSchema,
  updatedAt: isoTimestampSchema,
});

export type SourceItem = z.infer<typeof sourceItemSchema>;
