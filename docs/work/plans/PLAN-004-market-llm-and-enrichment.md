# Market, LLM, and Enrichment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement market-data adapters, AI SDK-backed local LLM enrichment, company/ticker matching, correction rules, and item enrichment job handling.

**Architecture:** Provider-specific code lives behind interfaces. The enrichment service orchestrates LLM extraction, ticker correction lookup, market-data validation, stock snapshot persistence, confidence status assignment, and item enrichment state updates.

**Tech Stack:** Vercel AI SDK, `@ai-sdk/openai-compatible`, Zod, `yahoo-finance2`, TypeScript, Vitest.

---

## Required Reading

- `docs/PRD_V1.md` sections `LLM Enrichment`, `Market Data`, `Company/Ticker Matching`, and `Manual Corrections`
- `docs/STACK.md`
- AI SDK docs for the installed version before writing AI SDK code

## Enrichment Boundary

LLM output is advisory. Market facts must come from market-data providers or company-reference data.

The enrichment service must:

- Extract companies and relationships from item metadata.
- Apply global ticker corrections before provider guessing.
- Validate ticker/company candidates through market data.
- Persist stock snapshots when available.
- Mark uncertain matches as `needs_review`.
- Keep failed enrichment visible and retryable.

## TASK-017: Define Market Data Provider Interface

**Status:** Done

**Dependencies:** TASK-006

**Goal:** Define a provider-agnostic contract for stock lookup and snapshot normalization.

**Files:**

- Create: `packages/market-data/src/types.ts`
- Create: `packages/market-data/src/provider-registry.ts`
- Modify: `packages/market-data/src/index.ts`
- Test: `packages/market-data/src/provider-registry.test.ts`

**Interface Requirements:**

```ts
export type MarketDataProviderType = 'yahoo-finance2';

export type StockLookupInput = {
  ticker: string;
  exchange?: string;
  universe: string;
};

export type StockSnapshotInput = {
  ticker: string;
  exchange?: string;
  companyName?: string;
  price?: number;
  currency?: string;
  dailyChange?: number;
  dailyChangePercent?: number;
  marketCap?: number;
  sector?: string;
  provider: MarketDataProviderType;
  capturedAt: string;
  staleAfter: string;
  raw: Record<string, unknown>;
};

export type CompanySearchResult = {
  companyName: string;
  ticker: string;
  exchange?: string;
  sector?: string;
  confidence: number;
  raw: Record<string, unknown>;
};

export type MarketDataProvider = {
  readonly type: MarketDataProviderType;
  searchCompanies(
    query: string,
    universe: string,
  ): Promise<CompanySearchResult[]>;
  getSnapshot(input: StockLookupInput): Promise<StockSnapshotInput | null>;
};
```

**Steps:**

- [x] Write registry tests first.
- [x] Implement provider registry with duplicate-provider rejection.
- [x] Validate provider output with Zod before returning to callers.

**Acceptance Criteria:**

- [x] Market-data callers depend on `MarketDataProvider`.
- [x] Provider registry rejects duplicate provider types.
- [x] Output schemas reject malformed snapshots.

**Verification:**

```bash
pnpm --filter @stocker/market-data test
pnpm --filter @stocker/market-data typecheck
```

## TASK-018: Implement Yahoo Finance Market Provider

**Status:** Done

**Dependencies:** TASK-017

**Goal:** Implement `yahoo-finance2` as the first market-data provider adapter.

**Files:**

- Create: `packages/market-data/src/yahoo/yahoo-finance-provider.ts`
- Create: `packages/market-data/src/yahoo/yahoo-normalize.ts`
- Create: `packages/market-data/src/yahoo/yahoo-fixtures.ts`
- Modify: `packages/market-data/src/index.ts`
- Test: `packages/market-data/src/yahoo/yahoo-finance-provider.test.ts`

**Normalization Rules:**

- `ticker`: from Yahoo `symbol`
- `companyName`: prefer `longName`, then `shortName`, then `displayName`
- `price`: from `regularMarketPrice`
- `currency`: from `currency`
- `dailyChange`: from `regularMarketChange`
- `dailyChangePercent`: from `regularMarketChangePercent`
- `marketCap`: from `marketCap`
- `sector`: from `quoteSummary.assetProfile.sector` or equivalent provider field when available
- `capturedAt`: service-provided current timestamp
- `staleAfter`: `capturedAt + 15 minutes`
- `raw`: provider response object

**Steps:**

- [x] Add `yahoo-finance2` dependency to `@stocker/market-data`.
- [x] Write tests using fixtures, not live network calls.
- [x] Mock `yahoo-finance2` in unit tests.
- [x] Implement `searchCompanies(query, universe)`.
- [x] Implement `getSnapshot(input)`.
- [x] Return `null` when provider returns no equity-like result.
- [x] Preserve raw provider data for debugging.

**Acceptance Criteria:**

