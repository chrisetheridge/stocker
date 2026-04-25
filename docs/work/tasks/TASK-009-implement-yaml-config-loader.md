# TASK-009: Implement YAML Config Loader

## Status

Done

## Parent

PLAN-002: Data, Config, and Jobs

## Goal

Load and validate local YAML configuration for sources, market settings, LLM settings, and defaults.

## Scope

- Zod schema for the Stocker config file
- YAML parsing with environment-based path resolution
- Example config file and config tests

## Out of Scope

- Database migrations
- Repository logic
- Worker runtime behavior

## Acceptance Criteria

- [x] Config validation fails with actionable error messages
- [x] Example config validates
- [x] Config package has no dependency on web or worker packages

## Verification

- [x] `pnpm --filter @stocker/config test`
- [x] `pnpm --filter @stocker/config typecheck`

## Progress Log

- 2026-04-25: Implemented the config schema, loader, example config, and tests.
