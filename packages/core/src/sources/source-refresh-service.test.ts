import { describe, expect, it, vi } from 'vitest';

import type {
  JobRecord,
  SourceRecord,
  SourceItemRecord,
  SourceItemUpsertInput,
} from '@stocker/db';
import {
  createSourceAdapterRegistry,
  type NormalizedSourceItemInput,
  type SourceAdapter,
} from '@stocker/source-adapters';

import { createSourceRefreshService } from './source-refresh-service';

function createSource(overrides: Partial<SourceRecord> = {}): SourceRecord {
  return {
    id: 'source-1',
    type: 'rss',
    name: 'Example Feed',
    enabled: true,
    config: {
      id: 'source-1',
      type: 'rss',
      name: 'Example Feed',
      enabled: true,
      url: 'https://example.com/feed.xml',
      refreshMinutes: 30,
    },
    lastFetchedAt: null,
    lastSuccessAt: null,
    lastErrorAt: null,
    lastErrorMessage: null,
    createdAt: '2026-04-25T10:00:00.000Z',
    updatedAt: '2026-04-25T10:00:00.000Z',
    ...overrides,
  };
}

function createJobRecord(): JobRecord {
  return {
    id: 'job-1',
    type: 'item.enrich',
    state: 'queued',
    payload: {
      sourceItemId: 'item-1',
      trigger: 'source-refresh',
    },
    attemptCount: 0,
    maxAttempts: 3,
    runAfter: '2026-04-25T10:00:00.000Z',
    lockedAt: null,
    lockedBy: null,
    lastErrorMessage: null,
    createdAt: '2026-04-25T10:00:00.000Z',
    updatedAt: '2026-04-25T10:00:00.000Z',
  };
}

function createAdapter(
  itemFactory: () => NormalizedSourceItemInput[] = () => [],
  overrides: Partial<SourceAdapter<Record<string, unknown>>> = {},
): SourceAdapter<Record<string, unknown>> {
  return {
    type: 'rss',
    validateConfig: (input: unknown) => input as Record<string, unknown>,
    fetchItems: async () => ({
      items: itemFactory(),
      fetchedAt: '2026-04-25T10:05:00.000Z',
      warnings: ['adapter warning'],
    }),
    ...overrides,
  };
}

function createDependencies(options: {
  sources?: SourceRecord[];
  adapter?: SourceAdapter<Record<string, unknown>>;
  itemRecords?: SourceItemRecord[];
  fetchItems?: NormalizedSourceItemInput[];
}) {
  const sources = options.sources ?? [createSource()];
  const sourceState = [...sources];
  const itemState = [...(options.itemRecords ?? [])];
  const jobCalls: string[] = [];
  const fetchItems = options.fetchItems ?? [
    {
      sourceId: 'source-1',
      externalId: 'external-1',
      canonicalUrl: 'https://example.com/articles/1',
      title: 'Example article',
      fetchedAt: '2026-04-25T10:05:00.000Z',
      sourceMetadata: {},
    },
    {
      sourceId: 'source-1',
      externalId: 'external-2',
      canonicalUrl: 'https://example.com/articles/2',
      title: 'Second article',
      fetchedAt: '2026-04-25T10:05:00.000Z',
      sourceMetadata: {},
    },
  ];

  const adapter = options.adapter ?? createAdapter(() => fetchItems);

  const sourcesRepository = {
    listSourceStatus: async () => sourceState,
    markFetchSuccess: async (sourceId: string, fetchedAt: string) => {
      const source = sourceState.find((entry) => entry.id === sourceId);
      if (source) {
        source.lastFetchedAt = fetchedAt;
        source.lastSuccessAt = fetchedAt;
        source.lastErrorAt = null;
        source.lastErrorMessage = null;
        source.updatedAt = fetchedAt;
      }
      return source ?? null;
    },
    markFetchFailure: async (
      sourceId: string,
      errorMessage: string,
      failedAt: string,
    ) => {
      const source = sourceState.find((entry) => entry.id === sourceId);
      if (source) {
        source.lastErrorAt = failedAt;
        source.lastErrorMessage = errorMessage;
        source.updatedAt = failedAt;
      }
      return source ?? null;
    },
  };

  const sourceItemsRepository = {
    findBySourceAndExternalId: async (sourceId: string, externalId: string) =>
      itemState.find(
        (item) => item.sourceId === sourceId && item.externalId === externalId,
      ) ?? null,
    upsertFromSource: async (input: SourceItemUpsertInput) => {
      const existingIndex = itemState.findIndex(
        (item) =>
          item.sourceId === input.sourceId &&
          item.externalId === input.externalId,
      );
      const nextItem: SourceItemRecord = {
        id: input.id ?? 'item-1',
        sourceId: input.sourceId,
        externalId: input.externalId,
        canonicalUrl: input.canonicalUrl,
        title: input.title,
        summary: input.summary ?? null,
        author: input.author ?? null,
        publishedAt: input.publishedAt ?? null,
        fetchedAt: input.fetchedAt,
        sourceMetadata: input.sourceMetadata,
        readState: input.readState,
        savedForResearch: input.savedForResearch,
        enrichmentState: input.enrichmentState,
        createdAt: input.createdAt,
        updatedAt: input.updatedAt,
      };

      if (existingIndex >= 0) {
        itemState[existingIndex] = {
          ...itemState[existingIndex],
          ...nextItem,
        };
        return itemState[existingIndex];
      }

      itemState.push(nextItem);
      return nextItem;
    },
  };

  const jobService = {
    enqueueItemEnrichment: async (sourceItemId: string, trigger: string) => {
      jobCalls.push(`enrich:${sourceItemId}:${trigger}`);
      return createJobRecord();
    },
    enqueueSourceRefresh: async (sourceId: string, trigger: string) => {
      jobCalls.push(`refresh:${sourceId}:${trigger}`);
      return {
        ...createJobRecord(),
        type: 'source.refresh',
        payload: {
          sourceId,
          trigger,
        },
      };
    },
  };

  const service = createSourceRefreshService({
    sourcesRepository,
    sourceItemsRepository,
    jobService,
    sourceAdapters: createSourceAdapterRegistry([adapter]),
    now: () => '2026-04-25T10:10:00.000Z',
    fetch: vi.fn(),
    logger: {
      debug: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
    },
  });

  return {
    service,
    jobCalls,
    sourceState,
    itemState,
    sourcesRepository,
  };
}