- [x] Provider returns required v1.0 fields when available.
- [x] Missing optional market fields do not fail the whole snapshot.
- [x] Live provider dependency is isolated to this adapter.

**Verification:**

```bash
pnpm --filter @stocker/market-data test
pnpm --filter @stocker/market-data typecheck
```

## TASK-019: Define LLM Provider and Enrichment Output Schemas

**Status:** Done

**Dependencies:** TASK-006, TASK-009

**Goal:** Define app-level LLM/enrichment contracts before integrating the AI SDK.

**Files:**

- Create: `packages/llm/src/types.ts`
- Create: `packages/llm/src/enrichment-schema.ts`
- Create: `packages/llm/src/prompt-template.ts`
- Modify: `packages/llm/src/index.ts`
- Test: `packages/llm/src/enrichment-schema.test.ts`

**LLM Output Schema:**

```ts
{
  companies: [
    {
      companyName: string;
      tickerHint?: string;
      relationshipType: "mentioned" | "competitor" | "customer" | "supplier";
      relevanceExplanation: string;
      confidence: number;
      evidenceText?: string;
    }
  ]
}
```

**Validation Rules:**

- `companies` must be an array.
- `companyName` must be non-empty.
- `relevanceExplanation` must be non-empty.
- `confidence` must be between `0` and `1`.
- `tickerHint` is optional and must not be treated as validated stock data.

**Steps:**

- [x] Write schema tests for valid output.
- [x] Write schema tests rejecting missing company name, invalid relationship type, empty explanation, and confidence outside `0..1`.
- [x] Implement prompt builder that accepts item title, summary, source metadata, and prompt override config.
- [x] Ensure prompt text explicitly forbids buy/sell/hold recommendations.
- [x] Ensure prompt text asks for evidence text when available.

**Acceptance Criteria:**

- [x] LLM structured output schema is centralized.
- [x] Prompt builder can be configured but still enforces no-investment-advice boundaries.

**Verification:**

```bash
pnpm --filter @stocker/llm test
pnpm --filter @stocker/llm typecheck
```

## TASK-020: Implement AI SDK OpenAI-Compatible LLM Provider

**Status:** Done

**Dependencies:** TASK-019

**Goal:** Use Vercel AI SDK to call LM Studio or another OpenAI-compatible endpoint for structured enrichment.

**Files:**

- Create: `packages/llm/src/openai-compatible/openai-compatible-provider.ts`
- Create: `packages/llm/src/openai-compatible/model-factory.ts`
- Modify: `packages/llm/src/index.ts`
- Test: `packages/llm/src/openai-compatible/openai-compatible-provider.test.ts`

**Package Requirements:**

- Add `ai`.
- Add `@ai-sdk/openai-compatible`.

**Steps:**

- [x] Read installed AI SDK docs before writing code.
- [x] Use `createOpenAICompatible` from `@ai-sdk/openai-compatible`.
- [x] Use `generateText` with structured output support for the installed AI SDK version.
- [x] Keep raw AI SDK calls inside `@stocker/llm`.
- [x] Implement `extractStockRelevance(input)` returning parsed enrichment output.
- [x] Add tests with a fake model/generation function instead of live LM Studio.
- [x] Add one skipped or separately documented manual smoke command for LM Studio local endpoint.

**Acceptance Criteria:**

- [x] App-level LLM service returns schema-validated structured output.
- [x] Bad model output fails with a typed validation error.
- [x] No code outside `@stocker/llm` directly calls AI SDK functions.

**Verification:**

```bash
pnpm --filter @stocker/llm test
pnpm --filter @stocker/llm typecheck
```

Manual smoke check when LM Studio is running:

```bash
LM_STUDIO_API_KEY=local pnpm --filter @stocker/llm smoke:local
```

Expected:

```text
The smoke command prints validated structured enrichment JSON for a sample item.
```

## TASK-021: Implement Company/Ticker Matching Service

**Status:** Done

**Dependencies:** TASK-008, TASK-018, TASK-019

**Goal:** Convert LLM company candidates into validated or needs-review item-company records.

**Files:**

- Create: `packages/core/src/enrichment/company-matcher.ts`
- Create: `packages/core/src/enrichment/confidence.ts`
- Modify: `packages/core/src/index.ts`
- Test: `packages/core/src/enrichment/company-matcher.test.ts`

**Matching Rules:**

- Check enabled ticker corrections by exact normalized company name first.
- If correction exists, use corrected ticker and mark as `validated` if market snapshot lookup succeeds.
- If no correction exists and LLM provides `tickerHint`, validate it through market data.
- If no ticker hint exists, search market provider by company name.
- Mark match as `validated` when confidence is at least `0.75` and market data returns a matching equity-like result.
- Mark match as `needs_review` when confidence is below `0.75`, market search has multiple plausible results, or market data is unavailable.
- Never invent a ticker when no provider result exists.

**Steps:**

