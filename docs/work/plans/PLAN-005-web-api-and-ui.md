# Web API and UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the v1.0 web experience: combined inbox, filters, item details, enrichment state display, source status, save-for-research actions, retries, stock refresh, and ticker corrections.

**Architecture:** Next.js renders the web app. tRPC routers are thin adapters over shared services. React components use custom inbox/list/filter UI with Tailwind and shadcn-style primitives. No core product logic belongs in React components or tRPC routers.

**Tech Stack:** Next.js, React, tRPC, Tailwind CSS, shadcn-style primitives, Zod, shared `@stocker/core` services.

---

## Required Reading

- `docs/PRD_V1.md` sections `Combined Inbox`, `Item Detail Page`, `UX Requirements`, and `Service Core Requirement`
- `docs/STACK.md` section `Web App`
- `docs/work/plans/PLAN-004-market-llm-and-enrichment.md`

## UI Product Rules

- The first screen is the app inbox, not a landing page.
- The inbox is a custom list/filter interface, not a data table.
- UI text must not imply investment advice.
- Original articles/posts open externally.
- Uncertain matches and failed enrichment remain visible.
- Saved state means saved for stock research.

## TASK-025: Implement Application Service Facade

**Status:** Done

**Dependencies:** TASK-015, TASK-022, TASK-024

**Goal:** Create a single service construction boundary used by web, worker, and future CLI/TUI.

**Files:**

- Create: `packages/core/src/app/create-app-services.ts`
- Create: `packages/core/src/app/app-services.ts`
- Modify: `packages/core/src/index.ts`
- Test: `packages/core/src/app/create-app-services.test.ts`

**Service Facade Must Expose:**

```text
inboxService
itemService
sourceRefreshService
sourceStatusService
jobService
itemEnrichmentService
stockRefreshService
correctionService
```

**Steps:**

- [ ] Write tests using fake dependencies.
- [ ] Implement `createAppServices(dependencies)`.
- [ ] Ensure construction accepts config, repositories, adapter registry, market provider registry, LLM provider, and logger.
- [ ] Ensure web and worker can import the same service facade.

**Acceptance Criteria:**

- [ ] Web does not manually construct individual repositories/providers.
- [ ] Worker does not manually construct individual repositories/providers.
- [ ] App service construction is centralized.

**Verification:**

```bash
pnpm --filter @stocker/core test
pnpm --filter @stocker/core typecheck
```

## TASK-026: Implement Inbox and Item Services

**Status:** Done

**Dependencies:** TASK-008, TASK-022

**Goal:** Provide service-level operations required by the web UI and future clients.

**Files:**

- Create: `packages/core/src/inbox/inbox-service.ts`
- Create: `packages/core/src/items/item-service.ts`
- Modify: `packages/core/src/index.ts`
- Test: `packages/core/src/inbox/inbox-service.test.ts`
- Test: `packages/core/src/items/item-service.test.ts`

**Service Methods:**

`InboxService`:

```text
listInboxItems(filters)
```

`ItemService`:

```text
getItemDetail(itemId)
markReadState(itemId, readState)
setSavedForResearch(itemId, saved)
retryEnrichment(itemId)
refreshStockDataForItem(itemId)
```

**Filter Inputs:**

```text
sourceId
ticker
company
readState
savedForResearch
enrichmentState
query
```

**Steps:**

- [ ] Write tests for each filter.
- [ ] Write tests for saved research toggling.
- [ ] Write tests for retry enrichment enqueuing `item.enrich`.
- [ ] Write tests for stock refresh enqueuing `stock.refresh` for item tickers.
- [ ] Implement services with repository and job-service dependencies.

**Acceptance Criteria:**

- [ ] Inbox filtering exists at service layer.
- [ ] Retry and refresh actions enqueue jobs rather than running provider code directly.
- [ ] Saved research state is persisted through service methods.

**Verification:**

```bash
pnpm --filter @stocker/core test
pnpm --filter @stocker/core typecheck
```

## TASK-027: Implement tRPC Routers

**Status:** Done

**Dependencies:** TASK-025, TASK-026

**Goal:** Expose web API procedures as thin wrappers over application services.

**Files:**

- Create or modify: `apps/web/src/server/api/root.ts`
- Create: `apps/web/src/server/api/routers/inbox.ts`
- Create: `apps/web/src/server/api/routers/items.ts`
- Create: `apps/web/src/server/api/routers/sources.ts`
- Create: `apps/web/src/server/api/routers/corrections.ts`
- Create: `apps/web/src/server/services.ts`
- Test: `apps/web/src/server/api/routers/router-contract.test.ts`

**Routers and Procedures:**

`inbox`:

```text
list(filters)
```

`items`:

