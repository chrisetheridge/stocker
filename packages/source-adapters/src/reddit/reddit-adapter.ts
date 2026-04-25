import type {
  SourceAdapter,
  SourceFetchContext,
  SourceFetchResult,
} from '../types';
import { parseXmlDocument } from '../xml';
import {
  redditSourceConfigSchema,
  type RedditSourceConfig,
} from './reddit-config';
import { normalizeRedditFeedDocument } from './reddit-normalize';

const redditUserAgent = 'StockerLocalInbox/1.0 (+local personal app)';

export const redditAdapter: SourceAdapter<RedditSourceConfig> = {
  type: 'reddit',
  validateConfig(input: unknown): RedditSourceConfig {
    return redditSourceConfigSchema.parse(input);
  },
  async fetchItems(
    config: RedditSourceConfig,
    context: SourceFetchContext,
  ): Promise<SourceFetchResult> {
    const response = await context.fetch(config.feedUrl, {
      headers: {
        'user-agent': redditUserAgent,
        accept: 'application/rss+xml, application/xml;q=0.9, */*;q=0.8',
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch feed from ${config.feedUrl}: HTTP ${response.status} ${response.statusText}`,
      );
    }

    const xml = await response.text();
    const document = parseXmlDocument(xml, config.feedUrl);
    const result = normalizeRedditFeedDocument(document, {
      sourceId: context.sourceId,
      fetchedAt: context.now,
      feedUrl: config.feedUrl,
    });

    for (const warning of result.warnings) {
      context.logger.warn(warning);
    }

    return result;
  },
};

export function createRedditAdapter(): SourceAdapter<RedditSourceConfig> {
  return redditAdapter;
}
