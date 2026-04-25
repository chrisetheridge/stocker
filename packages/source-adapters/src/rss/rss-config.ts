import { z } from 'zod';

export const rssSourceConfigSchema = z
  .object({
    id: z.string().min(1),
    type: z.literal('rss'),
    name: z.string().min(1),
    enabled: z.boolean(),
    url: z.string().url(),
    refreshMinutes: z.number().int().positive(),
  })
  .strict();

export type RssSourceConfig = z.infer<typeof rssSourceConfigSchema>;
