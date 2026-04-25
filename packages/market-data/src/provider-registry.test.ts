import { describe, expect, it } from 'vitest';

import type { MarketDataProvider } from './types';
import { createMarketDataProviderRegistry } from './provider-registry';

function createProvider(
  overrides: Partial<MarketDataProvider> = {},
): MarketDataProvider {
  return {
    type: 'yahoo-finance2',
    searchCompanies: async () => [
      {
        companyName: 'Apple Inc.',
        ticker: 'AAPL',
        exchange: 'NASDAQ',
        sector: 'Technology',
        confidence: 1,
        raw: { symbol: 'AAPL' },
      },
    ],
    getSnapshot: async () => ({
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
    }),
    ...overrides,
  };
}

describe('createMarketDataProviderRegistry', () => {
  it('returns providers by type', () => {
    const registry = createMarketDataProviderRegistry([createProvider()]);

    expect(registry.listTypes()).toEqual(['yahoo-finance2']);
    expect(registry.get('yahoo-finance2').type).toBe('yahoo-finance2');
  });

  it('rejects duplicate provider types', () => {
    expect(() =>
      createMarketDataProviderRegistry([createProvider(), createProvider()]),
    ).toThrow('Duplicate market-data provider type: yahoo-finance2');
  });

  it('throws for unknown provider types', () => {
    const registry = createMarketDataProviderRegistry([createProvider()]);

    expect(() => registry.get('yahoo-finance2' as never)).not.toThrow();
    expect(() => registry.get('other' as never)).toThrow(
      'Unknown market-data provider type: other',
    );
  });

  it('validates malformed provider output before returning it', async () => {
    const registry = createMarketDataProviderRegistry([
      createProvider({
        searchCompanies: async () =>
          [
            {
              companyName: '',
              ticker: 'AAPL',
              confidence: 2,
              raw: {},
            },
          ] as never,
      }),
    ]);

    await expect(
      registry.get('yahoo-finance2').searchCompanies('Apple', 'US'),
    ).rejects.toThrow();
  });

  it('validates malformed snapshots before returning them', async () => {
    const registry = createMarketDataProviderRegistry([
      createProvider({
        getSnapshot: async () =>
          ({
            ticker: '',
            provider: 'yahoo-finance2',
            capturedAt: 'not-a-date',
            staleAfter: 'still-not-a-date',
            raw: {},
          }) as never,
      }),
    ]);

    await expect(
      registry.get('yahoo-finance2').getSnapshot({
        ticker: 'AAPL',
        universe: 'US',
      }),
    ).rejects.toThrow();
  });
});
