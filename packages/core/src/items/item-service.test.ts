import { describe, expect, it, vi } from 'vitest';

import { createItemService } from './item-service';

function createJobRecord(overrides: Partial<{
  id: string;
  type: string;
  state: string;
  payload: Record<string, unknown>;
}> = {}) {
  return {
    id: 'job-1',
    type: 'item.enrich',
    state: 'queued',
    payload: {
      sourceItemId: 'item-1',
      trigger: 'retry',
    },
    attemptCount: 0,
    maxAttempts: 3,
    runAfter: '2026-04-25T12:00:00.000Z',
    lockedAt: null,
    lockedBy: null,
    lastErrorMessage: null,
    createdAt: '2026-04-25T12:00:00.000Z',
    updatedAt: '2026-04-25T12:00:00.000Z',
    ...overrides,
  };
}

describe('ItemService', () => {
  it('retrieves details and mutates item state', async () => {
    const getItemDetail = vi.fn().mockResolvedValue({
      item: { id: 'item-1' },
      companies: [
        { ticker: 'ACME' },
        { ticker: 'ACME' },
        { ticker: 'OMNI' },
      ],
    });
    const markReadState = vi.fn().mockResolvedValue({ id: 'item-1' });
    const setSavedForResearch = vi.fn().mockResolvedValue({ id: 'item-1' });
    const listItemIdsBySourceId = vi.fn().mockResolvedValue([
      'item-1',
      'item-2',
      'item-3',
    ]);
    const listSourceStatus = vi.fn().mockResolvedValue([
      {
        id: 'source-1',
        type: 'rss',
        name: 'Hacker News',
        enabled: true,
        config: {},
        lastFetchedAt: null,
        lastSuccessAt: null,
        lastErrorAt: null,
        lastErrorMessage: null,
        createdAt: '2026-04-25T12:00:00.000Z',
      updatedAt: '2026-04-25T12:00:00.000Z',
      },
    ]);
    const enqueueItemEnrichment = vi.fn().mockResolvedValue(createJobRecord());
    const enqueueStockRefresh = vi.fn().mockImplementation(
      async (_itemId: string, ticker: string) => ({
        ...createJobRecord({
          id: `job-${ticker}`,
          type: 'stock.refresh',
          payload: {
            sourceItemId: 'item-1',
            ticker,
            trigger: 'manual',
          },
        }),
      }),
    );

    const service = createItemService({
      sourceItemsRepository: {
        getItemDetail,
        listItemIdsBySourceId,
        markReadState,
        setSavedForResearch,
      },
      sourcesRepository: {
        listSourceStatus,
      },
      jobService: {
        enqueueItemEnrichment,
        enqueueStockRefresh,
      },
    });

    await expect(service.getItemDetail('item-1')).resolves.toMatchObject({
      item: { id: 'item-1' },
    });
    await expect(service.markReadState('item-1', 'read')).resolves.toMatchObject({
      id: 'item-1',
    });
    await expect(service.setSavedForResearch('item-1', true)).resolves.toMatchObject(
      {
        id: 'item-1',
      },
    );
    await expect(service.retryEnrichment('item-1')).resolves.toMatchObject({
      id: 'job-1',
    });
    await expect(service.retryEnrichmentForSource('source-1')).resolves.toEqual({
      sourceId: 'source-1',
      itemsFound: 3,
      jobsEnqueued: 3,
      batchSize: 4,
    });
    await expect(service.refreshStockDataForItem('item-1')).resolves.toEqual([
      expect.objectContaining({ id: 'job-ACME' }),
      expect.objectContaining({ id: 'job-OMNI' }),
    ]);

    expect(enqueueItemEnrichment).toHaveBeenCalledWith('item-1', 'retry');
    expect(enqueueItemEnrichment).toHaveBeenCalledTimes(4);
    expect(enqueueStockRefresh).toHaveBeenCalledTimes(2);
    expect(listItemIdsBySourceId).toHaveBeenCalledWith('source-1');
    expect(listSourceStatus).toHaveBeenCalled();
  });

  it('enqueues source enrichment retries in batches of four', async () => {
    const listItemIdsBySourceId = vi.fn().mockResolvedValue([
      'item-1',
      'item-2',
      'item-3',
      'item-4',
      'item-5',
      'item-6',
      'item-7',
      'item-8',
      'item-9',
    ]);
    const markReadState = vi.fn().mockResolvedValue(null);
    const setSavedForResearch = vi.fn().mockResolvedValue(null);
    const enqueueItemEnrichment = vi.fn(async (itemId: string) => {
      activeJobs += 1;
      maxConcurrentJobs = Math.max(maxConcurrentJobs, activeJobs);
      await new Promise((resolve) => setTimeout(resolve, 5));
      activeJobs -= 1;
      return createJobRecord({
        id: `job-${itemId}`,
      });
    });
    let activeJobs = 0;
    let maxConcurrentJobs = 0;

    const service = createItemService({
      sourceItemsRepository: {
        getItemDetail: vi.fn(),
        listItemIdsBySourceId,
        markReadState,
        setSavedForResearch,
      },
      sourcesRepository: {
        listSourceStatus: vi.fn(),
      },
      jobService: {
        enqueueItemEnrichment,
        enqueueStockRefresh: vi.fn(),
      },
    });

    await expect(service.retryEnrichmentForSource('source-1')).resolves.toEqual({
      sourceId: 'source-1',
      itemsFound: 9,
      jobsEnqueued: 9,
      batchSize: 4,
    });

    expect(enqueueItemEnrichment).toHaveBeenCalledTimes(9);
    expect(maxConcurrentJobs).toBeLessThanOrEqual(4);
  });

  it('rejects missing items for retry and stock refresh', async () => {
    const getItemDetail = vi.fn().mockResolvedValue(null);
    const service = createItemService({
      sourceItemsRepository: {
        getItemDetail,
        listItemIdsBySourceId: vi.fn(),
        markReadState: vi.fn(),
        setSavedForResearch: vi.fn(),
      },
      sourcesRepository: {
        listSourceStatus: vi.fn(),
      },
      jobService: {
        enqueueItemEnrichment: vi.fn(),
        enqueueStockRefresh: vi.fn(),
      },
    });

    await expect(service.retryEnrichment('missing')).rejects.toThrow(
      /Item not found/,
    );
    await expect(service.refreshStockDataForItem('missing')).rejects.toThrow(
      /Item not found/,
    );
  });
});
