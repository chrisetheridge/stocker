import type { NormalizedSourceItemInput, SourceFetchResult } from '../types';
import {
  asArray,
  readAttribute,
  readText,
  type ParsedXmlDocument,
} from '../xml';

type NormalizeFeedOptions = {
  sourceId: string;
  fetchedAt: string;
  feedUrl: string;
};

type NormalizationOutcome = {
  item?: NormalizedSourceItemInput;
  warnings: string[];
};

function readFeedTitle(document: ParsedXmlDocument): string | undefined {
  const rssRoot = document.rss as Record<string, unknown> | undefined;
  if (rssRoot) {
    const channel = rssRoot.channel as Record<string, unknown> | undefined;
    return readText(channel?.title);
  }

  const atomFeed = document.feed as Record<string, unknown> | undefined;
  if (atomFeed) {
    return readText(atomFeed.title);
  }

  return undefined;
}

function normalizeCategories(value: unknown): string[] {
  const categories = asArray(value);
  return categories
    .map((category) => {
      if (typeof category === 'string') {
        return category.trim();
      }

      if (typeof category === 'object' && category !== null) {
        const record = category as Record<string, unknown>;
        return (
          readText(record.term) ??
          readText(record.label) ??
          readText(record['#text'])
        );
      }

      return undefined;
    })
    .filter((entry): entry is string => Boolean(entry));
}

function normalizeRssItem(
  item: Record<string, unknown>,
  options: NormalizeFeedOptions,
  feedTitle: string | undefined,
  index: number,
): NormalizationOutcome {
  const title = readText(item.title);
  if (!title) {
    return {
      warnings: [
        `Skipped RSS item ${index + 1} from ${options.feedUrl}: missing title`,
      ],
    };
  }

  const canonicalUrl = readText(item.link);
  if (!canonicalUrl) {
    return {
      warnings: [
        `Skipped RSS item ${index + 1} from ${options.feedUrl}: missing link`,
      ],
    };
  }

  const guid = readText(item.guid);
  const summary =
    readText(item.description) ??
    readText(item['content:encoded']) ??
    readText(item.content) ??
    undefined;
  const author =
    readText(item.creator) ??
    readText(item.author) ??
    readText(item['dc:creator']) ??
    undefined;
  const publishedAt =
    readText(item.pubDate) ?? readText(item.isoDate) ?? undefined;

  return {
    item: {
      sourceId: options.sourceId,
      externalId: guid ?? canonicalUrl,
      canonicalUrl,
      title,
      summary,
      author,
      publishedAt,
      fetchedAt: options.fetchedAt,
      sourceMetadata: {
        feedTitle,
        guid,
        categories: normalizeCategories(item.category),
        rawPublishedAt: readText(item.pubDate) ?? readText(item.isoDate),
        feedType: 'rss',
      },
    },
    warnings: [],
  };
}

function normalizeAtomItem(
  entry: Record<string, unknown>,
  options: NormalizeFeedOptions,
  feedTitle: string | undefined,
  index: number,
): NormalizationOutcome {
  const title = readText(entry.title);
  if (!title) {
    return {
      warnings: [
        `Skipped Atom entry ${index + 1} from ${options.feedUrl}: missing title`,
      ],
    };
  }

  const links = asArray(entry.link);
  const canonicalUrl =
    links
      .map((link) =>
        typeof link === 'string'
          ? readText(link)
          : readAttribute(link, '@_href'),
      )
      .find((link): link is string => Boolean(link)) ?? undefined;
  if (!canonicalUrl) {
    return {
      warnings: [
        `Skipped Atom entry ${index + 1} from ${options.feedUrl}: missing link`,
      ],
    };
  }

  const entryId = readText(entry.id);
  const summary =
    readText(entry.summary) ??
    readText(entry.content) ??
    readText(entry['content:encoded']) ??
    undefined;
  const author =
    readText((entry.author as Record<string, unknown> | undefined)?.name) ??
    readText(entry.author) ??
    undefined;
  const publishedAt =
    readText(entry.published) ?? readText(entry.updated) ?? undefined;

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
        categories: normalizeCategories(entry.category),
        rawPublishedAt: readText(entry.published) ?? readText(entry.updated),
        feedType: 'atom',
      },
    },
    warnings: [],
  };
}

export function normalizeFeedDocument(
  document: ParsedXmlDocument,
  options: NormalizeFeedOptions,
): SourceFetchResult {
  const feedTitle = readFeedTitle(document);
  const items: NormalizedSourceItemInput[] = [];
  const warnings: string[] = [];

  const rssChannel = document.rss as Record<string, unknown> | undefined;
  if (rssChannel) {
    const channel = rssChannel.channel as Record<string, unknown> | undefined;
    const rssItems = asArray(channel?.item as unknown);
    for (const [index, rawItem] of rssItems.entries()) {
      if (typeof rawItem !== 'object' || rawItem === null) {
        warnings.push(
          `Skipped RSS item ${index + 1} from ${options.feedUrl}: invalid item shape`,
        );
        continue;
      }

      const outcome = normalizeRssItem(
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

  const atomFeed = document.feed as Record<string, unknown> | undefined;
  if (atomFeed) {
    const atomEntries = asArray(atomFeed.entry as unknown);
    for (const [index, rawEntry] of atomEntries.entries()) {
      if (typeof rawEntry !== 'object' || rawEntry === null) {
        warnings.push(
          `Skipped Atom entry ${index + 1} from ${options.feedUrl}: invalid entry shape`,
        );
        continue;
      }

      const outcome = normalizeAtomItem(
        rawEntry as Record<string, unknown>,
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

  throw new Error(
    `Failed to parse feed from ${options.feedUrl}: missing rss or atom root`,
  );
}
