# Agent Instructions

This project is managed through markdown-first product, planning, and task documents.

Agents must treat the markdown work system as the source of truth before making implementation changes.

## Read Order

Before implementation work, read these files in order:

1. `docs/PRODUCT.md`, if it exists
2. The relevant PRD or spec, if one exists
3. `docs/STACK.md`, if it exists
4. `docs/FUTURE.md`, if it exists
5. `docs/work/CURRENT.md`, if it exists
6. `docs/work/README.md`, if it exists
7. Any master plan, coverage matrix, roadmap, ADRs, active epic, active plan, and active task files referenced by `docs/work/CURRENT.md`

If `docs/work/CURRENT.md` does not exist, do not guess the active task. Ask for the current plan or create a planning document only when explicitly asked.

## Work Directory

Use this structure for project management:

```text
docs/
  PRODUCT.md
  PRD_<version>.md
  STACK.md
  FUTURE.md

  work/
    README.md
    CURRENT.md
    ROADMAP.md

    epics/
      EPIC-001-<epic-name>.md

    plans/
      PLAN-000-<project>-master-work-plan.md
      PLAN-COVERAGE.md
      PLAN-001-<implementation-slice>.md
      PLAN-002-<implementation-slice>.md

    tasks/
      TASK-INDEX.md
      TASK-001-<short-task-name>.md

    decisions/
      ADR-001-<decision-name>.md
```

## File Responsibilities

`docs/PRODUCT.md` describes the overall product, target user, product principles, and long-term shape.

`docs/PRD_<version>.md` or other spec files define locked scope for a release or project.

`docs/STACK.md` defines the accepted technology stack. Follow it unless a newer ADR explicitly supersedes it.

`docs/FUTURE.md` tracks ideas and later versions. Items in this file are not active work.

`docs/work/CURRENT.md` is the single source of truth for active work.

`docs/work/ROADMAP.md` tracks future epics and rough sequencing.

`docs/work/epics/EPIC-*.md` describes large outcome-oriented bodies of work.

`docs/work/plans/PLAN-*.md` breaks epics into ordered implementation slices.

`docs/work/tasks/TASK-*.md` contains focused executable tasks for agents.

`docs/work/decisions/ADR-*.md` records durable architecture decisions.

## Current Work

`docs/work/CURRENT.md` must identify:

- Active epic
- Active plan
- Active task
- Current status
- Any special instructions for the active task

Rules:

- Do not infer active work from filenames, roadmap order, or personal judgment.
- Do not start a plan unless `CURRENT.md` points to it or the user explicitly asks for it.
- Do not start the next task until the current task's acceptance criteria and verification steps are complete.
- When a task is complete, update `CURRENT.md` to the next task or mark the work ready for review.
- If `CURRENT.md` is missing or stale, pause implementation and ask the user whether to create or update it.

## Planning Rules

Every implementation plan should:

- Live under `docs/work/plans/`.
- Use stable task IDs.
- List dependencies for every task.
- Include acceptance criteria and verification commands for every task.
- Include checkpoints between major phases.
- Avoid placeholders such as `TBD`, `TODO`, `decide later`, or vague instructions.
- Keep tasks small enough for a focused agent session.
- Map back to product or PRD requirements directly or through a coverage matrix.

Every task should:

- Have a clear goal.
- State its parent plan.
- Define in-scope and out-of-scope work.
- Name likely files or modules.
- Include acceptance criteria.
- Include exact verification steps.
- Record progress before the agent stops.

Future work should:

- Live in `docs/FUTURE.md` or `docs/work/ROADMAP.md`.
- Stay inactive until promoted into an epic, plan, and task.
- Not be implemented opportunistically.

## Task Template

Use this template for task files:

```markdown
# TASK-001: Short Task Name

## Status

Ready

## Parent

PLAN-001: Plan Name

## Goal

One sentence describing the outcome of this task.

## Scope

- Specific thing included in this task
- Specific thing included in this task

## Out of Scope

- Specific thing intentionally excluded from this task
- Specific thing intentionally excluded from this task

## Acceptance Criteria

- [ ] Specific, testable condition
- [ ] Specific, testable condition

## Verification

- [ ] Exact command or manual check
- [ ] Exact command or manual check

## Progress Log

- YYYY-MM-DD: Created
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

- Read the relevant product, PRD/spec, stack, current work, plan, task, and ADR docs before coding.
- Work only on the active task unless the user explicitly changes scope.
- Keep task progress updated before stopping.
- Add verification notes to the task after running tests, builds, or manual checks.
- If scope changes, update the relevant plan or task before implementing the change.
- If a decision affects architecture or future implementation, add or update an ADR.
- Do not implement roadmap or future ideas until they are promoted into active work.
- Prefer small, verifiable tasks over broad implementation sweeps.
- Use the verification commands listed in the active task before marking it complete.
- Update `docs/work/CURRENT.md` when moving to the next task.
- If implementation reveals that a plan is wrong, update the plan first, then implement the corrected task.

