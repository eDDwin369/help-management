# ──────────────────────────────────────────────────────────────────
# Backend – development image
#
# Build context: repo root (set via docker-compose `context: .`)
# This lets us COPY the root package.json, which the backend
# references as "support-app": "file:.." in its own package.json.
# ──────────────────────────────────────────────────────────────────
FROM node:20-slim

WORKDIR /app

# Install OpenSSL required by Prisma
RUN apt-get update -y && apt-get install -y openssl

# ── 1. Dependency manifests ────────────────────────────────────────
# Copy root package.json first — npm needs it to resolve the
# "support-app": "file:.." workspace-style dependency declared in
# backend/package.json.
COPY package.json ./

# Copy backend manifests separately so this layer is only
# invalidated when dependencies change, not on every source edit.
COPY backend/package.json ./backend/
COPY backend/package-lock.json* ./backend/

# ── 2. Install dependencies ────────────────────────────────────────
WORKDIR /app/backend

# --ignore-scripts prevents the root package's `prepare` hook (husky)
# from running inside the container where there is no git repo.
# Prisma client generation is handled explicitly in CMD instead.
RUN npm install --ignore-scripts

# ── 3. Source files ────────────────────────────────────────────────
WORKDIR /app
COPY backend/ ./backend/

# ── 4. Runtime .env placeholder ───────────────────────────────────
# dotenv-safe opens this file on boot; all real values are injected
# by docker-compose `environment:` and are already in process.env,
# so an empty file satisfies the existence check without overriding
# anything.
RUN touch /app/backend/.env

WORKDIR /app/backend

EXPOSE 4000

# ── 5. Entrypoint ─────────────────────────────────────────────────
# 1. Generate Prisma client (must run before the app imports it)
# 2. Sync Prisma schema → DB (idempotent; creates tables on first run)
# 3. Start ts-node-dev with hot reload
CMD ["sh", "-c", "npx prisma generate && npx prisma db push && npm run dev"]
