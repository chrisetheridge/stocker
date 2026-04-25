import { describe, expect, it, vi } from 'vitest';

import type { TickerCorrectionRecord } from '@stocker/db';

import { createCorrectionService } from './correction-service';

function createCorrection(overrides: Partial<TickerCorrectionRecord> = {}): TickerCorrectionRecord {
  return {
    id: 'correction-1',
    companyName: 'Apple Inc.',
    correctTicker: 'AAPL',
    correctExchange: 'NASDAQ',
    notes: 'note',
    enabled: true,
    createdAt: '2026-04-25T10:00:00.000Z',
    updatedAt: '2026-04-25T10:00:00.000Z',
    ...overrides,
  };
}

function createDependencies() {
  const corrections: TickerCorrectionRecord[] = [];
    const tickerCorrectionsRepository = {
      listCorrections: async () => corrections,
      upsertCorrection: async (input: {
        id?: string;
        companyName: string;
        correctTicker: string;
        correctExchange?: string | null;
        notes?: string | null;
        enabled?: boolean;
        createdAt: string;
        updatedAt: string;
      }) => {
      const next = createCorrection({
        id: input.id ?? 'correction-1',
        companyName: input.companyName,
        correctTicker: input.correctTicker,
        correctExchange: input.correctExchange ?? null,
        notes: input.notes ?? null,
        enabled: input.enabled ?? true,
        createdAt: input.createdAt,
        updatedAt: input.updatedAt,
      });
      corrections.splice(0, corrections.length, next);
      return next;
    },
    disableCorrection: async (correctionId: string) => {
      const correction = corrections.find((entry) => entry.id === correctionId);
      if (!correction) {
        return null;
      }

      correction.enabled = false;
      return correction;
    },
  };

  return {
    service: createCorrectionService({
      tickerCorrectionsRepository,
      now: () => '2026-04-25T10:05:00.000Z',
    }),
    corrections,
  };
}

describe('CorrectionService', () => {
  it('applies normalized corrections', async () => {
    const { service, corrections } = createDependencies();

    const correction = await service.applyTickerCorrection(
      ' apple inc. ',
      'aapl',
      'nasdaq',
      '  manual note  ',
    );

    expect(correction).toMatchObject({
      companyName: 'apple inc.',
      correctTicker: 'AAPL',
      correctExchange: 'NASDAQ',
      notes: 'manual note',
      enabled: true,
    });
    expect(corrections).toHaveLength(1);
  });

  it('disables corrections instead of deleting them', async () => {
    const { service, corrections } = createDependencies();
    const correction = await service.applyTickerCorrection(
      'Apple Inc.',
      'AAPL',
      'NASDAQ',
    );

    const removed = await service.removeTickerCorrection(correction.id);

    expect(removed?.enabled).toBe(false);
    expect(corrections[0]?.enabled).toBe(false);
  });

  it('upserts duplicate corrections', async () => {
    const { service } = createDependencies();

    await service.applyTickerCorrection('Apple Inc.', 'AAPL');
    const second = await service.applyTickerCorrection(
      'Apple Inc.',
      'AAPL',
      undefined,
      'updated note',
    );

    await expect(service.listCorrections()).resolves.toHaveLength(1);
    expect(second.notes).toBe('updated note');
  });
});
