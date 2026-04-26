#!/usr/bin/env sh

set -eu

pnpm format
pnpm lint
pnpm typecheck
pnpm test
pnpm --filter @stocker/web build

echo "All automated checks pass."
