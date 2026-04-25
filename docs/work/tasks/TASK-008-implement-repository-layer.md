# TASK-008: Implement Repository Layer

## Status

Done

## Parent

PLAN-002: Data, Config, and Jobs

## Goal

Provide persistence methods for services without exposing Drizzle query details everywhere.

## Scope

- Source, item, job, enrichment, snapshot, and correction repositories
- Temporary SQLite integration tests for repository behavior
- JSON serialization and typed return values at the repository boundary

## Out of Scope

- Source adapter implementations
- Config parsing
- Worker runtime orchestration

## Acceptance Criteria

- [x] Repositories hide Drizzle table details from `@stocker/core`
- [x] JSON columns round-trip as typed objects
- [x] Inbox filters work for source, ticker/company, read state, saved state, and enrichment state
- [x] Job claiming returns at most one queued runnable job and marks it running

## Verification

- [x] `pnpm --filter @stocker/db test`
- [x] `pnpm --filter @stocker/db typecheck`

## Progress Log

- 2026-04-25: Implemented the repository layer and covered it with SQLite integration tests.
