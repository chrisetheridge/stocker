# ADR-002: Record the Project Scaffold

## Status

Accepted

## Date

2026-04-25

## Context

The v1 foundation task created the initial TypeScript monorepo scaffold for Stocker.

The scaffold had to satisfy the locked v1 stack while also fitting the actual CLI/tooling constraints exposed during implementation.

## Decision

The project scaffold is:

- Package manager: `pnpm@10.11.0`
- Workspace tool: Turborepo `2.9.6`
- Root workspace name: `stocker`
- Web app package: `@stocker/web`
- Worker package: `@stocker/worker`
- Shared packages: `@stocker/config`, `@stocker/core`, `@stocker/db`, `@stocker/llm`, `@stocker/market-data`, `@stocker/source-adapters`, `@stocker/ui`
- Next.js: `15.5.15`
- tRPC: `11.0.0`
- Drizzle ORM: `0.41.0`
- SQLite driver: `@libsql/client@0.14.0`
- Test runner: Vitest `4.1.5`
- TypeScript: `6.0.3`

The web app was generated with:

```bash
pnpm create t3-app@latest apps/web --CI --noGit --noInstall --trpc --tailwind true --drizzle true --appRouter true --eslint true --dbProvider sqlite --nextAuth false --betterAuth false
```

The workspace was then adapted into a monorepo with:

- `apps/web`
- `apps/worker`
- `packages/config`
- `packages/core`
- `packages/db`
- `packages/llm`
- `packages/market-data`
- `packages/source-adapters`
- `packages/ui`

## Consequences

Positive:

- The repo now has a reproducible T3-style starting point for the v1 implementation.
- Web, worker, and shared packages all resolve through workspace package names.
- The root commands `pnpm format`, `pnpm lint`, `pnpm typecheck`, and `pnpm test` work from the monorepo root.
- The web app starts and builds locally, and the worker process starts independently.

Tradeoffs and deviations:

- `pnpm@latest` from the plan had to become the concrete `pnpm@10.11.0` package manager declaration because the scaffold CLI rejects the tag form.
- The root package is explicitly ESM so shared workspace config files like `eslint.config.js` and `vitest.workspace.ts` load cleanly.
- The workspace needed extra root tooling packages beyond the initial plan so the new lint and worker commands could resolve cleanly: `@types/node`, `eslint`, `prettier-plugin-tailwindcss`, `tsx`, `typescript-eslint`.
- The generated Next.js app still uses `next lint`; the later standardization work in `PLAN-001` Task 004 keeps that until the lint rollout is fully normalized.
