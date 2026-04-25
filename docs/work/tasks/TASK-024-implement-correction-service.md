# TASK-024: Implement Correction Service

## Status

Done

## Parent

PLAN-004: Market, LLM, and Enrichment

## Goal

Provide application operations for listing, applying, and removing global ticker corrections.

## Scope

- Correction service in `@stocker/core`
- Upsert and disable flows through the repository layer
- Tests for duplicate and removable corrections

## Out of Scope

- Matching logic implementation
- LLM provider integration
- UI wiring for correction management

## Acceptance Criteria

- [x] Corrections apply globally
- [x] Corrections are removable by disabling, not deleting
- [x] The matcher can consume enabled corrections

## Verification

- [x] `pnpm --filter @stocker/core test`
- [x] `pnpm --filter @stocker/core typecheck`

## Progress Log

- 2026-04-25: Created for PLAN-004 sequencing.
- 2026-04-25: Implemented correction CRUD service; core test and typecheck passed.
