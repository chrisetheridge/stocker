# TASK-023: Wire Enrichment and Stock Refresh Job Handlers

## Status

Done

## Parent

PLAN-004: Market, LLM, and Enrichment

## Goal

Connect `item.enrich` and `stock.refresh` jobs to shared enrichment and market-data services.

## Scope

- Job-handler wiring for enrichment and stock refresh
- Shared stock refresh service
- Tests for success, failure, and retry behavior

## Out of Scope

- LLM prompt/schema design
- Company matching implementation
- Manual correction service

## Acceptance Criteria

- [x] Worker can execute enrichment jobs
- [x] Worker can execute stock refresh jobs
- [x] Retry behavior still comes from the shared job service

## Verification

- [x] `pnpm --filter @stocker/core test`
- [x] `pnpm --filter @stocker/core typecheck`

## Progress Log

- 2026-04-25: Created for PLAN-004 sequencing.
- 2026-04-25: Added enrichment and stock refresh job handlers plus stock refresh service; core test and typecheck passed.
