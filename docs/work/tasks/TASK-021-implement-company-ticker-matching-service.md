# TASK-021: Implement Company/Ticker Matching Service

## Status

Done

## Parent

PLAN-004: Market, LLM, and Enrichment

## Goal

Convert LLM company candidates into validated or review-needed item-company records.

## Scope

- Correction-first company matching
- Market-data validation and confidence handling
- Matching tests and shared confidence helpers

## Out of Scope

- LLM provider integration
- Full item enrichment orchestration
- Job-handler wiring

## Acceptance Criteria

- [x] Corrections override LLM hints
- [x] Uncertain matches are surfaced as `needs_review`
- [x] Ticker values are only stored when corrected or provider-validated

## Verification

- [x] `pnpm --filter @stocker/core test`
- [x] `pnpm --filter @stocker/core typecheck`

## Progress Log

- 2026-04-25: Created for PLAN-004 sequencing.
- 2026-04-25: Implemented company/ticker matcher and confidence helper; core test and typecheck passed.
