import { describe, expect, it } from 'vitest';

import { createStockRefreshService } from './stock-refresh-service';

describe('StockRefreshService', () => {
  it('returns a stale snapshot when live refresh fails but cache exists', async () => {
    const cached = {
      id: 'snapshot-cached',
      ticker: 'AAPL',
      exchange: 'NASDAQ',
      companyName: 'Apple Inc.',
      price: 200,
      currency: 'USD',
      dailyChange: 1,
      dailyChangePercent: 0.5,
      marketCap: 3_000_000_000_000,
      sector: 'Technology',
      provider: 'yahoo-finance2',
      capturedAt: '2026-04-25T10:00:00.000Z',
      staleAfter: '2026-04-25T10:15:00.000Z',
      raw: { symbol: 'AAPL' },
      createdAt: '2026-04-25T10:00:00.000Z',
    };

    const service = createStockRefreshService({
      stockSnapshotsRepository: {
        insertSnapshot: async () => cached,
        getLatestSnapshot: async () => cached,
      },
      marketDataProvider: {
        getSnapshot: async () => {
          throw new Error('provider boom');
        },
      },
      now: () => '2026-04-25T10:05:00.000Z',
    });

    const result = await service.refreshStock('item-1', 'AAPL', 'manual');

    expect(result.status).toBe('stale');
    if (result.status === 'stale') {
      expect(result.snapshot.id).toBe('snapshot-cached');
    }
  });
});