```text
detail({ itemId })
markRead({ itemId, readState })
saveForResearch({ itemId, saved })
retryEnrichment({ itemId })
refreshStockData({ itemId })
```

`sources`:

```text
status()
refresh({ sourceId })
refreshAll()
```

`corrections`:

```text
list()
apply({ companyName, ticker, exchange, notes })
remove({ correctionId })
```

**Steps:**

- [ ] Define Zod input schemas at router boundary.
- [ ] Ensure routers call only app services.
- [ ] Do not import repositories directly in routers.
- [ ] Add tests with fake services verifying router-to-service delegation.

**Acceptance Criteria:**

- [ ] tRPC routers are thin.
- [ ] All web actions required by PRD are exposed.
- [ ] Router inputs are runtime-validated with Zod.

**Verification:**

```bash
pnpm --filter @stocker/web test
pnpm --filter @stocker/web typecheck
```

## TASK-028: Build App Shell and Navigation

**Status:** Done

**Dependencies:** TASK-027

**Goal:** Replace starter UI with the Stocker app shell.

**Files:**

- Modify: `apps/web/src/app/layout.tsx`
- Modify: `apps/web/src/app/page.tsx`
- Create: `apps/web/src/app/items/[itemId]/page.tsx`
- Create: `apps/web/src/app/sources/page.tsx`
- Create: `apps/web/src/components/app-shell.tsx`
- Create: `apps/web/src/components/nav.tsx`
- Create: `apps/web/src/styles/globals.css` or equivalent Tailwind entry

**UI Structure:**

```text
Top-level app shell
  Left or top navigation
  Main content area
  Inbox route at /
  Item detail route at /items/[itemId]
  Source status route at /sources
```

**Steps:**

- [ ] Remove starter marketing content.
- [ ] Make `/` render the inbox screen.
- [ ] Add navigation links for Inbox and Sources.
- [ ] Keep visual style dense, readable, and morning-triage oriented.
- [ ] Use shadcn-style primitives for buttons, badges, inputs, dropdowns, and dialogs.

**Acceptance Criteria:**

- [ ] App opens directly to inbox.
- [ ] No landing page exists.
- [ ] Navigation supports inbox, item details, and source status.

**Verification:**

```bash
pnpm --filter @stocker/web typecheck
pnpm --filter @stocker/web build
```

Manual:

```text
Open the web app and confirm the first screen is the inbox.
```

## TASK-029: Build Inbox List and Filters

**Status:** Done

**Dependencies:** TASK-027, TASK-028

**Goal:** Implement combined inbox UI with filters and compact enrichment context.

**Files:**

- Create: `apps/web/src/features/inbox/inbox-screen.tsx`
- Create: `apps/web/src/features/inbox/inbox-filters.tsx`
- Create: `apps/web/src/features/inbox/inbox-item-card.tsx`
- Create: `apps/web/src/features/inbox/stock-chip.tsx`
- Create: `apps/web/src/features/inbox/enrichment-state-badge.tsx`
- Create: `apps/web/src/features/inbox/saved-research-toggle.tsx`
- Test: `apps/web/src/features/inbox/inbox-components.test.tsx`

**Filter Controls:**

- Source
- Company or ticker
- Read state
- Saved state
- Enrichment state
- Text query

**Inbox Card Must Show:**

- Title
- Source name
- Published or fetched date
- Summary/snippet when available
- Enrichment state
- Compact stock chips for validated high-confidence matches
- Needs-review indicator when applicable
- Saved-for-research control
- External open action

**Steps:**

- [ ] Write component tests for filter state rendering.
- [ ] Write component tests for enrichment state badges.
- [ ] Write component tests ensuring needs-review is visible.
- [ ] Implement inbox screen using `api.inbox.list`.
- [ ] Ensure filters update query state or local component state consistently.
- [ ] Do not use a data table/grid dependency.

**Acceptance Criteria:**

- [ ] Combined inbox displays items from all sources.
- [ ] Filters call service-backed tRPC procedure.
- [ ] Validated stocks appear as compact chips.
- [ ] Failed and pending enrichment states are visible.
- [ ] Saved state can be toggled from inbox.

**Verification:**

```bash
pnpm --filter @stocker/web test
pnpm --filter @stocker/web typecheck
pnpm --filter @stocker/web build
```

## TASK-030: Build Item Detail Page

**Status:** Done

**Dependencies:** TASK-027, TASK-028

**Goal:** Implement the item detail page with richer enrichment, stock data, uncertainty, retries, stock refresh, corrections, and external source link.

**Files:**

