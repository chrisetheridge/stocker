# V1 Acceptance Checklist

This checklist maps every `docs/PRD_V1.md` v1.0 acceptance criterion to a verification action.

## Automated Verification

- [x] YAML config can define RSS/Atom and Reddit public feed-style sources.
  - Check: `pnpm --filter @stocker/config test`
  - Check: inspect `config/stocker.example.yaml`
- [x] Scheduled and manual fetching populate a combined inbox.
  - Check: `pnpm --filter @stocker/core test`
  - Check: `pnpm --filter @stocker/worker test`
- [x] Items are enriched in the background.
  - Check: `pnpm --filter @stocker/core test`
- [x] Inbox shows enrichment states and compact company/stock context.
  - Check: `pnpm --filter @stocker/web test`
- [x] Detail page shows richer enrichment, stock data, uncertainty, and external links.
  - Check: `pnpm --filter @stocker/web test`
- [x] Failed enrichment remains visible and can be retried.
  - Check: `pnpm --filter @stocker/core test`
  - Check: `pnpm --filter @stocker/web test`
- [x] Market-data failures degrade to stale snapshots or company-only context.
  - Check: `pnpm --filter @stocker/core test`
  - Check: `pnpm --filter @stocker/web test`
- [x] Items can be saved for stock research.
  - Check: `pnpm --filter @stocker/core test`
  - Check: `pnpm --filter @stocker/web test`
- [x] Company/ticker corrections apply globally and can be removed.
  - Check: `pnpm --filter @stocker/core test`
  - Check: `pnpm --filter @stocker/web test`
- [x] Web UI uses reusable service operations rather than embedding source/enrichment logic directly.
  - Check: `pnpm lint`
  - Check: `pnpm test`

## Manual Browser Checks

- [ ] Open app and confirm it lands directly in the inbox.
- [ ] Confirm inbox filters work for source, company/ticker, read state, saved state, and enrichment state.
- [ ] Confirm item detail opens the original item externally.
- [ ] Confirm failed enrichment shows a retry action.
- [ ] Confirm stale stock data is visibly marked stale.
- [ ] Confirm saved-for-research state is visible and filterable.
- [ ] Confirm corrections can be applied and removed from the UI.
- [ ] Confirm source status page shows success and failure state.

## Automated Commands Run

- `pnpm --filter @stocker/config test`
- `pnpm --filter @stocker/core test`
- `pnpm --filter @stocker/db test`
- `pnpm --filter @stocker/web test`
- `pnpm --filter @stocker/web build`
- `pnpm --filter @stocker/db seed:dev`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `sh scripts/verify-v1-local.sh`

## PRD Acceptance Criteria

- [ ] YAML config defines RSS/Atom and Reddit public feed-style sources.
- [ ] Scheduled and manual fetching populate a combined inbox.
- [ ] Items are enriched in the background.
- [ ] Inbox shows enrichment states and compact company/stock context.
- [ ] Detail page shows richer enrichment, stock data, uncertainty, and external links.
- [ ] Failed enrichment remains visible and can be retried.
- [ ] Market-data failures degrade to stale snapshots or company-only context.
- [ ] Items can be saved for stock research.
- [ ] Company/ticker corrections apply globally and can be removed.
- [ ] Web UI uses reusable service operations rather than embedding source/enrichment logic directly.
