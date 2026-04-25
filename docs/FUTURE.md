# Stocker Future Roadmap

## Purpose

This document tracks important ideas that are intentionally outside the v1.0 PRD or planned for later staged releases.

Do not treat these as v1.0 requirements.

## v1.1: Research Trail Extensions

### Discovered Watchlist

Add a passive watchlist derived from saved research items.

The watchlist should summarize tickers connected to saved items. It should not become a portfolio tracker.

Expected capabilities:

- List tickers discovered from saved research items
- Show count of saved items per ticker
- Link each ticker back to saved source items
- Allow manual removal or hiding of a ticker from the discovered watchlist
- Avoid portfolio fields such as shares, cost basis, allocation, or returns

### Reddit Discussion Signals

Add a separate discussion-signals section for Reddit items.

The app may summarize top comments, but comment analysis must be visually and semantically separate from article/post evidence.

Expected capabilities:

- Fetch top comments for configured Reddit items when available
- Summarize discussion themes
- Show caveats that Reddit comments are noisy and lower-authority evidence
- Avoid letting comment summaries drive primary company/ticker matching unless explicitly designed later

## v1.2: CLI and TUI

Add a CLI and TUI over the reusable local service core.

The CLI/TUI should support processing the enriched inbox, not full article reading, unless full-text extraction has been added by then.

Expected capabilities:

- Refresh sources
- List inbox items
- Filter by source, ticker, saved state, read state, and enrichment state
- Show item details
- Save or unsave items for stock research
- Retry failed enrichment
- Show source status
- Open original links externally

## Later: Article Extraction

Full-text extraction may become valuable if Stocker should evolve from an intelligence inbox into a true reader.

This would add significant complexity:

- Paywalls and partial content
- Site-specific extraction failures
- Readability quality
- Legal and terms-of-service considerations
- Storage and re-rendering of article content

If added, it should be treated as a dedicated project, not a small enhancement.

## Later: Flipboard

Flipboard support is desirable but not required in v1.0.

Potential approaches:

- Use RSS-like feeds if Flipboard exposes them for the user's use case
- Support manual shared links into Stocker
- Use browser automation only if there is no stable feed/API path and the maintenance burden is acceptable

Flipboard should not distort the source adapter model until its integration path is proven.

## Later: Automation API

Expose stable automation hooks once the service command model has settled.

Potential capabilities:

- Trigger source refresh from scripts
- Export enriched inbox items
- Export saved research items
- Run enrichment retries
- Query items by ticker or source

This should build on the same service core used by the web app and future CLI/TUI.

## Later: Full Research Trail

The product may eventually support a richer research trail.

Potential capabilities:

- Notes on saved items
- Manual tags
- Research status
- Links between related items
- Export to Markdown or another personal knowledge system

This should stay separate from portfolio tracking.

## Later: Recommendations

Buy, sell, or hold recommendations are intentionally excluded from v1.0.

If considered later, this should be designed with explicit constraints around investment advice, explainability, data quality, and user expectations.

## Later: Historical Stock Context

Historical stock observations are intentionally excluded from v1.0.

Potential future uses:

- Show stock movement since article publication
- Compare enrichment-time price to current price
- Add basic trend context to saved research items

This should not become portfolio performance tracking.

## Later: Alerts

Alerts and notifications are intentionally excluded from v1.0.

Potential future uses:

- Notify when a saved ticker appears in new source items
- Notify when enrichment repeatedly fails
- Notify when sources stop fetching successfully

Price alerts should be treated carefully because they move the product closer to a market-monitoring tool.
