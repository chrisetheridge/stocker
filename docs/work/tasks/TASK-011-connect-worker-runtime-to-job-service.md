# TASK-011: Connect Worker Runtime to Job Service

## Status

Done

## Parent

PLAN-002: Data, Config, and Jobs

## Goal

Make the worker process claim and execute DB-backed jobs through shared services.

## Scope

- Worker runtime orchestration
- Worker entrypoint signal handling
- Runtime tests with fakes

## Out of Scope

- Source ingestion adapters
- Enrichment logic
- Web transport or UI code

## Acceptance Criteria

- [x] Worker can run one job for deterministic tests
- [x] Worker loop is separate from job execution logic
- [x] Worker does not import web code

## Verification

- [x] `pnpm --filter @stocker/worker test`
- [x] `pnpm --filter @stocker/worker typecheck`

## Progress Log

- 2026-04-25: Wired the worker runtime to the shared job service and database.
