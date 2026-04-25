# Data, Config, and Jobs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the durable local data model, YAML config loader, repositories, and DB-backed job system required by ingestion and enrichment.

**Architecture:** Drizzle owns the SQLite schema. Repositories expose persistence operations to application services. Config loading lives in `@stocker/config`. Jobs are stored durably in SQLite and claimed by the worker through `@stocker/core` services.

**Tech Stack:** Drizzle, SQLite, Zod, YAML parser, Vitest, TypeScript.

---

## Required Reading

- `docs/PRD_V1.md`
- `docs/STACK.md`
- `docs/work/plans/PLAN-001-project-foundation.md`

## Data Model Overview

Use these persistent concepts:

- `sources`: configured source instances and health state
- `source_items`: normalized inbox items from all sources
- `jobs`: durable background jobs
- `enrichment_runs`: attempts to enrich an item
- `item_enrichments`: latest enrichment result for an item
- `item_companies`: validated or uncertain company/ticker matches for an item
- `stock_snapshots`: stock data captured during enrichment or refresh
- `ticker_corrections`: global removable correction rules

## TASK-006: Define Shared Domain Schemas

**Status:** Done

**Dependencies:** TASK-005

**Goal:** Define stable TypeScript/Zod domain schemas used across packages before database and service implementation.

**Files:**

- Create: `packages/core/src/domain/enums.ts`
- Create: `packages/core/src/domain/source-item.ts`
- Create: `packages/core/src/domain/enrichment.ts`
- Create: `packages/core/src/domain/company.ts`
- Create: `packages/core/src/domain/stock.ts`
- Create: `packages/core/src/domain/job.ts`
- Modify: `packages/core/src/index.ts`
- Test: `packages/core/src/domain/domain-schemas.test.ts`

**Steps:**

- [x] Define enums with exact values:

```ts
export const sourceTypes = ['rss', 'reddit'] as const;
export const itemReadStates = ['unread', 'read'] as const;
export const enrichmentStates = [
  'pending',
  'complete',
  'needs_review',
  'failed',
] as const;
export const companyMatchStatuses = [
  'validated',
  'needs_review',
  'rejected',
] as const;
export const relationshipTypes = [
  'mentioned',
  'competitor',
  'customer',
  'supplier',
] as const;
export const jobTypes = [
  'source.refresh',
  'item.enrich',
  'stock.refresh',
] as const;
export const jobStates = [
  'queued',
  'running',
  'succeeded',
  'failed',
  'cancelled',
] as const;
```

- [x] Define Zod schemas for:

```text
SourceItem
ItemEnrichment
ItemCompany
StockSnapshot
TickerCorrection
Job
```

- [x] Use ISO strings for serialized timestamps at service/API boundaries.
- [x] Use database-generated IDs internally.
- [x] Add tests that parse valid examples and reject invalid enum values.

**Acceptance Criteria:**

- [x] All domain enum values are centralized.
- [x] Zod schemas are exported from `@stocker/core`.
- [x] Tests reject invalid states such as `processing`, `done`, and `unknown`.

**Verification:**

- [x] `pnpm --filter @stocker/core test`
- [x] `pnpm --filter @stocker/core typecheck`

## TASK-007: Implement Drizzle Schema and Migrations

**Status:** Done

**Dependencies:** TASK-006

**Goal:** Create SQLite tables and migrations for all v1.0 persistent state.

**Files:**

- Create: `packages/db/src/schema.ts`
- Create: `packages/db/src/client.ts`
- Create: `packages/db/src/migrate.ts`
- Create: `packages/db/drizzle.config.ts`
- Create: `packages/db/migrations/*`
- Modify: `packages/db/src/index.ts`
- Test: `packages/db/src/schema.test.ts`

**Schema Requirements:**

`sources`:

```text
id text primary key
type text not null
name text not null
enabled integer not null default 1
config_json text not null
last_fetched_at text
last_success_at text
last_error_at text
last_error_message text
created_at text not null
updated_at text not null
```

`source_items`:

```text
id text primary key
source_id text not null references sources(id)
external_id text not null
canonical_url text not null
title text not null
summary text
author text
published_at text
fetched_at text not null
source_metadata_json text not null
read_state text not null default 'unread'
saved_for_research integer not null default 0
enrichment_state text not null default 'pending'
created_at text not null
updated_at text not null
unique(source_id, external_id)
```

`jobs`:

```text
id text primary key
type text not null
state text not null
payload_json text not null
attempt_count integer not null default 0
max_attempts integer not null default 3
run_after text not null
locked_at text
locked_by text
last_error_message text
created_at text not null
updated_at text not null
```

`enrichment_runs`:

```text
id text primary key
source_item_id text not null references source_items(id)
state text not null
started_at text not null
finished_at text
error_message text
raw_llm_output_json text
created_at text not null
```

`item_enrichments`:

```text
id text primary key
source_item_id text not null unique references source_items(id)
state text not null
summary text
model_provider text
model_name text
prompt_version text
completed_at text
error_message text
created_at text not null
updated_at text not null
```

`item_companies`:

