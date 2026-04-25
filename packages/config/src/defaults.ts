import type { StockerConfig } from "./schema";

export const defaultDatabasePath = ".stocker/stocker.sqlite";

export const defaultConfig: Pick<StockerConfig, "app" | "sources"> = {
  app: {
    databasePath: defaultDatabasePath,
  },
  sources: [],
};
