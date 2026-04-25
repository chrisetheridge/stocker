import { XMLParser, XMLValidator } from 'fast-xml-parser';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  removeNSPrefix: true,
  trimValues: true,
});

export type ParsedXmlDocument = Record<string, unknown>;

export function parseXmlDocument(
  xml: string,
  sourceUrl: string,
): ParsedXmlDocument {
  const validation = XMLValidator.validate(xml);
  if (validation !== true) {
    const message = validation.err?.msg ?? 'Invalid XML';
    throw new Error(`Failed to parse feed from ${sourceUrl}: ${message}`);
  }

  return parser.parse(xml) as ParsedXmlDocument;
}

export function asArray<T>(value: T | T[] | undefined | null): T[] {
  if (value === undefined || value === null) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

export function readText(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value === 'object' && value !== null) {
    const record = value as Record<string, unknown>;
    if (typeof record['#text'] === 'string') {
      return readText(record['#text']);
    }
  }

  return undefined;
}

export function readAttribute(
  value: unknown,
  attributeName: string,
): string | undefined {
  if (typeof value !== 'object' || value === null) {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  return readText(record[attributeName]);
}

export function readTextList(value: unknown): string[] {
  return asArray(value)
    .map((entry) => readText(entry))
    .filter((entry): entry is string => Boolean(entry));
}
