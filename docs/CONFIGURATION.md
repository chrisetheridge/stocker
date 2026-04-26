# Configuration

Stocker uses a local YAML config file.

## Config Path

- Default path: `config/stocker.yaml`
- Example path: `config/stocker.example.yaml`
- Override with `STOCKER_CONFIG_PATH`

## Shape

```yaml
app:
  databasePath: .stocker/stocker.sqlite
sources:
  - id: hacker-news
    type: rss
    name: Hacker News
    enabled: true
    refreshMinutes: 60
    url: https://news.ycombinator.com/rss
  - id: reddit-stocks
    type: reddit
    name: Reddit Stocks
    enabled: true
    refreshMinutes: 60
    feedUrl: https://www.reddit.com/r/stocks/.rss
market:
  defaultUniverse: US
  provider:
    type: yahoo-finance2
llm:
  provider:
    type: openai-compatible
    baseUrl: http://localhost:1234/v1
    apiKeyEnv: LM_STUDIO_API_KEY
    model: local-model
  prompts:
    enrichmentSystem: You extract public-company stock relevance from article metadata.
```

## `app`

- `databasePath`: local SQLite file path.

## `sources`

Each source entry is one adapter config.

Supported `type` values:

- `rss`
- `reddit`

Common fields:

- `id`: stable source identifier
- `name`: display name
- `enabled`: turns source on or off
- `refreshMinutes`: scheduler cadence

RSS/Atom fields:

- `url`: feed URL

Reddit fields:

- `feedUrl`: public Reddit feed URL

## `market`

- `defaultUniverse`: market universe label, default `US`
- `provider.type`: first v1 provider is `yahoo-finance2`

## `llm`

- `provider.type`: first v1 provider is `openai-compatible`
- `provider.baseUrl`: local OpenAI-compatible endpoint, such as LM Studio
- `provider.apiKeyEnv`: environment variable that holds the API key
- `provider.model`: model name sent to the endpoint
- `prompts.enrichmentSystem`: override for the system prompt used by enrichment

## Notes

- The LLM prompt can be overridden locally without changing application code.
- The database path is local-only and should stay outside version control.
- v1.0 must not use config to enable portfolio tracking, alerts, or investment advice.
