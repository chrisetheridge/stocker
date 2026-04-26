import type { AppServices } from "@stocker/core";
import { describe, expect, it, vi } from "vitest";

import { createCaller } from "../root";

describe("router contract", () => {
  it("delegates inbox and item actions to services", async () => {
    const listInboxItems = vi.fn().mockResolvedValue([]);
    const getItemDetail = vi.fn().mockResolvedValue(null);
    const markReadState = vi.fn().mockResolvedValue(null);
    const setSavedForResearch = vi.fn().mockResolvedValue(null);
    const retryEnrichment = vi.fn().mockResolvedValue({ id: "job-1" });
    const refreshStockDataForItem = vi.fn().mockResolvedValue([]);
    const listSourceStatus = vi.fn().mockResolvedValue([]);
    const refreshSource = vi.fn().mockResolvedValue({ status: "succeeded" });
    const refreshAllEnabledSources = vi.fn().mockResolvedValue([]);
    const listCorrections = vi.fn().mockResolvedValue([]);
    const applyTickerCorrection = vi
      .fn()
      .mockResolvedValue({ id: "correction-1" });
    const removeTickerCorrection = vi.fn().mockResolvedValue(null);
    const jobService = {
      enqueueSourceRefresh: vi.fn(),
      enqueueItemEnrichment: vi.fn(),
      enqueueStockRefresh: vi.fn(),
      claimAndRunNextJob: vi.fn(),
    };
    const services = {
      inboxService: {
        listInboxItems,
      },
      itemService: {
        getItemDetail,
        markReadState,
        setSavedForResearch,
        retryEnrichment,
        refreshStockDataForItem,
      },
      sourceRefreshService: {
        listSourceStatus,
        refreshSource,
        refreshAllEnabledSources,
      },
      sourceStatusService: {
        listSourceStatus,
      },
      jobService,
      itemEnrichmentService: {
        enrichItem: vi.fn(),
      },
      stockRefreshService: {
        refreshStock: vi.fn(),
      },
      correctionService: {
        listCorrections,
        applyTickerCorrection,
        removeTickerCorrection,
      },
      marketDataProvider: {
        type: "yahoo-finance2",
        searchCompanies: vi.fn().mockResolvedValue([]),
        getSnapshot: vi.fn().mockResolvedValue(null),
      },
    } as unknown as AppServices;

    const caller = createCaller(async () => ({
      headers: new Headers(),
      db: {} as never,
      services,
    }));

    await caller.inbox.list({ query: "acme" });
    await caller.items.detail({ itemId: "item-1" });
    await caller.items.markRead({ itemId: "item-1", readState: "read" });
    await caller.items.saveForResearch({ itemId: "item-1", saved: true });
    await caller.items.retryEnrichment({ itemId: "item-1" });
    await caller.items.refreshStockData({ itemId: "item-1" });
    await caller.sources.status();
    await caller.sources.refresh({ sourceId: "source-1" });
    await caller.sources.refreshAll();
    await caller.corrections.list();
    await caller.corrections.applyCorrection({
      companyName: "Acme",
      ticker: "ACME",
    });
    await caller.corrections.remove({ correctionId: "correction-1" });

    expect(listInboxItems).toHaveBeenCalledWith({
      query: "acme",
    });
    expect(retryEnrichment).toHaveBeenCalledWith("item-1");
    expect(refreshSource).toHaveBeenCalledWith(
      "source-1",
      "manual",
    );
    expect(applyTickerCorrection).toHaveBeenCalledWith(
      "Acme",
      "ACME",
      undefined,
      undefined,
    );
  });
});
