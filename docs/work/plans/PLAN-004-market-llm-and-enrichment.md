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

**Status:** Ready

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

- [ ] Write registry tests first.
- [ ] Implement provider registry with duplicate-provider rejection.
- [ ] Validate provider output with Zod before returning to callers.

**Acceptance Criteria:**

- [ ] Market-data callers depend on `MarketDataProvider`.
- [ ] Provider registry rejects duplicate provider types.
- [ ] Output schemas reject malformed snapshots.

**Verification:**

```bash
pnpm --filter @stocker/market-data test
pnpm --filter @stocker/market-data typecheck
```

## TASK-018: Implement Yahoo Finance Market Provider

**Status:** Ready

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

- [ ] Add `yahoo-finance2` dependency to `@stocker/market-data`.
- [ ] Write tests using fixtures, not live network calls.
- [ ] Mock `yahoo-finance2` in unit tests.
- [ ] Implement `searchCompanies(query, universe)`.
- [ ] Implement `getSnapshot(input)`.
- [ ] Return `null` when provider returns no equity-like result.
- [ ] Preserve raw provider data for debugging.

**Acceptance Criteria:**

- [ ] Provider returns required v1.0 fields when available.
- [ ] Missing optional market fields do not fail the whole snapshot.
- [ ] Live provider dependency is isolated to this adapter.

**Verification:**

```bash
pnpm --filter @stocker/market-data test
pnpm --filter @stocker/market-data typecheck
```

## TASK-019: Define LLM Provider and Enrichment Output Schemas

**Status:** Ready

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

- [ ] Write schema tests for valid output.
- [ ] Write schema tests rejecting missing company name, invalid relationship type, empty explanation, and confidence outside `0..1`.
- [ ] Implement prompt builder that accepts item title, summary, source metadata, and prompt override config.
- [ ] Ensure prompt text explicitly forbids buy/sell/hold recommendations.
- [ ] Ensure prompt text asks for evidence text when available.

**Acceptance Criteria:**

- [ ] LLM structured output schema is centralized.
- [ ] Prompt builder can be configured but still enforces no-investment-advice boundaries.

**Verification:**

```bash
pnpm --filter @stocker/llm test
pnpm --filter @stocker/llm typecheck
```

## TASK-020: Implement AI SDK OpenAI-Compatible LLM Provider

**Status:** Ready

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

- [ ] Read installed AI SDK docs before writing code.
- [ ] Use `createOpenAICompatible` from `@ai-sdk/openai-compatible`.
- [ ] Use `generateText` with structured output support for the installed AI SDK version.
- [ ] Keep raw AI SDK calls inside `@stocker/llm`.
- [ ] Implement `extractStockRelevance(input)` returning parsed enrichment output.
- [ ] Add tests with a fake model/generation function instead of live LM Studio.
- [ ] Add one skipped or separately documented manual smoke command for LM Studio local endpoint.

**Acceptance Criteria:**

- [ ] App-level LLM service returns schema-validated structured output.
- [ ] Bad model output fails with a typed validation error.
- [ ] No code outside `@stocker/llm` directly calls AI SDK functions.

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

**Status:** Ready

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

- [ ] Write tests for correction-first matching.
- [ ] Write tests for validated ticker hint.
- [ ] Write tests for ambiguous search result.
- [ ] Write tests for no market data.
- [ ] Implement matching service using injected repositories and market provider.
- [ ] Ensure explanations come from LLM output but ticker facts come from provider/corrections.

**Acceptance Criteria:**

- [ ] Corrections override LLM hints.
- [ ] Uncertain matches are visible as `needs_review`.
- [ ] Ticker values are only stored when corrected or provider-validated.

**Verification:**

```bash
pnpm --filter @stocker/core test
pnpm --filter @stocker/core typecheck
```

## TASK-022: Implement Item Enrichment Service

**Status:** Ready

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

- [ ] Write tests for complete enrichment.
- [ ] Write tests for needs-review enrichment.
- [ ] Write tests for LLM failure.
- [ ] Write tests for market data failure with and without cached snapshot.
- [ ] Start an enrichment run before calling LLM.
- [ ] Build LLM input from title, summary, author, source metadata, and canonical URL.
- [ ] Persist raw LLM output on the enrichment run.
- [ ] Replace item companies for the item atomically.
- [ ] Insert stock snapshots for successful market lookups.
- [ ] Set item `enrichment_state` to `complete`, `needs_review`, or `failed`.
- [ ] Persist failure error message when enrichment fails.

**Acceptance Criteria:**

- [ ] Enrichment failures leave item visible.
- [ ] Needs-review results are persisted.
- [ ] Stale cached snapshots can be shown when live market data fails.
- [ ] LLM output is never persisted as trusted stock data without matching validation.

**Verification:**

```bash
pnpm --filter @stocker/core test
pnpm --filter @stocker/core typecheck
```

## TASK-023: Wire Enrichment and Stock Refresh Job Handlers

**Status:** Ready

**Dependencies:** TASK-022

**Goal:** Connect `item.enrich` and `stock.refresh` jobs to enrichment and market-data services.

**Files:**

- Modify: `packages/core/src/jobs/job-handlers.ts`
- Create: `packages/core/src/market/stock-refresh-service.ts`
- Test: `packages/core/src/jobs/enrichment-handlers.test.ts`
- Test: `packages/core/src/market/stock-refresh-service.test.ts`

**Steps:**

- [ ] Add `item.enrich` handler that calls `enrichItem(sourceItemId, trigger)`.
- [ ] Add `stock.refresh` handler that refreshes one ticker snapshot and associates visibility with the item detail flow.
- [ ] Add tests for successful enrichment job.
- [ ] Add tests for enrichment job failure and retry behavior.
- [ ] Add tests for stock refresh with provider failure and cached snapshot fallback.

**Acceptance Criteria:**

- [ ] Worker can execute enrichment jobs.
- [ ] Worker can execute stock refresh jobs.
- [ ] Retry behavior comes from the shared job service.

**Verification:**

```bash
pnpm --filter @stocker/core test
pnpm --filter @stocker/core typecheck
```

## TASK-024: Implement Correction Service

**Status:** Ready

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

- [ ] Write tests for applying a correction.
- [ ] Write tests for disabling a correction.
- [ ] Write tests for duplicate correction upsert.
- [ ] Implement service methods using repository layer.

**Acceptance Criteria:**

- [ ] Corrections apply globally.
- [ ] Corrections are removable by disabling, not deleting.
- [ ] Matcher can consume enabled corrections.

**Verification:**

```bash
pnpm --filter @stocker/core test
pnpm --filter @stocker/core typecheck
```

## Checkpoint: Enrichment Complete

- [ ] Market-data interface exists.
- [ ] Yahoo provider adapter is isolated and tested with fixtures.
- [ ] LLM provider is AI SDK-backed and schema-validated.
- [ ] Matching honors corrections before LLM/provider guesses.
- [ ] Enrichment persists complete, needs-review, and failed states.
- [ ] Enrichment and stock refresh jobs run through worker handlers.
- [ ] Root `pnpm test` and `pnpm typecheck` pass.
