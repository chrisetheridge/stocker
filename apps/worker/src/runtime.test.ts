import { describe, expect, it, vi } from "vitest";

import type { StockerConfig } from "@stocker/config";
import type { Database } from "@stocker/db";
import type { JobService } from "@stocker/core";

import { createWorkerRuntime } from "./runtime";

function createConfig(): StockerConfig {
  return {
    app: {
      databasePath: ".stocker/stocker.sqlite",
    },
    sources: [],
    market: {
      defaultUniverse: "US",
      provider: {
        type: "yahoo-finance2",
      },
    },
    llm: {
      provider: {
        type: "openai-compatible",
        baseUrl: "http://localhost:1234/v1",
        apiKeyEnv: "LM_STUDIO_API_KEY",
        model: "local-model",
      },
      prompts: {
        enrichmentSystem:
          "You extract public-company stock relevance from article metadata.",
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

describe("createWorkerRuntime", () => {
  it("returns the configured runtime and delegates one job at a time", async () => {
    const claimAndRunNextJob = vi.fn(async () => ({ status: "idle" as const }));
    const jobService = {
      claimAndRunNextJob,
    } as Pick<JobService, "claimAndRunNextJob"> as JobService;
    const runtime = createWorkerRuntime({
      config: createConfig(),
      database: {} as Database,
      jobService,
      handlers: createHandlers(),
      workerId: "worker-1",
      pollingIntervalMs: 1,
    });

    await runtime.runOnce();

    expect(claimAndRunNextJob).toHaveBeenCalledWith(
      "worker-1",
      expect.objectContaining({
        itemEnrich: expect.any(Function),
      }),
    );
  });

  it("loops until aborted", async () => {
    const controller = new AbortController();
    const claimAndRunNextJob = vi.fn(async () => {
      controller.abort();
      return { status: "idle" as const };
    });
    const jobService = {
      claimAndRunNextJob,
    } as Pick<JobService, "claimAndRunNextJob"> as JobService;
    const runtime = createWorkerRuntime({
      config: createConfig(),
      database: {} as Database,
      jobService,
      handlers: createHandlers(),
      workerId: "worker-1",
      pollingIntervalMs: 1,
    });

    await runtime.runLoop(controller.signal);

    expect(claimAndRunNextJob).toHaveBeenCalledTimes(1);
  });
});
