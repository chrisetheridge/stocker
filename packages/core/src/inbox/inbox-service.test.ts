import { describe, expect, it, vi } from 'vitest';

import { createInboxService } from './inbox-service';

describe('InboxService', () => {
  it('maps inbox filters to the repository contract', async () => {
    const listInboxItems = vi.fn().mockResolvedValue([]);
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
    const service = createInboxService({
      sourceItemsRepository: { listInboxItems },
      sourcesRepository: { listSourceStatus },
    });

    await service.listInboxItems({
      sourceId: 'source-1',
      ticker: 'ACME',
      company: 'Acme Corp',
      readState: 'read',
      savedForResearch: true,
      enrichmentState: 'complete',
      query: 'Acme',
      limit: 25,
      offset: 10,
    });

    expect(listInboxItems).toHaveBeenCalledWith({
      sourceId: 'source-1',
      ticker: 'ACME',
      companyName: 'Acme Corp',
      readState: 'read',
      savedForResearch: true,
      enrichmentState: 'complete',
      query: 'Acme',
      limit: 25,
      offset: 10,
    });
    expect(listSourceStatus).toHaveBeenCalled();
  });
});
