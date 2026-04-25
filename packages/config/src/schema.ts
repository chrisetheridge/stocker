import { z } from "zod";

export const sourceConfigTypes = ["rss", "reddit"] as const;
export const marketProviderTypes = ["yahoo-finance2"] as const;
export const llmProviderTypes = ["openai-compatible"] as const;

const sourceBaseSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  enabled: z.boolean().default(true),
  refreshMinutes: z.number().int().positive().default(60),
});

export const rssSourceConfigSchema = sourceBaseSchema.extend({
  type: z.literal("rss"),
  url: z.string().url(),
});

export const redditSourceConfigSchema = sourceBaseSchema.extend({
  type: z.literal("reddit"),
  feedUrl: z.string().url(),
});

export const sourceConfigSchema = z.discriminatedUnion("type", [
  rssSourceConfigSchema,
  redditSourceConfigSchema,
]);

export const marketConfigSchema = z.object({
  defaultUniverse: z.string().min(1).default("US"),
  provider: z.object({
    type: z.literal("yahoo-finance2"),
  }),
});

export const llmConfigSchema = z.object({
  provider: z.object({
    type: z.literal("openai-compatible"),
    baseUrl: z.string().url(),
    apiKeyEnv: z.string().min(1),
    model: z.string().min(1),
  }),
  prompts: z.object({
    enrichmentSystem: z.string().min(1),
  }),
});

export const appConfigSchema = z.object({
  databasePath: z.string().min(1).default(".stocker/stocker.sqlite"),
});

export const stockerConfigSchema = z
  .object({
    app: appConfigSchema.default({}),
    sources: z.array(sourceConfigSchema).default([]),
    market: marketConfigSchema,
    llm: llmConfigSchema,
  })
  .superRefine((config, context) => {
    const seenIds = new Set<string>();
    for (const [index, source] of config.sources.entries()) {
      if (seenIds.has(source.id)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["sources", index, "id"],
          message: `Duplicate source id: ${source.id}`,
        });
      }
      seenIds.add(source.id);
    }
  });

export type StockerConfig = z.infer<typeof stockerConfigSchema>;
export type StockerSourceConfig = z.infer<typeof sourceConfigSchema>;
