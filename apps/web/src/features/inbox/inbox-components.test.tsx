import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { EnrichmentStateBadge } from "./enrichment-state-badge";
import { InboxFilters } from "./inbox-filters";
import { InboxItemCard } from "./inbox-item-card";
import { StockChip } from "./stock-chip";
import type { InboxItemRecord } from "@stocker/core";

const sampleItem = {
  item: {
    id: "item-1",
    sourceId: "source-1",
    externalId: "external-1",
    canonicalUrl: "https://example.com/articles/1",
    title: "Acme launches new product",
    summary: "Acme launched a product.",
    author: "Jane Reporter",
    publishedAt: "2026-04-25T12:00:00.000Z",
    fetchedAt: "2026-04-25T12:01:00.000Z",
    sourceMetadata: {},
    readState: "unread",
    savedForResearch: false,
    enrichmentState: "complete",
    createdAt: "2026-04-25T12:01:00.000Z",
    updatedAt: "2026-04-25T12:01:00.000Z",
  },
  source: {
    id: "source-1",
    type: "rss",
    name: "Hacker News",
    enabled: true,
    config: {},
    lastFetchedAt: "2026-04-25T12:01:00.000Z",
    lastSuccessAt: "2026-04-25T12:01:00.000Z",
    lastErrorAt: null,
    lastErrorMessage: null,
    createdAt: "2026-04-25T12:00:00.000Z",
    updatedAt: "2026-04-25T12:01:00.000Z",
  },
  companies: [
    {
      id: "company-1",
      sourceItemId: "item-1",
      companyName: "Acme Corp",
      ticker: "ACME",
      exchange: "NASDAQ",
      relationshipType: "mentioned",
      relevanceExplanation: "The article mentions Acme.",
      confidence: 0.92,
      matchStatus: "validated",
      evidenceText: "Acme launches new product",
      createdAt: "2026-04-25T12:01:00.000Z",
      updatedAt: "2026-04-25T12:01:00.000Z",
    },
  ],
  enrichment: {
    id: "enrichment-1",
    sourceItemId: "item-1",
    state: "complete",
    summary: "Acme is relevant.",
    modelProvider: "openai-compatible",
    modelName: "local-model",
    promptVersion: "2026-04-25",
    completedAt: "2026-04-25T12:02:00.000Z",
    errorMessage: null,
    createdAt: "2026-04-25T12:02:00.000Z",
    updatedAt: "2026-04-25T12:02:00.000Z",
  },
  snapshots: [
    {
      id: "snapshot-1",
      ticker: "ACME",
      exchange: "NASDAQ",
      companyName: "Acme Corp",
      price: 123.45,
      currency: "USD",
      dailyChange: 1.23,
      dailyChangePercent: 1.01,
      marketCap: 1000000,
      sector: "Technology",
      provider: "yahoo-finance2",
      capturedAt: "2026-04-25T12:05:00.000Z",
      staleAfter: "2026-04-25T12:20:00.000Z",
      raw: {},
      createdAt: "2026-04-25T12:05:00.000Z",
    },
  ],
} satisfies InboxItemRecord;

describe("Inbox components", () => {
  it("renders filter controls and visibility states", () => {
    const emptyFilters = {};
    const markup = renderToStaticMarkup(
      React.createElement(InboxFilters, {
        filters: emptyFilters,
        onChange: () => undefined,
        onClear: () => undefined,
      }),
    );

    expect(markup).toContain("Source");
    expect(markup).toContain("Company or ticker");
    expect(markup).toContain("Enrichment");
  });

  it("renders complete and validation states", () => {
    const badgeMarkup = renderToStaticMarkup(
      React.createElement(EnrichmentStateBadge, { state: "complete" }),
    );
    const cardMarkup = renderToStaticMarkup(
      React.createElement(InboxItemCard, {
        item: sampleItem,
        onToggleSaved: () => undefined,
      }),
    );

    expect(badgeMarkup).toContain("Complete");
    expect(cardMarkup).toContain("Hacker News");
    expect(cardMarkup).toContain("Complete");
    expect(cardMarkup).toContain("Acme launches new product");
  });

  it("renders compact stock chips", () => {
    const markup = renderToStaticMarkup(
      React.createElement(StockChip, {
        snapshot: sampleItem.snapshots[0],
        companyName: "Acme Corp",
      }),
    );

    expect(markup).toContain("ACME");
    expect(markup).toContain("$123.45");
  });
});
