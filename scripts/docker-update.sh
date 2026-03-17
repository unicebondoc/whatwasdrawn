#!/usr/bin/env bash
# Rebuild and restart Docker services so code changes are reflected.
# Usage: ./scripts/docker-update.sh [frontend|backend|all]

set -e
cd "$(dirname "$0")/.."

SERVICE="${1:-frontend}"

case "$SERVICE" in
  frontend)
    docker compose build frontend --no-cache
    docker compose up -d frontend
    echo "Frontend rebuilt and restarted. Open http://localhost:3000"
    ;;
  backend)
    docker compose build backend --no-cache
    docker compose up -d backend
    echo "Backend rebuilt and restarted."
    ;;
  all)
    docker compose build --no-cache
    docker compose up -d
    echo "All services rebuilt and restarted."
    ;;
  *)
    echo "Usage: $0 [frontend|backend|all]"
    exit 1
    ;;
esac
