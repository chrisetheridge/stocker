# TASK-032: Add Empty, Loading, and Error States

## Status

Done

## Parent

PLAN-005: Web API and UI

## Goal

Make the web UI usable when there is no data, pending enrichment, or service errors.

## Scope

- Shared empty, loading, and error state components
- State handling across inbox, item detail, and source status screens

## Out of Scope

- Data fetching logic
- Router wiring
- New product behavior beyond explicit state presentation

## Acceptance Criteria

- [ ] Empty and error states are explicit
- [ ] Failed enrichment remains actionable
- [ ] Users can recover from filters that hide all items

## Verification

- [ ] `pnpm --filter @stocker/web test`
- [ ] `pnpm --filter @stocker/web typecheck`
- [ ] `pnpm --filter @stocker/web build`

## Progress Log

- 2026-04-26: Created for PLAN-005 sequencing.
- 2026-04-26: Added shared empty, loading, and error states across inbox, item detail, and source status screens.
