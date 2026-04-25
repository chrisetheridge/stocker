import { describe, expect, it } from 'vitest';

import {
  LlmOutputValidationError,
  createOpenAiCompatibleLlmProvider,
} from './openai-compatible-provider';

describe('OpenAiCompatibleLlmProvider', () => {
  it('returns validated structured enrichment output', async () => {
    const provider = createOpenAiCompatibleLlmProvider(
      {
        baseURL: 'http://localhost:1234/v1',
        apiKey: 'local',
        modelName: 'local-model',
      },
      {
        modelFactory: () => ({ model: 'fake-model' }),
        generateTextImpl: async () => ({
          output: {
            companies: [
              {
                companyName: 'Apple Inc.',
                tickerHint: 'AAPL',
                relationshipType: 'mentioned',
                relevanceExplanation: 'Apple is mentioned in the item.',
                confidence: 0.98,
                evidenceText: 'Apple ...',
              },
            ],
          },
        }),
      },
    );

    await expect(
      provider.extractStockRelevance({
        title: 'Apple news',
        canonicalUrl: 'https://example.com/apple',
        sourceMetadata: {},
      }),
    ).resolves.toEqual({
      companies: [
        {
          companyName: 'Apple Inc.',
          tickerHint: 'AAPL',
          relationshipType: 'mentioned',
          relevanceExplanation: 'Apple is mentioned in the item.',
          confidence: 0.98,
          evidenceText: 'Apple ...',
        },
      ],
    });
  });

  it('fails with a typed validation error when the model output is malformed', async () => {
    const provider = createOpenAiCompatibleLlmProvider(
      {
        baseURL: 'http://localhost:1234/v1',
        apiKey: 'local',
        modelName: 'local-model',
      },
      {
        modelFactory: () => ({ model: 'fake-model' }),
        generateTextImpl: async () => ({
          output: {
            companies: [
              {
                companyName: '',
                relationshipType: 'mentioned',
                relevanceExplanation: '',
                confidence: 2,
              },
            ],
          },
        }),
      },
    );

    await expect(
      provider.extractStockRelevance({
        title: 'Apple news',
        canonicalUrl: 'https://example.com/apple',
        sourceMetadata: {},
      }),
    ).rejects.toBeInstanceOf(LlmOutputValidationError);
  });
});
