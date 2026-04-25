# Technology Stack

## Status

Accepted for v1.0.

The selected direction is a TypeScript T3-style monorepo.

## Stack Summary

Stocker v1.0 will use:

- TypeScript
- Next.js for the web app
- React for UI
- tRPC for the web API boundary
- A separate TypeScript worker process
- Shared TypeScript service/core packages
- Drizzle ORM
- SQLite first
- Durable DB-backed jobs owned by the app
- Vercel AI SDK as the primary LLM integration layer
- LM Studio or another OpenAI-compatible local endpoint as the first local LLM runtime target
- `yahoo-finance2` as the first market-data provider adapter
- Tailwind CSS
- shadcn-style UI primitives
- Zod for runtime validation
- pnpm workspaces
- T3-style starter adapted into a monorepo

## Architecture Shape

The stack must preserve the product requirement for a reusable local service core.

The intended dependency direction is:

```text
Web UI
  -> tRPC routers
    -> application services
      -> repositories, source adapters, LLM providers, market-data providers, job services

Worker process
  -> application services
    -> repositories, source adapters, LLM providers, market-data providers, job services

Future CLI/TUI
  -> application services
```

tRPC is the web transport layer. It must not own product logic.

The worker and future CLI/TUI should call application services directly.

## Monorepo Shape

The exact package names will be finalized during implementation planning, but the stack expects a workspace with separate apps and shared packages.

Likely shape:

```text
apps/
  web/
  worker/

packages/
  core/
  db/
  config/
  source-adapters/
  market-data/
  llm/
  ui/
```

This structure may be adjusted during implementation if the chosen T3/Turborepo starter suggests a cleaner convention.

## Web App

The web app is the primary v1.0 client.

It should be built with Next.js and React, using tRPC to call thin routers that delegate to shared application services.

The inbox UI should be a custom list/filter experience. Do not add a table or data-grid dependency by default. A table layout is not the desired product shape for v1.0.

## Worker

Background work must run in a separate TypeScript worker process.

The worker should use durable DB-backed jobs owned by the application.

v1.0 should not require Redis, BullMQ, Temporal, or external queue infrastructure.

The worker should handle scheduled source fetching, manual refresh jobs, enrichment jobs, retry state, and job error persistence through shared services.

## Database

Use SQLite first with Drizzle.

The data-access layer should be written so PostgreSQL can be introduced later if the app outgrows SQLite.

The exact SQLite driver is deferred to implementation research and the selected Drizzle/T3 starter conventions.

## LLM Integration

Use the Vercel AI SDK as the primary LLM integration layer.

The first local runtime target is LM Studio or another OpenAI-compatible local endpoint.

Raw AI SDK calls should be isolated behind app-level LLM or enrichment provider services so prompts, schemas, retries, logging, and model selection remain part of the domain layer.

LLM outputs must be schema-validated with Zod before persistence.

## Market Data

Use a market-data provider interface.

The first implementation should use `yahoo-finance2`, because it is practical for a local personal tool and supports the required v1.0 stock context.

Because Yahoo Finance access through this package is unofficial, the app must treat it as replaceable. Product logic should depend on the market-data provider interface, not directly on `yahoo-finance2`.

## Validation

Use Zod for runtime validation across:

- YAML config
- tRPC inputs
- Source adapter config and normalized outputs
- LLM structured outputs
- Market data provider outputs
- Job payloads
- Service command inputs where useful

## UI

Use Tailwind CSS with shadcn-style primitives.

The UI should be dense, readable, and optimized for morning triage. It should feel like a focused inbox, not a dashboard or spreadsheet.

## Testing Posture

Start with unit tests for core services, source adapters, provider adapters, config parsing, enrichment parsing, and matching logic.

DB/job integration tests and browser tests can be added as the implementation stabilizes.

## Deployment Posture

Optimize for local development first.

The app should run as separate local commands for web and worker.

Do not make deployment decisions that prevent a future Docker Compose homelab setup.

## Deferred Details

These details are intentionally deferred to implementation planning:

- Exact T3/Turborepo starter
- Exact package layout
- Exact SQLite driver
- Exact job table schema
- Exact config file schema
- Exact LLM model names
- Exact market-data normalization shape
- Exact test runner setup
