import type {
  SourceAdapter,
  SourceFetchContext,
  SourceFetchResult,
} from '../types';
import { parseXmlDocument } from '../xml';
import { rssSourceConfigSchema, type RssSourceConfig } from './rss-config';
import { normalizeFeedDocument } from './rss-normalize';

export const rssAdapter: SourceAdapter<RssSourceConfig> = {
  type: 'rss',
  validateConfig(input: unknown): RssSourceConfig {
    return rssSourceConfigSchema.parse(input);
  },
  async fetchItems(
    config: RssSourceConfig,
    context: SourceFetchContext,
  ): Promise<SourceFetchResult> {
    const response = await context.fetch(config.url);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch feed from ${config.url}: HTTP ${response.status} ${response.statusText}`,
      );
    }

    const xml = await response.text();
    const document = parseXmlDocument(xml, config.url);
    const result = normalizeFeedDocument(document, {
      sourceId: context.sourceId,
      fetchedAt: context.now,
      feedUrl: config.url,
    });

    for (const warning of result.warnings) {
      context.logger.warn(warning);
    }

    return result;
  },
};

export function createRssAdapter(): SourceAdapter<RssSourceConfig> {
  return rssAdapter;
}
