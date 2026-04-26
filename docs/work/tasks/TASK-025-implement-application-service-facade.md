# TASK-025: Implement Application Service Facade

## Status

Done

## Parent

PLAN-005: Web API and UI

## Goal

Create a single application service boundary used by the web app, worker, and future clients.

## Scope

- Application service assembly in `@stocker/core`
- Centralized construction for inbox, item, source refresh, source status, job, enrichment, stock refresh, and correction services
- Shared dependency wiring for repositories and provider registries

## Out of Scope

- UI routing and page rendering
- Repositories, adapters, and provider implementations
- CLI or TUI clients

## Acceptance Criteria

- [ ] Web and worker can import the same service facade
- [ ] Service construction is centralized in one place
- [ ] Construction accepts config, repositories, adapter registry, market provider registry, LLM provider, and logger

## Verification

- [ ] `pnpm --filter @stocker/core test`
- [ ] `pnpm --filter @stocker/core typecheck`

## Progress Log

- 2026-04-26: Created for PLAN-005 sequencing.
- 2026-04-26: Active plan moved from PLAN-004 to PLAN-005 after verifying the completed market, LLM, and enrichment work.
- 2026-04-26: Implemented shared app service facade; core test, core typecheck, web test, web typecheck, web build, and worker typecheck passed.
