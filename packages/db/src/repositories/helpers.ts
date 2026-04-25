import type { JsonRecord } from "../types";

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
