# Work System

This directory contains the implementation work plan for Stocker.

Agents must read `AGENTS.md` first, then this directory.

## Current Entry Point

Start with `docs/work/CURRENT.md`.

That file identifies the active epic, active plan, and active task.

## Work Order

The v1.0 implementation is split into dependency-ordered plans:

1. `plans/PLAN-000-v1-master-work-plan.md`
2. `plans/PLAN-COVERAGE.md`
3. `plans/PLAN-001-project-foundation.md`
4. `plans/PLAN-002-data-config-and-jobs.md`
5. `plans/PLAN-003-source-ingestion.md`
6. `plans/PLAN-004-market-llm-and-enrichment.md`
7. `plans/PLAN-005-web-api-and-ui.md`
8. `plans/PLAN-006-v1-verification-and-release.md`

Agents should execute plans in order unless the user explicitly changes the active plan.

## Implementation Rules

- Work only on the active task unless instructed otherwise.
- Keep the reusable service core separate from web and worker entrypoints.
- Keep tRPC routers thin.
- Keep source adapters plugin-like.
- Validate external inputs and LLM outputs with Zod.
- Add unit tests for core logic before implementation.
- Run verification commands listed in each task.
- Update `docs/work/CURRENT.md` and the active plan before stopping.
