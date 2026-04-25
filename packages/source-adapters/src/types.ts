export type SourceAdapterType = 'rss' | 'reddit';

export type NormalizedSourceItemInput = {
  sourceId: string;
  externalId: string;
  canonicalUrl: string;
  title: string;
  summary?: string;
  author?: string;
  publishedAt?: string;
  fetchedAt: string;
  sourceMetadata: Record<string, unknown>;
};

export type SourceFetchResult = {
  items: NormalizedSourceItemInput[];
  fetchedAt: string;
  warnings: string[];
};

export type SourceFetchLogger = Pick<
  Console,
  'debug' | 'error' | 'info' | 'warn'
>;

export type SourceFetchContext = {
  sourceId: string;
  sourceName: string;
  now: string;
  fetch: typeof fetch;
  logger: SourceFetchLogger;
};

export type SourceAdapter<TConfig> = {
  readonly type: SourceAdapterType;
  validateConfig(input: unknown): TConfig;
  fetchItems(
    config: TConfig,
    context: SourceFetchContext,
  ): Promise<SourceFetchResult>;
};
