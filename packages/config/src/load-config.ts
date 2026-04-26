import fs from 'node:fs/promises';
import path from 'node:path';

import { parse } from 'yaml';

import { stockerConfigSchema, type StockerConfig } from './schema';

const configCandidates = [
  path.join('config', 'stocker.yaml'),
  path.join('config', 'stocker.example.yaml'),
];

export async function loadConfig(filePath: string): Promise<StockerConfig> {
  const raw = await fs.readFile(filePath, 'utf8');
  const parsed = parse(raw) as unknown;
  return stockerConfigSchema.parse(parsed ?? {});
}

export async function resolveConfigPath(
  startDir = process.cwd(),
): Promise<string> {
  let currentDir = path.resolve(startDir);

  for (;;) {
    for (const candidatePath of configCandidates) {
      const candidate = path.join(currentDir, candidatePath);

      try {
        await fs.access(candidate);
        return candidate;
      } catch {
        continue;
      }
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      break;
    }

    currentDir = parentDir;
  }

  throw new Error(
    `Unable to find stocker config. Looked for ${configCandidates.join(
      ' and ',
    )} starting from ${path.resolve(startDir)}.`,
  );
}

export async function loadConfigFromEnv(): Promise<StockerConfig> {
  const configuredPath = process.env.STOCKER_CONFIG_PATH
    ? path.resolve(process.env.STOCKER_CONFIG_PATH)
    : await resolveConfigPath();
  return loadConfig(configuredPath);
}
