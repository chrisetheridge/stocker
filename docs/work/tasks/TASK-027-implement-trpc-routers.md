# TASK-027: Implement tRPC Routers

## Status

Done

## Parent

PLAN-005: Web API and UI

## Goal

Expose the web API as thin tRPC routers over the shared application services.

## Scope

- Inbox, item, source, and correction routers in `apps/web`
- Runtime input validation at the router boundary
- Web server context wiring to the shared application service facade

## Out of Scope

- UI layout and feature screens
- Repository access directly from router code
- Business logic beyond input validation and service delegation

## Acceptance Criteria

- [ ] tRPC routers are thin
- [ ] All web actions required by the PRD are exposed
- [ ] Router inputs are runtime-validated with Zod

## Verification

- [ ] `pnpm --filter @stocker/web test`
- [ ] `pnpm --filter @stocker/web typecheck`

## Progress Log

- 2026-04-26: Created for PLAN-005 sequencing.
- 2026-04-26: Implemented inbox, item, source, and correction routers with Zod validation and delegation to shared services.
