# @able/backend

Express 5 + TypeScript API service for the ABLE AI Platform. Provides the
production foundation: configuration, structured logging, error handling, JWT
auth utilities, PostgreSQL (Prisma) and Redis integration, and health probes.

## Stack

- **Runtime:** Node.js 22, TypeScript (strict mode)
- **HTTP:** Express 5, Helmet, CORS
- **Persistence:** PostgreSQL via Prisma (`@able/db`), Redis via `ioredis`
- **Auth:** JWT access/refresh utilities (`src/lib/jwt.ts`)
- **Logging:** `pino` + `pino-http` (structured, redacted; no `console`)
- **Validation:** `zod`
- **Tests:** Jest + ts-jest + supertest

## Prerequisites

- Node.js >= 22, pnpm >= 10
- Docker (for local Postgres + Redis)

## Run locally

From the repository root:

```bash
# 1. Install workspace dependencies
pnpm install

# 2. Generate the Prisma client
pnpm --filter @able/db prisma generate

# 3. Start Postgres + Redis
docker compose up -d

# 4. Sync the database schema
pnpm --filter @able/db db:push

# 5. Configure the backend environment
cp backend/.env.example backend/.env
#   Then set JWT_ACCESS_SECRET / JWT_REFRESH_SECRET (>= 32 chars each), e.g.:
#   openssl rand -base64 48

# 6. Start the backend (hot reload)
pnpm --filter @able/backend dev
```

The service listens on `http://localhost:4000`.

## Verify it works

```bash
# Liveness — process is up (no external calls)
curl -s http://localhost:4000/api/health
# {"status":"healthy","service":"able-backend","timestamp":"..."}

# Readiness — checks Postgres (SELECT 1) and Redis (PING)
curl -s http://localhost:4000/api/health/ready
# {"status":"ready","checks":{"database":true,"redis":true},"timestamp":"..."}

# Consistent 404 handling
curl -s http://localhost:4000/api/nope
# {"success":false,"error":{"code":"NOT_FOUND","message":"Route GET /api/nope not found"}}
```

## Scripts

| Command                                    | Description                     |
| ------------------------------------------ | ------------------------------- |
| `pnpm --filter @able/backend dev`          | Hot-reloading dev server (tsx)  |
| `pnpm --filter @able/backend build`        | Compile to `dist/`              |
| `pnpm --filter @able/backend type-check`   | `tsc --noEmit`                  |
| `pnpm --filter @able/backend lint`         | ESLint                          |
| `pnpm --filter @able/backend test`         | Jest test suite                 |
| `pnpm --filter @able/backend test:coverage`| Jest with coverage              |

## Layout

```
src/
  app.ts                     Express app assembly (no listen — importable by tests)
  index.ts                   Bootstrap: connect deps, listen, graceful shutdown
  config/env.ts              Zod-validated environment (fails fast on misconfig)
  lib/
    errors.ts                AppError hierarchy (typed HTTP errors)
    jwt.ts                   Sign/verify access & refresh tokens
    async-handler.ts         Async route error forwarding
  middleware/
    auth.ts                  requireAuth / requireRole
    error.ts                 notFoundHandler + central error handler
    request-logger.ts        pino-http request logging
    security.ts              Helmet
    validate.ts              Zod request validation
  services/
    database/prisma.ts       Prisma lifecycle + health check
    redis/redis.ts           Redis client + health check
    logging/logger.ts        pino logger (single logging entry point)
  api/routes/                health + readiness (feature routers added per phase)
  types/express.d.ts         Request.user augmentation
tests/                       jwt / errors / health (supertest)
```

## Notes

- **Secrets** are never committed. `.env` is git-ignored; only `.env.example`
  is tracked. The process refuses to boot without valid JWT secrets.
- **Production container:** `Dockerfile` is a template. Running the compiled
  image requires `@able/db` to ship compiled JS (it currently ships TypeScript
  source); see the header in `Dockerfile`.
