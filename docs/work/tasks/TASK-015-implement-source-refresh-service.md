# TASK-015: Implement Source Refresh Service

## Status

Done

## Parent

PLAN-003: Source Ingestion

## Goal

Refresh configured sources, persist normalized items, update source health, and enqueue enrichment jobs for new items.

## Scope

- Source refresh service in `@stocker/core`
- Source scheduling helper for due refresh jobs
- Source health update service
- Tests with fake repositories, fake adapters, and fake job service

## Out of Scope

- RSS/Atom adapter implementation
- Reddit public feed adapter implementation
- Job handler wiring

## Acceptance Criteria

- [x] Manual refresh can refresh one source
- [x] Scheduled refresh can enqueue due source refresh jobs
- [x] Source health records last success and last error
- [x] New items enter the inbox with `enrichment_state = pending`
- [x] New items enqueue enrichment jobs

## Verification

- [x] `pnpm --filter @stocker/core test`
- [x] `pnpm --filter @stocker/core typecheck`

## Progress Log

- 2026-04-25: Created as the next task in PLAN-003.
- 2026-04-25: Implemented source refresh, scheduler, and status services; core test and typecheck passed.
