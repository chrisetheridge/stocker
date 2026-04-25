# Project Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the TypeScript T3-style monorepo foundation that all v1.0 work builds on.

**Architecture:** Establish pnpm workspaces with `apps/web`, `apps/worker`, and shared packages for core services, database, config, source adapters, market data, LLM integration, and UI. The web app and worker must depend on shared packages instead of duplicating product logic.

**Tech Stack:** pnpm workspaces, TypeScript, Next.js, tRPC, Tailwind CSS, Drizzle, SQLite, Vitest, ESLint, Prettier.

---

## Required Reading

- `AGENTS.md`
- `docs/STACK.md`
- `docs/work/plans/PLAN-000-v1-master-work-plan.md`
- `docs/work/decisions/ADR-001-technology-stack.md`

## Target Workspace Shape

```text
apps/
  web/
  worker/

packages/
  config/
  core/
  db/
  llm/
  market-data/
  source-adapters/
  ui/

docs/
  work/
```

## Package Names

Use these package names:

- Root workspace: `stocker`
- Web app: `@stocker/web`
- Worker app: `@stocker/worker`
- Config package: `@stocker/config`
- Core package: `@stocker/core`
- Database package: `@stocker/db`
- LLM package: `@stocker/llm`
- Market data package: `@stocker/market-data`
- Source adapters package: `@stocker/source-adapters`
- UI package: `@stocker/ui`

## TASK-001: Initialize TypeScript T3 Monorepo

**Status:** Ready

**Dependencies:** None

**Goal:** Create the root pnpm workspace and scaffold the Next.js/T3 web app.

**Files:**

- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `tsconfig.base.json`
- Create: `.gitignore`
- Create: `.prettierrc.json`
- Create: `apps/web/*`

**Steps:**

- [ ] Create the root workspace files.

Root `package.json` must include:

```json
{
  "name": "stocker",
  "private": true,
  "packageManager": "pnpm@latest",
  "scripts": {
    "build": "turbo build",
    "dev": "turbo dev",
    "format": "prettier --write .",
    "lint": "turbo lint",
    "test": "turbo test",
    "typecheck": "turbo typecheck"
  },
  "devDependencies": {
    "prettier": "latest",
    "turbo": "latest",
    "typescript": "latest",
    "vitest": "latest"
  }
}
```

`pnpm-workspace.yaml` must include:

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

`turbo.json` must define `build`, `dev`, `lint`, `test`, and `typecheck` tasks with package dependency ordering.

- [ ] Scaffold the web app in `apps/web` using a T3-style starter with TypeScript, Next.js App Router, tRPC, Tailwind, Drizzle, and no auth.

Preferred command:

```bash
pnpm create t3-app@latest apps/web --CI --trpc --tailwind --drizzle --appRouter
```

If the CLI does not support one of those flags, run the interactive T3 CLI and choose:

```text
TypeScript: yes
Next.js App Router: yes
tRPC: yes
Tailwind CSS: yes
Drizzle: yes
Authentication: no
```

- [ ] Rename the web package to `@stocker/web`.

- [ ] Confirm the web app can start.

Run:

```bash
pnpm install
pnpm --filter @stocker/web dev
```

Expected:

```text
Next.js starts a local development server without TypeScript or dependency errors.
```

- [ ] Stop the dev server after verification.

**Acceptance Criteria:**

- [ ] Root pnpm workspace exists.
- [ ] `apps/web` exists and is a working T3-style Next.js app.
- [ ] The web app uses TypeScript, tRPC, Tailwind, and Drizzle.
- [ ] No auth provider is installed or configured.
- [ ] Root scripts delegate through Turborepo.

**Verification:**

- [ ] `pnpm install` succeeds.
- [ ] `pnpm --filter @stocker/web dev` starts successfully.

## TASK-002: Create Shared Package Skeletons

**Status:** Ready

**Dependencies:** TASK-001

**Goal:** Add empty but buildable shared packages with consistent exports and TypeScript settings.

**Files:**

- Create: `packages/config/package.json`
- Create: `packages/config/src/index.ts`
- Create: `packages/config/tsconfig.json`
- Create: `packages/core/package.json`
- Create: `packages/core/src/index.ts`
- Create: `packages/core/tsconfig.json`
- Create: `packages/db/package.json`
- Create: `packages/db/src/index.ts`
- Create: `packages/db/tsconfig.json`
- Create: `packages/llm/package.json`
- Create: `packages/llm/src/index.ts`
- Create: `packages/llm/tsconfig.json`
- Create: `packages/market-data/package.json`
- Create: `packages/market-data/src/index.ts`
- Create: `packages/market-data/tsconfig.json`
- Create: `packages/source-adapters/package.json`
- Create: `packages/source-adapters/src/index.ts`
- Create: `packages/source-adapters/tsconfig.json`
- Create: `packages/ui/package.json`
- Create: `packages/ui/src/index.ts`
- Create: `packages/ui/tsconfig.json`

**Steps:**

