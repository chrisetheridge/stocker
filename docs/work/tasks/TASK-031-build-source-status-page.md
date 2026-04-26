# TASK-031: Build Source Status Page

## Status

Done

## Parent

PLAN-005: Web API and UI

## Goal

Show configured source status and provide manual refresh actions.

## Scope

- Source status screen and cards in `apps/web`
- Manual refresh actions for one source and all enabled sources

## Out of Scope

- Inbox filters
- Item detail rendering
- Source refresh service implementation

## Acceptance Criteria

- [ ] User can see active source health
- [ ] User can manually refresh one source
- [ ] User can manually refresh all enabled sources

## Verification

- [ ] `pnpm --filter @stocker/web test`
- [ ] `pnpm --filter @stocker/web typecheck`
- [ ] `pnpm --filter @stocker/web build`

## Progress Log

- 2026-04-26: Created for PLAN-005 sequencing.
- 2026-04-26: Implemented source status list, source cards, and manual refresh actions.
