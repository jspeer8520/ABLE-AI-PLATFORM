# Backend Agents

This folder contains helper files and scripts for working with the backend agent API.

The backend service exposes agent execution endpoints under `/api/agents`:

- `POST /api/agents/run` — starts a new agent execution
- `GET /api/agents/:id` — retrieves agent execution status

## Supported agents

- `security-agent`
- `coding-agent`
- `research-agent`
- `business-agent`
- `support-agent`

## Usage

1. Start the backend service:

```bash
cd /workspaces/ABLE-AI-PLATFORM/backend
pnpm dev
```

2. Run an agent:

```bash
cd /workspaces/ABLE-AI-PLATFORM/backend/agents
./run-agent.sh security-agent "Audit the application for security issues"
```

3. Poll agent status:

```bash
./check-agent-status.sh <executionId>
```
