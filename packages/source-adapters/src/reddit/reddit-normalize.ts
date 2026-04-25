import type { NormalizedSourceItemInput, SourceFetchResult } from '../types';
import { asArray, readText, type ParsedXmlDocument } from '../xml';

type NormalizeRedditOptions = {
  sourceId: string;
  fetchedAt: string;
  feedUrl: string;
};

function stripHtml(value: string): string {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractOutboundUrl(description: unknown): string | undefined {
  const text = readText(description);
  if (!text) {
    return undefined;
  }

  const hrefMatch = text.match(/href=["']([^"']+)["']/i);
  return hrefMatch?.[1];
}

function readCanonicalUrl(item: Record<string, unknown>): string | undefined {
  const commentsUrl = readText(item.comments);
  if (commentsUrl) {
    return commentsUrl;
  }

  return readText(item.link);
}

function parseScore(
  item: Record<string, unknown>,
): string | number | undefined {
  const scoreText = readText(item.score);
  if (!scoreText) {
    return undefined;
  }

  const score = Number(scoreText);
  return Number.isFinite(score) ? score : scoreText;
}

function normalizeRedditItem(
  item: Record<string, unknown>,
  options: NormalizeRedditOptions,
  feedTitle: string | undefined,
  index: number,
): { item?: NormalizedSourceItemInput; warnings: string[] } {
  const title = readText(item.title);
  if (!title) {
    return {
      warnings: [
        `Skipped Reddit item ${index + 1} from ${options.feedUrl}: missing title`,
      ],
    };
  }

  const canonicalUrl = readCanonicalUrl(item);
  if (!canonicalUrl) {
    return {
      warnings: [
        `Skipped Reddit item ${index + 1} from ${options.feedUrl}: missing link`,
      ],
    };
  }

  const entryId = readText(item.guid) ?? readText(item.id);
  const descriptionText = readText(item.description);
  const summary = descriptionText
    ? stripHtml(descriptionText)
    : readText(item.content);
  const author =
    readText(item.creator) ??
    readText(item.author) ??
    readText((item.author as Record<string, unknown> | undefined)?.name) ??
    undefined;
  const publishedAt =
    readText(item.pubDate) ?? readText(item.isoDate) ?? undefined;
  const outboundUrl = extractOutboundUrl(item.description);

  return {
    item: {
      sourceId: options.sourceId,
      externalId: entryId ?? canonicalUrl,
      canonicalUrl,
      title,
      summary,
      author,
      publishedAt,
      fetchedAt: options.fetchedAt,
      sourceMetadata: {
        feedTitle,
        entryId,
        subreddit: readText(item.category),
        score: parseScore(item),
        commentsUrl: readText(item.comments) ?? undefined,
        outboundUrl,
        rawPublishedAt: readText(item.pubDate) ?? readText(item.isoDate),
        feedType: 'reddit',
      },
    },
    warnings: [],
  };
}

export function normalizeRedditFeedDocument(
  document: ParsedXmlDocument,
  options: NormalizeRedditOptions,
): SourceFetchResult {
  const rssRoot = document.rss as Record<string, unknown> | undefined;
  if (!rssRoot) {
    throw new Error(
      `Failed to parse feed from ${options.feedUrl}: missing rss root`,
    );
  }

  const channel = rssRoot.channel as Record<string, unknown> | undefined;
  if (!channel) {
    throw new Error(
      `Failed to parse feed from ${options.feedUrl}: missing channel root`,
    );
  }

  const feedTitle = readText(channel.title);
  const redditItems = asArray(channel.item as unknown);
  const items: NormalizedSourceItemInput[] = [];
  const warnings: string[] = [];

  for (const [index, rawItem] of redditItems.entries()) {
    if (typeof rawItem !== 'object' || rawItem === null) {
      warnings.push(
        `Skipped Reddit item ${index + 1} from ${options.feedUrl}: invalid item shape`,
      );
      continue;
    }

    const outcome = normalizeRedditItem(
      rawItem as Record<string, unknown>,
      options,
      feedTitle,
      index,
    );
    warnings.push(...outcome.warnings);
    if (outcome.item) {
      items.push(outcome.item);
    }
  }

  return {
    items,
    fetchedAt: options.fetchedAt,
    warnings,
  };
}
