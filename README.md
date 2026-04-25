# Stocker

Stocker is a local-first intelligence inbox for morning article reading and stock discovery.

It collects article-like items from configured sources, enriches them with company and stock context, and helps you decide what is worth opening, saving, or researching later.

This repository is the v1 monorepo foundation:

- `apps/web` is the Next.js web app and primary UI
- `apps/worker` is the background worker process
- `packages/*` holds shared service and domain packages

## What It Does

The v1 product is designed to:

- ingest RSS/Atom and Reddit public feed-style sources
- show a combined inbox of fetched items
- enrich items in the background with company and stock context
- let you save items for stock research
- keep the service core reusable for future CLI or TUI clients

It is local-first, single-user, and does not include auth, portfolio tracking, alerts, or buy/sell recommendations.

## Requirements

- Node.js 20+
- pnpm 10+

## Install

```bash
pnpm install
```

## Run

Start the web app:

```bash
pnpm --filter @stocker/web dev
```

The app runs at:

- http://localhost:3000

Start the worker process in a separate terminal:

```bash
pnpm --filter @stocker/worker dev
```

## Verify

Run the workspace checks from the repository root:

```bash
pnpm format
pnpm lint
pnpm typecheck
pnpm test
pnpm --filter @stocker/web build
pnpm --filter @stocker/worker typecheck
```

## Workspace Commands

The root `package.json` delegates to Turbo:

- `pnpm dev`
- `pnpm build`
- `pnpm lint`
- `pnpm test`
- `pnpm typecheck`

## Project Docs

- [Product overview](docs/PRODUCT.md)
- [v1 PRD](docs/PRD_V1.md)
- [Technology stack](docs/STACK.md)
- [Work tracking](docs/work/README.md)

## Current State

The monorepo foundation is in place. The next active implementation work is tracked in `docs/work/CURRENT.md`.
