# Stocker

Stocker is a local-first intelligence inbox for morning article reading and stock discovery.

It collects article-like items from configured sources, enriches them with company and stock context, and helps you decide what to open, save, or research later.

## What Stocker Is

Stocker is the v1 monorepo for a single-user local intelligence inbox.

- `apps/web` is the Next.js web app and primary UI
- `apps/worker` is the background worker process
- `packages/*` holds shared service and domain packages

## v1.0 Scope

v1.0 supports:

- RSS/Atom and Reddit public feed-style sources
- combined inbox and item detail views
- background enrichment with company and stock context
- saved-for-research state
- manual ticker corrections
- reusable service core for future CLI or TUI clients

v1.0 does not include:

- buy/sell/hold recommendations
- portfolio tracking
- alerts or notifications
- historical price tracking
- full-text article extraction
- embedded article reading
- CLI or TUI client
- multi-user support or authentication
- user-facing plugin marketplace

## Prerequisites

- Node.js 20+
- pnpm 10+
- local SQLite storage
- optional LM Studio or another OpenAI-compatible local endpoint

## Install

```bash
pnpm install
```

## Configure

```bash
cp config/stocker.example.yaml config/stocker.yaml
```

The app reads `config/stocker.yaml` by default.
Set `STOCKER_CONFIG_PATH` to point at another YAML file if needed.

## Run Migrations

```bash
pnpm --filter @stocker/db migrate
```

## Start Web

```bash
pnpm --filter @stocker/web dev
```

The app opens at `http://localhost:3000`.

## Start Worker

```bash
pnpm --filter @stocker/worker dev
```

## Run Tests

```bash
pnpm test
pnpm typecheck
pnpm --filter @stocker/web build
```

For release verification, also run:

```bash
sh scripts/verify-v1-local.sh
```

## Known Non-Goals

- no investment advice
- no embedded article reader
- no full-text extraction
- no portfolio or holdings tracking
- no alerts or notifications

## Project Docs

- [Local development](docs/LOCAL_DEVELOPMENT.md)
- [Configuration](docs/CONFIGURATION.md)
- [Product overview](docs/PRODUCT.md)
- [v1 PRD](docs/PRD_V1.md)
- [Technology stack](docs/STACK.md)
- [Work tracking](docs/work/README.md)

## Current State

The monorepo foundation is in place. Active release-gate work is tracked in `docs/work/CURRENT.md`.
