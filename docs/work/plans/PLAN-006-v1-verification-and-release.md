# v1 Verification and Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Verify Stocker v1.0 against the PRD, prepare local developer/homelab usage docs, and ensure future agents can continue safely.

**Architecture:** Verification should exercise the full local stack: config loading, migrations, web app, worker, source refresh, enrichment job execution, market-data fallback behavior, saved research, corrections, and source status.

**Tech Stack:** pnpm, Next.js, TypeScript, Vitest, Drizzle migrations, local SQLite, LM Studio/OpenAI-compatible endpoint for manual smoke checks.

---

## Required Reading

- `docs/PRD_V1.md`
- `docs/STACK.md`
- All v1.0 plan files

## TASK-033: Add Local Development Documentation

**Status:** Ready

**Dependencies:** TASK-032

**Goal:** Document how to run Stocker locally with web, worker, config, database, and LM Studio.

**Files:**

- Create: `README.md`
- Create: `docs/LOCAL_DEVELOPMENT.md`
- Create: `docs/CONFIGURATION.md`
- Modify: `config/stocker.example.yaml`

**Required README Sections:**

- What Stocker is
- v1.0 scope
- Prerequisites
- Install
- Configure
- Run migrations
- Start web
- Start worker
- Run tests
- Known non-goals

**Required Commands:**

```bash
pnpm install
cp config/stocker.example.yaml config/stocker.yaml
pnpm --filter @stocker/db migrate
pnpm --filter @stocker/web dev
pnpm --filter @stocker/worker dev
pnpm test
pnpm typecheck
```

**Acceptance Criteria:**

- [ ] A new agent can follow docs to run the app locally.
- [ ] Config docs explain RSS, Reddit, market provider, LLM provider, database path, and prompt override fields.
- [ ] Docs clearly state v1.0 does not make investment recommendations.

**Verification:**

- [ ] Run commands from the README on a clean install path or document the exact command that could not be run.
- [ ] `rg -n "buy/sell/hold|portfolio tracking|full-text" README.md docs/LOCAL_DEVELOPMENT.md docs/CONFIGURATION.md` finds non-goal language.

## TASK-034: Add Seed and Fixture Data for Local UI Testing

**Status:** Ready

**Dependencies:** TASK-032

**Goal:** Provide deterministic sample data so the web UI can be inspected without live feeds or a live LLM.

**Files:**

- Create: `packages/db/src/seed/seed-dev.ts`
- Create: `packages/db/src/seed/sample-data.ts`
- Modify: `packages/db/package.json`
- Test: `packages/db/src/seed/seed-dev.test.ts`

**Seed Data Must Include:**

- One RSS source
- One Reddit source
- One pending item
- One failed enrichment item
- One needs-review item
- One complete enriched item with validated ticker
- One saved-for-research item
- One stale stock snapshot
- One correction rule

**Steps:**

- [ ] Implement deterministic seed data.
- [ ] Add `pnpm --filter @stocker/db seed:dev`.
- [ ] Ensure seed command is idempotent.
- [ ] Add tests that seed a temporary database twice without duplicates.

**Acceptance Criteria:**

- [ ] UI states can be tested without network.
- [ ] Seed command does not duplicate data.
- [ ] Seed records use realistic but non-advisory example content.

**Verification:**

```bash
pnpm --filter @stocker/db test
pnpm --filter @stocker/db seed:dev
```

## TASK-035: Add End-to-End Manual Verification Script

**Status:** Ready

**Dependencies:** TASK-034

**Goal:** Create a repeatable manual verification checklist for v1.0 acceptance criteria.

**Files:**

- Create: `docs/work/checklists/V1_ACCEPTANCE_CHECKLIST.md`
- Create: `scripts/verify-v1-local.sh`

**Checklist Must Cover:**

- YAML config loads.
- RSS source refresh creates items.
- Reddit feed source refresh creates items.
- Manual refresh works.
- Scheduled refresh enqueues jobs.
- Background worker runs jobs.
- Enrichment pending, complete, needs-review, and failed states are visible.
- Inbox filters work.
- Item detail shows enrichment and stock context.
- Failed enrichment can be retried.
- Market data failure shows stale or company-only context.
- Saved-for-research works.
- Correction rule applies globally and can be removed.
- Source status page shows source health.
- Original links open externally.
- No full-text extraction or embedded reading is present.

**Script Requirements:**

`scripts/verify-v1-local.sh` must run:

```bash
pnpm format
pnpm lint
pnpm typecheck
pnpm test
pnpm --filter @stocker/web build
```

