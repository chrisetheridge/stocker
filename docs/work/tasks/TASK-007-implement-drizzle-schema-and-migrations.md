# TASK-007: Implement Drizzle Schema and Migrations

## Status

Done

## Parent

PLAN-002: Data, Config, and Jobs

## Goal

Create the SQLite schema, migration config, and schema test for all v1.0 persistent state.

## Scope

- Drizzle table definitions for sources, items, jobs, enrichments, snapshots, and corrections
- SQLite migration generation and migration execution
- Schema integration test for migrated database behavior

## Out of Scope

- Repository methods
- YAML config loading
- Job service execution

## Acceptance Criteria

- [x] All required tables exist
- [x] Duplicate source items are prevented for the same source/external ID
- [x] A migrated empty database can accept and return a source item

## Verification

- [x] `pnpm --filter @stocker/db test`
- [x] `pnpm --filter @stocker/db typecheck`

## Progress Log

- 2026-04-25: Implemented the DB schema, generated migrations, and added schema coverage tests.
