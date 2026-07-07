#!/usr/bin/env bash
set -euo pipefail

EXECUTION_ID=${1:-}

if [ -z "$EXECUTION_ID" ]; then
  echo "Usage: $0 <executionId>"
  exit 1
fi

RESPONSE=$(curl -s "http://localhost:4000/api/agents/$EXECUTION_ID")
echo "$RESPONSE"
