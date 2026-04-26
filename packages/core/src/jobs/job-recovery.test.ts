import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import { createDatabase, createDatabaseClient, jobs } from '@stocker/db';
import { migrateDatabase, migrationsFolder } from '@stocker/db/migrate';
import { createJobsRepository } from '@stocker/db';
import type { JobHandlers } from './job-handlers';
import { createJobService } from './job-service';

const now = '2026-04-25T12:00:00.000Z';
const staleLockedAt = '2026-04-25T11:30:00.000Z';

async function createDatabaseFixture() {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'stocker-job-'));
  const databaseUrl = `file:${path.join(tempDir, 'stocker.sqlite')}`;
  await migrateDatabase({ databaseUrl, migrationsFolder });
  const client = createDatabaseClient(databaseUrl);
  const database = createDatabase(client);
  const jobsRepository = createJobsRepository(database);
  const service = createJobService({
    jobsRepository,
    now: () => now,
  });

  return {
    client,
    database,
    jobsRepository,
    service,
    async close() {
      await client.close();
    },
  };
}

function createHandlers(overrides: Partial<JobHandlers> = {}): JobHandlers {
  return {
    sourceRefresh: async () => undefined,
    itemEnrich: async () => undefined,
    stockRefresh: async () => undefined,
    ...overrides,
  };
}

describe('job recovery', () => {
  it('claims one queued job at a time', async () => {
    const fixture = await createDatabaseFixture();

    try {
      await fixture.jobsRepository.enqueue(
        'item.enrich',
        {
          sourceItemId: 'item-1',
          trigger: 'manual',
        },
        {
          id: 'job-queued',
          runAfter: now,
          createdAt: now,
          updatedAt: now,
        },
      );

      const first = await fixture.service.claimAndRunNextJob(
        'worker-1',
        createHandlers(),
      );
      const second = await fixture.service.claimAndRunNextJob(
        'worker-2',
        createHandlers(),
      );

      expect(first.status).toBe('succeeded');
      expect(second.status).toBe('idle');
    } finally {
      await fixture.close();
    }
  });

  it('recovers stale running jobs', async () => {
    const fixture = await createDatabaseFixture();

    try {
      await fixture.database.insert(jobs).values({
        id: 'job-stale',
        type: 'item.enrich',
        state: 'running',
        payloadJson: JSON.stringify({
          sourceItemId: 'item-1',
          trigger: 'manual',
        }),
        attemptCount: 0,
        maxAttempts: 3,
        runAfter: now,
        lockedAt: staleLockedAt,
        lockedBy: 'worker-old',
        lastErrorMessage: null,
        createdAt: now,
        updatedAt: staleLockedAt,
      });

      const result = await fixture.service.claimAndRunNextJob(
        'worker-2',
        createHandlers(),
      );

      expect(result.status).toBe('succeeded');
      const [job] = await fixture.jobsRepository.listRecentJobs(1);
      expect(job?.state).toBe('succeeded');
      expect(job?.lockedBy).toBeNull();
    } finally {
      await fixture.close();
    }
  });

  it('retries failed jobs until max attempts', async () => {
    const fixture = await createDatabaseFixture();
    const handler = vi.fn(async () => {
      throw new Error('temporary failure');
    });

    try {
      await fixture.jobsRepository.enqueue(
        'item.enrich',
        {
          sourceItemId: 'item-1',
          trigger: 'manual',
        },
        {
          id: 'job-retry',
          runAfter: now,
          createdAt: now,
          updatedAt: now,
          maxAttempts: 3,
        },
      );

      const first = await fixture.service.claimAndRunNextJob(
        'worker-1',
        createHandlers({
          itemEnrich: handler,
        }),
      );
      const second = await fixture.service.claimAndRunNextJob(
        'worker-1',
        createHandlers({
          itemEnrich: handler,
        }),
      );
      const third = await fixture.service.claimAndRunNextJob(
        'worker-1',
        createHandlers({
          itemEnrich: handler,
        }),
      );

      expect(first.status).toBe('retry_scheduled');
      expect(second.status).toBe('retry_scheduled');
      expect(third.status).toBe('failed');
    } finally {
      await fixture.close();
    }
  });

  it('keeps terminal failures visible with the original error message', async () => {
    const fixture = await createDatabaseFixture();

    try {
      await fixture.database.insert(jobs).values({
        id: 'job-terminal',
        type: 'item.enrich',
        state: 'running',
        payloadJson: JSON.stringify({
          sourceItemId: 'item-1',
          trigger: 'manual',
        }),
        attemptCount: 2,
        maxAttempts: 3,
        runAfter: now,
        lockedAt: staleLockedAt,
        lockedBy: 'worker-old',
        lastErrorMessage: null,
        createdAt: now,
        updatedAt: staleLockedAt,
      });

      const result = await fixture.service.claimAndRunNextJob(
        'worker-2',
        createHandlers({
          itemEnrich: async () => {
            throw new Error('terminal failure');
          },
        }),
      );

      expect(result.status).toBe('failed');
      if (result.status === 'failed') {
        expect(result.errorMessage).toBe('terminal failure');
      }
    } finally {
      await fixture.close();
    }
  });

  it('marks invalid payloads failed with validation errors', async () => {
    const fixture = await createDatabaseFixture();

    try {
      await fixture.database.insert(jobs).values({
        id: 'job-invalid',
        type: 'item.enrich',
        state: 'queued',
        payloadJson: JSON.stringify({
          sourceItemId: '',
          trigger: 'manual',
        }),
        attemptCount: 0,
        maxAttempts: 3,
        runAfter: now,
        lockedAt: null,
        lockedBy: null,
        lastErrorMessage: null,
        createdAt: now,
        updatedAt: now,
      });

      const result = await fixture.service.claimAndRunNextJob(
        'worker-1',
        createHandlers(),
      );

      expect(result.status).toBe('failed');
      if (result.status === 'failed') {
        expect(result.errorMessage).toMatch(/at least 1 character/i);
      }
    } finally {
      await fixture.close();
    }
  });
});
