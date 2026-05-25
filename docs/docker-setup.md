# Docker Setup

Local development environment using Docker Compose. All three services — PostgreSQL, backend, and frontend — start with a single command.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Docker host                                                    │
│                                                                 │
│  localhost:5173 ──► frontend (Vite + React)                     │
│  localhost:4000 ──► backend  (Express + ts-node-dev)            │
│  localhost:5432 ──► postgres (PostgreSQL 16)                    │
│                                                                 │
│  Internal Docker network:                                       │
│    backend ──► postgres  (service name "postgres", port 5432)   │
│    browser ──► backend   (via host port mapping localhost:4000) │
└─────────────────────────────────────────────────────────────────┘
```

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Engine and Compose v2)
- Node ≥ 20 is **not** required on your host — it runs inside the containers.

## Quick start

```bash
# From the repo root
docker compose up --build
```

First run takes a few minutes while images are built and `npm install` runs inside each container. Subsequent starts are fast because the named volumes (`backend_node_modules`, `frontend_node_modules`) cache the installed packages.

Once all services are healthy you will see:

| Service  | URL                      |
|----------|--------------------------|
| Frontend | http://localhost:5173    |
| Backend  | http://localhost:4000    |
| Postgres | localhost:5432           |

## Common commands

```bash
# Start in foreground (shows logs from all services)
docker compose up --build

# Start in background
docker compose up --build -d

# Follow logs for a specific service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f postgres

# Stop all containers (keeps volumes / data intact)
docker compose down

# Stop and delete all volumes (full clean slate — DB data is wiped)
docker compose down -v

# Rebuild a single service after changing its Dockerfile or package.json
docker compose up --build backend
docker compose up --build frontend
```

## Hot reload

Both services are configured for live reload:

- **Frontend** — Vite HMR. Edit any file under `frontend/src/` and the browser reflects the change instantly.
- **Backend** — `ts-node-dev` watches `backend/src/`. Saving a file restarts the server in ~1 s.

Source directories are bind-mounted into each container:

| Host path        | Container path             |
|------------------|----------------------------|
| `backend/src`    | `/app/backend/src`         |
| `backend/prisma` | `/app/backend/prisma`      |
| `frontend/src`   | `/app/frontend/src`        |

> **Note for macOS / Windows Docker Desktop users** — `CHOKIDAR_USEPOLLING=true` is set in `docker-compose.yml` so both Vite and ts-node-dev detect changes through the virtio-fs layer. This adds a small amount of CPU usage compared to native inotify on Linux.

## Prisma

On every backend container start the entrypoint runs:

```
npx prisma generate   # regenerates the TS client from schema.prisma
npx prisma db push    # syncs schema → DB (idempotent, safe to re-run)
```

### Create a named migration

`prisma db push` is fine for early development. When you are ready to track schema changes in migration files:

```bash
docker compose exec backend npx prisma migrate dev --name <migration-name>
```

### Apply pending migrations (CI / staging)

```bash
docker compose exec backend npx prisma migrate deploy
```

### Open Prisma Studio

```bash
docker compose exec backend npx prisma studio
# then visit http://localhost:5555 in your browser
```

## Environment variables

### Backend

Environment values are passed directly by `docker-compose.yml` and do **not** require a `.env` file on your host. If you want to override a value locally, create `backend/.env` — dotenv-safe will pick it up and its values take precedence over the docker-compose defaults.

| Variable                    | Docker default                                              |
|-----------------------------|-------------------------------------------------------------|
| `NODE_ENV`                  | `development`                                               |
| `PORT`                      | `4000`                                                      |
| `DATABASE_URL`              | `postgresql://postgres:postgres@postgres:5432/support_app`  |
| `CORS_ORIGIN`               | `http://localhost:5173`                                     |
| `LOG_LEVEL`                 | `info`                                                      |
| `SENTRY_DSN`                | *(empty — Sentry disabled)*                                 |
| `SENTRY_TRACES_SAMPLE_RATE` | `0.1`                                                       |

### Frontend

Vite picks up `VITE_*` variables from `process.env` at dev-server startup (docker-compose `environment:` block) and injects them into `import.meta.env`.

| Variable           | Docker default              |
|--------------------|-----------------------------|
| `VITE_API_BASE_URL`| `http://localhost:4000`     |
| `VITE_APP_NAME`    | `Support App`               |
| `VITE_APP_ENV`     | `development`               |
| `VITE_SENTRY_DSN`  | *(empty — Sentry disabled)* |

## Updating dependencies

Because `node_modules` lives in a named Docker volume, changing `package.json` on the host does **not** automatically update packages inside the container. After adding or removing a dependency:

```bash
# Rebuild the image (re-runs npm install) and recreate the container
docker compose up --build backend    # or frontend
```

Alternatively, exec into the running container:

```bash
docker compose exec backend npm install <package>
```

## Troubleshooting

### Backend fails to start with "P1001: Can't reach database server"

Postgres may not have finished initialising. Docker Compose waits for the healthcheck (`pg_isready`) before starting the backend, but if this persists:

```bash
docker compose logs postgres   # check for init errors
docker compose restart backend
```

### Port already in use

Something on your host is using port 4000, 5173, or 5432.

```bash
# Find and kill the process (Linux / macOS)
lsof -ti:<port> | xargs kill -9

# Windows PowerShell
Stop-Process -Id (Get-NetTCPConnection -LocalPort <port>).OwningProcess -Force
```

Or edit `docker-compose.yml` to map a different host port (e.g. `"4001:4000"`).

### HMR / hot reload not working

1. Confirm `CHOKIDAR_USEPOLLING=true` is set in `docker-compose.yml`.
2. Restart the affected service: `docker compose restart frontend` or `backend`.
3. On Docker Desktop for Windows, ensure **file sharing** is enabled for the drive containing the repo.

### node_modules out of sync after a git pull

The named volumes persist between `docker compose down` / `up`. If a dependency was added upstream:

```bash
docker compose down -v          # remove volumes (DB data is lost)
docker compose up --build       # fresh npm install
```

Or keep the DB volume and only remove the package volumes:

```bash
docker volume rm support-app_backend_node_modules support-app_frontend_node_modules
docker compose up --build
```

### Reset everything

```bash
docker compose down -v --remove-orphans
docker system prune -f
docker compose up --build
```
