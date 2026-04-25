# EPIC-001: v1 Intelligence Inbox

## Status

Proposed

## Product References

- `docs/PRODUCT.md`
- `docs/PRD_V1.md`
- `docs/FUTURE.md`

## Goal

Build the first shippable version of Stocker: a local-first web app that ingests configured RSS/Atom and Reddit public feed-style items into a combined inbox, enriches them with company and stock context, and lets the user save interesting items for stock research.

## User Outcomes

- The user can process their morning article inbox faster than their current workflow.
- The user discovers investable public companies they would otherwise miss.
- The user reduces context switching between source articles/posts and stock lookup tools.
- The user can preserve interesting items as a lightweight stock-research trail.

## Scope

This epic includes:

- A web-first intelligence inbox
- A reusable local service core for future CLI, TUI, and automation clients
- YAML-based local configuration
- Plugin-like source adapter model
- RSS/Atom source support
- Reddit public feed-style source support
- Scheduled and manual source fetching
- Background enrichment with visible states
- Pluggable local-first LLM provider support
- Prompt override support through config
- Pluggable market data provider support
- Company/ticker extraction and validation
- Related public company detection for competitors, customers, and suppliers
- Relevance explanations for detected stocks
- Stock context: ticker, price, daily change, market cap, and sector
- Needs-review handling for uncertain matches
- Graceful degradation for market-data failures
- Saved-for-stock-research state
- Global removable company/ticker correction rules
- Source health and enrichment error visibility

## Out of Scope

This epic excludes:

- Buy, sell, or hold recommendations
- Portfolio tracking
- Alerts or notifications
- Historical price tracking
- Full-text article extraction
- Embedded article reading
- CLI or TUI client
- Multi-user support or authentication
- User-facing plugin marketplace
- Flipboard integration
- Reddit comment summaries
- Discovered ticker watchlist

## Success Criteria

This epic is complete when the v1.0 acceptance criteria in `docs/PRD_V1.md` are met.

At minimum:

- RSS/Atom and Reddit public feed-style sources can be configured in YAML.
- Manual and scheduled source fetching populate a combined inbox.
- New items are enriched in the background.
- The inbox shows enrichment status and compact company/stock context.
- Item details show richer enrichment, stock data, uncertainty, and external source links.
- Failed enrichment remains visible and can be retried.
- Market-data failures show stale snapshots or company-only context where appropriate.
- Items can be saved for stock research.
- Company/ticker corrections apply globally and can be removed.
- The web app uses reusable service operations rather than owning ingestion or enrichment logic directly.

## Planned Follow-On Work

Follow-on ideas are tracked in `docs/FUTURE.md`.

The most likely next versions are:

- v1.1: discovered watchlist and Reddit discussion summaries
- v1.2: CLI and TUI over the reusable service core

These are not part of this epic unless explicitly promoted later.

## Linked Plans

No implementation plans have been created yet.

## Linked Tasks

No implementation tasks have been created yet.

## Open Questions

- Tech stack has not been selected.
- Database and persistence strategy have not been selected.
- LLM provider abstraction details have not been designed.
- Market data provider abstraction details have not been designed.
- Source adapter contract details have not been designed.

