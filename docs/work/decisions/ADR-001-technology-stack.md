# ADR-001: Use a TypeScript T3-Style Monorepo

## Status

Accepted

## Date

2026-04-25

## Context

Stocker v1.0 is a local-first intelligence inbox for article-like items and stock enrichment.

The product requires:

- A polished web app as the first client
- A reusable service core for future CLI, TUI, and automation clients
- Plugin-like source adapters
- Pluggable LLM providers
- Pluggable market-data providers
- Background ingestion and enrichment
- Local SQLite-first persistence
- Strong structured validation around LLM outputs and external provider data

The user prefers Ruby for readability, but selected fastest path to a polished web app and AI-provider integration as the dominant stack constraint.

The Vercel AI SDK is a major reason to prefer TypeScript because v1.0 depends on structured LLM enrichment and provider flexibility.

## Decision

Use a TypeScript T3-style monorepo for v1.0.

The accepted stack is:

- TypeScript
- Next.js web app
- React UI
- tRPC web API boundary
- Separate TypeScript worker process
- Shared application service core
- Drizzle ORM
- SQLite first
- Durable DB-backed jobs owned by the app
- Vercel AI SDK for LLM integration
- LM Studio or another OpenAI-compatible local endpoint as the first local LLM target
- `yahoo-finance2` as the first market-data adapter
- Tailwind CSS with shadcn-style primitives
- Zod for runtime validation
- pnpm workspaces
- T3-style starter adapted into a monorepo

tRPC routers must be thin adapters over shared application services. They must not own core product logic.

The worker and future CLI/TUI clients must call application services directly.

## Alternatives Considered

### Ruby Rails Service App

Rails would provide strong readability, fast CRUD development, ActiveRecord, migrations, and mature background-job patterns.

It was rejected for v1.0 because the hardest part of Stocker is AI-provider-backed structured enrichment. TypeScript has a stronger ecosystem for this through the Vercel AI SDK, tRPC, Zod, and shared types between web and service layers.

Ruby remains a readable and viable alternative, but it does not match the selected priority of fastest polished web app plus AI-provider integration.

### Go Service Core with TypeScript Web

Go would provide a strong service, worker, CLI, and deployment story.

It was rejected for v1.0 because it would split the system across Go and TypeScript before the product shape is proven. It would also make AI SDK integration awkward and require extra API/client contract work.

Go may become useful later for specialized services, but it is not the right first stack.

### Single Next.js App Without Monorepo Boundaries

A single Next.js app would be simpler to start.

It was rejected because v1.0 has a hard requirement for a reusable service core and a separate worker process. A monorepo gives clearer boundaries for shared services, database code, adapters, providers, and future CLI/TUI clients.

## Consequences

Positive consequences:

- Strong fit for Vercel AI SDK and structured LLM workflows
- Typed end-to-end web API through tRPC
- Clear path to shared service logic across web, worker, and future CLI/TUI
- Drizzle and Zod provide inspectable schemas that are friendly to implementation agents
- SQLite keeps local setup simple
- DB-backed jobs keep background work durable without external infrastructure

Negative consequences:

- More TypeScript ceremony than Ruby
- Monorepo setup adds upfront structure
- Next.js, tRPC, Drizzle, AI SDK, and worker boundaries require disciplined architecture
- `yahoo-finance2` is unofficial and may break, so the adapter boundary is important

## Follow-Up Decisions

The following decisions remain open and should be handled during implementation planning or later ADRs:

- Exact starter/template
- Exact workspace/package layout
- Exact SQLite driver
- Job table schema and worker claim/retry semantics
- Config schema
- Source adapter contract
- LLM enrichment schema
- Market-data provider contract
- Test runner and integration-test setup

