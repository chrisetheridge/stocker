# TASK-010: Implement DB-Backed Job Service

## Status

Done

## Parent

PLAN-002: Data, Config, and Jobs

## Goal

Add application-level job enqueueing, claiming, retry, and completion behavior.

## Scope

- Shared job payload schemas
- Job enqueue and claim behavior
- Retry and terminal failure behavior

## Out of Scope

- Actual source ingestion handlers
- Actual enrichment logic
- Web UI integration

## Acceptance Criteria

- [x] Job payloads are validated before execution
- [x] Worker can claim jobs without web process involvement
- [x] Failed jobs retain error messages
- [x] Retry behavior is deterministic and tested

## Verification

- [x] `pnpm --filter @stocker/core test`
- [x] `pnpm --filter @stocker/core typecheck`

## Progress Log

- 2026-04-25: Implemented the shared job service and payload validation.
