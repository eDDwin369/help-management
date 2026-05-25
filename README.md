# help-manage

Production-grade full-stack scaffold demonstrating the **Help & Support** feature.

- **Frontend**: React + Vite + TypeScript + TanStack Query + Zustand
- **Backend**: Node.js + Express + TypeScript + Prisma + Postgres
- **Cross-cutting**: Zod validation, Winston logging, Sentry monitoring, ESLint, Prettier, Husky

## Quick start

```bash
# 1. Install everything (root + both packages)
npm run install:all

# 2. Set up env files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# edit DATABASE_URL etc. in backend/.env

# 3. One-time after cloning: make the Husky hook executable
chmod +x .husky/pre-commit

# 4. Apply Prisma migrations
npm --prefix backend run prisma:migrate

# 5. Run the two services (in separate terminals)
npm run dev:backend     # http://localhost:4000
npm run dev:frontend    # http://localhost:5173
```

Open `http://localhost:5173` and click **Help and Support**.

## Repository layout

```
support-app/
├── backend/        Express API (see backend/README.md)
├── frontend/       React SPA (see frontend/README.md)
├── docs/           Architecture documentation
├── .husky/         Git hooks
├── package.json    Monorepo orchestration scripts
└── README.md       (this file)
```

## Root scripts

| Script | Purpose |
|---|---|
| `npm run install:all` | Install root + backend + frontend |
| `npm run dev:backend` | Start backend dev server |
| `npm run dev:frontend` | Start frontend dev server |
| `npm run build` | Build both packages |
| `npm run lint` | Lint both packages |
| `npm test` | Test both packages |
| `npm run typecheck` | Type-check both packages |

## Documentation

- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — system architecture & design decisions
- [`docs/SETUP.md`](./docs/SETUP.md) — detailed setup & environment guide
- [`docs/SCRIPTS.md`](./docs/SCRIPTS.md) — all available scripts
- [`backend/README.md`](./backend/README.md) — backend details & API reference
- [`frontend/README.md`](./frontend/README.md) — frontend details

## Engineering principles enforced

- ✅ Strict TypeScript across both packages
- ✅ No business logic in controllers
- ✅ No direct DB access in route handlers
- ✅ No `console.log` in production code (ESLint-enforced)
- ✅ No `process.env` access outside the centralized config module
- ✅ Every async handler wraps errors properly
- ✅ Centralized error handling with structured Sentry reporting
- ✅ Environment validation fails fast
- ✅ Feature-based modular architecture
- ✅ Service layer + repository pattern
- ✅ TDD-friendly (DI in service, mocked deps in tests)
- ✅ Future-ready for AI integration (chatbot behind an interface)
- ✅ Future-ready for realtime (`createApp` + `http.Server` split)

## License

MIT

