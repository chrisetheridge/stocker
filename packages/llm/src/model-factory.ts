import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

export type OpenAiCompatibleModelFactoryConfig = {
  baseURL: string;
  apiKey?: string;
  headers?: Record<string, string>;
  providerName?: string;
};

export function createOpenAiCompatibleModelFactory(
  config: OpenAiCompatibleModelFactoryConfig,
) {
  const provider = createOpenAICompatible({
    name: config.providerName ?? 'openai-compatible',
    baseURL: config.baseURL,
    apiKey: config.apiKey,
    headers: config.headers,
  });

  return (modelName: string) => provider(modelName);
}
