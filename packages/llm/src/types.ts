export type EnrichmentRelationshipType =
  | 'mentioned'
  | 'competitor'
  | 'customer'
  | 'supplier';

export type EnrichmentCompanyCandidate = {
  companyName: string;
  tickerHint?: string;
  relationshipType: EnrichmentRelationshipType;
  relevanceExplanation: string;
  confidence: number;
  evidenceText?: string;
};

export type EnrichmentOutput = {
  companies: EnrichmentCompanyCandidate[];
};

export type EnrichmentPromptInput = {
  title: string;
  summary?: string;
  author?: string;
  canonicalUrl: string;
  sourceMetadata: Record<string, unknown>;
  promptOverride?: string;
};

export type LlmProvider = {
  readonly type: string;
  readonly providerName?: string;
  readonly modelName?: string;
  readonly promptVersion?: string;
  extractStockRelevance(
    input: EnrichmentPromptInput,
  ): Promise<EnrichmentOutput>;
};
