export const rssFeedFixtureXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Example RSS Feed</title>
    <item>
      <title>Acme reports quarterly growth</title>
      <link>https://example.com/articles/acme-quarterly-growth</link>
      <guid isPermaLink="false">rss-guid-1</guid>
      <pubDate>Tue, 25 Apr 2026 11:00:00 GMT</pubDate>
      <creator>Jane Reporter</creator>
      <category>Markets</category>
      <description>Acme reported another quarter of growth.</description>
    </item>
    <item>
      <title>Skipped item without link</title>
      <guid>rss-guid-2</guid>
      <description>This item should be skipped.</description>
    </item>
  </channel>
</rss>`;

export const atomFeedFixtureXml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Example Atom Feed</title>
  <entry>
    <title>Beta launches new product</title>
    <id>tag:example.com,2026:atom-1</id>
    <link href="https://example.com/articles/beta-launches-new-product" rel="alternate" />
    <updated>2026-04-25T10:30:00Z</updated>
    <author>
      <name>Alice Author</name>
    </author>
    <summary>Beta shipped a product update.</summary>
    <category term="Technology" />
  </entry>
  <entry>
    <id>tag:example.com,2026:atom-2</id>
    <link href="https://example.com/articles/skipped-atom-item" rel="alternate" />
    <updated>2026-04-25T10:35:00Z</updated>
    <summary>Missing title should be skipped.</summary>
  </entry>
</feed>`;
