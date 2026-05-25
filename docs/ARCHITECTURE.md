# Architecture

## Goals

This scaffold is shaped around six non-negotiables stated in the brief:

1. Scalable
2. Modular
3. Maintainable
4. TDD-friendly
5. Future-ready for AI integration
6. Future-ready for realtime / socket communication

Every architectural decision below traces back to one of those.

---

## High-level shape

```
┌──────────────────────────────┐         ┌──────────────────────────────┐
│        Frontend (SPA)        │         │      Backend (Express API)   │
│                              │         │                              │
│  ┌────────────────────────┐  │         │  ┌────────────────────────┐  │
│  │   modules/support      │  │         │  │  modules/support       │  │
│  │  (feature components)  │  │         │  │ routes → controller →  │  │
│  └────────────┬───────────┘  │         │  │       service          │  │
│               ▼              │         │  └────────────┬───────────┘  │
│  ┌────────────────────────┐  │  HTTP   │               ▼              │
│  │  hooks (TanStack Query)│──┼─────────┼─▶│   repositories (Prisma)   │
│  └────────────┬───────────┘  │         │  └────────────┬───────────┘  │
│               ▼              │         │               ▼              │
│  ┌────────────────────────┐  │         │       ┌──────────────┐       │
│  │ services/apiClient     │  │         │       │  PostgreSQL  │       │
│  │ (axios + interceptors) │  │         │       └──────────────┘       │
│  └────────────────────────┘  │         │                              │
│                              │         │                              │
│  Zustand (UI state only)     │         │  Cross-cutting: Winston,     │
│  TanStack Query (server      │         │  Sentry, Zod validation,     │
│   state cache)               │         │  central error handler       │
└──────────────────────────────┘         └──────────────────────────────┘
```

---

## Backend layering

```
HTTP request
   │
   ▼
┌──────────────────────┐
│  middleware          │  requestId · logger · validate · errorHandler
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│  routes              │  Wire middleware → controller. Nothing else.
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│  controllers         │  Thin HTTP adapter: parse req → call service →
│                      │  shape response. NO business logic. NO DB.
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│  services            │  Business logic. Knows nothing about HTTP.
│                      │  Dependencies injected (testable).
└──────────┬───────────┘
           ▼
┌──────────────────────┐
│  repositories        │  ONLY place Prisma is imported.
└──────────┬───────────┘
           ▼
      PostgreSQL
```

### Why this shape?

- **Controllers are thin** so the test surface is the service, not the request lifecycle. You can refactor HTTP shapes without rewriting tests.
- **Services depend on injected interfaces** (`ChatBot`, `SupportRepository`), so unit tests run with fakes and integration tests run with real implementations — the same code path either way.
- **Repositories own Prisma**, so swapping the ORM or sharding the DB later is a localized change.
- **Config owns `process.env`**, so misconfiguration fails at boot, not at the 4 a.m. request that triggers an undefined value.

### Cross-cutting middleware order

```
1. Sentry request handler   (must be first to instrument everything)
2. helmet                   (security headers)
3. cors                     (validated origin list)
4. express.json             (with size limit)
5. requestId                (UUID per request, propagated in logs + response header)
6. requestLogger            (single log line per request on `finish`)
7. ... routes ...
8. notFoundHandler          (terminal 404)
9. errorHandler             (central error boundary)
```

The error handler is the **single funnel** for everything thrown anywhere below it. It distinguishes:

- `ZodError` → 400 with field details
- `AppError` (operational) → its status code, no Sentry noise
- everything else → 500 + Sentry capture with request context

---

## Frontend layering

```
Pages / route components
        │
        ▼
Feature components  (modules/support/*)
        │
        ▼
Hooks (TanStack Query) ──── reads UI state ──▶  Zustand store
        │
        ▼
Service layer (*.api.ts)
        │
        ▼
apiClient (axios + interceptors)
```

### State separation

| Kind of state | Lives in |
|---|---|
| Anything fetched from the server | TanStack Query cache |
| Modal open/closed, draft text, current session | Zustand |
| Form field values during edit | Local `useState` |

Mixing server state into Zustand or `useState` is the most common cause of stale UI; we keep it strictly out.

### Cross-cutting

- **ErrorBoundary** wraps the whole app and reports caught render errors to Sentry.
- **axios interceptor** normalizes errors into `ApiError` and captures 5xx + network failures to Sentry.
- **Centralized config** validates `import.meta.env` once at startup.

---

## Data model

```
SupportSession
  ├─ id                UUID            (PK)
  ├─ userMessage       text
  ├─ botResponse       text
  ├─ resolutionStatus  enum            (PENDING | RESOLVED | NOT_RESOLVED)
  ├─ createdAt         timestamp
  └─ updatedAt         timestamp
```

Indexed on `resolutionStatus` and `createdAt` so a future "admin dashboard" can filter and paginate efficiently.

---

## Future-readiness

### AI integration

The chatbot is hidden behind an interface:

```ts
export interface ChatBot {
  reply(userMessage: string): Promise<ChatBotResponse>;
}
```

The support service depends on this interface, not on the mock. Swap the mock for an LLM-backed implementation in `services/chatBot.service.ts` and nothing else changes — including tests, which inject fakes through the same interface.

### Realtime / sockets

`createApp()` returns the Express `Application`. `server.ts` wraps it in an `http.Server` separately. To add websockets:

```ts
import { Server as SocketServer } from 'socket.io';

const httpServer = http.createServer(createApp());
const io = new SocketServer(httpServer, { cors: { origin: config.cors.origin } });
```

The HTTP request/response pipeline isn't touched. New socket-driven features land in a new `modules/<feature>/<feature>.gateway.ts` file alongside the existing controller.

### New features

To add a feature (say, "feedback"):

1. `src/modules/feedback/` — routes, controller, service.
2. `src/repositories/feedback.repository.ts` — DB access.
3. `src/validations/feedback.schema.ts` — Zod schemas.
4. `src/modules/feedback/feedback.routes.ts` mounted in `src/routes/index.ts`.

Same shape on the frontend:

1. `src/modules/feedback/` — components.
2. `src/services/feedback.api.ts` — HTTP client.
3. `src/hooks/useFeedback.ts` — TanStack Query hooks.

No global state needs to change.

---

## Observability

- **Logs**: structured JSON in production, correlated by `requestId` end-to-end (the frontend sends `x-request-id`, the backend echoes it back).
- **Errors**: Sentry on both sides, tagged with environment, release, requestId, and request context.
- **Health**: `GET /health` pings the DB; a load balancer or k8s probe gets 503 when degraded.

---

## What's deliberately excluded

- **Auth**: out of scope for this scaffold. Add an `auth` middleware between `requestLogger` and the routes, plus a `users` module on the same layered pattern.
- **Rate limiting**: same; drop in `express-rate-limit` as middleware.
- **Caching layer**: TanStack Query handles client-side caching. Server-side caching (Redis) would live in a `cache/` service consumed by repositories.

These are intentional omissions so the scaffold stays focused; the architecture has clean seams for all of them.
