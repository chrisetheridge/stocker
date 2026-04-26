import { describe, expect, it, vi } from 'vitest';

import type { StockerConfig } from '@stocker/config';
import type { Database, JobRecord } from '@stocker/db';
import type { JobService } from '@stocker/core';

import { createWorkerRuntime } from './runtime';

function createConfig(): StockerConfig {
  return {
    app: {
      databasePath: '.stocker/stocker.sqlite',
    },
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
        enrichmentSystem:
          'You extract public-company stock relevance from article metadata.',
      },
    },
  };
}

function createHandlers() {
  return {
    sourceRefresh: async () => undefined,
    itemEnrich: async () => undefined,
    stockRefresh: async () => undefined,
  } as const;
}

function createJobRecord(): JobRecord {
  return {
    id: 'job-1',
    type: 'item.enrich',
    state: 'succeeded',
    payload: {
      sourceItemId: 'item-1',
      trigger: 'manual',
    },
    attemptCount: 0,
    maxAttempts: 3,
    runAfter: '2026-04-25T10:00:00.000Z',
    lockedAt: null,
    lockedBy: null,
    lastErrorMessage: null,
    createdAt: '2026-04-25T10:00:00.000Z',
    updatedAt: '2026-04-25T10:00:00.000Z',
  };
}

describe('createWorkerRuntime', () => {
  it('returns the configured runtime and delegates one job at a time', async () => {
    const claimAndRunNextJob = vi.fn(async () => ({
      status: 'succeeded' as const,
      job: createJobRecord(),
    }));
    const logger = {
      debug: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
    };
    const jobService = {
      claimAndRunNextJob,
    } as Pick<JobService, 'claimAndRunNextJob'> as JobService;
    const runtime = createWorkerRuntime({
      config: createConfig(),
      database: {} as Database,
      jobService,
      handlers: createHandlers(),
      workerId: 'worker-1',
      pollingIntervalMs: 1,
      logger,
    });

    await runtime.runOnce();

    expect(claimAndRunNextJob).toHaveBeenCalledWith(
      'worker-1',
      expect.objectContaining({
        itemEnrich: expect.any(Function),
      }),
    );
    expect(logger.info).toHaveBeenCalledWith(
      '[worker-1] completed item.enrich job job-1',
    );
  });

  it('loops until aborted', async () => {
    const controller = new AbortController();
    const claimAndRunNextJob = vi.fn(async () => {
      controller.abort();
      return { status: 'idle' as const };
    });
    const logger = {
      debug: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
    };
    const jobService = {
      claimAndRunNextJob,
    } as Pick<JobService, 'claimAndRunNextJob'> as JobService;
    const runtime = createWorkerRuntime({
      config: createConfig(),
      database: {} as Database,
      jobService,
      handlers: createHandlers(),
      workerId: 'worker-1',
      pollingIntervalMs: 1,
      logger,
    });

    await runtime.runLoop(controller.signal);

    expect(claimAndRunNextJob).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith(
      '[worker-1] worker loop started with 1ms poll interval',
    );
    expect(logger.info).toHaveBeenCalledWith('[worker-1] worker loop stopped');
  });
});
