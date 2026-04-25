# TASK-020: Implement AI SDK OpenAI-Compatible LLM Provider

## Status

Done

## Parent

PLAN-004: Market, LLM, and Enrichment

## Goal

Use Vercel AI SDK to call LM Studio or another OpenAI-compatible endpoint for structured enrichment.

## Scope

- OpenAI-compatible provider wiring in `@stocker/llm`
- Structured output generation with AI SDK
- Local smoke path for LM Studio

## Out of Scope

- Prompt/schema design work
- Core item enrichment orchestration
- Market-data provider work

## Acceptance Criteria

- [x] The LLM service returns schema-validated structured output
- [x] Invalid model output fails with a typed validation error
- [x] No code outside `@stocker/llm` calls AI SDK directly

## Verification

- [x] `pnpm --filter @stocker/llm test`
- [x] `pnpm --filter @stocker/llm typecheck`

## Progress Log

- 2026-04-25: Created for PLAN-004 sequencing.
- 2026-04-25: Implemented OpenAI-compatible AI SDK provider and local smoke path; package test and typecheck passed.
