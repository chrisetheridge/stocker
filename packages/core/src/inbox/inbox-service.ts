import type { ItemDetailRecord } from '@stocker/db';
import type {
  SourceRecord,
  SourceItemsRepository,
  SourcesRepository,
} from '@stocker/db';

import type { EnrichmentState, ItemReadState } from '../domain/enums';

export type InboxListFilters = {
  readonly sourceId?: string;
  readonly ticker?: string;
  readonly company?: string;
  readonly readState?: ItemReadState;
  readonly savedForResearch?: boolean;
  readonly enrichmentState?: EnrichmentState;
  readonly query?: string;
  readonly limit?: number;
  readonly offset?: number;
};

export type InboxServiceDependencies = {
  readonly sourceItemsRepository: Pick<SourceItemsRepository, 'listInboxItems'>;
  readonly sourcesRepository: Pick<SourcesRepository, 'listSourceStatus'>;
};

export type InboxItemRecord = ItemDetailRecord & {
  readonly source: SourceRecord | null;
};

function normalizeQuery(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export class InboxService {
  constructor(private readonly dependencies: InboxServiceDependencies) {}

  async listInboxItems(
    filters: InboxListFilters = {},
  ): Promise<InboxItemRecord[]> {
    const [items, sources] = await Promise.all([
      this.dependencies.sourceItemsRepository.listInboxItems({
        sourceId: filters.sourceId,
        ticker: filters.ticker,
        companyName: filters.company,
        readState: filters.readState,
        savedForResearch: filters.savedForResearch,
        enrichmentState: filters.enrichmentState,
        query: normalizeQuery(filters.query),
        limit: filters.limit,
        offset: filters.offset,
      }),
      this.dependencies.sourcesRepository.listSourceStatus(),
    ]);

    const sourceById = new Map<string, SourceRecord>(
      sources.map((source) => [source.id, source]),
    );

    return items.map((item) => ({
      ...item,
      source: sourceById.get(item.item.sourceId) ?? null,
    })) as InboxItemRecord[];
  }
}

export function createInboxService(
  dependencies: InboxServiceDependencies,
): InboxService {
  return new InboxService(dependencies);
}
