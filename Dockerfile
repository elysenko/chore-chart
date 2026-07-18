# syntax=docker/dockerfile:1
# Multi-stage build for the Next.js 15 (App Router) Chore Chart app.
#   Stage 1 (builder): install deps, generate the Prisma client, build Next.
#   Stage 2 (runner):  run `prisma migrate deploy` + idempotent seed, then serve.
# The seed prints SEED_CREDS_JSON to stdout so the deploy credential sync can
# capture demo logins. Both migrate and seed are idempotent, so re-running on
# every pod start is safe.

FROM node:20-slim AS builder
WORKDIR /app

# openssl + ca-certificates are required by Prisma's query engine.
RUN apt-get update -y \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# A dummy DATABASE_URL satisfies `prisma generate` at build time (no real DB
# connection is made during generate/build).
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

RUN apt-get update -y \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Full dependency tree (includes the Prisma CLI + tsx) so `prisma migrate deploy`
# and the tsx-based seed can run at container start.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.mjs ./next.config.mjs
COPY --from=builder /app/tsconfig.json ./tsconfig.json

EXPOSE 3000

# Apply pending migrations, seed (idempotent, emits SEED_CREDS_JSON), then serve.
# A migration failure exits non-zero so Kubernetes will not route traffic to a
# half-initialized pod.
CMD ["sh", "-c", "npx prisma migrate deploy && npx tsx prisma/seed.ts && npx next start -p ${PORT:-3000} -H 0.0.0.0"]
