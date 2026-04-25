# TASK-012: Define Source Adapter Interface

## Status

Ready

## Parent

PLAN-003: Source Ingestion

## Goal

Create the plugin-like source adapter base interface and registry for RSS and Reddit sources.

## Scope

- Shared adapter types and fetch context
- Adapter registry lookup and duplicate detection
- Source adapter package exports and tests

## Out of Scope

- RSS/Atom adapter implementation
- Reddit adapter implementation
- Source refresh service and job handlers

## Acceptance Criteria

- [ ] Adding a new source requires implementing `SourceAdapter<TConfig>` and registering it
- [ ] Registry is tested for duplicate and unknown source behavior

## Verification

- [ ] `pnpm --filter @stocker/source-adapters test`
- [ ] `pnpm --filter @stocker/source-adapters typecheck`

## Progress Log

- 2026-04-25: Created as the next active task after PLAN-002 completion.