```text
id text primary key
source_item_id text not null references source_items(id)
company_name text not null
ticker text
exchange text
relationship_type text not null
relevance_explanation text not null
confidence real not null
match_status text not null
evidence_text text
created_at text not null
updated_at text not null
```

`stock_snapshots`:

```text
id text primary key
ticker text not null
exchange text
company_name text
price real
currency text
daily_change real
daily_change_percent real
market_cap real
sector text
provider text not null
captured_at text not null
stale_after text not null
raw_json text not null
created_at text not null
```

`ticker_corrections`:

```text
id text primary key
company_name text not null
correct_ticker text not null
correct_exchange text
notes text
enabled integer not null default 1
created_at text not null
updated_at text not null
unique(company_name, correct_ticker, correct_exchange)
```

**Steps:**

- [x] Implement Drizzle schema with the exact table names and columns above.
- [x] Add indexes for:

```text
source_items.enrichment_state
source_items.saved_for_research
source_items.read_state
source_items.published_at
jobs.state
jobs.run_after
item_companies.ticker
stock_snapshots.ticker
```

- [x] Add migration generation command to `@stocker/db`.
- [x] Add migration run command to `@stocker/db`.
- [x] Add a schema test that creates an in-memory or temporary SQLite database, migrates it, inserts one source and one source item, and reads them back.

**Acceptance Criteria:**

- [x] All required tables exist.
- [x] Uniqueness prevents duplicate source items for the same source/external ID.
- [x] A migrated empty database can accept and return a source item.

**Verification:**

```bash
pnpm --filter @stocker/db test
pnpm --filter @stocker/db typecheck
```

## TASK-008: Implement Repository Layer

**Status:** Done

**Dependencies:** TASK-007

**Goal:** Provide persistence methods for services without exposing Drizzle query details everywhere.

**Files:**

- Create: `packages/db/src/repositories/sources-repository.ts`
- Create: `packages/db/src/repositories/source-items-repository.ts`
- Create: `packages/db/src/repositories/jobs-repository.ts`
- Create: `packages/db/src/repositories/enrichment-repository.ts`
- Create: `packages/db/src/repositories/stock-snapshots-repository.ts`
- Create: `packages/db/src/repositories/ticker-corrections-repository.ts`
- Create: `packages/db/src/repositories/index.ts`
- Test: `packages/db/src/repositories/repositories.test.ts`

**Required Methods:**

`SourcesRepository`:

```text
upsertConfiguredSource(input)
listEnabledSources()
markFetchSuccess(sourceId, fetchedAt)
markFetchFailure(sourceId, errorMessage, failedAt)
listSourceStatus()
```

`SourceItemsRepository`:

```text
upsertFromSource(input)
listInboxItems(filters)
getItemDetail(itemId)
markReadState(itemId, readState)
setSavedForResearch(itemId, saved)
setEnrichmentState(itemId, state)
```

`JobsRepository`:

```text
enqueue(type, payload, options)
claimNext(workerId, now)
markSucceeded(jobId, now)
markFailed(jobId, errorMessage, now)
reschedule(jobId, runAfter, errorMessage, now)
listRecentJobs(limit)
```

`EnrichmentRepository`:

```text
startRun(itemId, now)
completeRun(runId, rawOutput, now)
failRun(runId, errorMessage, now)
upsertItemEnrichment(input)
replaceItemCompanies(itemId, companies)
```

`StockSnapshotsRepository`:

```text
insertSnapshot(input)
getLatestSnapshot(ticker)
getLatestSnapshots(tickers)
```

`TickerCorrectionsRepository`:

```text
upsertCorrection(input)
disableCorrection(correctionId)
findEnabledCorrection(companyName)
listCorrections()
```

**Steps:**

- [x] Write repository tests first using a temporary SQLite database.
- [x] Implement repositories with explicit input/output types.
- [x] Keep JSON serialization inside repositories for `*_json` columns.
- [x] Return parsed objects to callers.
- [x] Ensure repository methods do not import from web or worker packages.

**Acceptance Criteria:**

- [x] Repositories hide Drizzle table details from `@stocker/core`.
- [x] JSON columns round-trip as typed objects.
- [x] Inbox filters work for source, ticker/company, read state, saved state, and enrichment state.
- [x] Job claiming returns at most one queued runnable job and marks it running.

**Verification:**

```bash
pnpm --filter @stocker/db test
pnpm --filter @stocker/db typecheck
```

## TASK-009: Implement YAML Config Loader

**Status:** Done

**Dependencies:** TASK-006

**Goal:** Load and validate local YAML configuration for sources, schedules, market providers, LLM provider, market universe, and prompts.

**Files:**

- Create: `packages/config/src/schema.ts`
- Create: `packages/config/src/load-config.ts`
- Create: `packages/config/src/defaults.ts`
- Create: `packages/config/src/example-config.ts`
- Modify: `packages/config/src/index.ts`
- Create: `config/stocker.example.yaml`
- Test: `packages/config/src/load-config.test.ts`

**Config Shape:**

