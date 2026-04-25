import type { ItemEnrichmentService } from '../enrichment/item-enrichment-service';
import type { StockRefreshService } from '../market/stock-refresh-service';
import type { SourceRefreshService } from '../sources/source-refresh-service';
import type {
  ItemEnrichJobPayload,
  SourceRefreshJobPayload,
  StockRefreshJobPayload,
} from './job-payloads';

export type JobHandlers = {
  readonly sourceRefresh: (payload: SourceRefreshJobPayload) => Promise<void>;
  readonly itemEnrich: (payload: ItemEnrichJobPayload) => Promise<void>;
  readonly stockRefresh: (payload: StockRefreshJobPayload) => Promise<void>;
};

export function createJobHandlers(handlers: JobHandlers): JobHandlers {
  return handlers;
}

export type SourceRefreshJobHandlerDependencies = {
  readonly sourceRefreshService: Pick<SourceRefreshService, 'refreshSource'>;
};

export function createSourceRefreshJobHandler(
  dependencies: SourceRefreshJobHandlerDependencies,
): (payload: SourceRefreshJobPayload) => Promise<void> {
  return async (payload: SourceRefreshJobPayload): Promise<void> => {
    const result = await dependencies.sourceRefreshService.refreshSource(
      payload.sourceId,
      payload.trigger,
    );

    if (result.status === 'failed') {
      throw new Error(result.errorMessage);
    }
  };
}

export type ItemEnrichJobHandlerDependencies = {
  readonly itemEnrichmentService: Pick<ItemEnrichmentService, 'enrichItem'>;
};

export function createItemEnrichJobHandler(
  dependencies: ItemEnrichJobHandlerDependencies,
): (payload: ItemEnrichJobPayload) => Promise<void> {
  return async (payload: ItemEnrichJobPayload): Promise<void> => {
    const result = await dependencies.itemEnrichmentService.enrichItem(
      payload.sourceItemId,
      payload.trigger,
    );

    if (result.status === 'failed') {
      throw new Error(result.errorMessage);
    }
  };
}

export type StockRefreshJobHandlerDependencies = {
  readonly stockRefreshService: Pick<StockRefreshService, 'refreshStock'>;
};

export function createStockRefreshJobHandler(
  dependencies: StockRefreshJobHandlerDependencies,
): (payload: StockRefreshJobPayload) => Promise<void> {
  return async (payload: StockRefreshJobPayload): Promise<void> => {
    const result = await dependencies.stockRefreshService.refreshStock(
      payload.sourceItemId,
      payload.ticker,
      payload.trigger,
    );

    if (result.status === 'failed') {
      throw new Error(result.errorMessage);
    }
  };
}
