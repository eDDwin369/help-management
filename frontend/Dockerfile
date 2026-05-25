# ──────────────────────────────────────────────────────────────────
# Frontend – development image
#
# Build context: repo root (set via docker-compose `context: .`)
# This lets us COPY the root package.json, which the frontend
# references as "support-app": "file:.." in its own package.json.
# ──────────────────────────────────────────────────────────────────
FROM node:20-slim

WORKDIR /app

# ── 1. Dependency manifests ────────────────────────────────────────
# Copy root package.json first — npm needs it to resolve the
# "support-app": "file:.." workspace-style dependency.
COPY package.json ./

# Copy frontend manifests separately for layer caching.
COPY frontend/package.json ./frontend/
COPY frontend/package-lock.json* ./frontend/

# ── 2. Install dependencies ────────────────────────────────────────
WORKDIR /app/frontend

# --ignore-scripts prevents the root package's `prepare` hook (husky)
# from running inside the container where there is no git repo.
RUN npm install --ignore-scripts

# ── 3. Source files ────────────────────────────────────────────────
WORKDIR /app
COPY frontend/ ./frontend/

# ── 4. Vite .env baseline ─────────────────────────────────────────
# Seed .env from .env.example so Vite always has a valid env file.
# docker-compose `environment:` values override these at runtime
# because process.env takes precedence over .env files in Vite.
RUN cp /app/frontend/.env.example /app/frontend/.env

WORKDIR /app/frontend

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]
