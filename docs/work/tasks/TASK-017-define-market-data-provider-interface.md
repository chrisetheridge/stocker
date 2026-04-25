# TASK-017: Define Market Data Provider Interface

## Status

Done

## Parent

PLAN-004: Market, LLM, and Enrichment

## Goal

Create the provider-agnostic contract and registry for market-data lookups and stock snapshots.

## Scope

- Shared market-data provider types and normalized outputs
- Provider registry lookup and duplicate detection
- Zod validation of provider results before they reach callers
- Package exports and tests

## Out of Scope

- Yahoo Finance provider implementation
- LLM provider work
- Core enrichment and matching services

## Acceptance Criteria

- [x] Callers depend on `MarketDataProvider` rather than a concrete implementation
- [x] Duplicate provider types are rejected by the registry
- [x] Malformed company search results and snapshots fail validation

## Verification

- [x] `pnpm --filter @stocker/market-data test`
- [x] `pnpm --filter @stocker/market-data typecheck`

## Progress Log

- 2026-04-25: Created as the first task in PLAN-004.
- 2026-04-25: Implemented market-data provider contract and registry; package test and typecheck passed.
