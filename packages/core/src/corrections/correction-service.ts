import { randomUUID } from 'node:crypto';

import type {
  TickerCorrectionInput,
  TickerCorrectionRecord,
  TickerCorrectionsRepository,
} from '@stocker/db';

export type CorrectionServiceDependencies = {
  readonly tickerCorrectionsRepository: Pick<
    TickerCorrectionsRepository,
    'upsertCorrection' | 'disableCorrection' | 'listCorrections'
  >;
  readonly now?: () => string;
};

const defaultNow = (): string => new Date().toISOString();

function resolveNow(now?: () => string): string {
  return (now ?? defaultNow)();
}

function normalizeCompanyName(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function normalizeTicker(value: string): string {
  return value.trim().toUpperCase();
}

function normalizeExchange(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed.toUpperCase() : undefined;
}

export class CorrectionService {
  constructor(private readonly dependencies: CorrectionServiceDependencies) {}

  async listCorrections(): Promise<TickerCorrectionRecord[]> {
    return this.dependencies.tickerCorrectionsRepository.listCorrections();
  }

  async applyTickerCorrection(
    companyName: string,
    ticker: string,
    exchange?: string,
    notes?: string,
  ): Promise<TickerCorrectionRecord> {
    const now = resolveNow(this.dependencies.now);
    const input: TickerCorrectionInput = {
      id: randomUUID(),
      companyName: normalizeCompanyName(companyName),
      correctTicker: normalizeTicker(ticker),
      correctExchange: normalizeExchange(exchange),
      notes: notes?.trim() || undefined,
      enabled: true,
      createdAt: now,
      updatedAt: now,
    };

    return this.dependencies.tickerCorrectionsRepository.upsertCorrection(input);
  }

  async removeTickerCorrection(
    correctionId: string,
  ): Promise<TickerCorrectionRecord | null> {
    return this.dependencies.tickerCorrectionsRepository.disableCorrection(
      correctionId,
    );
  }
}

export function createCorrectionService(
  dependencies: CorrectionServiceDependencies,
): CorrectionService {
  return new CorrectionService(dependencies);
}