```yaml
app:
  databasePath: '.stocker/stocker.sqlite'

sources:
  - id: 'hacker-news'
    type: 'rss'
    name: 'Hacker News'
    enabled: true
    url: 'https://news.ycombinator.com/rss'
    refreshMinutes: 60
  - id: 'reddit-stocks'
    type: 'reddit'
    name: 'Reddit Stocks'
    enabled: true
    feedUrl: 'https://www.reddit.com/r/stocks/.rss'
    refreshMinutes: 60

market:
  defaultUniverse: 'US'
  provider:
    type: 'yahoo-finance2'

llm:
  provider:
    type: 'openai-compatible'
    baseUrl: 'http://localhost:1234/v1'
    apiKeyEnv: 'LM_STUDIO_API_KEY'
    model: 'local-model'
  prompts:
    enrichmentSystem: 'You extract public-company stock relevance from article metadata.'
```

**Steps:**

- [x] Define Zod schemas for the config shape above.
- [x] Require unique source IDs.
- [x] Default `enabled` to `true`.
- [x] Default source `refreshMinutes` to `60`.
- [x] Default `market.defaultUniverse` to `US`.
- [x] Implement `loadConfig(path)` that reads YAML, validates it, applies defaults, and returns typed config.
- [x] Implement `loadConfigFromEnv()` using `STOCKER_CONFIG_PATH`, defaulting to `config/stocker.yaml`.
- [x] Add tests for valid config, duplicate source IDs, invalid source type, missing LLM model, and default values.

**Acceptance Criteria:**

- [x] Config validation fails with actionable error messages.
- [x] Example config validates.
- [x] Config package has no dependency on web or worker packages.

**Verification:**

```bash
pnpm --filter @stocker/config test
pnpm --filter @stocker/config typecheck
```

## TASK-010: Implement DB-Backed Job Service

**Status:** Done

**Dependencies:** TASK-008

**Goal:** Add application-level job enqueueing, claiming, retry, and completion behavior.

**Files:**

- Create: `packages/core/src/jobs/job-service.ts`
- Create: `packages/core/src/jobs/job-handlers.ts`
- Create: `packages/core/src/jobs/job-payloads.ts`
- Modify: `packages/core/src/index.ts`
- Test: `packages/core/src/jobs/job-service.test.ts`

**Job Payloads:**

`source.refresh`:

```json
{
  "sourceId": "reddit-stocks",
  "trigger": "manual"
}
```

`item.enrich`:

```json
{
  "sourceItemId": "item_123",
  "trigger": "source-refresh"
}
```

`stock.refresh`:

```json
{
  "sourceItemId": "item_123",
  "ticker": "AAPL",
  "trigger": "item-open"
}
```

**Steps:**

- [x] Define Zod schemas for each job payload.
- [x] Implement `enqueueSourceRefresh(sourceId, trigger)`.
- [x] Implement `enqueueItemEnrichment(sourceItemId, trigger)`.
- [x] Implement `enqueueStockRefresh(sourceItemId, ticker, trigger)`.
- [x] Implement `claimAndRunNextJob(workerId, handlers)`.
- [x] Retry failed jobs until `attempt_count` reaches `max_attempts`.
- [x] Mark failed jobs as `failed` after the final attempt.
- [x] Add tests for successful job, retryable failure, terminal failure, and invalid payload rejection.

**Acceptance Criteria:**

- [x] Job payloads are validated before execution.
- [x] Worker can claim jobs without web process involvement.
- [x] Failed jobs retain error messages.
- [x] Retry behavior is deterministic and tested.

**Verification:**

```bash
pnpm --filter @stocker/core test
pnpm --filter @stocker/core typecheck
```

## TASK-011: Connect Worker Runtime to Job Service

**Status:** Done

**Dependencies:** TASK-010

**Goal:** Make the worker process claim and execute DB-backed jobs through shared services.

**Files:**

- Modify: `apps/worker/src/runtime.ts`
- Modify: `apps/worker/src/index.ts`
- Test: `apps/worker/src/runtime.test.ts`

**Steps:**

- [x] Extend `createWorkerRuntime()` to accept config, database client, job service, handlers, worker ID, and polling interval.
- [x] Implement one `runOnce()` method that claims and executes at most one job.
- [x] Implement one `runLoop()` method that repeatedly calls `runOnce()` with a delay.
- [x] Keep signal handling in `apps/worker/src/index.ts`.
- [x] Add tests using fake job service and fake handlers.

**Acceptance Criteria:**

- [x] Worker can run one job for deterministic tests.
- [x] Worker loop is separate from job execution logic.
- [x] Worker does not import web code.

**Verification:**

```bash
pnpm --filter @stocker/worker test
pnpm --filter @stocker/worker typecheck
```

## Checkpoint: Data, Config, and Jobs Complete

- [x] Database schema exists and migrates.
- [x] Repositories are tested.
- [x] YAML config loads and validates.
- [x] DB-backed jobs enqueue, claim, retry, succeed, and fail.
- [x] Worker can execute jobs through shared services.
- [x] Root `pnpm test` and `pnpm typecheck` pass.
