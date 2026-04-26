import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { CompanyCard } from "./company-card";
import { ItemDetailView } from "./item-detail-screen";
import { StockSnapshotCard } from "./stock-snapshot-card";
import type { ItemDetailViewRecord } from "@stocker/core";

const detail = {
  item: {
    id: "item-1",
    sourceId: "source-1",
    externalId: "external-1",
    canonicalUrl: "https://example.com/articles/1",
    title: "Acme launch",
    summary: "Acme launched a product.",
    author: "Jane Reporter",
    publishedAt: "2026-04-25T12:00:00.000Z",
    fetchedAt: "2026-04-25T12:01:00.000Z",
    sourceMetadata: { feedTitle: "Hacker News" },
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
      relevanceExplanation: "The item mentions Acme.",
      confidence: 0.93,
      matchStatus: "validated",
      evidenceText: "Acme launch",
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
} satisfies ItemDetailViewRecord;

describe("Item detail components", () => {
  it("renders a complete enriched item view", () => {
    const markup = renderToStaticMarkup(
      React.createElement(ItemDetailView, {
        detail,
        onToggleSaved: () => undefined,
        onRetryEnrichment: () => undefined,
        onRefreshStock: () => undefined,
        onApplyCorrection: () => undefined,
      }),
    );

    expect(markup).toContain("Acme launch");
    expect(markup).toContain("Hacker News");
    expect(markup).toContain("Detected companies");
    expect(markup).toContain("ACME");
    expect(markup).toContain("Open original");
  });

  it("renders failed enrichment copy with retry affordance", () => {
    const markup = renderToStaticMarkup(
      React.createElement(ItemDetailView, {
        detail: {
          ...detail,
          item: { ...detail.item, enrichmentState: "failed" },
          enrichment: {
            ...detail.enrichment,
            state: "failed",
            errorMessage: "LLM output validation failed",
          },
        },
        onToggleSaved: () => undefined,
        onRetryEnrichment: () => undefined,
        onRefreshStock: () => undefined,
        onApplyCorrection: () => undefined,
      }),
    );

    expect(markup).toContain("LLM output validation failed");
    expect(markup).toContain("Retry enrichment");
  });

  it("renders complete state for previously review-needed items", () => {
    const markup = renderToStaticMarkup(
      React.createElement(ItemDetailView, {
        detail: {
          ...detail,
          item: { ...detail.item, enrichmentState: "complete" },
          enrichment: {
            ...detail.enrichment,
            state: "complete",
          },
        },
        onToggleSaved: () => undefined,
        onRetryEnrichment: () => undefined,
        onRefreshStock: () => undefined,
        onApplyCorrection: () => undefined,
      }),
    );

    expect(markup).toContain("complete");
  });

  it("renders needs-review company cards and stale snapshots", () => {
    const company = detail.companies[0]!;
    const snapshot = detail.snapshots[0]!;
    const validatedCompany = {
      ...company,
      matchStatus: "validated",
    };
    const staleSnapshot = {
      ...snapshot,
      staleAfter: "2020-01-01T00:00:00.000Z",
    };
    const markup = renderToStaticMarkup(
      React.createElement(
        "div",
        null,
        React.createElement(CompanyCard, {
          company: validatedCompany,
          snapshot,
          onApplyCorrection: () => undefined,
        }),
        React.createElement(StockSnapshotCard, { snapshot: staleSnapshot }),
      ),
    );

    expect(markup).toContain("Validated");
    expect(markup).toContain("Stale cache");
  });
});
