import { generateText, Output } from 'ai';

import {
  enrichmentOutputSchema,
  normalizePromptInput,
} from '../enrichment-schema';
import {
  buildEnrichmentPrompt,
} from '../prompt-template';
import type {
  EnrichmentOutput,
  EnrichmentPromptInput,
  LlmProvider,
} from '../types';
import { enrichmentPromptVersion } from '../enrichment-schema';
import { createOpenAiCompatibleModelFactory } from '../model-factory';

export type OpenAiCompatibleLlmProviderConfig = {
  baseURL: string;
  apiKey?: string;
  modelName: string;
  headers?: Record<string, string>;
  providerName?: string;
  promptOverride?: string;
  supportsStructuredOutputs?: boolean;
};

export type OpenAiCompatibleLlmProviderDependencies = {
  generateTextImpl?: (args: {
    model: unknown;
    output: unknown;
    prompt: string;
  }) => Promise<{ output: unknown }>;
  modelFactory?: (modelName: string) => unknown;
};

export class LlmOutputValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LlmOutputValidationError';
  }
}

type AssistantMessagePart = {
  readonly type?: string;
  readonly text?: string;
};

type AssistantMessage = {
  readonly role?: string;
  readonly content?: readonly AssistantMessagePart[];
};

type NoObjectGeneratedErrorLike = {
  readonly response?: {
    readonly messages?: readonly AssistantMessage[];
  };
};

function stripCodeFences(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

function extractStructuredOutputText(
  error: NoObjectGeneratedErrorLike,
): string | undefined {
  const messages = error.response?.messages;
  if (!messages) {
    return undefined;
  }

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.role !== 'assistant' || !message.content) {
      continue;
    }

    const text = message.content
      .map((part) => (part.type === 'text' || part.type === 'reasoning' ? part.text : ''))
      .filter((part): part is string => Boolean(part))
      .join('\n')
      .trim();

    if (text) {
      return stripCodeFences(text);
    }
  }

  return undefined;
}

export class OpenAiCompatibleLlmProvider implements LlmProvider {
  readonly type = 'openai-compatible' as const;
  readonly providerName: string;
  readonly modelName: string;
  readonly promptVersion = enrichmentPromptVersion;
  private readonly modelFactory: (modelName: string) => unknown;
  private readonly generateTextImpl: (args: {
    model: unknown;
    output: unknown;
    prompt: string;
  }) => Promise<{ output: unknown }>;

  constructor(
    private readonly config: OpenAiCompatibleLlmProviderConfig,
    dependencies: OpenAiCompatibleLlmProviderDependencies = {},
  ) {
    this.providerName = config.providerName ?? 'openai-compatible';
    this.modelName = config.modelName;
    this.modelFactory =
      dependencies.modelFactory ??
      createOpenAiCompatibleModelFactory({
        baseURL: config.baseURL,
        apiKey: config.apiKey,
        headers: config.headers,
        providerName: config.providerName,
        supportsStructuredOutputs: config.supportsStructuredOutputs,
      });
    this.generateTextImpl =
      dependencies.generateTextImpl ??
      (async (args) => (generateText(args as any) as Promise<{ output: unknown }>));
  }

  async extractStockRelevance(
    input: EnrichmentPromptInput,
  ): Promise<EnrichmentOutput> {
    const normalizedInput = normalizePromptInput({
      ...input,
      promptOverride: input.promptOverride ?? this.config.promptOverride,
    });
    const prompt = buildEnrichmentPrompt(normalizedInput);
    const model = this.modelFactory(this.config.modelName) as Parameters<
      typeof generateText
    >[0]['model'];

    try {
      const result = await this.generateTextImpl({
        model,
        output: Output.object({
          name: 'StockRelevance',
          description:
            'Extract public-company relevance from article-like source items.',
          schema: enrichmentOutputSchema,
        }),
        prompt,
      });

      const parsed = enrichmentOutputSchema.safeParse(result.output);
      if (!parsed.success) {
        throw new LlmOutputValidationError(parsed.error.message);
      }

      return parsed.data;
    } catch (error) {
      if (error instanceof LlmOutputValidationError) {
        throw error;
      }

      const fallbackText = extractStructuredOutputText(
        error as NoObjectGeneratedErrorLike,
      );
      if (fallbackText) {
        try {
          const parsedJson = JSON.parse(fallbackText) as unknown;
          const parsed = enrichmentOutputSchema.safeParse(parsedJson);
          if (parsed.success) {
            return parsed.data;
          }

          throw new LlmOutputValidationError(parsed.error.message);
        } catch (fallbackError) {
          if (fallbackError instanceof LlmOutputValidationError) {
            throw fallbackError;
          }
        }
      }

      const providerLabel = `${this.providerName} (${this.config.baseURL})`;
      const modelLabel = this.modelName;

      if (error instanceof Error) {
        throw new LlmOutputValidationError(
          `OpenAI-compatible request failed for ${providerLabel} using ${modelLabel}: ${error.message}`,
        );
      }

      throw new LlmOutputValidationError(
        `OpenAI-compatible request failed for ${providerLabel} using ${modelLabel}: Invalid LLM output`,
      );
    }
  }
}

export function createOpenAiCompatibleLlmProvider(
  config: OpenAiCompatibleLlmProviderConfig,
  dependencies: OpenAiCompatibleLlmProviderDependencies = {},
): OpenAiCompatibleLlmProvider {
  return new OpenAiCompatibleLlmProvider(config, dependencies);
}
