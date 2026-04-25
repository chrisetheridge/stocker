import fs from 'node:fs/promises';
import path from 'node:path';

import { parse } from 'yaml';

import { stockerConfigSchema, type StockerConfig } from './schema';

export async function loadConfig(filePath: string): Promise<StockerConfig> {
  const raw = await fs.readFile(filePath, 'utf8');
  const parsed = parse(raw) as unknown;
  return stockerConfigSchema.parse(parsed ?? {});
}

export async function loadConfigFromEnv(): Promise<StockerConfig> {
  const configuredPath =
    process.env.STOCKER_CONFIG_PATH ?? path.resolve('config/stocker.yaml');
  return loadConfig(configuredPath);
}
