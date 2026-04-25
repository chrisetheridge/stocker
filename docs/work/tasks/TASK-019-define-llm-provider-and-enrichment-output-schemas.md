# TASK-019: Define LLM Provider and Enrichment Output Schemas

## Status

Done

## Parent

PLAN-004: Market, LLM, and Enrichment

## Goal

Define the shared LLM/enrichment contract before integrating the AI SDK.

## Scope

- LLM output schema for company extraction
- Prompt builder for item enrichment
- Package exports and schema tests

## Out of Scope

- AI SDK provider integration
- Core matching and enrichment orchestration
- Market-data provider work

## Acceptance Criteria

- [x] Structured enrichment output is centralized in one schema
- [x] Prompt text forbids buy/sell/hold recommendations
- [x] Invalid output shapes fail validation

## Verification

- [x] `pnpm --filter @stocker/llm test`
- [x] `pnpm --filter @stocker/llm typecheck`

## Progress Log

- 2026-04-25: Created for PLAN-004 sequencing.
- 2026-04-25: Implemented enrichment schema and prompt template; package test and typecheck passed.
