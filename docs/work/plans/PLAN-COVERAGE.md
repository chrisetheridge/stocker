# v1 PRD Coverage Matrix

This file maps `docs/PRD_V1.md` requirements to implementation plans and task IDs.

## Combined Inbox

Requirement: single inbox containing items from all configured sources.

Covered by:

- TASK-008: Repository inbox filters
- TASK-026: Inbox service
- TASK-027: tRPC inbox router
- TASK-029: Inbox list and filters

## Inbox Filters

Requirement: filter by source, company/ticker, read state, saved state, and enrichment state.

Covered by:

- TASK-008: `listInboxItems(filters)`
- TASK-026: service filter inputs
- TASK-029: UI filter controls

## Item Detail Page

Requirement: title, source, external link, metadata, enrichment, detected companies, related companies, explanations, stock data, needs-review state, retry, and save action.

Covered by:

- TASK-026: item service
- TASK-027: item router
- TASK-030: item detail page
- TASK-032: empty/loading/error states

## Saved Research

Requirement: save item because it is interesting for stock research.

Covered by:

- TASK-007: `saved_for_research` column
- TASK-008: repository setter and filters
- TASK-026: item service
- TASK-029: inbox saved toggle
- TASK-030: detail saved action

## Source Configuration

Requirement: YAML config for RSS/Atom and Reddit public feed-style sources.

Covered by:

- TASK-009: YAML config loader
- TASK-013: RSS adapter config
- TASK-014: Reddit adapter config
- TASK-033: configuration docs

## Source Adapter Model

Requirement: plugin-like source adapter model.

Covered by:

- TASK-012: source adapter interface and registry
- TASK-013: RSS implementation
- TASK-014: Reddit implementation
- TASK-015: refresh service consumes adapters by registry

## Fetching

Requirement: scheduled background fetching, manual refresh, source health/error reporting.

Covered by:

- TASK-010: DB-backed job service
- TASK-015: source refresh service and scheduler
- TASK-016: source refresh job handler
- TASK-027: source refresh tRPC procedures
- TASK-031: source status page

## Background Enrichment

Requirement: enrichment runs in background with pending, complete, needs-review, and failed states.

Covered by:

- TASK-007: enrichment state schema
- TASK-010: job service
- TASK-022: item enrichment service
- TASK-023: enrichment job handler
- TASK-029: inbox state badges
- TASK-030: detail enrichment states

## LLM Enrichment

Requirement: LLM extracts companies, relationships, and relevance explanations; output is schema-validated.

Covered by:

- TASK-019: LLM output schema and prompt template
- TASK-020: AI SDK OpenAI-compatible provider
- TASK-022: item enrichment service

## Market Data

Requirement: provider abstraction with ticker, price, daily change, market cap, sector, stale fallback.

Covered by:

- TASK-017: market-data provider interface
- TASK-018: Yahoo provider adapter
- TASK-022: enrichment snapshot persistence and fallback
- TASK-023: stock refresh handler
- TASK-030: stock snapshot cards

## Company/Ticker Matching

Requirement: validate company/ticker identity and surface uncertain matches.

Covered by:

- TASK-021: company/ticker matching service
- TASK-022: enrichment state persistence
- TASK-029: needs-review inbox indicator
- TASK-030: needs-review detail cards

## Manual Corrections

Requirement: global removable company/ticker corrections.

Covered by:

- TASK-007: `ticker_corrections` table
- TASK-008: corrections repository
- TASK-021: matcher checks corrections first
- TASK-024: correction service
- TASK-027: corrections router
- TASK-030: correction dialog

## Stock Data Freshness

Requirement: capture snapshot on enrichment, refresh on item open, manual refresh fallback.

Covered by:

- TASK-022: enrichment snapshot capture
- TASK-023: stock refresh service and job handler
- TASK-026: `refreshStockDataForItem`
- TASK-030: manual stock refresh action

## Local Persistence

Requirement: persist sources, items, summaries/snippets, enrichment, stock snapshots, read/saved state, corrections, errors.

Covered by:

- TASK-007: database schema
- TASK-008: repositories
- TASK-015: source refresh persistence
- TASK-022: enrichment persistence
- TASK-024: corrections persistence

## UX Requirements

Requirement: web app opens to inbox, supports source status, retry, save, correction, and external links.

Covered by:

- TASK-028: app shell and navigation
- TASK-029: inbox UI
- TASK-030: detail UI
- TASK-031: source status UI
- TASK-032: empty/loading/error states

## Service Core Requirement

Requirement: web app uses reusable service operations rather than embedding ingestion or enrichment logic.

Covered by:

- TASK-025: application service facade
- TASK-026: inbox and item services
- TASK-027: thin tRPC routers
- TASK-011: worker runtime uses job service

## v1 Acceptance Verification

Requirement: verify all PRD acceptance criteria.

Covered by:

- TASK-033: local development docs
- TASK-034: seed data
- TASK-035: v1 acceptance checklist and verification script
- TASK-036: worker/job recovery verification
- TASK-037: scope guardrail verification
- TASK-038: completion notes

