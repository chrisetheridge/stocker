import { describe, expect, it, vi } from 'vitest';

import { redditAdapter } from './reddit-adapter';
import { redditFeedFixtureXml } from './reddit-fixtures';

function createLogger() {
  return {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  };
}

describe('redditAdapter', () => {
  it('normalizes atom entries while skipping invalid items', async () => {
    const fetch = vi.fn(
      async () => new Response(redditFeedFixtureXml, { status: 200 }),
    );
    const logger = createLogger();

    const result = await redditAdapter.fetchItems(
      {
        id: 'reddit-stocks',
        type: 'reddit',
        name: 'Reddit Stocks',
        enabled: true,
        feedUrl: 'https://www.reddit.com/r/stocks/.rss',
        refreshMinutes: 30,
      },
      {
        sourceId: 'reddit-stocks',
        sourceName: 'Reddit Stocks',
        now: '2026-04-25T12:00:00.000Z',
        fetch,
        logger,
      },
    );

    expect(fetch).toHaveBeenCalledWith(
      'https://www.reddit.com/r/stocks/.rss',
      expect.objectContaining({
        headers: expect.objectContaining({
          'user-agent': expect.stringContaining('StockerLocalInbox/1.0'),
        }),
      }),
    );
    expect(result.items).toHaveLength(2);
    expect(result.items[0]?.title).toBe('Acme shares hit a new high');
    expect(result.items[0]?.canonicalUrl).toBe(
      'https://www.reddit.com/r/stocks/comments/abc123/acme_shares_hit_a_new_high/',
    );
    expect(result.items[0]?.sourceMetadata).toMatchObject({
      subreddit: 'r/stocks',
      score: undefined,
      commentsUrl: undefined,
      outboundUrl: undefined,
      entryId: 't3_abc123',
      feedType: 'atom',
    });
    expect(result.items[1]?.title).toBe('Daily discussion thread');
    expect(result.items[1]?.sourceMetadata).toMatchObject({
      outboundUrl: undefined,
      subreddit: 'r/stocks',
      feedType: 'atom',
    });
    expect(result.warnings).toHaveLength(1);
    expect(logger.warn).toHaveBeenCalledTimes(1);
  });

  it('validates config shape', () => {
    expect(() =>
      redditAdapter.validateConfig({
        id: 'reddit-stocks',
        type: 'reddit',
        name: 'Reddit Stocks',
        enabled: true,
        feedUrl: 'not-a-url',
        refreshMinutes: 30,
      }),
    ).toThrow();
  });
});
