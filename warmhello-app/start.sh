#!/bin/bash
set -e
cd "$(dirname "$0")"

# Load ALL key=value pairs from .env into process environment,
# stripping comments and blank lines.
if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi

# Runtime defaults (can be overridden in .env)
export NODE_ENV="${NODE_ENV:-production}"
export PORT="${PORT:-8080}"

exec node --max-old-space-size=4096 ./node_modules/next/dist/bin/next start -p "$PORT"