- [ ] Create each package with `"type": "module"`.
- [ ] Each package must export `./src/index.ts`.
- [ ] Each package must have `typecheck` and `test` scripts.
- [ ] Add package references or path aliases so workspace packages can import each other by package name.
- [ ] Add a trivial exported constant to each `src/index.ts` to verify package resolution.

Example:

```ts
export const corePackageName = "@stocker/core";
```

- [ ] Add workspace dependencies where needed:

```text
@stocker/core depends on @stocker/db, @stocker/config, @stocker/source-adapters, @stocker/market-data, @stocker/llm
@stocker/worker depends on @stocker/core
@stocker/web depends on @stocker/core and @stocker/ui
```

**Acceptance Criteria:**

- [ ] All shared packages exist.
- [ ] All shared packages can be imported by package name.
- [ ] `@stocker/web` can import from `@stocker/core`.
- [ ] `@stocker/worker` can import from `@stocker/core`.

**Verification:**

- [ ] `pnpm typecheck` succeeds.
- [ ] `pnpm test` succeeds.

## TASK-003: Add Worker App Skeleton

**Status:** Ready

**Dependencies:** TASK-002

**Goal:** Create a separate TypeScript worker app that can run independently from the web process.

**Files:**

- Create: `apps/worker/package.json`
- Create: `apps/worker/tsconfig.json`
- Create: `apps/worker/src/index.ts`
- Create: `apps/worker/src/runtime.ts`
- Create: `apps/worker/src/runtime.test.ts`

**Steps:**

- [ ] Create `@stocker/worker` package.
- [ ] Add dependencies on `@stocker/core` and TypeScript runtime tooling.
- [ ] Implement `createWorkerRuntime()` in `apps/worker/src/runtime.ts`.

Expected initial behavior:

```ts
export type WorkerRuntime = {
  readonly name: "@stocker/worker";
  readonly mode: "idle";
};

export function createWorkerRuntime(): WorkerRuntime {
  return {
    name: "@stocker/worker",
    mode: "idle"
  };
}
```

- [ ] Add a unit test that asserts `createWorkerRuntime()` returns name `@stocker/worker` and mode `idle`.
- [ ] Add `apps/worker/src/index.ts` that creates the runtime and logs a single startup line.

**Acceptance Criteria:**

- [ ] Worker app exists as a separate package.
- [ ] Worker can run without starting Next.js.
- [ ] Worker imports shared packages through workspace dependencies.

**Verification:**

- [ ] `pnpm --filter @stocker/worker test` passes.
- [ ] `pnpm --filter @stocker/worker typecheck` passes.
- [ ] `pnpm --filter @stocker/worker dev` prints a startup line and exits or idles cleanly.

## TASK-004: Standardize Test, Lint, Format, and Typecheck Commands

**Status:** Ready

**Dependencies:** TASK-003

**Goal:** Ensure all packages participate in consistent root-level verification.

**Files:**

- Modify: `package.json`
- Modify: `turbo.json`
- Modify: package files under `apps/*/package.json`
- Modify: package files under `packages/*/package.json`
- Create: `vitest.workspace.ts`

**Steps:**

- [ ] Configure Vitest workspace discovery for `apps/*` and `packages/*`.
- [ ] Ensure every package has a `test` script.
- [ ] Ensure every package has a `typecheck` script.
- [ ] Ensure packages without lintable source still have a safe `lint` script.
- [ ] Run root commands.

**Acceptance Criteria:**

- [ ] `pnpm test` runs all package tests.
- [ ] `pnpm typecheck` typechecks all packages.
- [ ] `pnpm lint` runs without package-script failures.
- [ ] `pnpm format` formats markdown, TypeScript, JSON, and YAML.

**Verification:**

```bash
pnpm format
pnpm lint
pnpm typecheck
pnpm test
```

Expected:

```text
All commands complete successfully.
```

## TASK-005: Record Foundation Implementation Notes

**Status:** Ready

**Dependencies:** TASK-004

**Goal:** Document actual scaffold choices so later agents do not need to rediscover them.

**Files:**

- Create: `docs/work/decisions/ADR-002-project-scaffold.md`
- Modify: `docs/work/CURRENT.md`

**Steps:**

- [ ] Create ADR-002 with:

```text
Status: Accepted
Date: current date
Context: T3-style TypeScript monorepo foundation was created.
Decision: Record exact starter command, package manager, workspace tool, Next.js version, tRPC version, Drizzle driver, and test runner.
Consequences: Note any deviations from docs/STACK.md.
```

- [ ] Update `docs/work/CURRENT.md` to move active task to the first task in `PLAN-002-data-config-and-jobs.md`.

**Acceptance Criteria:**

- [ ] ADR-002 exists and records real scaffold facts.
- [ ] `CURRENT.md` points to the next executable task.

**Verification:**

- [ ] `rg -n "ADR-002|TASK-006" docs/work` finds both references.

## Checkpoint: Foundation Complete

- [ ] Root workspace commands pass.
- [ ] Web app starts.
- [ ] Worker app starts.
- [ ] Shared packages typecheck.
- [ ] ADR-002 records actual scaffold choices.

