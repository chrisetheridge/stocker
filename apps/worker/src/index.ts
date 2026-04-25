import { loadConfigFromEnv } from "@stocker/config";
import { createJobService, createJobHandlers } from "@stocker/core";
import {
  createDatabase,
  createDatabaseClient,
  createJobsRepository,
} from "@stocker/db";
import path from "node:path";

import { createWorkerRuntime } from "./runtime";

function toDatabaseUrl(databasePath: string): string {
  if (databasePath.startsWith("file:")) {
    return databasePath;
  }

  return `file:${path.resolve(databasePath)}`;
}

async function main(): Promise<void> {
  const config = await loadConfigFromEnv();
  const client = createDatabaseClient(toDatabaseUrl(config.app.databasePath));
  const database = createDatabase(client);
  const jobsRepository = createJobsRepository(database);
  const jobService = createJobService({ jobsRepository });
  const handlers = createJobHandlers({
    sourceRefresh: async () => {
      throw new Error("source.refresh handler is not wired yet");
    },
    itemEnrich: async () => {
      throw new Error("item.enrich handler is not wired yet");
    },
    stockRefresh: async () => {
      throw new Error("stock.refresh handler is not wired yet");
    },
  });

  const runtime = createWorkerRuntime({
    config,
    database,
    jobService,
    handlers,
    workerId: `worker-${process.pid}`,
    pollingIntervalMs: 1_000,
  });

  console.log(`[${runtime.workerId}] started in polling mode`);

  const abortController = new AbortController();
  const stop = (): void => abortController.abort();
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);

  try {
    await runtime.runLoop(abortController.signal);
  } finally {
    process.off("SIGINT", stop);
    process.off("SIGTERM", stop);
    await client.close();
  }
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
