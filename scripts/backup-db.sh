#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${ROOT}/.env"
BACKUP_DIR="${BACKUP_DIR:-${ROOT}/storage/backups}"

mkdir -p "$BACKUP_DIR"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing .env at $ENV_FILE" >&2
  exit 1
fi

# shellcheck disable=SC1090
source <(grep -E '^DATABASE_URL=' "$ENV_FILE" | sed 's/^/export /')

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is not set" >&2
  exit 1
fi

if [[ ! "$DATABASE_URL" =~ ^mysql://([^:@/]*):?([^@/]*)@([^:/]+):?([0-9]*)/(.+)$ ]]; then
  echo "Unsupported DATABASE_URL format" >&2
  exit 1
fi

USER="${BASH_REMATCH[1]}"
PASS="${BASH_REMATCH[2]}"
HOST="${BASH_REMATCH[3]}"
PORT="${BASH_REMATCH[4]:-3306}"
DB="${BASH_REMATCH[5]}"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="${BACKUP_DIR}/${DB}-${STAMP}.sql"

if [[ -n "$PASS" ]]; then
  mysqldump -h "$HOST" -P "$PORT" -u "$USER" -p"$PASS" "$DB" > "$OUT"
else
  mysqldump -h "$HOST" -P "$PORT" -u "$USER" "$DB" > "$OUT"
fi

echo "Backup saved: $OUT"
