import { describe, expect, it } from 'vitest';

import {
  enrichmentOutputSchema,
  enrichmentCompanyCandidateSchema,
} from './enrichment-schema';
import { buildEnrichmentPrompt } from './prompt-template';

describe('enrichmentOutputSchema', () => {
  it('accepts valid enrichment output', () => {
    const output = {
      companies: [
        {
          companyName: 'Apple Inc.',
          tickerHint: 'AAPL',
          relationshipType: 'mentioned',
          relevanceExplanation: 'The item discusses Apple product sales.',
          confidence: 0.95,
          evidenceText: 'Apple announced ...',
        },
      ],
    };

    expect(enrichmentOutputSchema.parse(output)).toEqual(output);
  });

  it('rejects invalid company candidates', () => {
    expect(() =>
      enrichmentCompanyCandidateSchema.parse({
        companyName: '',
        relationshipType: 'investor',
        relevanceExplanation: '',
        confidence: 2,
      }),
    ).toThrow();
  });
});

describe('buildEnrichmentPrompt', () => {
  it('includes the source details and no-advice boundary', () => {
    const prompt = buildEnrichmentPrompt({
      title: 'Apple ships new MacBook',
      summary: 'Report on the launch',
      author: 'Reporter',
      canonicalUrl: 'https://example.com/apple',
      sourceMetadata: {
        feedTitle: 'Morning Feed',
        guid: 'guid-1',
      },
    });

    expect(prompt).toContain('Do not give buy, sell, or hold recommendations.');
    expect(prompt).toContain('Apple ships new MacBook');
    expect(prompt).toContain('Morning Feed');
    expect(prompt).toContain('guid-1');
  });

  it('includes prompt overrides when provided', () => {
    const prompt = buildEnrichmentPrompt({
      title: 'Item',
      canonicalUrl: 'https://example.com/item',
      sourceMetadata: {},
      promptOverride: 'Prefer shorter evidence snippets.',
    });

    expect(prompt).toContain('Prefer shorter evidence snippets.');
  });
});
