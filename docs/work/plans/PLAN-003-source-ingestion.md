# Source Ingestion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement plugin-like source adapters and source refresh services for RSS/Atom and Reddit public feed-style sources.

**Architecture:** Source adapters live in `@stocker/source-adapters` and normalize external source records into shared source item inputs. The refresh service lives in `@stocker/core`, loads configured source definitions, calls adapters, persists normalized items, updates source health, and enqueues enrichment jobs.

**Tech Stack:** TypeScript, Zod, RSS/Atom parser, fetch, Vitest, Drizzle repositories.

---

## Required Reading

- `docs/PRD_V1.md` sections `Source Configuration`, `Source Adapter Model`, and `Fetching`
- `docs/work/plans/PLAN-002-data-config-and-jobs.md`

## Source Adapter Contract

Every source adapter must:

- Declare one source type.
- Validate its own source-specific config.
- Fetch raw source records.
- Normalize raw records into shared source item inputs.
- Return source health information.
- Avoid direct database access.

## TASK-012: Define Source Adapter Interface

**Status:** Ready

**Dependencies:** TASK-009

**Goal:** Create the plugin-like base interface that all source adapters implement.

**Files:**

- Create: `packages/source-adapters/src/types.ts`
- Create: `packages/source-adapters/src/registry.ts`
- Modify: `packages/source-adapters/src/index.ts`
- Test: `packages/source-adapters/src/registry.test.ts`

**Interface Requirements:**

Define these exported types:

```ts
export type SourceAdapterType = "rss" | "reddit";

export type NormalizedSourceItemInput = {
  sourceId: string;
  externalId: string;
  canonicalUrl: string;
  title: string;
  summary?: string;
  author?: string;
  publishedAt?: string;
  fetchedAt: string;
  sourceMetadata: Record<string, unknown>;
};

export type SourceFetchResult = {
  items: NormalizedSourceItemInput[];
  fetchedAt: string;
  warnings: string[];
};

export type SourceAdapter<TConfig> = {
  readonly type: SourceAdapterType;
  validateConfig(input: unknown): TConfig;
  fetchItems(config: TConfig, context: SourceFetchContext): Promise<SourceFetchResult>;
};
```

`SourceFetchContext` must include:

```text
sourceId
sourceName
now
fetch
logger
```

**Steps:**

- [ ] Write registry tests first.
- [ ] Implement `createSourceAdapterRegistry(adapters)`.
- [ ] Registry must reject duplicate adapter types.
- [ ] Registry must return adapter by source type.
- [ ] Registry must throw an actionable error for unknown source types.

**Acceptance Criteria:**

- [ ] Adding a new source requires implementing `SourceAdapter<TConfig>` and registering it.
- [ ] Registry is tested for duplicate and unknown source behavior.

**Verification:**

```bash
pnpm --filter @stocker/source-adapters test
pnpm --filter @stocker/source-adapters typecheck
```

## TASK-013: Implement RSS/Atom Adapter

**Status:** Ready

**Dependencies:** TASK-012

**Goal:** Fetch RSS/Atom feeds and normalize feed entries into source items.

**Files:**

- Create: `packages/source-adapters/src/rss/rss-config.ts`
- Create: `packages/source-adapters/src/rss/rss-adapter.ts`
- Create: `packages/source-adapters/src/rss/rss-normalize.ts`
- Create: `packages/source-adapters/src/rss/rss-fixtures.ts`
- Modify: `packages/source-adapters/src/index.ts`
- Test: `packages/source-adapters/src/rss/rss-adapter.test.ts`

**RSS Config Schema:**

```ts
{
  id: string;
  type: "rss";
  name: string;
  enabled: boolean;
  url: string;
  refreshMinutes: number;
}
```

**Normalization Rules:**

- `externalId`: use feed item GUID if available, otherwise canonical URL.
- `canonicalUrl`: use item link. Reject item if no link exists.
- `title`: use item title. Reject item if title is empty.
- `summary`: use content snippet, description, or summary field.
- `author`: use creator or author field when available.
- `publishedAt`: use ISO string if pubDate or isoDate is available.
- `sourceMetadata`: include original GUID, categories, feed title, and raw published date when available.

**Steps:**

- [ ] Add unit tests with fixture XML for RSS and Atom.
- [ ] Test malformed feed response returns a thrown error with feed URL.
- [ ] Test entries without title or link are skipped and produce warnings.
- [ ] Implement config validation.
- [ ] Implement fetch with injected `context.fetch`.
- [ ] Implement normalization.

**Acceptance Criteria:**

- [ ] RSS and Atom fixture feeds normalize into `NormalizedSourceItemInput`.
- [ ] Invalid item records do not crash the whole feed.
- [ ] Feed-level failures are surfaced to the source refresh service.

**Verification:**

```bash
pnpm --filter @stocker/source-adapters test
pnpm --filter @stocker/source-adapters typecheck
```

