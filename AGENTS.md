# Agent Instructions

This project is managed through markdown-first product, planning, and task documents.

Agents must treat these files as the source of truth before making implementation changes.

## Read Order

Before doing implementation work, read these files in order:

1. `docs/PRODUCT.md`
2. `docs/PRD_V1.md`
3. `docs/FUTURE.md`
4. `docs/work/CURRENT.md`, if it exists
5. The active epic, plan, task, and ADR files referenced by `docs/work/CURRENT.md`

If `docs/work/CURRENT.md` does not exist, do not guess the active task. Ask for the current plan or create a planning document when explicitly asked.

## Work System

Use this structure for project management:

```text
docs/
  PRODUCT.md
  PRD_V1.md
  FUTURE.md

  work/
    README.md
    CURRENT.md
    ROADMAP.md

    epics/
      EPIC-001-v1-intelligence-inbox.md

    plans/
      PLAN-001-v1-foundation.md
      PLAN-002-ingestion-and-sources.md
      PLAN-003-enrichment.md

    tasks/
      TASK-001-project-scaffold.md
      TASK-002-source-adapter-contract.md
      TASK-003-rss-source-adapter.md

    decisions/
      ADR-001-service-core-first.md
```

## File Responsibilities

### `docs/PRODUCT.md`

Describes the overall product, target user, product principles, and long-term shape.

### `docs/PRD_V1.md`

Defines the locked v1.0 product scope.

Do not implement features outside this file unless a later PRD or active plan explicitly promotes them.

### `docs/FUTURE.md`

Tracks future ideas and later versions.

Items in this file are not active work. Do not implement them unless they have been promoted into an active epic, plan, and task.

### `docs/work/CURRENT.md`

The single source of truth for active work.

It should identify:

- Active epic
- Active plan
- Active task
- Current status
- Any special instructions for the current agent session

Example:

```markdown
# Current Work

## Active Epic
EPIC-001: v1 Intelligence Inbox

## Active Plan
PLAN-001: v1 Foundation

## Active Task
TASK-002: Source Adapter Contract

## Status
In Progress

## Agent Instructions
- Read the active epic, plan, and task before coding.
- Only work on the active task unless instructed otherwise.
- Update task progress before stopping.
- Do not implement items from `docs/FUTURE.md` unless promoted into a plan.
```

### `docs/work/ROADMAP.md`

Tracks future epics and their rough order.

Use this for planned future work that is more concrete than raw ideas but not yet active.

### `docs/work/epics/EPIC-*.md`

Epics describe large outcome-oriented bodies of work.

Each epic should include:

- Goal
- Scope
- Out of scope
- Linked PRD or product docs
- Linked plans
- Success criteria

### `docs/work/plans/PLAN-*.md`

Plans break epics into ordered implementation slices.

Each plan should include:

- Overview
- Architecture decisions or references to ADRs
- Ordered task list
- Dependencies
- Checkpoints
- Risks
- Open questions

### `docs/work/tasks/TASK-*.md`

Tasks are the unit of work for implementation agents.

Each task should be small enough to complete, test, and verify in one focused session.

### `docs/work/decisions/ADR-*.md`

ADRs record durable architecture decisions.

Write an ADR for decisions that would be expensive to reverse, including stack choice, database choice, service-core architecture, source adapter design, provider abstractions, and API boundaries.

## Task Template

Use this template for task files:

```markdown
# TASK-002: Source Adapter Contract

## Status
Ready

## Parent
PLAN-002: Ingestion and Sources

## Goal
Define the shared interface that all source adapters must implement.

## Scope
- Create source adapter contract
- Add config validation shape
- Add normalized inbox item shape
- Add source health/error shape

## Out of Scope
- RSS implementation
- Reddit implementation
- UI

## Acceptance Criteria
- [ ] New adapters can validate config
- [ ] New adapters can fetch source items
- [ ] New adapters normalize into shared inbox item records
- [ ] Source errors can be reported consistently

## Verification
- [ ] Unit tests cover a mock adapter
- [ ] Type checks pass
- [ ] Contract is documented

## Progress Log
- 2026-04-25: Created
```

## Status Vocabulary

Use only these statuses:

- Proposed
- Ready
- In Progress
- Blocked
- Review
- Done
- Deferred
- Cancelled

Do not invent new statuses.

## Agent Workflow Rules

- Read the relevant product, PRD, current work, plan, task, and ADR docs before coding.
- Work only on the active task unless the user explicitly changes scope.
- Keep task progress updated before stopping.
- Add verification notes to the task after running tests, builds, or manual checks.
- If scope changes, update the relevant plan or task before implementing the change.
- If a decision affects architecture or future implementation, add or update an ADR.
- Do not implement roadmap or future ideas until they are promoted into active work.
- Do not turn `docs/FUTURE.md` items into code opportunistically.
- Prefer small, verifiable tasks over broad implementation sweeps.

## Core Product Guardrails

v1.0 is an intelligence inbox backed by a reusable local service core.

The web app is the first client. Future CLI, TUI, and automation clients should reuse the same service operations.

v1.0 does not include:

- Buy, sell, or hold recommendations
- Portfolio tracking
- Alerts or notifications
- Historical price tracking
- Full-text article extraction
- Embedded article reading
- CLI or TUI client
- Multi-user support or authentication
- User-facing plugin marketplace

