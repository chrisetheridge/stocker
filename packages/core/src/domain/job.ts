import { z } from "zod";

import { jobStateSchema, jobTypeSchema } from "./enums";

const isoTimestampSchema = z.string().datetime({ offset: true });
const jsonRecordSchema = z.record(z.string(), z.unknown());

export const jobSchema = z.object({
  id: z.string().min(1),
  type: jobTypeSchema,
  state: jobStateSchema,
  payload: jsonRecordSchema,
  attemptCount: z.number().int().min(0),
  maxAttempts: z.number().int().min(1),
  runAfter: isoTimestampSchema,
  lockedAt: isoTimestampSchema.optional(),
  lockedBy: z.string().min(1).optional(),
  lastErrorMessage: z.string().min(1).optional(),
  createdAt: isoTimestampSchema,
  updatedAt: isoTimestampSchema,
});

export type Job = z.infer<typeof jobSchema>;
