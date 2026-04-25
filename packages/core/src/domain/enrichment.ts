import { z } from "zod";

import { enrichmentStateSchema } from "./enums";

const isoTimestampSchema = z.string().datetime({ offset: true });

export const itemEnrichmentSchema = z.object({
  id: z.string().min(1),
  sourceItemId: z.string().min(1),
  state: enrichmentStateSchema,
  summary: z.string().min(1).optional(),
  modelProvider: z.string().min(1).optional(),
  modelName: z.string().min(1).optional(),
  promptVersion: z.string().min(1).optional(),
  completedAt: isoTimestampSchema.optional(),
  errorMessage: z.string().min(1).optional(),
  createdAt: isoTimestampSchema,
  updatedAt: isoTimestampSchema,
});

export type ItemEnrichment = z.infer<typeof itemEnrichmentSchema>;
