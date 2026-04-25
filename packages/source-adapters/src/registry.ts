import type { SourceAdapter, SourceAdapterType } from './types';

export type SourceAdapterRegistry = {
  get(type: SourceAdapterType): SourceAdapter<unknown>;
  has(type: SourceAdapterType): boolean;
  listTypes(): SourceAdapterType[];
};

function formatRegisteredTypes(types: readonly SourceAdapterType[]): string {
  return types.length === 0 ? 'none' : types.join(', ');
}

export function createSourceAdapterRegistry(
  adapters: readonly SourceAdapter<unknown>[],
): SourceAdapterRegistry {
  const registry = new Map<SourceAdapterType, SourceAdapter<unknown>>();

  for (const adapter of adapters) {
    if (registry.has(adapter.type)) {
      const knownTypes = formatRegisteredTypes([...registry.keys()]);
      throw new Error(
        `Duplicate source adapter type "${adapter.type}". Registered types: ${knownTypes}.`,
      );
    }

    registry.set(adapter.type, adapter);
  }

  return {
    get(type: SourceAdapterType): SourceAdapter<unknown> {
      const adapter = registry.get(type);
      if (!adapter) {
        throw new Error(
          `Unknown source adapter type "${type}". Registered types: ${formatRegisteredTypes([...registry.keys()])}.`,
        );
      }

      return adapter;
    },
    has(type: SourceAdapterType): boolean {
      return registry.has(type);
    },
    listTypes(): SourceAdapterType[] {
      return [...registry.keys()];
    },
  };
}
