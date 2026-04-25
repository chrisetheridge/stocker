import { describe, expect, it, vi } from 'vitest';

import { createItemEnrichJobHandler } from './job-handlers';

describe('createItemEnrichJobHandler', () => {
  it('throws when enrichment fails', async () => {
    const handler = createItemEnrichJobHandler({
      itemEnrichmentService: {
        enrichItem: async () => ({
          status: 'failed',
          sourceItemId: 'item-1',
          errorMessage: 'boom',
        }),
      },
    });

    await expect(
      handler({
        sourceItemId: 'item-1',
        trigger: 'manual',
      }),
    ).rejects.toThrow('boom');
  });

  it('passes successful enrichment through', async () => {
    const enrichItem = vi.fn().mockResolvedValue({
      status: 'succeeded',
      sourceItemId: 'item-1',
      enrichmentState: 'complete',
      runId: 'run-1',
      enrichment: {},
      companies: [],
      snapshots: [],
    });
    const handler = createItemEnrichJobHandler({
      itemEnrichmentService: {
        enrichItem,
      },
    });

    await handler({
      sourceItemId: 'item-1',
      trigger: 'manual',
    });

    expect(enrichItem).toHaveBeenCalledWith('item-1', 'manual');
  });
});