- Create: `apps/web/src/features/items/item-detail-screen.tsx`
- Create: `apps/web/src/features/items/company-card.tsx`
- Create: `apps/web/src/features/items/stock-snapshot-card.tsx`
- Create: `apps/web/src/features/items/enrichment-actions.tsx`
- Create: `apps/web/src/features/items/correction-dialog.tsx`
- Create: `apps/web/src/features/items/external-link-button.tsx`
- Modify: `apps/web/src/app/items/[itemId]/page.tsx`
- Test: `apps/web/src/features/items/item-detail-components.test.tsx`

**Detail Page Must Show:**

- Title
- Source
- Original external link
- Summary/snippet/post text/metadata
- Enrichment status
- Detected companies
- Relationship type
- Relevance explanation
- Confidence and needs-review status
- Stock data when available
- Stale indicator when using stale cached stock data
- Retry enrichment action for failed state
- Manual stock refresh action
- Save-for-research action
- Correction dialog for company/ticker match

**Steps:**

- [ ] Write tests for complete enrichment rendering.
- [ ] Write tests for failed enrichment rendering with retry action.
- [ ] Write tests for needs-review company rendering.
- [ ] Write tests for stale stock snapshot indicator.
- [ ] Implement item detail screen using `api.items.detail`.
- [ ] Implement correction dialog using `api.corrections.apply`.
- [ ] Ensure external links open in a new tab with safe attributes.

**Acceptance Criteria:**

- [ ] Item detail page covers every PRD-required field.
- [ ] Retry and stock refresh actions call tRPC mutations.
- [ ] Correction dialog applies global correction through service layer.
- [ ] Page never embeds original article content.

**Verification:**

```bash
pnpm --filter @stocker/web test
pnpm --filter @stocker/web typecheck
pnpm --filter @stocker/web build
```

## TASK-031: Build Source Status Page

**Status:** Done

**Dependencies:** TASK-027, TASK-028

**Goal:** Show configured source status and provide manual refresh actions.

**Files:**

- Create: `apps/web/src/features/sources/source-status-screen.tsx`
- Create: `apps/web/src/features/sources/source-status-card.tsx`
- Modify: `apps/web/src/app/sources/page.tsx`
- Test: `apps/web/src/features/sources/source-status-components.test.tsx`

**Source Status Must Show:**

- Source name
- Source type
- Enabled state
- Last fetched time
- Last success time
- Last error time
- Last error message
- Manual refresh action

**Steps:**

- [ ] Write tests for healthy source rendering.
- [ ] Write tests for failed source rendering.
- [ ] Implement screen using `api.sources.status`.
- [ ] Implement refresh action using `api.sources.refresh`.
- [ ] Implement refresh all action using `api.sources.refreshAll`.

**Acceptance Criteria:**

- [ ] User can see active source health.
- [ ] User can manually refresh one source.
- [ ] User can manually refresh all enabled sources.

**Verification:**

```bash
pnpm --filter @stocker/web test
pnpm --filter @stocker/web typecheck
pnpm --filter @stocker/web build
```

## TASK-032: Add Empty, Loading, and Error States

**Status:** Done

**Dependencies:** TASK-029, TASK-030, TASK-031

**Goal:** Make the web UI usable when there is no data, pending enrichment, or service errors.

**Files:**

- Create: `apps/web/src/components/empty-state.tsx`
- Create: `apps/web/src/components/error-state.tsx`
- Create: `apps/web/src/components/loading-state.tsx`
- Modify: `apps/web/src/features/inbox/inbox-screen.tsx`
- Modify: `apps/web/src/features/items/item-detail-screen.tsx`
- Modify: `apps/web/src/features/sources/source-status-screen.tsx`
- Test: `apps/web/src/components/state-components.test.tsx`

**Required States:**

- Empty inbox with configured-source guidance.
- Empty filtered inbox with clear-filter action.
- Pending enrichment badge and neutral copy.
- Failed enrichment with retry action.
- Source fetch failure with visible error.
- Item not found.

**Steps:**

- [ ] Add shared state components.
- [ ] Add tests for empty inbox and failed enrichment.
- [ ] Wire states into screens.
- [ ] Ensure UI copy does not suggest investment advice.

**Acceptance Criteria:**

- [ ] Empty and error states are explicit.
- [ ] Failed enrichment remains actionable.
- [ ] Users can recover from filters that hide all items.

**Verification:**

```bash
pnpm --filter @stocker/web test
pnpm --filter @stocker/web typecheck
pnpm --filter @stocker/web build
```

## Checkpoint: Web API and UI Complete

- [x] tRPC routers expose required service operations.
- [x] Inbox is the first screen.
- [x] Inbox filters source, ticker/company, read state, saved state, and enrichment state.
- [x] Item detail shows enrichment and stock context.
- [x] Source status page shows health and refresh actions.
- [x] Failed enrichment and needs-review states are visible.
- [x] Root `pnpm test`, `pnpm typecheck`, and web build pass.
