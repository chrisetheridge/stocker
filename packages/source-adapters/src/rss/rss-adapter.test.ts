import { describe, expect, it, vi } from 'vitest';

import { rssAdapter } from './rss-adapter';
import { atomFeedFixtureXml, rssFeedFixtureXml } from './rss-fixtures';

function createLogger() {
  return {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  };
}

describe('rssAdapter', () => {
  it.each([
    ['rss', rssFeedFixtureXml, 'Acme reports quarterly growth'],
    ['atom', atomFeedFixtureXml, 'Beta launches new product'],
  ] as const)(
    'normalizes %s fixture feeds',
    async (_kind, xml, expectedTitle) => {
      const fetch = vi.fn(async () => new Response(xml, { status: 200 }));
      const logger = createLogger();

      const result = await rssAdapter.fetchItems(
        {
          id: 'source-1',
          type: 'rss',
          name: 'Example Feed',
          enabled: true,
          url: 'https://example.com/feed.xml',
          refreshMinutes: 60,
        },
        {
          sourceId: 'source-1',
          sourceName: 'Example Feed',
          now: '2026-04-25T12:00:00.000Z',
          fetch,
          logger,
        },
      );

      expect(fetch).toHaveBeenCalledWith('https://example.com/feed.xml');
      expect(result.fetchedAt).toBe('2026-04-25T12:00:00.000Z');
      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.title).toBe(expectedTitle);
      expect(result.items[0]?.sourceId).toBe('source-1');
      expect(result.warnings).toHaveLength(1);
      expect(logger.warn).toHaveBeenCalledTimes(1);
    },
  );

  it('rejects malformed feeds with the feed URL in the error', async () => {
    const fetch = vi.fn(
      async () => new Response('<rss><channel><item></channel>'),
    );
    const logger = createLogger();

    await expect(
      rssAdapter.fetchItems(
        {
          id: 'source-1',
          type: 'rss',
          name: 'Broken Feed',
          enabled: true,
          url: 'https://example.com/broken.xml',
          refreshMinutes: 60,
        },
        {
          sourceId: 'source-1',
          sourceName: 'Broken Feed',
          now: '2026-04-25T12:00:00.000Z',
          fetch,
          logger,
        },
      ),
    ).rejects.toThrow(/https:\/\/example\.com\/broken\.xml/);
  });

  it('validates config shape', () => {
    expect(() =>
      rssAdapter.validateConfig({
        id: 'source-1',
        type: 'rss',
        name: 'Feed',
        enabled: true,
        url: 'not-a-url',
        refreshMinutes: 60,
      }),
    ).toThrow();
  });
});
