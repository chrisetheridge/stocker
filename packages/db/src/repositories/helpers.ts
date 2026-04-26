import type { JsonRecord } from '../types';

export function parseJsonRecord(value: string): JsonRecord {
  if (value.trim().length === 0) {
    return {};
  }

  return JSON.parse(value) as JsonRecord;
}

export function stringifyJsonRecord(value: JsonRecord): string {
  return JSON.stringify(value);
}

export function toNullableText(value?: string | null): string | null {
  return value ?? null;
}

export function toNullableNumber(value?: number | null): number | null {
  return value ?? null;
}

export function toNullableBoolean(value?: boolean | null): boolean | null {
  return value ?? null;
}

type SqliteBusyErrorLike = {
  readonly code?: string;
  readonly rawCode?: number;
};

function isSqliteBusyError(error: unknown): error is SqliteBusyErrorLike {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const candidate = error as SqliteBusyErrorLike;
  return candidate.code === 'SQLITE_BUSY' || candidate.rawCode === 5;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withSqliteBusyRetry<T>(
  operation: () => Promise<T>,
  options: {
    readonly attempts?: number;
    readonly initialDelayMs?: number;
  } = {},
): Promise<T> {
  const attempts = options.attempts ?? 5;
  const initialDelayMs = options.initialDelayMs ?? 25;

  let delayMs = initialDelayMs;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      if (!isSqliteBusyError(error) || attempt === attempts) {
        throw error;
      }

      await delay(delayMs);
      delayMs *= 2;
    }
  }

  throw new Error('Unexpected sqlite retry failure');
}
