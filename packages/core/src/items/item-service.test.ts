import { describe, expect, it, vi } from 'vitest';

import { createItemService } from './item-service';

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
    const enqueueItemEnrichment = vi.fn().mockResolvedValue({ id: 'job-1' });
    const enqueueStockRefresh = vi.fn().mockImplementation(
      async (_itemId: string, ticker: string) => ({ id: `job-${ticker}` }),
    );

    const service = createItemService({
      sourceItemsRepository: {
        getItemDetail,
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
    await expect(service.refreshStockDataForItem('item-1')).resolves.toEqual([
      { id: 'job-ACME' },
      { id: 'job-OMNI' },
    ]);

    expect(enqueueItemEnrichment).toHaveBeenCalledWith('item-1', 'retry');
    expect(enqueueStockRefresh).toHaveBeenCalledTimes(2);
    expect(listSourceStatus).toHaveBeenCalled();
  });

  it('rejects missing items for retry and stock refresh', async () => {
    const getItemDetail = vi.fn().mockResolvedValue(null);
    const service = createItemService({
      sourceItemsRepository: {
        getItemDetail,
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
