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

  it('includes provider context when the API connection fails', async () => {
    const provider = createOpenAiCompatibleLlmProvider(
      {
        baseURL: 'http://localhost:1234/v1',
        apiKey: 'local',
        modelName: 'local-model',
      },
      {
        modelFactory: () => ({ model: 'fake-model' }),
        generateTextImpl: async () => {
          throw new Error('Cannot connect to API: ');
        },
      },
    );

    await expect(
      provider.extractStockRelevance({
        title: 'Apple news',
        canonicalUrl: 'https://example.com/apple',
        sourceMetadata: {},
      }),
    ).rejects.toThrow(
      'OpenAI-compatible request failed for openai-compatible (http://localhost:1234/v1) using local-model: Cannot connect to API: ',
    );
  });

  it('recovers structured output from reasoning content when the SDK cannot parse it', async () => {
    const provider = createOpenAiCompatibleLlmProvider(
      {
        baseURL: 'http://localhost:1234/v1',
        apiKey: 'local',
        modelName: 'local-model',
        supportsStructuredOutputs: true,
      },
      {
        modelFactory: () => ({ model: 'fake-model' }),
        generateTextImpl: async () => {
          throw {
            response: {
              messages: [
                {
                  role: 'assistant',
                  content: [
                    {
                      type: 'reasoning',
                      text: '{"companies":[{"companyName":"Apple Inc.","relationshipType":"mentioned","relevanceExplanation":"Apple is mentioned.","confidence":0.95}]}',
                    },
                  ],
                },
              ],
            },
          };
        },
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
          relationshipType: 'mentioned',
          relevanceExplanation: 'Apple is mentioned.',
          confidence: 0.95,
        },
      ],
    });
  });
});