## TASK-014: Implement Reddit Public Feed Adapter

**Status:** Ready

**Dependencies:** TASK-012

**Goal:** Fetch Reddit public RSS feeds and normalize posts into source items.

**Files:**

- Create: `packages/source-adapters/src/reddit/reddit-config.ts`
- Create: `packages/source-adapters/src/reddit/reddit-adapter.ts`
- Create: `packages/source-adapters/src/reddit/reddit-normalize.ts`
- Create: `packages/source-adapters/src/reddit/reddit-fixtures.ts`
- Modify: `packages/source-adapters/src/index.ts`
- Test: `packages/source-adapters/src/reddit/reddit-adapter.test.ts`

**Reddit Config Schema:**

```ts
{
  id: string;
  type: "reddit";
  name: string;
  enabled: boolean;
  feedUrl: string;
  refreshMinutes: number;
}
```

**Normalization Rules:**

- `externalId`: use Reddit post ID or entry ID.
- `canonicalUrl`: use Reddit comments URL if present; otherwise entry link.
- `title`: use post title.
- `summary`: use post text/content snippet from feed.
- `author`: use Reddit author when available.
- `publishedAt`: use post published timestamp when available.
- `sourceMetadata`: include subreddit, score if present in feed, comments URL, outbound URL, and original entry ID.

**Steps:**

- [ ] Add tests with a Reddit RSS fixture containing a link post and a text post.
- [ ] Verify both post types are accepted.
- [ ] Verify missing title or link skips the item with a warning.
- [ ] Implement config validation.
- [ ] Implement fetch with a user-agent header suitable for a local app.
- [ ] Normalize Reddit-specific metadata without fetching comments.

**Acceptance Criteria:**

- [ ] Reddit public feed posts become inbox items.
- [ ] Link posts and text posts are both supported.
- [ ] Reddit comment summaries are not implemented in v1.0.

**Verification:**

```bash
pnpm --filter @stocker/source-adapters test
pnpm --filter @stocker/source-adapters typecheck
```

## TASK-015: Implement Source Refresh Service

**Status:** Ready

**Dependencies:** TASK-008, TASK-010, TASK-013, TASK-014

**Goal:** Refresh configured sources, persist normalized items, update source health, and enqueue enrichment jobs for new items.

**Files:**

- Create: `packages/core/src/sources/source-refresh-service.ts`
- Create: `packages/core/src/sources/source-scheduler.ts`
- Create: `packages/core/src/sources/source-status-service.ts`
- Modify: `packages/core/src/index.ts`
- Test: `packages/core/src/sources/source-refresh-service.test.ts`

**Service Methods:**

```text
refreshSource(sourceId, trigger)
refreshAllEnabledSources(trigger)
scheduleDueSourceRefreshJobs(now)
listSourceStatus()
```

**Steps:**

- [ ] Write tests with fake repositories, fake adapters, and fake job service.
- [ ] Test successful refresh inserts source items and enqueues one `item.enrich` job per new item.
- [ ] Test duplicate source items do not enqueue duplicate enrichment jobs.
- [ ] Test adapter failure updates source health with error message.
- [ ] Test disabled source is skipped.
- [ ] Implement service methods.
- [ ] Ensure refresh service does not import web or worker code.

**Acceptance Criteria:**

- [ ] Manual refresh can refresh one source.
- [ ] Scheduled refresh can enqueue due source refresh jobs.
- [ ] Source health records last success and last error.
- [ ] New items enter the inbox with `enrichment_state = pending`.
- [ ] New items enqueue enrichment jobs.

**Verification:**

```bash
pnpm --filter @stocker/core test
pnpm --filter @stocker/core typecheck
```

## TASK-016: Wire Source Refresh Job Handler

**Status:** Ready

**Dependencies:** TASK-015

**Goal:** Connect `source.refresh` jobs to the source refresh service.

**Files:**

- Modify: `packages/core/src/jobs/job-handlers.ts`
- Test: `packages/core/src/jobs/source-refresh-handler.test.ts`

**Steps:**

- [ ] Add handler for `source.refresh` payloads.
- [ ] Handler must call `refreshSource(sourceId, trigger)`.
- [ ] Handler must throw an error if source ID does not exist.
- [ ] Add tests for success and missing source.

**Acceptance Criteria:**

- [ ] Worker can execute source refresh jobs through job handlers.
- [ ] Handler uses shared services only.

**Verification:**

```bash
pnpm --filter @stocker/core test
pnpm --filter @stocker/core typecheck
```

## Checkpoint: Source Ingestion Complete

- [ ] RSS adapter works against fixtures.
- [ ] Reddit feed adapter works against fixtures.
- [ ] Source adapter registry rejects invalid registrations.
- [ ] Source refresh service persists items and source health.
- [ ] New items enqueue enrichment jobs.
- [ ] Source refresh jobs execute through the worker job system.
- [ ] Root `pnpm test` and `pnpm typecheck` pass.

