# TASK-022: Implement Item Enrichment Service

## Status

Done

## Parent

PLAN-004: Market, LLM, and Enrichment

## Goal

Enrich one source item by calling the LLM provider, matching companies, and persisting the resulting enrichment state.

## Scope

- Enrichment orchestration service in `@stocker/core`
- Run tracking, item-company persistence, and stock snapshot persistence
- Failure handling and review-state persistence

## Out of Scope

- Job-handler wiring
- Manual correction UI
- Market-data provider implementation

## Acceptance Criteria

- [x] Enrichment failures leave the item visible
- [x] Needs-review results are persisted
- [x] Cached snapshots can be shown when live market data fails

## Verification

- [x] `pnpm --filter @stocker/core test`
- [x] `pnpm --filter @stocker/core typecheck`

## Progress Log

- 2026-04-25: Created for PLAN-004 sequencing.
- 2026-04-25: Implemented item enrichment orchestration with enrichment runs, matching, snapshot persistence, and fallback behavior; core test and typecheck passed.
