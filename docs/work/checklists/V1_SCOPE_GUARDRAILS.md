# V1 Scope Guardrails

Use this checklist to confirm v1.0 did not drift into out-of-scope product behavior.

## Search Command

```bash
rg -n "buy|sell|hold|recommendation|portfolio|position|shares|cost basis|alert|notification|iframe|webview|Flipboard|comment summary|watchlist|TanStack Table|data grid|DataGrid" apps packages docs
```

## Review Notes

- [x] No buy/sell/hold recommendation UI. Hits are limited to docs, prompt text, and tests that explicitly forbid recommendations.
- [x] No portfolio holdings, positions, shares, cost basis, allocation, or returns UI. Hits are limited to docs and future-planning notes.
- [x] No alerts or notifications. Hits are limited to docs and future-planning notes.
- [x] No historical price tracking feature. No product code implements it.
- [x] No full-text article extraction. No product code implements it.
- [x] No embedded article reader or iframe/webview. No product code implements it.
- [x] No CLI/TUI client. No product code implements it.
- [x] No auth or multi-user support. No product code implements it.
- [x] No user-facing plugin marketplace. No product code implements it.
- [x] No Flipboard integration. Hits are limited to docs/FUTURE references.
- [x] No Reddit comment summaries. No product code implements it.
- [x] No discovered watchlist. Hits are limited to docs/FUTURE references.
- [x] No table/data-grid dependency for the inbox. No product code implements it.

## Expected Outcome

- Search hits reviewed: product code is free of out-of-scope features.
- Remaining hits are intentional references in docs, prompt text, fixtures, or future-planning notes.
- No UI, service, or adapter code introduces the blocked behaviors.
