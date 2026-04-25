import { z } from 'zod';

import type { EnrichmentPromptInput } from './types';

export const enrichmentRelationshipTypes = [
  'mentioned',
  'competitor',
  'customer',
  'supplier',
] as const;

export const enrichmentCompanyCandidateSchema = z.object({
  companyName: z.string().min(1),
  tickerHint: z.string().min(1).optional(),
  relationshipType: z.enum(enrichmentRelationshipTypes),
  relevanceExplanation: z.string().min(1),
  confidence: z.number().finite().min(0).max(1),
  evidenceText: z.string().min(1).optional(),
});

export const enrichmentOutputSchema = z.object({
  companies: z.array(enrichmentCompanyCandidateSchema),
});

export type EnrichmentOutputSchema = z.infer<typeof enrichmentOutputSchema>;

export const enrichmentPromptConfigSchema = z.object({
  promptOverride: z.string().min(1).optional(),
});

export type EnrichmentPromptConfig = z.infer<
  typeof enrichmentPromptConfigSchema
>;

export const enrichmentPromptVersion = '2026-04-25';

export function normalizePromptInput(
  input: EnrichmentPromptInput,
): EnrichmentPromptInput {
  return {
    title: input.title.trim(),
    summary: input.summary?.trim(),
    author: input.author?.trim(),
    canonicalUrl: input.canonicalUrl.trim(),
    sourceMetadata: input.sourceMetadata,
    promptOverride: input.promptOverride?.trim(),
  };
}
