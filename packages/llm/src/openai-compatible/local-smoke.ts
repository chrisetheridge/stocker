import { createOpenAiCompatibleLlmProvider } from './openai-compatible-provider';

async function main(): Promise<void> {
  const provider = createOpenAiCompatibleLlmProvider({
    baseURL: process.env.LM_STUDIO_BASE_URL ?? 'http://localhost:1234/v1',
    apiKey: process.env.LM_STUDIO_API_KEY ?? 'local',
    modelName: process.env.LM_STUDIO_MODEL ?? 'local-model',
    promptOverride: process.env.LM_STUDIO_PROMPT_OVERRIDE,
  });

  const output = await provider.extractStockRelevance({
    title: 'Apple shares climb after product launch',
    summary: 'The report mentions Apple, Samsung, and Broadcom.',
    canonicalUrl: 'https://example.com/sample-item',
    sourceMetadata: {
      feedTitle: 'Smoke Test Feed',
      sourceId: 'smoke-source',
    },
  });

  console.log(JSON.stringify(output, null, 2));
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : 'Unknown failure';
  console.error(message);
  process.exitCode = 1;
});
