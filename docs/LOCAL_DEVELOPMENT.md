# Local Development

Use this flow for first-time setup and everyday local work.

## 1. Install Dependencies

```bash
pnpm install
```

## 2. Create Local Config

```bash
cp config/stocker.example.yaml config/stocker.yaml
```

Edit `config/stocker.yaml` to point at your local RSS, Reddit, market-data, and LLM setup.

## 3. Run Migrations

```bash
pnpm --filter @stocker/db migrate
```

This creates or updates the local SQLite database.

## 4. Start App

```bash
pnpm --filter @stocker/web dev
pnpm --filter @stocker/worker dev
```

The web app is the main interface. The worker handles background fetching, enrichment, and stock refresh jobs.

## 5. Optional Seed Data

```bash
pnpm --filter @stocker/db seed:dev
```

This loads deterministic local sample data for UI inspection and manual verification.

## 6. Run Checks

```bash
pnpm format
pnpm lint
pnpm typecheck
pnpm test
pnpm --filter @stocker/web build
```

For the release gate, also run:

```bash
sh scripts/verify-v1-local.sh
```

## Operational Notes

- The default config path is `config/stocker.yaml`.
- Use `STOCKER_CONFIG_PATH` to point at a different YAML file.
- The default database path is `.stocker/stocker.sqlite`.
- LM Studio or another OpenAI-compatible local endpoint is the expected first LLM runtime.
- v1.0 is local-first and single-user.
- v1.0 is not a broker, portfolio tracker, or recommendation engine.
