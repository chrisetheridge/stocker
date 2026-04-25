import type {
  ItemEnrichJobPayload,
  SourceRefreshJobPayload,
  StockRefreshJobPayload,
} from "./job-payloads";

export type JobHandlers = {
  readonly sourceRefresh: (payload: SourceRefreshJobPayload) => Promise<void>;
  readonly itemEnrich: (payload: ItemEnrichJobPayload) => Promise<void>;
  readonly stockRefresh: (payload: StockRefreshJobPayload) => Promise<void>;
};

export function createJobHandlers(handlers: JobHandlers): JobHandlers {
  return handlers;
}
