import type { StockerConfig } from './schema';

export const exampleConfig: StockerConfig = {
  app: {
    databasePath: '.stocker/stocker.sqlite',
  },
  sources: [
    {
      id: 'hacker-news',
      type: 'rss',
      name: 'Hacker News',
      enabled: true,
      refreshMinutes: 60,
      url: 'https://news.ycombinator.com/rss',
    },
    {
      id: 'reddit-stocks',
      type: 'reddit',
      name: 'Reddit Stocks',
      enabled: true,
      refreshMinutes: 60,
      feedUrl: 'https://www.reddit.com/r/stocks/.rss',
    },
  ],
  market: {
    defaultUniverse: 'US',
    provider: {
      type: 'yahoo-finance2',
    },
  },
  llm: {
    provider: {
      type: 'openai-compatible',
      baseUrl: 'http://localhost:1234/v1',
      apiKeyEnv: 'LM_STUDIO_API_KEY',
      model: 'local-model',
    },
    prompts: {
      enrichmentSystem:
        'You extract public-company stock relevance from article metadata.',
    },
  },
};
