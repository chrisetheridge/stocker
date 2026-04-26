import { randomUUID } from 'node:crypto';

import type {
  ItemCompanyInput,
  TickerCorrectionsRepository,
} from '@stocker/db';
import type { EnrichmentCompanyCandidate } from '@stocker/llm';
import type { MarketDataProvider } from '@stocker/market-data';

export type CompanyMatcherDependencies = {
  readonly tickerCorrectionsRepository: Pick<
    TickerCorrectionsRepository,
    'findEnabledCorrection'
  >;
  readonly marketDataProvider: Pick<
    MarketDataProvider,
    'searchCompanies' | 'getSnapshot'
  >;
  readonly now?: () => string;
  readonly universe?: string;
};

export type CompanyMatcherInput = {
  readonly sourceItemId: string;
  readonly candidates: EnrichmentCompanyCandidate[];
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

function normalizeForComparison(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

function buildBaseCompanyInput(
  sourceItemId: string,
  companyName: string,
  candidate: EnrichmentCompanyCandidate,
  now: string,
): ItemCompanyInput {
  return {
    id: randomUUID(),
    sourceItemId,
    companyName,
    ticker: undefined,
    exchange: undefined,
    relationshipType: candidate.relationshipType,
    relevanceExplanation: candidate.relevanceExplanation,
    confidence: candidate.confidence,
    matchStatus: 'validated',
    evidenceText: candidate.evidenceText,
    createdAt: now,
    updatedAt: now,
  };
}

export class CompanyMatcher {
  constructor(private readonly dependencies: CompanyMatcherDependencies) {}

  async matchCompanies(
    input: CompanyMatcherInput,
  ): Promise<ItemCompanyInput[]> {
    const now = resolveNow(this.dependencies.now);
    const universe = this.dependencies.universe ?? 'US';
    const matched: ItemCompanyInput[] = [];

    for (const candidate of input.candidates) {
      const normalizedCompanyName = normalizeCompanyName(candidate.companyName);
      const correction =
        await this.dependencies.tickerCorrectionsRepository.findEnabledCorrection(
          normalizedCompanyName,
        );

      if (correction) {
        let snapshot = null;
        try {
          snapshot = await this.dependencies.marketDataProvider.getSnapshot({
            ticker: correction.correctTicker,
            exchange: correction.correctExchange ?? undefined,
            universe,
          });
        } catch {
          snapshot = null;
        }

        const company = buildBaseCompanyInput(
          input.sourceItemId,
          correction.companyName,
          candidate,
          now,
        );
        company.ticker = correction.correctTicker;
        company.exchange =
          correction.correctExchange ?? snapshot?.exchange ?? undefined;
        company.matchStatus = 'validated';
        matched.push(company);
        continue;
      }

      if (candidate.tickerHint) {
        const tickerHint = normalizeTicker(candidate.tickerHint);
        let snapshot = null;
        try {
          snapshot = await this.dependencies.marketDataProvider.getSnapshot({
            ticker: tickerHint,
            universe,
          });
        } catch {
          snapshot = null;
        }

        const company = buildBaseCompanyInput(
          input.sourceItemId,
          normalizedCompanyName,
          candidate,
          now,
        );
        if (snapshot) {
          company.ticker = tickerHint;
          company.exchange = snapshot.exchange ?? undefined;
        }
        matched.push(company);
        continue;
      }

      const searchResults = await this.dependencies.marketDataProvider.searchCompanies(
        normalizedCompanyName,
        universe,
      );
      const exactMatch = searchResults.find(
        (result) =>
          normalizeForComparison(result.companyName) ===
          normalizeForComparison(normalizedCompanyName),
      );
      const [bestMatch] = searchResults;
      const company = buildBaseCompanyInput(
        input.sourceItemId,
        bestMatch?.companyName ?? normalizedCompanyName,
        candidate,
        now,
      );

      if (exactMatch) {
        company.ticker = exactMatch.ticker;
        company.exchange = exactMatch.exchange ?? undefined;
      } else if (bestMatch) {
        company.ticker = bestMatch.ticker;
        company.exchange = bestMatch.exchange ?? undefined;
        company.companyName = bestMatch.companyName;
      }

      matched.push(company);
    }

    return matched;
  }
}

export function createCompanyMatcher(
  dependencies: CompanyMatcherDependencies,
): CompanyMatcher {
  return new CompanyMatcher(dependencies);
}
