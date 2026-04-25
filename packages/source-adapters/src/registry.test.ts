import { describe, expect, it } from 'vitest';

import { createSourceAdapterRegistry } from './registry';
import type { SourceAdapter } from './types';

function createAdapter(
  type: 'rss' | 'reddit',
): SourceAdapter<Record<string, never>> {
  return {
    type,
    validateConfig: (input: unknown) => input as Record<string, never>,
    fetchItems: async () => ({
      items: [],
      fetchedAt: '2026-04-25T12:00:00.000Z',
      warnings: [],
    }),
  };
}

describe('createSourceAdapterRegistry', () => {
  it('returns an adapter by source type', () => {
    const registry = createSourceAdapterRegistry([createAdapter('rss')]);

    expect(registry.has('rss')).toBe(true);
    expect(registry.listTypes()).toEqual(['rss']);
    expect(registry.get('rss').type).toBe('rss');
  });

  it('rejects duplicate adapter types', () => {
    expect(() =>
      createSourceAdapterRegistry([createAdapter('rss'), createAdapter('rss')]),
    ).toThrow(/Duplicate source adapter type "rss"/);
  });

  it('throws an actionable error for unknown adapter types', () => {
    const registry = createSourceAdapterRegistry([createAdapter('reddit')]);

    expect(() => registry.get('rss')).toThrow(
      /Unknown source adapter type "rss"/,
    );
    expect(() => registry.get('rss')).toThrow(/Registered types: reddit/);
  });
});
