import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SourceStatusCard } from "./source-status-card";

describe("Source status components", () => {
  it("renders healthy source details", () => {
    const source = {
      id: "source-1",
      type: "rss",
      name: "Hacker News",
      enabled: true,
      config: {},
      lastFetchedAt: "2026-04-25T12:00:00.000Z",
      lastSuccessAt: "2026-04-25T12:00:00.000Z",
      lastErrorAt: null,
      lastErrorMessage: null,
      createdAt: "2026-04-25T12:00:00.000Z",
      updatedAt: "2026-04-25T12:00:00.000Z",
    };
    const markup = renderToStaticMarkup(
      React.createElement(SourceStatusCard, {
        source,
        onRefresh: () => undefined,
        onRetryEnrichment: () => undefined,
      }),
    );

    expect(markup).toContain("Hacker News");
    expect(markup).toContain("Healthy");
    expect(markup).toContain("Refresh source");
    expect(markup).toContain("Retry all enrichment");
  });

  it("renders failed source details", () => {
    const source = {
      id: "source-1",
      type: "reddit",
      name: "Reddit Stocks",
      enabled: false,
      config: {},
      lastFetchedAt: "2026-04-25T12:00:00.000Z",
      lastSuccessAt: null,
      lastErrorAt: "2026-04-25T12:10:00.000Z",
      lastErrorMessage: "timeout",
      createdAt: "2026-04-25T12:00:00.000Z",
      updatedAt: "2026-04-25T12:00:00.000Z",
    };
    const markup = renderToStaticMarkup(
      React.createElement(SourceStatusCard, {
        source,
        onRefresh: () => undefined,
        onRetryEnrichment: () => undefined,
      }),
    );

    expect(markup).toContain("timeout");
    expect(markup).toContain("Disabled");
    expect(markup).toContain("Error");
  });
});
