import {
  companySearchResultsSchema,
  stockSnapshotInputSchema,
  type MarketDataProvider,
  type MarketDataProviderType,
} from './types';

export type MarketDataProviderRegistry = {
  get(type: MarketDataProviderType): MarketDataProvider;
  listTypes(): MarketDataProviderType[];
};

function formatKnownTypes(types: MarketDataProviderType[]): string {
  return types.length === 0 ? 'none' : types.join(', ');
}

function wrapProvider(provider: MarketDataProvider): MarketDataProvider {
  return {
    type: provider.type,
    async searchCompanies(query: string, universe: string) {
      const results = await provider.searchCompanies(query, universe);
      return companySearchResultsSchema.parse(results);
    },
    async getSnapshot(input) {
      const result = await provider.getSnapshot(input);
      if (result === null) {
        return null;
      }

      return stockSnapshotInputSchema.parse(result);
    },
  };
}

export function createMarketDataProviderRegistry(
  providers: MarketDataProvider[],
): MarketDataProviderRegistry {
  const map = new Map<MarketDataProviderType, MarketDataProvider>();

  for (const provider of providers) {
    if (map.has(provider.type)) {
      throw new Error(`Duplicate market-data provider type: ${provider.type}`);
    }

    map.set(provider.type, wrapProvider(provider));
  }

  return {
    get(type: MarketDataProviderType): MarketDataProvider {
      const provider = map.get(type);
      if (!provider) {
        throw new Error(
          `Unknown market-data provider type: ${type}. Registered providers: ${formatKnownTypes(
            [...map.keys()],
          )}`,
        );
      }

      return provider;
    },
    listTypes(): MarketDataProviderType[] {
      return [...map.keys()];
    },
  };
}
