# TASK-014: Implement Reddit Public Feed Adapter

## Status

Done

## Parent

PLAN-003: Source Ingestion

## Goal

Fetch Reddit public RSS-style feeds and normalize link and text posts into shared source items.

## Scope

- Reddit adapter config schema and normalization helpers
- Reddit public feed fetch implementation with a suitable user-agent header
- Fixture-backed adapter tests for link and text posts
- Package exports for the Reddit adapter

## Out of Scope

- RSS/Atom adapter implementation
- Reddit comment summaries
- Source refresh orchestration

## Acceptance Criteria

- [x] Link posts and text posts are both supported
- [x] Missing title or link skips the item and produces a warning
- [x] Reddit-specific metadata is normalized without fetching comments

## Verification

- [x] `pnpm --filter @stocker/source-adapters test`
- [x] `pnpm --filter @stocker/source-adapters typecheck`

## Progress Log

- 2026-04-25: Created as the next task in PLAN-003.
- 2026-04-25: Implemented Reddit public feed adapter; package test and typecheck passed.
