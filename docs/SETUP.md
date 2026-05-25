# Setup Guide

## Prerequisites

- **Node.js** 20+ (`node --version`)
- **npm** 10+ (ships with Node 20)
- **PostgreSQL** 14+ running locally, or a connection string to a hosted instance

If you don't have Postgres locally, the fastest path is Docker:

```bash
docker run --name support-app-pg \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=support_app \
  -p 5432:5432 \
  -d postgres:16
```

## 1. Install dependencies

```bash
npm run install:all
```

This installs:
- root (Husky + lint-staged)
- `backend/`
- `frontend/`

## 2. Configure environments

### Backend

```bash
cp backend/.env.example backend/.env
```

Required values:

| Variable | Example |
|---|---|
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/support_app?schema=public` |
| `PORT` | `4000` |
| `CORS_ORIGIN` | `http://localhost:5173` |

Optional:

| Variable | Notes |
|---|---|
| `SENTRY_DSN` | Leave blank to disable Sentry reporting |
| `LOG_LEVEL` | `info` for normal use, `debug` while developing |

The process **fails to start** if `DATABASE_URL` is missing or malformed — by design.

### Frontend

```bash
cp frontend/.env.example frontend/.env
```

Required:

| Variable | Example |
|---|---|
| `VITE_API_BASE_URL` | `http://localhost:4000` |
| `VITE_APP_ENV` | `development` |

## 3. Run database migrations

```bash
npm --prefix backend run prisma:migrate
```

This generates the Prisma client AND creates the `support_sessions` table. The first run will prompt for a migration name — anything works (e.g. `init`).

To open Prisma Studio (a GUI for browsing data):

```bash
npm --prefix backend run prisma:studio
```

## 4. Enable the Husky pre-commit hook

After cloning, make the hook executable once:

```bash
chmod +x .husky/pre-commit
```

(Husky doesn't preserve the executable bit across `git clone` on some platforms.)

## 5. Start the services

In two terminals:

```bash
# Terminal 1
npm run dev:backend
# → http://localhost:4000

# Terminal 2
npm run dev:frontend
# → http://localhost:5173
```

Open `http://localhost:5173`, click **Help and Support**, send a message, then mark it Resolved or Not Resolved. The state change persists to Postgres — verify with Prisma Studio or:

```sql
SELECT id, "userMessage", "resolutionStatus", "createdAt"
FROM support_sessions
ORDER BY "createdAt" DESC
LIMIT 5;
```

## Troubleshooting

### "Invalid environment variables" on backend startup

The Zod validator told you exactly which variable failed. Common cases:
- `DATABASE_URL` not a URL — must include `postgresql://` scheme
- `PORT` not a number — quotes around numeric strings in `.env` are fine; non-numeric values aren't

### Frontend can't reach backend (`NETWORK_ERROR`)

- Confirm the backend is running on the port in `VITE_API_BASE_URL`
- Confirm `CORS_ORIGIN` on the backend matches the frontend's origin (no trailing slash)

### Tests can't connect to Postgres

The default Jest setup mocks Prisma so unit + integration tests don't touch a real database. You only need a live DB for `npm run dev:backend` and for migrations.

### Husky hook doesn't fire on commit

- Did you run `npm install` at the root? Husky's `prepare` script wires up the git hooks path during install.
- Is `.husky/pre-commit` executable? `chmod +x .husky/pre-commit`.
