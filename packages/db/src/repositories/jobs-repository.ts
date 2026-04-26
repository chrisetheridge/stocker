import {
  and,
  asc,
  desc,
  eq,
  lte,
  sql,
  type InferSelectModel,
} from 'drizzle-orm';
import { randomUUID } from 'node:crypto';

import { jobs } from '../schema';
import type { Database } from '../client';
import type { JobEnqueueOptions, JobRecord, JsonRecord } from '../types';
import {
  parseJsonRecord,
  stringifyJsonRecord,
  withSqliteBusyRetry,
} from './helpers';

type JobRow = InferSelectModel<typeof jobs>;

const staleLockWindowMs = 15 * 60 * 1000;

function mapJob(row: JobRow): JobRecord {
  return {
    id: row.id,
    type: row.type,
    state: row.state,
    payload: parseJsonRecord(row.payloadJson),
    attemptCount: row.attemptCount,
    maxAttempts: row.maxAttempts,
    runAfter: row.runAfter,
    lockedAt: row.lockedAt ?? null,
    lockedBy: row.lockedBy ?? null,
    lastErrorMessage: row.lastErrorMessage ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class JobsRepository {
  constructor(private readonly database: Database) {}

  async enqueue(
    type: string,
    payload: JsonRecord,
    options: JobEnqueueOptions = {},
  ): Promise<JobRecord> {
    const now = options.createdAt ?? new Date().toISOString();
    const [row] = await withSqliteBusyRetry(() =>
      this.database
        .insert(jobs)
        .values({
          id: options.id ?? randomUUID(),
          type,
          state: 'queued',
          payloadJson: stringifyJsonRecord(payload),
          attemptCount: 0,
          maxAttempts: options.maxAttempts ?? 3,
          runAfter: options.runAfter ?? now,
          lockedAt: null,
          lockedBy: null,
          lastErrorMessage: null,
          createdAt: now,
          updatedAt: options.updatedAt ?? now,
        })
        .returning(),
    );

    if (!row) {
      throw new Error('Failed to enqueue job');
    }

    return mapJob(row);
  }

  async claimNext(workerId: string, now: string): Promise<JobRecord | null> {
    return withSqliteBusyRetry(() =>
      this.database.transaction(async (transaction) => {
        const [nextJob] = await transaction
          .select()
          .from(jobs)
          .where(
            and(
              eq(jobs.state, 'queued'),
              lte(jobs.runAfter, now),
              sql`${jobs.attemptCount} < ${jobs.maxAttempts}`,
            ),
          )
          .orderBy(asc(jobs.runAfter), asc(jobs.createdAt))
          .limit(1);

        let jobToClaim = nextJob ?? null;
        if (!jobToClaim) {
          const staleCutoff = new Date(
            new Date(now).getTime() - staleLockWindowMs,
          ).toISOString();
          const [staleJob] = await transaction
            .select()
            .from(jobs)
            .where(
              and(
                eq(jobs.state, 'running'),
                lte(jobs.lockedAt, staleCutoff),
                sql`${jobs.attemptCount} < ${jobs.maxAttempts}`,
              ),
            )
            .orderBy(asc(jobs.lockedAt), asc(jobs.createdAt))
            .limit(1);
          jobToClaim = staleJob ?? null;
        }

        if (!jobToClaim) {
          return null;
        }

        const [claimed] = await transaction
          .update(jobs)
          .set({
            state: 'running',
            lockedAt: now,
            lockedBy: workerId,
            updatedAt: now,
          })
          .where(eq(jobs.id, jobToClaim.id))
          .returning();

        return claimed ? mapJob(claimed) : null;
      }),
    );
  }

  async markSucceeded(jobId: string, now: string): Promise<JobRecord | null> {
    const [row] = await withSqliteBusyRetry(() =>
      this.database
        .update(jobs)
        .set({
          state: 'succeeded',
          lockedAt: null,
          lockedBy: null,
          lastErrorMessage: null,
          updatedAt: now,
        })
        .where(eq(jobs.id, jobId))
        .returning(),
    );

    return row ? mapJob(row) : null;
  }

  async markFailed(
    jobId: string,
    errorMessage: string,
    now: string,
  ): Promise<JobRecord | null> {
    const [row] = await withSqliteBusyRetry(() =>
      this.database
        .update(jobs)
        .set({
          state: 'failed',
          lockedAt: null,
          lockedBy: null,
          lastErrorMessage: errorMessage,
          updatedAt: now,
        })
        .where(eq(jobs.id, jobId))
        .returning(),
    );

    return row ? mapJob(row) : null;
  }

  async reschedule(
    jobId: string,
    runAfter: string,
    errorMessage: string,
    now: string,
  ): Promise<JobRecord | null> {
    const [row] = await withSqliteBusyRetry(() =>
      this.database
        .update(jobs)
        .set({
          state: 'queued',
          attemptCount: sql`${jobs.attemptCount} + 1`,
          runAfter,
          lockedAt: null,
          lockedBy: null,
          lastErrorMessage: errorMessage,
          updatedAt: now,
        })
        .where(eq(jobs.id, jobId))
        .returning(),
    );

    return row ? mapJob(row) : null;
  }

  async listRecentJobs(limit: number): Promise<JobRecord[]> {
    const rows = await withSqliteBusyRetry(() =>
      this.database
        .select()
        .from(jobs)
        .orderBy(desc(jobs.createdAt))
        .limit(limit),
    );

    return rows.map(mapJob);
  }
}

export function createJobsRepository(database: Database): JobsRepository {
  return new JobsRepository(database);
}
