# TASK-016: Wire Source Refresh Job Handler

## Status

Done

## Parent

PLAN-003: Source Ingestion

## Goal

Connect `source.refresh` jobs to the source refresh service through the shared job handler layer.

## Scope

- Add a reusable `source.refresh` job handler helper in `@stocker/core`
- Route `source.refresh` payloads into the source refresh service
- Wire the worker entrypoint to use the shared handler helper
- Tests for successful and missing-source execution paths

## Files

- Modify: `packages/core/src/jobs/job-handlers.ts`
- Create: `packages/core/src/jobs/source-refresh-handler.test.ts`
- Modify: `apps/worker/src/index.ts`

## Out of Scope

- Source adapter implementations
- Source refresh service implementation
- Other job types

## Acceptance Criteria

- [x] Worker can execute source refresh jobs through job handlers
- [x] Handler uses shared services only
- [x] Missing source IDs produce an actionable error

## Verification

- [x] `pnpm --filter @stocker/core test`
- [x] `pnpm --filter @stocker/core typecheck`
- [x] `pnpm --filter @stocker/worker typecheck`
- [x] `pnpm lint`
- [x] `pnpm typecheck`
- [x] `pnpm test`

## Progress Log

- 2026-04-25: Created as the next task in PLAN-003.
- 2026-04-25: Added the shared source refresh job handler helper and worker wiring.
- 2026-04-25: Verified with package-level and repo-wide lint, typecheck, and test commands.
