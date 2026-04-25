# v1 Intelligence Inbox Master Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Stocker v1.0 as a local-first intelligence inbox with source ingestion, background enrichment, stock context, saved research, and a reusable service core.

**Architecture:** Use a TypeScript T3-style monorepo with a Next.js web app, a separate worker process, shared service packages, SQLite/Drizzle persistence, DB-backed jobs, tRPC as the web API boundary, Vercel AI SDK for LLM integration, and provider/adapter interfaces for sources and market data.

**Tech Stack:** TypeScript, Next.js, React, tRPC, Drizzle, SQLite, pnpm workspaces, Tailwind CSS, shadcn-style primitives, Zod, Vercel AI SDK, LM Studio/OpenAI-compatible local endpoint, `yahoo-finance2`, Vitest.

---

## Source Documents

Agents must read these files before starting implementation:

- `AGENTS.md`
- `docs/PRODUCT.md`
- `docs/PRD_V1.md`
- `docs/STACK.md`
- `docs/work/epics/EPIC-001-v1-intelligence-inbox.md`
- `docs/work/decisions/ADR-001-technology-stack.md`

## Dependency Graph

```text
Project foundation
  -> shared package boundaries
    -> database schema and repositories
      -> config loading
      -> DB-backed jobs
        -> source adapter contract
          -> RSS adapter
          -> Reddit feed adapter
          -> source refresh service
            -> market data provider contract
            -> LLM provider contract
              -> matching and enrichment service
                -> worker orchestration
                -> tRPC routers
                  -> inbox UI
                  -> item detail UI
                  -> source status UI
                    -> v1 verification
```

## Plan Files

Execute these plans in order:

1. `PLAN-001-project-foundation.md`
2. `PLAN-002-data-config-and-jobs.md`
3. `PLAN-003-source-ingestion.md`
4. `PLAN-004-market-llm-and-enrichment.md`
5. `PLAN-005-web-api-and-ui.md`
6. `PLAN-006-v1-verification-and-release.md`

## Cross-Plan Rules

- Keep product logic in shared application services, not in Next.js pages, React components, tRPC routers, worker entrypoints, or provider adapters.
- Keep tRPC routers thin: validate input, call a service, return service output.
- Keep worker code thin: claim a job, call a service, record the result.
- Do not add Redis, BullMQ, Temporal, external queues, auth, full-text extraction, embedded reading, alerts, portfolio tracking, or buy/sell/hold recommendations.
- Do not add a table/data-grid dependency for the inbox by default.
- Do not implement `docs/FUTURE.md` features.
- Write unit tests for each service, adapter, provider normalization function, and matching function before implementation.
- Use Zod for config, provider outputs, job payloads, tRPC inputs, and LLM structured output.
- Add ADRs when changing accepted architecture.

## Global Verification Commands

Each implementation session should finish with the commands available at that point:

```bash
pnpm format
pnpm lint
pnpm typecheck
pnpm test
```

After the web app exists, also run:

```bash
pnpm --filter @stocker/web build
```

After the worker exists, also run:

```bash
pnpm --filter @stocker/worker typecheck
```

## v1.0 Completion Gate

v1.0 is complete only when all acceptance criteria from `docs/PRD_V1.md` are demonstrated by automated tests, local manual checks, or documented verification notes.