- [x] Write tests for correction-first matching.
- [x] Write tests for validated ticker hint.
- [x] Write tests for ambiguous search result.
- [x] Write tests for no market data.
- [x] Implement matching service using injected repositories and market provider.
- [x] Ensure explanations come from LLM output but ticker facts come from provider/corrections.

**Acceptance Criteria:**

- [x] Corrections override LLM hints.
- [x] Uncertain matches are visible as `needs_review`.
- [x] Ticker values are only stored when corrected or provider-validated.

**Verification:**

```bash
pnpm --filter @stocker/core test
pnpm --filter @stocker/core typecheck
```

## TASK-022: Implement Item Enrichment Service

**Status:** Done

**Dependencies:** TASK-021

**Goal:** Enrich one source item by calling the LLM provider, matching companies, persisting enrichment results, and updating item state.

**Files:**

- Create: `packages/core/src/enrichment/item-enrichment-service.ts`
- Create: `packages/core/src/enrichment/enrichment-errors.ts`
- Modify: `packages/core/src/index.ts`
- Test: `packages/core/src/enrichment/item-enrichment-service.test.ts`

**Service Method:**

```text
enrichItem(sourceItemId, trigger)
```

**Steps:**

- [x] Write tests for complete enrichment.
- [x] Write tests for needs-review enrichment.
- [x] Write tests for LLM failure.
- [x] Write tests for market data failure with and without cached snapshot.
- [x] Start an enrichment run before calling LLM.
- [x] Build LLM input from title, summary, author, source metadata, and canonical URL.
- [x] Persist raw LLM output on the enrichment run.
- [x] Replace item companies for the item atomically.
- [x] Insert stock snapshots for successful market lookups.
- [x] Set item `enrichment_state` to `complete`, `needs_review`, or `failed`.
- [x] Persist failure error message when enrichment fails.

**Acceptance Criteria:**

- [x] Enrichment failures leave item visible.
- [x] Needs-review results are persisted.
- [x] Stale cached snapshots can be shown when live market data fails.
- [x] LLM output is never persisted as trusted stock data without matching validation.

**Verification:**

```bash
pnpm --filter @stocker/core test
pnpm --filter @stocker/core typecheck
```

## TASK-023: Wire Enrichment and Stock Refresh Job Handlers

**Status:** Done

**Dependencies:** TASK-022

**Goal:** Connect `item.enrich` and `stock.refresh` jobs to enrichment and market-data services.

**Files:**

- Modify: `packages/core/src/jobs/job-handlers.ts`
- Create: `packages/core/src/market/stock-refresh-service.ts`
- Test: `packages/core/src/jobs/enrichment-handlers.test.ts`
- Test: `packages/core/src/market/stock-refresh-service.test.ts`

**Steps:**

- [x] Add `item.enrich` handler that calls `enrichItem(sourceItemId, trigger)`.
- [x] Add `stock.refresh` handler that refreshes one ticker snapshot and associates visibility with the item detail flow.
- [x] Add tests for successful enrichment job.
- [x] Add tests for enrichment job failure and retry behavior.
- [x] Add tests for stock refresh with provider failure and cached snapshot fallback.

**Acceptance Criteria:**

- [x] Worker can execute enrichment jobs.
- [x] Worker can execute stock refresh jobs.
- [x] Retry behavior comes from the shared job service.

**Verification:**

```bash
pnpm --filter @stocker/core test
pnpm --filter @stocker/core typecheck
```

## TASK-024: Implement Correction Service

**Status:** Done

**Dependencies:** TASK-008, TASK-021

**Goal:** Provide application operations for listing, applying, and removing global ticker corrections.

**Files:**

- Create: `packages/core/src/corrections/correction-service.ts`
- Modify: `packages/core/src/index.ts`
- Test: `packages/core/src/corrections/correction-service.test.ts`

**Service Methods:**

```text
listCorrections()
applyTickerCorrection(companyName, ticker, exchange, notes)
removeTickerCorrection(correctionId)
```

**Steps:**

- [x] Write tests for applying a correction.
- [x] Write tests for disabling a correction.
- [x] Write tests for duplicate correction upsert.
- [x] Implement service methods using repository layer.

**Acceptance Criteria:**

- [x] Corrections apply globally.
- [x] Corrections are removable by disabling, not deleting.
- [x] Matcher can consume enabled corrections.

**Verification:**

```bash
pnpm --filter @stocker/core test
pnpm --filter @stocker/core typecheck
```

## Checkpoint: Enrichment Complete

- [x] Market-data interface exists.
- [x] Yahoo provider adapter is isolated and tested with fixtures.
- [x] LLM provider is AI SDK-backed and schema-validated.
- [x] Matching honors corrections before LLM/provider guesses.
- [x] Enrichment persists complete, needs-review, and failed states.
- [x] Enrichment and stock refresh jobs run through worker handlers.
- [x] Root `pnpm test` and `pnpm typecheck` pass.
