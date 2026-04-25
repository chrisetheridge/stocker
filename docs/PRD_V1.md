# Stocker v1.0 PRD

## Status

Locked product scope for the first shippable release.

This document defines v1.0 only. Later versions are tracked in `docs/FUTURE.md`.

## Goal

Build a local-first web app that ingests configured RSS/Atom and Reddit feed items into a combined inbox, enriches them with company and stock context in the background, and lets the user save interesting items for stock research.

## Non-Goals

v1.0 must not include:

- Buy, sell, or hold recommendations
- Portfolio tracking
- Alerts or notifications
- Historical price tracking
- Full-text article extraction
- Embedded article reading
- CLI or TUI client
- Multi-user support or authentication
- User-facing plugin marketplace

## Target User

One local user running the app on a personal machine or homelab.

## Required Product Capabilities

### Combined Inbox

The app must show a single inbox containing items from all configured sources.

The inbox must support filters for:

- Source
- Company or ticker
- Read state
- Saved state
- Enrichment state

Inbox items should show compact enrichment when available, including detected companies and stock chips.

### Item Detail Page

Each inbox item must have a detail page that shows:

- Title
- Source
- Link to original item
- Source summary, snippet, post text, or metadata available from the source
- Enrichment status
- Detected companies
- Related public companies, including competitors, customers, or suppliers when detected
- Short explanation of why each stock is relevant
- Stock data when available
- Needs-review state for uncertain matches
- Retry action when enrichment failed
- Save-for-stock-research action

The original article or post must open externally. v1.0 does not embed or extract full article text.

### Saved Research

The user must be able to save an item because it is interesting for stock research.

Saved state must be filterable in the inbox.

Saved items are not portfolio holdings and do not imply an investment decision.

### Source Configuration

Sources are configured through a local YAML file.

v1.0 must support:

- RSS/Atom sources
- Reddit public feed-style sources

Flipboard is not required in v1.0.

### Source Adapter Model

Sources must use a plugin-like adapter model.

Each source type must implement a shared base interface or base class for:

- Validating its YAML config
- Fetching source items
- Normalizing source-specific records into the shared inbox item model
- Reporting source health and errors

Adding a new source should mean creating one new adapter and one YAML config shape without changing inbox, enrichment, market data, saved research, or correction logic.

This is an internal developer extension model, not a user-facing marketplace.

### Fetching

Source fetching must support:

- Scheduled background fetching
- Manual refresh
- Source health/error reporting

v1.0 should keep scheduling simple and local.

### Background Enrichment

Fetched items must be enriched in the background.

The inbox may show pending states while enrichment is running.

Supported enrichment states:

- Pending
- Complete
- Needs review
- Failed

Failed enrichment must keep the item visible and provide a retry action.

### LLM Enrichment

v1.0 must use an LLM for interpretive enrichment.

The LLM is responsible for:

- Extracting company mentions from item metadata, title, summary, snippet, post text, and available source content
- Identifying related public companies when the source evidence supports it
- Classifying relationships such as competitor, customer, or supplier
- Producing a short explanation of why each stock is relevant

The LLM must not be trusted as the source of truth for ticker symbols, stock prices, market cap, sector, or other live market facts.

LLM providers must be pluggable. Local LLM providers are preferred for v1.0.

The YAML config must select provider and model. It may also override prompts.

LLM outputs must be schema-validated before persistence.

### Market Data

Market data providers must be pluggable.

v1.0 stock context must include:

- Ticker
- Current price
- Daily change
- Market cap
- Sector

The market universe must be configurable and default to US-listed equities.

When market data fails:

- If a cached stock snapshot exists, show it with a stale indicator.
- If no cached stock snapshot exists, show validated company context without price data.

### Company/Ticker Matching

Company/ticker identity must be validated against market-data or company-reference data before being displayed as factual stock data.

Uncertain matches must appear in a needs-review state rather than being hidden or silently accepted.

Inline or compact stock chips should be reserved for higher-confidence matches. Lower-confidence matches should remain visible in the detail page or enrichment panel.

### Manual Corrections

The user must be able to manually correct a company/ticker match.

Corrections apply globally by default and must be removable.

The matching pipeline must consult corrections before relying on LLM or provider guesses.

### Stock Data Freshness

Stock data should be captured when an item is enriched.

Stock data should refresh when the item is opened.

The UI must provide a manual refresh fallback for stock data.

No periodic in-page polling is required in v1.0.

### Local Persistence

v1.0 must persist locally:

- Source configs or parsed source config state
- Fetched item metadata
- Extracted source summary/snippet/post text when available
- Enrichment results
- Stock snapshots
- Read/unread state
- Saved-for-research state
- Manual correction rules
- Source and enrichment errors needed for retry/status display

## UX Requirements

The web app must be the primary v1.0 interface.

The app should open directly into the combined inbox.

The user should be able to:

- See which items are enriched, pending, failed, or need review
- Filter the inbox quickly
- Open item details
- Open the original article or post externally
- Save an item for stock research
- Retry failed enrichment
- Correct company/ticker matches
- See source health/status

## Service Core Requirement

The reusable local service core is a hard v1.0 requirement.

The web app must call service-level operations rather than owning ingestion or enrichment behavior directly.

Expected service operations include:

- Refresh sources
- List inbox items with filters
- Get item details
- Retry enrichment
- Save or unsave an item for research
- Apply and remove ticker corrections
- List source status
- Refresh stock data for an item

This enables future CLI, TUI, and automation clients to reuse the same behavior.

## v1.0 Acceptance Criteria

v1.0 is acceptable when:

- A YAML config can define RSS/Atom and Reddit public feed-style sources.
- Scheduled and manual fetching populate a combined inbox.
- Items are enriched in the background.
- The inbox shows enrichment states and compact company/stock context.
- The detail page shows richer enrichment, stock data, uncertainty, and external links.
- Failed enrichment remains visible and can be retried.
- Market data failures degrade to stale snapshots or company-only context.
- Items can be saved for stock research.
- Company/ticker corrections apply globally and can be removed.
- The web UI uses reusable service operations rather than embedding source/enrichment logic directly.

