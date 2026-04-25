import { z } from 'zod';

export const redditSourceConfigSchema = z
  .object({
    id: z.string().min(1),
    type: z.literal('reddit'),
    name: z.string().min(1),
    enabled: z.boolean(),
    feedUrl: z.string().url(),
    refreshMinutes: z.number().int().positive(),
  })
  .strict();

export type RedditSourceConfig = z.infer<typeof redditSourceConfigSchema>;
