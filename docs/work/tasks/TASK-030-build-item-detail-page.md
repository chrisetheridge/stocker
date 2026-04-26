# TASK-030: Build Item Detail Page

## Status

Done

## Parent

PLAN-005: Web API and UI

## Goal

Implement the item detail page with richer enrichment, stock data, uncertainty, retries, refresh, corrections, and external links.

## Scope

- Item detail screen and subcomponents in `apps/web`
- Correction dialog UI
- Safe external-link handling

## Out of Scope

- Inbox filter controls
- Source status page
- Full-text article embedding or extraction

## Acceptance Criteria

- [ ] Item detail page covers every PRD-required field
- [ ] Retry and stock refresh actions call tRPC mutations
- [ ] Correction dialog applies global correction through service layer
- [ ] Page never embeds original article content

## Verification

- [ ] `pnpm --filter @stocker/web test`
- [ ] `pnpm --filter @stocker/web typecheck`
- [ ] `pnpm --filter @stocker/web build`

## Progress Log

- 2026-04-26: Created for PLAN-005 sequencing.
- 2026-04-26: Implemented item detail rendering, company cards, correction dialog, stock snapshot cards, and refresh actions.
