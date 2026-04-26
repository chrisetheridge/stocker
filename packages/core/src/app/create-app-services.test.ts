import { describe, expect, it, vi } from 'vitest';

import { createAppServices } from './create-app-services';

describe('createAppServices', () => {
  it('builds the shared app service facade from injected dependencies', async () => {
    const getProvider = vi.fn().mockReturnValue({
      type: 'yahoo-finance2',
      searchCompanies: vi.fn(),
      getSnapshot: vi.fn(),
    });

    const services = createAppServices({
      config: {
        app: { databasePath: '.stocker/stocker.sqlite' },
        sources: [],
        market: {
          defaultUniverse: 'US',
          provider: {
            type: 'yahoo-finance2',
          },
        },
        llm: {
          provider: {
            type: 'openai-compatible',
            baseUrl: 'http://localhost:1234/v1',
            apiKeyEnv: 'LM_STUDIO_API_KEY',
            model: 'local-model',
          },
          prompts: {
            enrichmentSystem: 'prompt',
          },
        },
      },
      sourceItemsRepository: {
        listInboxItems: vi.fn().mockResolvedValue([]),
        getItemDetail: vi.fn().mockResolvedValue(null),
        markReadState: vi.fn(),
        setSavedForResearch: vi.fn(),
      } as never,
      sourcesRepository: {
        listSourceStatus: vi.fn().mockResolvedValue([]),
        markFetchSuccess: vi.fn(),
        markFetchFailure: vi.fn(),
      } as never,
      enrichmentRepository: {
        startRun: vi.fn(),
        completeRun: vi.fn(),
        failRun: vi.fn(),
        upsertItemEnrichment: vi.fn(),
        replaceItemCompanies: vi.fn(),
      } as never,
      stockSnapshotsRepository: {
        insertSnapshot: vi.fn(),
        getLatestSnapshot: vi.fn(),
      } as never,
      tickerCorrectionsRepository: {
        upsertCorrection: vi.fn(),
        disableCorrection: vi.fn(),
        listCorrections: vi.fn(),
        findEnabledCorrection: vi.fn(),
      } as never,
      jobsRepository: {
        enqueue: vi.fn(),
        claimNext: vi.fn(),
        markSucceeded: vi.fn(),
        markFailed: vi.fn(),
        reschedule: vi.fn(),
        listRecentJobs: vi.fn(),
      } as never,
      sourceAdapters: {
        get: vi.fn(),
        listTypes: vi.fn(),
      } as never,
      marketDataProviderRegistry: {
        get: getProvider,
        listTypes: vi.fn(),
      } as never,
      llmProvider: {
        type: 'openai-compatible',
        extractStockRelevance: vi.fn(),
      },
    });

    expect(getProvider).toHaveBeenCalledWith('yahoo-finance2');
    expect(services).toMatchObject({
      inboxService: expect.any(Object),
      itemService: expect.any(Object),
      sourceRefreshService: expect.any(Object),
      sourceStatusService: expect.any(Object),
      jobService: expect.any(Object),
      itemEnrichmentService: expect.any(Object),
      stockRefreshService: expect.any(Object),
      correctionService: expect.any(Object),
      marketDataProvider: expect.any(Object),
    });
  });
});
