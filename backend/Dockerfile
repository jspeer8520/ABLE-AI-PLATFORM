# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# ABLE Backend — multi-stage production image.
# Build context must be the repository ROOT (pnpm workspace), e.g.:
#   docker build -f backend/Dockerfile -t able-backend .
#
# PREREQUISITE: the compiled runtime (`node dist/index.js`) requires the
# @able/db workspace package to emit compiled JavaScript. It currently ships
# TypeScript source consumed via bundler/tsx, so give @able/db a build step
# (tsc -> dist, exports pointing at the built files) before shipping this image.
# For local development, run the service on the host with `pnpm dev` against the
# Postgres/Redis containers from docker-compose.yml.
# ---------------------------------------------------------------------------

FROM node:22-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
# OpenSSL is required by the Prisma engine at runtime.
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /app

# --- Dependencies -----------------------------------------------------------
FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json turbo.json tsconfig.base.json ./
COPY backend/package.json ./backend/
COPY packages/db/package.json ./packages/db/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
  pnpm install --frozen-lockfile --filter @able/backend...

# --- Build ------------------------------------------------------------------
FROM deps AS build
COPY packages/db ./packages/db
COPY backend ./backend
# Generate the Prisma client, then compile the backend to dist/.
RUN pnpm --filter @able/db exec prisma generate
RUN pnpm --filter @able/backend build

# --- Runtime ----------------------------------------------------------------
FROM base AS runner
ENV NODE_ENV=production
# Copy the pruned production dependency graph and compiled output.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/backend/package.json ./backend/package.json

USER node
WORKDIR /app/backend
EXPOSE 4000
CMD ["node", "dist/index.js"]
