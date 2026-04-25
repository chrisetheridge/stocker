import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { exampleConfig } from './example-config';
import { loadConfig } from './load-config';

async function writeConfigFile(contents: string): Promise<string> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'stocker-config-'));
  const filePath = path.join(tempDir, 'stocker.yaml');
  await fs.writeFile(filePath, contents, 'utf8');
  return filePath;
}

describe('loadConfig', () => {
  it('loads a valid config', async () => {
    const filePath = await writeConfigFile(`
app:
  databasePath: '.stocker/stocker.sqlite'
sources:
  - id: hacker-news
    type: rss
    name: Hacker News
    url: https://news.ycombinator.com/rss
market:
  provider:
    type: yahoo-finance2
llm:
  provider:
    type: openai-compatible
    baseUrl: http://localhost:1234/v1
    apiKeyEnv: LM_STUDIO_API_KEY
    model: local-model
  prompts:
    enrichmentSystem: You extract public-company stock relevance from article metadata.
`);

    const config = await loadConfig(filePath);
    expect(config.sources).toHaveLength(1);
    expect(config.sources[0]).toMatchObject({
      id: 'hacker-news',
      enabled: true,
      refreshMinutes: 60,
    });
    expect(config.market.defaultUniverse).toBe('US');
  });

  it('rejects duplicate source ids', async () => {
    const filePath = await writeConfigFile(`
sources:
  - id: hacker-news
    type: rss
    name: Hacker News
    url: https://news.ycombinator.com/rss
  - id: hacker-news
    type: reddit
    name: Reddit Stocks
    feedUrl: https://www.reddit.com/r/stocks/.rss
market:
  provider:
    type: yahoo-finance2
llm:
  provider:
    type: openai-compatible
    baseUrl: http://localhost:1234/v1
    apiKeyEnv: LM_STUDIO_API_KEY
    model: local-model
  prompts:
    enrichmentSystem: You extract public-company stock relevance from article metadata.
`);

    await expect(loadConfig(filePath)).rejects.toThrow(/Duplicate source id/);
  });

  it('rejects an invalid source type', async () => {
    const filePath = await writeConfigFile(`
sources:
  - id: unknown-source
    type: blog
    name: Unknown
    url: https://example.com/rss
market:
  provider:
    type: yahoo-finance2
llm:
  provider:
    type: openai-compatible
    baseUrl: http://localhost:1234/v1
    apiKeyEnv: LM_STUDIO_API_KEY
    model: local-model
  prompts:
    enrichmentSystem: You extract public-company stock relevance from article metadata.
`);

    await expect(loadConfig(filePath)).rejects.toThrow();
  });

  it('rejects a missing llm model', async () => {
    const filePath = await writeConfigFile(`
sources: []
market:
  provider:
    type: yahoo-finance2
llm:
  provider:
    type: openai-compatible
    baseUrl: http://localhost:1234/v1
    apiKeyEnv: LM_STUDIO_API_KEY
  prompts:
    enrichmentSystem: You extract public-company stock relevance from article metadata.
`);

    await expect(loadConfig(filePath)).rejects.toThrow();
  });

  it('applies defaults', async () => {
    const filePath = await writeConfigFile(`
market:
  provider:
    type: yahoo-finance2
llm:
  provider:
    type: openai-compatible
    baseUrl: http://localhost:1234/v1
    apiKeyEnv: LM_STUDIO_API_KEY
    model: local-model
  prompts:
    enrichmentSystem: You extract public-company stock relevance from article metadata.
`);

    const config = await loadConfig(filePath);
    expect(config.app.databasePath).toBe('.stocker/stocker.sqlite');
    expect(config.sources).toEqual([]);
  });

  it('matches the example config object', () => {
    expect(exampleConfig.market.defaultUniverse).toBe('US');
    expect(exampleConfig.sources).toHaveLength(2);
  });
});
