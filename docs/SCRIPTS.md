# Scripts Reference

All scripts can be run from the **repo root** or from inside `backend/` / `frontend/` directly.

## Root scripts (orchestration)

| Script | What it does |
|---|---|
| `npm run install:all` | Install root + backend + frontend dependencies |
| `npm run dev:backend` | Proxy to `backend/`'s dev server |
| `npm run dev:frontend` | Proxy to `frontend/`'s dev server |
| `npm run build` | Build backend then frontend |
| `npm run lint` | Lint backend then frontend |
| `npm test` | Run backend tests then frontend tests |
| `npm run typecheck` | Type-check both packages |
| `npm run prepare` | (Auto-run) install Husky hooks |

## Backend scripts

Run from `backend/` or via `npm --prefix backend run <script>`.

| Script | What it does |
|---|---|
| `npm run dev` | Hot-reloading dev server via `ts-node-dev` |
| `npm run build` | TypeScript compile → `dist/` |
| `npm start` | Run compiled output (production) |
| `npm test` | Jest, single run, sequential |
| `npm run test:watch` | Jest watch mode |
| `npm run test:coverage` | Jest with coverage report |
| `npm run lint` | ESLint |
| `npm run lint:fix` | ESLint with autofix |
| `npm run format` | Prettier write |
| `npm run format:check` | Prettier check only |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run prisma:generate` | Regenerate Prisma client |
| `npm run prisma:migrate` | Create + apply a dev migration |
| `npm run prisma:deploy` | Apply migrations in CI / production |
| `npm run prisma:studio` | Open Prisma Studio (GUI) |

## Frontend scripts

Run from `frontend/` or via `npm --prefix frontend run <script>`.

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server with HMR (port 5173) |
| `npm run build` | Type-check + production build → `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Vitest, single run |
| `npm run test:watch` | Vitest watch mode |
| `npm run test:coverage` | Vitest with coverage |
| `npm run lint` | ESLint |
| `npm run lint:fix` | ESLint with autofix |
| `npm run format` | Prettier write |
| `npm run format:check` | Prettier check only |
| `npm run typecheck` | `tsc -b --noEmit` |

## Git hooks (Husky)

| Hook | What it does |
|---|---|
| `pre-commit` | Runs `lint-staged` — ESLint + Prettier on staged files in both packages |
