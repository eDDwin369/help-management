# Support App — Backend

Production-grade Node.js + Express + TypeScript backend for the **Help & Support** feature.

## Stack

- **Runtime**: Node.js 20+
- **Framework**: Express 4
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL via Prisma
- **Validation**: Zod
- **Logging**: Winston (structured JSON in production)
- **Error monitoring**: Sentry
- **Testing**: Jest + Supertest
- **Lint/Format**: ESLint (flat config) + Prettier

## Architecture

Feature-based modules sit on top of a clean layered architecture:

```
src/
  config/         Centralized env + Prisma + Sentry initialization
  logger/         Winston logger
  middleware/     requestId, requestLogger, validate, errorHandler
  modules/
    support/      Feature module: routes → controller → service
  repositories/   Only layer permitted to talk to Prisma
  services/       Cross-feature services (e.g. mock chatbot)
  routes/         Root router (mounts feature routers) + health
  utils/          Errors, asyncHandler
  validations/    Zod schemas
  tests/          Unit + integration tests
```

### Layer rules (enforced by convention + reviews)

1. **Routes** wire middleware → controller. Nothing else.
2. **Controllers** are thin HTTP adapters. No business logic. No DB.
3. **Services** hold business logic. They know nothing about HTTP.
4. **Repositories** are the only layer allowed to import Prisma.
5. **Config** is the only file allowed to read `process.env`.

## Setup

```bash
# 1. Install
npm install

# 2. Create your env file from the example
cp .env.example .env
# edit DATABASE_URL etc.

# 3. Set up Postgres + run migrations
npm run prisma:migrate

# 4. Start dev server (hot reload)
npm run dev
```

The server listens on `http://localhost:4000` by default.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Hot-reloading dev server |
| `npm run build` | Type-check + compile to `dist/` |
| `npm start` | Run compiled output |
| `npm test` | Run all tests |
| `npm run test:coverage` | Tests + coverage |
| `npm run lint` | ESLint |
| `npm run lint:fix` | ESLint with autofix |
| `npm run format` | Prettier write |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run prisma:migrate` | Create + apply a migration in dev |
| `npm run prisma:deploy` | Apply migrations (CI / prod) |
| `npm run prisma:studio` | Open Prisma Studio |

## Environment variables

All env vars are validated on boot. Missing or invalid values cause the process to exit immediately.

| Variable | Required | Default | Notes |
|---|---|---|---|
| `NODE_ENV` | yes | `development` | `development` \| `test` \| `production` |
| `PORT` | yes | `4000` | |
| `DATABASE_URL` | yes | — | PostgreSQL connection string |
| `LOG_LEVEL` | no | `info` | `error` \| `warn` \| `info` \| `debug` |
| `CORS_ORIGIN` | yes | `http://localhost:5173` | Comma-separated list allowed |
| `SENTRY_DSN` | no | empty | Leave blank to disable Sentry |
| `SENTRY_TRACES_SAMPLE_RATE` | no | `0.1` | 0.0–1.0 |
| `APP_NAME` | yes | `support-app-backend` | |
| `APP_VERSION` | yes | `1.0.0` | |

## API

### `GET /health`

Liveness + DB readiness check. Returns 200 when both are healthy, 503 otherwise.

### `POST /api/v1/support/chat`

Request:

```json
{ "message": "I can't log in" }
```

Response `201`:

```json
{
  "data": {
    "sessionId": "uuid",
    "botResponse": "…",
    "resolutionStatus": "PENDING",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### `PATCH /api/v1/support/:id/status`

Request:

```json
{ "status": "RESOLVED" }
```

`status` must be `RESOLVED` or `NOT_RESOLVED`. Returns the updated session.

## Error responses

All errors share one shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "…",
    "details": { },
    "requestId": "…"
  }
}
```

## Logging

Winston emits JSON in production with `service`, `env`, `version`, and `requestId` on every line — ready for ingestion by a log aggregator.

In development the output is colorized and human-readable.

## Future-ready

- **AI integration**: the chatbot is behind a `ChatBot` interface. Swapping `mockChatBot` for an LLM-backed implementation requires no service changes.
- **Realtime / sockets**: `createApp` returns the Express `Application` and `server.ts` wraps it in an `http.Server`. Adding `socket.io` is a one-line attach to that same server.
