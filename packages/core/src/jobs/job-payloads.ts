import { z } from "zod";

export const jobTriggerSchema = z.enum([
  "manual",
  "scheduled",
  "source-refresh",
  "item-open",
  "retry",
]);

export const sourceRefreshJobPayloadSchema = z.object({
  sourceId: z.string().min(1),
  trigger: jobTriggerSchema,
});

export const itemEnrichJobPayloadSchema = z.object({
  sourceItemId: z.string().min(1),
  trigger: jobTriggerSchema,
});

export const stockRefreshJobPayloadSchema = z.object({
  sourceItemId: z.string().min(1),
  ticker: z.string().min(1),
  trigger: jobTriggerSchema,
});

export const jobPayloadSchemas = {
  "source.refresh": sourceRefreshJobPayloadSchema,
  "item.enrich": itemEnrichJobPayloadSchema,
  "stock.refresh": stockRefreshJobPayloadSchema,
} as const;

export function parseJobPayload(
  type: string,
  payload: unknown,
):
  | { success: true; data: JobPayload }
  | { success: false; error: z.ZodError } {
  const schema = jobPayloadSchemas[type as keyof typeof jobPayloadSchemas];
  if (!schema) {
    return {
      success: false,
      error: new z.ZodError([
        {
          code: z.ZodIssueCode.custom,
          path: ["type"],
          message: `Unknown job type: ${type}`,
        },
      ]),
    };
  }

  const result = schema.safeParse(payload);
  if (result.success) {
    return { success: true, data: result.data as JobPayload };
  }

  return { success: false, error: result.error };
}

export type SourceRefreshJobPayload = z.infer<typeof sourceRefreshJobPayloadSchema>;
export type ItemEnrichJobPayload = z.infer<typeof itemEnrichJobPayloadSchema>;
export type StockRefreshJobPayload = z.infer<typeof stockRefreshJobPayloadSchema>;
export type JobPayload =
  | SourceRefreshJobPayload
  | ItemEnrichJobPayload
  | StockRefreshJobPayload;
