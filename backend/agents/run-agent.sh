#!/usr/bin/env bash
set -euo pipefail

AGENT=${1:-}
TASK=${2:-}

if [ -z "$AGENT" ] || [ -z "$TASK" ]; then
  echo "Usage: $0 <agent> <task>"
  exit 1
fi

RESPONSE=$(curl -s -X POST "http://localhost:4000/api/agents/run" \
  -H "Content-Type: application/json" \
  -d "{\"agent\": \"$AGENT\", \"task\": \"$TASK\"}")

echo "$RESPONSE"