describe('SourceRefreshService', () => {
  it('refreshes one source and enqueues enrichment jobs for new items', async () => {
    const { service, jobCalls, sourceState, itemState } = createDependencies(
      {},
    );

    const result = await service.refreshSource('source-1', 'manual');

    expect(result.status).toBe('succeeded');
    if (result.status === 'succeeded') {
      expect(result.itemsFetched).toBe(2);
      expect(result.newItems).toBe(2);
      expect(result.jobsEnqueued).toBe(2);
      expect(result.warnings).toEqual(['adapter warning']);
    }
    expect(jobCalls).toHaveLength(2);
    expect(jobCalls[0]).toMatch(/^enrich:/);
    expect(jobCalls[1]).toMatch(/^enrich:/);
    expect(sourceState[0]?.lastSuccessAt).toBe('2026-04-25T10:05:00.000Z');
    expect(itemState).toHaveLength(2);
  });

  it('does not enqueue duplicate enrichment jobs on a later refresh', async () => {
    const { service, jobCalls } = createDependencies({});

    await service.refreshSource('source-1', 'manual');
    jobCalls.length = 0;

    const result = await service.refreshSource('source-1', 'manual');

    expect(result.status).toBe('succeeded');
    if (result.status === 'succeeded') {
      expect(result.newItems).toBe(0);
      expect(result.jobsEnqueued).toBe(0);
    }
    expect(jobCalls).toEqual([]);
  });

  it('updates source health when the adapter fails', async () => {
    const failingAdapter = createAdapter(() => [], {
      fetchItems: async () => {
        throw new Error('adapter boom');
      },
    });
    const { service, sourceState } = createDependencies({
      adapter: failingAdapter,
    });

    const result = await service.refreshSource('source-1', 'manual');

    expect(result.status).toBe('failed');
    if (result.status === 'failed') {
      expect(result.errorMessage).toBe('adapter boom');
    }
    expect(sourceState[0]?.lastErrorMessage).toBe('adapter boom');
  });

  it('skips disabled sources', async () => {
    const { service, jobCalls, sourceState, itemState } = createDependencies({
      sources: [createSource({ enabled: false })],
    });

    const result = await service.refreshSource('source-1', 'manual');

    expect(result.status).toBe('skipped');
    expect(jobCalls).toEqual([]);
    expect(sourceState[0]?.lastSuccessAt).toBeNull();
    expect(itemState).toHaveLength(0);
  });

  it('schedules due source refresh jobs', async () => {
    const { service, jobCalls } = createDependencies({
      sources: [
        createSource({
          id: 'due-source',
          name: 'Due Source',
          lastFetchedAt: '2026-04-25T08:00:00.000Z',
          config: {
            id: 'due-source',
            type: 'rss',
            name: 'Due Source',
            enabled: true,
            url: 'https://example.com/due.xml',
            refreshMinutes: 60,
          },
        }),
        createSource({
          id: 'recent-source',
          name: 'Recent Source',
          lastFetchedAt: '2026-04-25T09:55:00.000Z',
          config: {
            id: 'recent-source',
            type: 'rss',
            name: 'Recent Source',
            enabled: true,
            url: 'https://example.com/recent.xml',
            refreshMinutes: 60,
          },
        }),
      ],
      fetchItems: [],
    });

    const jobs = await service.scheduleDueSourceRefreshJobs(
      '2026-04-25T10:10:00.000Z',
    );

    expect(jobs).toHaveLength(1);
    expect(jobCalls).toEqual(['refresh:due-source:scheduled']);
  });
});
