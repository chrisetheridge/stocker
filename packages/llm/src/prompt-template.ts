import type { EnrichmentPromptInput } from './types';

function stringifyMetadata(sourceMetadata: Record<string, unknown>): string {
  return JSON.stringify(sourceMetadata, null, 2);
}

export function buildEnrichmentPrompt(input: EnrichmentPromptInput): string {
  const normalizedSummary = input.summary?.trim();
  const normalizedAuthor = input.author?.trim();

  const sections = [
    'You extract public-company relevance from article-like items.',
    'Do not give buy, sell, or hold recommendations.',
    'Do not invent ticker symbols or market facts.',
    'Return JSON that matches the requested schema exactly.',
    '',
    `Title: ${input.title.trim()}`,
    `Canonical URL: ${input.canonicalUrl.trim()}`,
  ];

  if (normalizedAuthor) {
    sections.push(`Author: ${normalizedAuthor}`);
  }

  if (normalizedSummary) {
    sections.push(`Summary: ${normalizedSummary}`);
  }

  sections.push(`Source metadata: ${stringifyMetadata(input.sourceMetadata)}`);
  sections.push(
    'For each company, explain why it is relevant and include evidence text when available.',
  );
  sections.push(
    'Prefer public companies mentioned in the text over speculative related-company guesses.',
  );

  if (input.promptOverride?.trim()) {
    sections.push('');
    sections.push('Additional instructions:');
    sections.push(input.promptOverride.trim());
  }

  return sections.join('\n');
}
