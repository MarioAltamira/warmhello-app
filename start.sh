#!/bin/bash
set -e
cd "$(dirname "$0")"

# Load ALL key=value pairs from .env into process environment,
# stripping comments and blank lines.
if [ -f .env ]; then
  set -a
  while IFS= read -r rawline || [ -n "$rawline" ]; do
    # Strip any leading UTF-8 BOM bytes from start of line
    rawline="${rawline#$'\xef\xbb\xbf'}"
    # Trim leading/trailing whitespace
    rawline="$(printf '%s' "$rawline" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"
    # Skip blank lines and comments
    [[ -z "$rawline" || "$rawline" =~ ^# ]] && continue
    # Skip lines with no equals sign
    [[ "$rawline" != *"="* ]] && continue
    # Split ONLY at the FIRST equals sign (preserves '=' inside values like base64)
    key="${rawline%%=*}"
    value="${rawline#*=}"
    # Trim key whitespace again
    key="$(printf '%s' "$key" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"
    # Strip leading/trailing quotes and backticks from value (up to 3 layers)
    for _ in 1 2 3; do
      if [[ ${#value} -ge 2 ]]; then
        first="${value:0:1}"
        last="${value: -1}"
        if [[ ( "$first" == '"' && "$last" == '"' ) || ( "$first" == "'" && "$last" == "'" ) || ( "$first" == '`' && "$last" == '`' ) ]]; then
          value="${value:1:${#value}-2}"
        else
          break
        fi
      else
        break
      fi
    done
    # Skip empty keys (shouldn't happen)
    [[ -z "$key" ]] && continue
    export "$key=$value"
  done < .env
  set +a
fi

# Runtime defaults (can be overridden in .env)
export NODE_ENV="${NODE_ENV:-production}"
export PORT="${PORT:-8080}"

exec node --max-old-space-size=2048 ./node_modules/next/dist/bin/next start -p "$PORT"
