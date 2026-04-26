# TASK-026: Implement Inbox and Item Services

## Status

Done

## Parent

PLAN-005: Web API and UI

## Goal

Provide service-level inbox listing and item actions for the web UI and future clients.

## Scope

- Inbox listing service in `@stocker/core`
- Item detail and item action service in `@stocker/core`
- Filter handling for source, company/ticker, read state, saved state, enrichment state, and query

## Out of Scope

- tRPC route definitions
- React component rendering
- Provider or repository schema changes unrelated to service inputs

## Acceptance Criteria

- [ ] Inbox filtering exists at service layer
- [ ] Retry and refresh actions enqueue jobs rather than running provider code directly
- [ ] Saved research state is persisted through service methods

## Verification

- [ ] `pnpm --filter @stocker/core test`
- [ ] `pnpm --filter @stocker/core typecheck`

## Progress Log

- 2026-04-26: Created for PLAN-005 sequencing.
- 2026-04-26: Implemented inbox and item services, including source joins, filter mapping, and queued retry/refresh actions.
