import type {
  StockSnapshotInput as DbStockSnapshotInput,
  SourceItemsRepository,
  StockSnapshotRecord,
  StockSnapshotsRepository,
} from '@stocker/db';
import type {
  MarketDataProvider,
  StockSnapshotInput as MarketSnapshotInput,
} from '@stocker/market-data';
import type { StockRefreshJobPayload } from '../jobs/job-payloads';

export type StockRefreshTrigger = StockRefreshJobPayload['trigger'];

export type StockRefreshSucceeded = {
  readonly status: 'succeeded';
  readonly sourceItemId: string;
  readonly ticker: string;
  readonly snapshot: StockSnapshotRecord;
  readonly cachedSnapshot: StockSnapshotRecord | null;
};

export type StockRefreshStale = {
  readonly status: 'stale';
  readonly sourceItemId: string;
  readonly ticker: string;
  readonly snapshot: StockSnapshotRecord;
};

export type StockRefreshFailed = {
  readonly status: 'failed';
  readonly sourceItemId: string;
  readonly ticker: string;
  readonly errorMessage: string;
};

export type StockRefreshResult =
  | StockRefreshSucceeded
  | StockRefreshStale
  | StockRefreshFailed;

export type StockRefreshServiceDependencies = {
  readonly sourceItemsRepository?: Pick<
    SourceItemsRepository,
    'getItemDetail'
  >;
  readonly stockSnapshotsRepository: Pick<
    StockSnapshotsRepository,
    'insertSnapshot' | 'getLatestSnapshot'
  >;
  readonly marketDataProvider: Pick<MarketDataProvider, 'getSnapshot'>;
  readonly now?: () => string;
  readonly universe?: string;
};

const defaultNow = (): string => new Date().toISOString();

function resolveNow(now?: () => string): string {
  return (now ?? defaultNow)();
}

function formatErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown stock refresh failure';
}

function toStoredSnapshot(
  snapshot: MarketSnapshotInput,
  now: string,
): DbStockSnapshotInput {
  return {
    ...snapshot,
    raw: snapshot.raw,
    createdAt: now,
  };
}

export class StockRefreshService {
  constructor(private readonly dependencies: StockRefreshServiceDependencies) {}

  async refreshStock(
    sourceItemId: string,
    ticker: string,
    _trigger: StockRefreshTrigger,
  ): Promise<StockRefreshResult> {
    const now = resolveNow(this.dependencies.now);
    const universe = this.dependencies.universe ?? 'US';

    try {
      const snapshot = await this.dependencies.marketDataProvider.getSnapshot({
        ticker,
        universe,
      });

      if (snapshot) {
        const stored = await this.dependencies.stockSnapshotsRepository.insertSnapshot(
          toStoredSnapshot(snapshot, now),
        );

        return {
          status: 'succeeded',
          sourceItemId,
          ticker,
          snapshot: stored,
          cachedSnapshot: null,
        };
      }

      const cachedSnapshot =
        await this.dependencies.stockSnapshotsRepository.getLatestSnapshot(
          ticker,
        );

      if (cachedSnapshot) {
        return {
          status: 'stale',
          sourceItemId,
          ticker,
          snapshot: cachedSnapshot,
        };
      }

      return {
        status: 'failed',
        sourceItemId,
        ticker,
        errorMessage: `No market snapshot available for ${ticker}`,
      };
    } catch (error) {
      const cachedSnapshot =
        await this.dependencies.stockSnapshotsRepository.getLatestSnapshot(
          ticker,
        );

      if (cachedSnapshot) {
        return {
          status: 'stale',
          sourceItemId,
          ticker,
          snapshot: cachedSnapshot,
        };
      }

      return {
        status: 'failed',
        sourceItemId,
        ticker,
        errorMessage: formatErrorMessage(error),
      };
    }
  }
}

export function createStockRefreshService(
  dependencies: StockRefreshServiceDependencies,
): StockRefreshService {
  return new StockRefreshService(dependencies);
}
