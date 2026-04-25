# TASK-012: Define Source Adapter Interface

## Status

Done

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

- [x] Adding a new source requires implementing `SourceAdapter<TConfig>` and registering it
- [x] Registry is tested for duplicate and unknown source behavior

## Verification

- [x] `pnpm --filter @stocker/source-adapters test`
- [x] `pnpm --filter @stocker/source-adapters typecheck`

## Progress Log

- 2026-04-25: Created as the next active task after PLAN-002 completion.
- 2026-04-25: Marked in progress before implementation of the source adapter contract.
- 2026-04-25: Implemented registry and contract; package test and typecheck passed.
