# TASK-029: Build Inbox List and Filters

## Status

Done

## Parent

PLAN-005: Web API and UI

## Goal

Implement the combined inbox UI with filters and compact enrichment context.

## Scope

- Inbox list and filter controls in `apps/web`
- Item cards with enrichment state, saved state, and stock chips
- Visible needs-review and failed states

## Out of Scope

- Item detail screen
- Source status screen
- tRPC router definitions

## Acceptance Criteria

- [ ] Combined inbox displays items from all sources
- [ ] Filters call service-backed tRPC procedure
- [ ] Validated stocks appear as compact chips
- [ ] Failed and pending enrichment states are visible
- [ ] Saved state can be toggled from inbox

## Verification

- [ ] `pnpm --filter @stocker/web test`
- [ ] `pnpm --filter @stocker/web typecheck`
- [ ] `pnpm --filter @stocker/web build`

## Progress Log

- 2026-04-26: Created for PLAN-005 sequencing.
- 2026-04-26: Implemented inbox filtering, item cards, enrichment badges, stock chips, and saved-for-research toggles.
