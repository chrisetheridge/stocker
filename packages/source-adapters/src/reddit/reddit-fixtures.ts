export const redditFeedFixtureXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>r/stocks</title>
    <item>
      <title>Acme shares hit a new high</title>
      <link>https://www.reddit.com/r/stocks/comments/abc123/acme_shares_hit_a_new_high/</link>
      <guid isPermaLink="false">t3_abc123</guid>
      <pubDate>Tue, 25 Apr 2026 11:30:00 GMT</pubDate>
      <creator>u/marketwatcher</creator>
      <category>r/stocks</category>
      <comments>https://www.reddit.com/r/stocks/comments/abc123/acme_shares_hit_a_new_high/</comments>
      <score>123</score>
      <description>&lt;a href="https://example.com/acme-press-release"&gt;Acme press release&lt;/a&gt; on the company's latest quarter.</description>
    </item>
    <item>
      <title>Daily discussion thread</title>
      <link>https://www.reddit.com/r/stocks/comments/def456/daily_discussion_thread/</link>
      <guid isPermaLink="false">t3_def456</guid>
      <pubDate>Tue, 25 Apr 2026 11:45:00 GMT</pubDate>
      <creator>u/anotheruser</creator>
      <category>r/stocks</category>
      <comments>https://www.reddit.com/r/stocks/comments/def456/daily_discussion_thread/</comments>
      <description>This is a self post with no outbound link.</description>
    </item>
    <item>
      <link>https://www.reddit.com/r/stocks/comments/ghi789/skipped_item/</link>
      <guid isPermaLink="false">t3_ghi789</guid>
      <description>Missing a title, so this should be skipped.</description>
    </item>
  </channel>
</rss>`;
