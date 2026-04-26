import { createDatabase, getSharedDatabaseClient } from "@stocker/db";

import { env } from "~/env";

export const client = getSharedDatabaseClient(env.DATABASE_URL);
export const db = createDatabase(client);
