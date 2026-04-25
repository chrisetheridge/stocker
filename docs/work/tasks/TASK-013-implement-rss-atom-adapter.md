# TASK-013: Implement RSS/Atom Adapter

## Status

Done

## Parent

PLAN-003: Source Ingestion

## Goal

Fetch RSS and Atom feeds, normalize feed entries into shared source items, and expose adapter-specific config validation.

## Scope

- RSS adapter config schema and normalization helpers
- RSS/Atom fetch implementation using injected `fetch`
- Fixture-backed adapter tests for RSS and Atom feeds
- Package exports for the RSS adapter

## Out of Scope

- Reddit public feed adapter
- Source refresh orchestration
- Job handler wiring

## Acceptance Criteria

- [x] RSS and Atom fixture feeds normalize into `NormalizedSourceItemInput`
- [x] Invalid item records do not crash the whole feed
- [x] Feed-level failures are surfaced with the feed URL in the error

## Verification

- [x] `pnpm --filter @stocker/source-adapters test`
- [x] `pnpm --filter @stocker/source-adapters typecheck`

## Progress Log

- 2026-04-25: Created as the next task in PLAN-003.
- 2026-04-25: Implemented RSS and Atom normalization; package test and typecheck passed.
