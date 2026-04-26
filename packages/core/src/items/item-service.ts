import type {
  ItemDetailRecord,
  SourceItemsRepository,
  SourcesRepository,
} from '@stocker/db';

import type { JobService } from '../jobs/job-service';
import type { ItemReadState } from '../domain/enums';

export type ItemDetailViewRecord = ItemDetailRecord & {
  readonly source:
    | Awaited<ReturnType<SourcesRepository['listSourceStatus']>>[number]
    | null;
};

export type SourceEnrichmentRetryResult = {
  readonly sourceId: string;
  readonly itemsFound: number;
  readonly jobsEnqueued: number;
  readonly batchSize: number;
};

const sourceEnrichmentBatchSize = 4;

export type ItemServiceDependencies = {
  readonly sourceItemsRepository: Pick<
    SourceItemsRepository,
    | 'getItemDetail'
    | 'listItemIdsBySourceId'
    | 'markReadState'
    | 'setSavedForResearch'
  >;
  readonly sourcesRepository: Pick<SourcesRepository, 'listSourceStatus'>;
  readonly jobService: Pick<
    JobService,
    'enqueueItemEnrichment' | 'enqueueStockRefresh'
  >;
};

export class ItemService {
  constructor(private readonly dependencies: ItemServiceDependencies) {}

  async getItemDetail(itemId: string): Promise<ItemDetailViewRecord | null> {
    const [detail, sources] = await Promise.all([
      this.dependencies.sourceItemsRepository.getItemDetail(itemId),
      this.dependencies.sourcesRepository.listSourceStatus(),
    ]);

    if (!detail) {
      return null;
    }

    const source =
      sources.find((entry) => entry.id === detail.item.sourceId) ?? null;
    return {
      ...detail,
      source,
    };
  }

  async markReadState(
    itemId: string,
    readState: ItemReadState,
  ): Promise<Awaited<ReturnType<SourceItemsRepository['markReadState']>>> {
    return this.dependencies.sourceItemsRepository.markReadState(
      itemId,
      readState,
    );
  }

  async setSavedForResearch(
    itemId: string,
    saved: boolean,
  ): Promise<
    Awaited<ReturnType<SourceItemsRepository['setSavedForResearch']>>
  > {
    return this.dependencies.sourceItemsRepository.setSavedForResearch(
      itemId,
      saved,
    );
  }

  async retryEnrichment(itemId: string) {
    const detail =
      await this.dependencies.sourceItemsRepository.getItemDetail(itemId);

    if (!detail) {
      throw new Error(`Item not found: ${itemId}`);
    }

    return this.dependencies.jobService.enqueueItemEnrichment(itemId, 'retry');
  }

  async retryEnrichmentForSource(
    sourceId: string,
  ): Promise<SourceEnrichmentRetryResult> {
    const itemIds =
      await this.dependencies.sourceItemsRepository.listItemIdsBySourceId(
        sourceId,
      );

    let jobsEnqueued = 0;
    for (
      let index = 0;
      index < itemIds.length;
      index += sourceEnrichmentBatchSize
    ) {
      const batch = itemIds.slice(index, index + sourceEnrichmentBatchSize);
      const jobs = await Promise.all(
        batch.map((itemId) =>
          this.dependencies.jobService.enqueueItemEnrichment(itemId, 'retry'),
        ),
      );
      jobsEnqueued += jobs.length;
    }

    return {
      sourceId,
      itemsFound: itemIds.length,
      jobsEnqueued,
      batchSize: sourceEnrichmentBatchSize,
    };
  }

  async refreshStockDataForItem(itemId: string) {
    const detail =
      await this.dependencies.sourceItemsRepository.getItemDetail(itemId);

    if (!detail) {
      throw new Error(`Item not found: ${itemId}`);
    }

    const uniqueTickers = new Set(
      detail.companies
        .map((company) => company.ticker)
        .filter((ticker): ticker is string => Boolean(ticker)),
    );

    const jobs = [];
    for (const ticker of uniqueTickers) {
      jobs.push(
        await this.dependencies.jobService.enqueueStockRefresh(
          itemId,
          ticker,
          'manual',
        ),
      );
    }

    return jobs;
  }
}

export function createItemService(
  dependencies: ItemServiceDependencies,
): ItemService {
  return new ItemService(dependencies);
}