**Acceptance Criteria:**

- [ ] Checklist maps every `docs/PRD_V1.md` acceptance criterion to a verification action.
- [ ] Script exits non-zero when any automated check fails.
- [ ] Checklist separates automated verification from manual browser checks.

**Verification:**

```bash
sh scripts/verify-v1-local.sh
```

Expected:

```text
All automated checks pass.
```

## TASK-036: Verify Worker and Job Recovery Behavior

**Status:** Ready

**Dependencies:** TASK-023, TASK-035

**Goal:** Confirm durable DB-backed jobs behave correctly across worker restarts and failures.

**Files:**

- Create: `packages/core/src/jobs/job-recovery.test.ts`
- Modify: `docs/work/checklists/V1_ACCEPTANCE_CHECKLIST.md`

**Required Tests:**

- Queued job is claimed by one worker.
- Running job can be recovered if lock is stale.
- Failed job is retried until max attempts.
- Failed terminal job remains visible with error message.
- Invalid payload marks job failed with validation error.

**Acceptance Criteria:**

- [ ] Job recovery behavior is tested.
- [ ] Stale running jobs do not block the queue permanently.
- [ ] Terminal failures preserve useful error messages.

**Verification:**

```bash
pnpm --filter @stocker/core test
pnpm --filter @stocker/core typecheck
```

## TASK-037: Verify No Out-of-Scope Feature Drift

**Status:** Ready

**Dependencies:** TASK-035

**Goal:** Ensure v1.0 has not accidentally added excluded product behavior.

**Files:**

- Create: `docs/work/checklists/V1_SCOPE_GUARDRAILS.md`

**Guardrail Checks:**

- [ ] No buy/sell/hold recommendation UI.
- [ ] No portfolio holdings, positions, shares, cost basis, allocation, or returns UI.
- [ ] No alerts or notifications.
- [ ] No historical price tracking feature.
- [ ] No full-text article extraction.
- [ ] No embedded article reader or iframe/webview.
- [ ] No CLI/TUI client.
- [ ] No auth or multi-user support.
- [ ] No user-facing plugin marketplace.
- [ ] No Flipboard integration.
- [ ] No Reddit comment summaries.
- [ ] No discovered watchlist.
- [ ] No table/data-grid dependency for the inbox.

**Search Commands:**

```bash
rg -n "buy|sell|hold|recommendation|portfolio|position|shares|cost basis|alert|notification|iframe|webview|Flipboard|comment summary|watchlist|TanStack Table|data grid|DataGrid" apps packages docs
```

**Acceptance Criteria:**

- [ ] Any search hits are reviewed and documented as safe or fixed.
- [ ] Guardrail checklist is complete before v1.0 is considered ready.

**Verification:**

- [ ] Run the search command and update `V1_SCOPE_GUARDRAILS.md` with results.

## TASK-038: Finalize Work Tracking for v1.0 Completion

**Status:** Ready

**Dependencies:** TASK-037

**Goal:** Update work docs so future agents know v1.0 status and next available work.

**Files:**

- Modify: `docs/work/CURRENT.md`
- Modify: `docs/work/ROADMAP.md`
- Modify: `docs/work/epics/EPIC-001-v1-intelligence-inbox.md`
- Create: `docs/work/checklists/V1_COMPLETION_NOTES.md`

**Steps:**

- [ ] Record completed plan sequence.
- [ ] Record final verification commands and outcomes.
- [ ] Mark EPIC-001 status as `Review` or `Done`.
- [ ] If incomplete items remain, create explicit follow-up tasks and keep EPIC-001 in `Review`.
- [ ] Keep v1.1 and v1.2 future work inactive unless the user promotes it.

**Acceptance Criteria:**

- [ ] Current work docs match actual implementation state.
- [ ] Future agents can see whether v1.0 is ready, in review, or incomplete.
- [ ] No future roadmap items are accidentally marked active.

**Verification:**

```bash
rg -n "Active Plan|Active Task|Status|v1.1|v1.2" docs/work
```

## Final v1.0 Verification Gate

Run:

```bash
pnpm format
pnpm lint
pnpm typecheck
pnpm test
pnpm --filter @stocker/web build
sh scripts/verify-v1-local.sh
```

Then complete:

- [ ] `docs/work/checklists/V1_ACCEPTANCE_CHECKLIST.md`
- [ ] `docs/work/checklists/V1_SCOPE_GUARDRAILS.md`
- [ ] `docs/work/checklists/V1_COMPLETION_NOTES.md`

v1.0 is not complete until all three checklists are complete.
