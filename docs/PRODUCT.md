# Stocker Product Overview

## Product Summary

Stocker is a personal, local-first intelligence inbox for morning article reading and stock discovery.

It collects article-like items from configured sources, enriches them with public-company and stock context, and helps the user decide which items are worth opening, reading, and saving for later stock research.

Stocker is not a broker, portfolio tracker, recommendation engine, or full article reader in its first release. Its job is to reduce context switching and surface investable companies the user might otherwise miss.

## Primary User

The initial user is a single person running the app locally or on a homelab.

The user reads many articles and posts in the morning, often from sources like RSS feeds, Reddit, and Flipboard. When an item mentions a company, the user currently leaves the reading flow to look up whether the company is public, how the stock is doing, and whether related companies are relevant.

Stocker should make that first pass faster.

## Core Workflow

1. The user configures sources in a local YAML file.
2. Stocker fetches article-like items from those sources on a schedule and on manual refresh.
3. New items enter a combined inbox.
4. Stocker enriches items in the background.
5. The inbox shows compact company and stock context when enrichment is available.
6. The user opens an item detail page to inspect richer enrichment.
7. The user opens the original source externally when they want to read the full article.
8. The user saves interesting items for stock research.
9. Manual company/ticker corrections become reusable local rules.

## Product Shape

The first product shape is an Intelligence Inbox backed by a reusable local service core.

The web app is the first client. The core ingestion, enrichment, source status, retry, saved research, and correction behavior must not be locked inside the web UI. Future clients, including a CLI and TUI, should be able to call the same service operations.

## Success Metrics

The first release should optimize for two outcomes:

1. The user can process the morning article inbox faster than their current workflow.
2. The user discovers investable public companies they would otherwise miss.

Secondary value comes from reducing context switching and building a better saved research trail over time.

## Product Principles

- Local-first: the app runs for one user without auth or cloud account assumptions.
- Source-agnostic: sources are implemented as plugin-like adapters behind a shared interface.
- Provider-agnostic: LLM and market-data providers are swappable.
- Honest enrichment: LLM output can explain relevance, but ticker identity and market data must be validated before being shown as fact.
- Visible uncertainty: uncertain matches and failed enrichment should be visible, not silently hidden.
- No investment advice: the app surfaces context, not buy/sell/hold recommendations.
