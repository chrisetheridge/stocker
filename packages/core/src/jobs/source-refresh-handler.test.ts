import { describe, expect, it, vi } from 'vitest';

import { createSourceRefreshJobHandler } from './job-handlers';

describe('createSourceRefreshJobHandler', () => {
  it('calls the shared source refresh service with the payload', async () => {
    const refreshSource = vi.fn(async () => ({
      status: 'succeeded' as const,
      sourceId: 'source-1',
      sourceName: 'Example Feed',
      fetchedAt: '2026-04-25T12:00:00.000Z',
      itemsFetched: 1,
      newItems: 1,
      jobsEnqueued: 1,
      warnings: [],
    }));
    const handler = createSourceRefreshJobHandler({
      sourceRefreshService: {
        refreshSource,
      },
    });

    await handler({
      sourceId: 'source-1',
      trigger: 'manual',
    });

    expect(refreshSource).toHaveBeenCalledWith('source-1', 'manual');
  });

  it('surfaces missing source errors', async () => {
    const handler = createSourceRefreshJobHandler({
      sourceRefreshService: {
        refreshSource: async () => {
          throw new Error('Source not found: missing-source');
        },
      },
    });

    await expect(
      handler({
        sourceId: 'missing-source',
        trigger: 'manual',
      }),
    ).rejects.toThrow(/Source not found: missing-source/);
  });
});
