# TASK-028: Build App Shell and Navigation

## Status

Done

## Parent

PLAN-005: Web API and UI

## Goal

Replace the starter UI with the Stocker shell and primary navigation.

## Scope

- Global app shell
- Navigation links for inbox and source status
- Inbox-first root route

## Out of Scope

- Inbox filtering controls
- Item detail screen content
- Source and correction service logic

## Acceptance Criteria

- [ ] App opens directly to inbox
- [ ] No landing page exists
- [ ] Navigation supports inbox, item details, and source status

## Verification

- [ ] `pnpm --filter @stocker/web test`
- [ ] `pnpm --filter @stocker/web typecheck`
- [ ] `pnpm --filter @stocker/web build`

## Progress Log

- 2026-04-26: Created for PLAN-005 sequencing.
- 2026-04-26: Replaced the starter landing page with the Stocker shell, navigation, and inbox-first layout.
