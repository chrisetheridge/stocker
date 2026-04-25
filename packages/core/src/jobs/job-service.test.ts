import { describe, expect, it } from "vitest";

import type { JobRecord, JobsRepository } from "@stocker/db";

import { createJobService } from "./job-service";
import type { JobHandlers } from "./job-handlers";

function createQueuedJob(overrides: Partial<JobRecord> = {}): JobRecord {
  return {
    id: "job_1",
    type: "item.enrich",
    state: "queued",
    payload: {
      sourceItemId: "item_1",
      trigger: "source-refresh",
    },
    attemptCount: 0,
    maxAttempts: 3,
    runAfter: "2026-04-25T12:00:00.000Z",
    lockedAt: null,
    lockedBy: null,
    lastErrorMessage: null,
    createdAt: "2026-04-25T12:00:00.000Z",
    updatedAt: "2026-04-25T12:00:00.000Z",
    ...overrides,
  };
}

function createRepository(job: JobRecord | null) {
  const calls: string[] = [];
  const state = { job };

  const repository: Pick<
    JobsRepository,
    "enqueue" | "claimNext" | "markSucceeded" | "markFailed" | "reschedule"
  > = {
    enqueue: async () => createQueuedJob(),
    claimNext: async () => {
      calls.push("claimNext");
      const current = state.job;
      state.job = null;
      return current;
    },
    markSucceeded: async (jobId: string) => {
      calls.push(`markSucceeded:${jobId}`);
      return currentJob("succeeded", jobId);
    },
    markFailed: async (jobId: string, errorMessage: string) => {
      calls.push(`markFailed:${jobId}:${errorMessage}`);
      return currentJob("failed", jobId, errorMessage);
    },
    reschedule: async (
      jobId: string,
      runAfter: string,
      errorMessage: string,
    ) => {
      calls.push(`reschedule:${jobId}:${runAfter}:${errorMessage}`);
      return currentJob("queued", jobId, errorMessage, runAfter);
    },
  };

  function currentJob(
    stateName: JobRecord["state"],
    jobId: string,
    errorMessage?: string,
    runAfter?: string,
  ): JobRecord {
    return createQueuedJob({
      id: jobId,
      state: stateName,
      lastErrorMessage: errorMessage ?? null,
      runAfter: runAfter ?? "2026-04-25T12:00:00.000Z",
      attemptCount: stateName === "queued" ? 1 : 0,
    });
  }

  return { repository: repository as JobsRepository, calls };
}

function createHandlers(overrides: Partial<JobHandlers> = {}): JobHandlers {
  return {
    sourceRefresh: async () => undefined,
    itemEnrich: async () => undefined,
    stockRefresh: async () => undefined,
    ...overrides,
  };
}

describe("JobService", () => {
  it("runs a job successfully", async () => {
    const { repository, calls } = createRepository(createQueuedJob());
    const service = createJobService({ jobsRepository: repository });
    const handlers = createHandlers({
      itemEnrich: async () => undefined,
    });

    const result = await service.claimAndRunNextJob("worker-1", handlers);

    expect(result.status).toBe("succeeded");
    expect(calls).toEqual(["claimNext", "markSucceeded:job_1"]);
  });

  it("reschedules a retryable failure", async () => {
    const { repository, calls } = createRepository(createQueuedJob());
    const service = createJobService({ jobsRepository: repository });
    const handlers = createHandlers({
      itemEnrich: async () => {
        throw new Error("temporary failure");
      },
    });

    const result = await service.claimAndRunNextJob("worker-1", handlers);

    expect(result.status).toBe("retry_scheduled");
    expect(calls[1]).toContain("reschedule:job_1");
  });

  it("marks a terminal failure", async () => {
    const { repository, calls } = createRepository(
      createQueuedJob({ attemptCount: 2, maxAttempts: 3 }),
    );
    const service = createJobService({ jobsRepository: repository });
    const handlers = createHandlers({
      itemEnrich: async () => {
        throw new Error("terminal failure");
      },
    });

    const result = await service.claimAndRunNextJob("worker-1", handlers);

    expect(result.status).toBe("failed");
    expect(calls[1]).toContain("markFailed:job_1:terminal failure");
  });

  it("rejects invalid payloads before execution", async () => {
    const invalidJob = createQueuedJob({
      payload: {
        sourceItemId: "",
        trigger: "source-refresh",
      } as never,
    });
    const { repository, calls } = createRepository(invalidJob);
    const service = createJobService({ jobsRepository: repository });
    const handlers = createHandlers({
      itemEnrich: async () => {
        throw new Error("should not run");
      },
    });

    const result = await service.claimAndRunNextJob("worker-1", handlers);

    expect(result.status).toBe("failed");
    expect(calls[1]).toContain("markFailed:job_1");
  });
});
