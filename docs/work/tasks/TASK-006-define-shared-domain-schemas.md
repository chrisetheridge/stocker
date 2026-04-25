# TASK-006: Define Shared Domain Schemas

## Status

Done

## Parent

PLAN-002: Data, Config, and Jobs

## Goal

Define stable Zod-backed domain schemas and enums used across the workspace.

## Scope

- Centralized enums for source, item, enrichment, company, relationship, and job states
- Shared Zod schemas for source items, enrichments, companies, stock snapshots, ticker corrections, and jobs

## Out of Scope

- Database tables and migrations
- Repository implementations
- Config loading and worker orchestration

## Acceptance Criteria

- [x] Domain enum values are centralized
- [x] Zod schemas are exported from `@stocker/core`
- [x] Invalid states such as `processing`, `done`, and `unknown` are rejected

## Verification

- [x] `pnpm --filter @stocker/core test`
- [x] `pnpm --filter @stocker/core typecheck`

## Progress Log

- 2026-04-25: Implemented domain enums and shared Zod schemas in `@stocker/core`.
