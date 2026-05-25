# Support App — Frontend

Production-grade React + Vite + TypeScript frontend for the **Help & Support** feature.

## Stack

- **Build**: Vite 5
- **Framework**: React 18
- **Language**: TypeScript (strict mode)
- **Routing**: react-router-dom v6
- **Data layer**: TanStack Query v5
- **UI state**: Zustand
- **HTTP**: axios
- **Validation**: Zod (env)
- **Error monitoring**: Sentry
- **Testing**: Vitest + React Testing Library
- **Lint/Format**: ESLint (flat) + Prettier

## Architecture

Feature-based modules sit on top of layered services:

```
src/
  app/             Application shell (providers wiring)
  config/          Centralized env config + Sentry init
  components/      Reusable UI primitives (Button, Modal, ErrorBoundary)
  modules/
    support/       Feature components (HelpSupportButton, SupportChatModal)
  services/        API layer (apiClient, support.api, queryClient)
  hooks/           Feature hooks (TanStack Query wrappers)
  store/           Zustand stores (UI state only)
  routes/          Pages + router config
  utils/           Reserved for shared helpers
  tests/           Vitest unit + integration tests
```

### Layer rules

1. **Components / pages** never import axios directly — they go through hooks.
2. **Hooks** are TanStack Query wrappers over the API service.
3. **Services (`*.api.ts`)** are the only place axios is called.
4. **Zustand** holds UI state only. Server state lives in TanStack Query.
5. **`config/index.ts`** is the only file allowed to read `import.meta.env`.

## Setup

```bash
# 1. Install
npm install

# 2. Create env file
cp .env.example .env
# point VITE_API_BASE_URL at your backend

# 3. Dev server (http://localhost:5173)
npm run dev
```

The backend must be reachable at `VITE_API_BASE_URL` for the chat flow to work.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build |
| `npm test` | Run Vitest once |
| `npm run test:watch` | Watch mode |
| `npm run test:coverage` | Tests + coverage |
| `npm run lint` | ESLint |
| `npm run lint:fix` | ESLint with autofix |
| `npm run format` | Prettier write |
| `npm run typecheck` | `tsc -b --noEmit` |

## Environment variables

All variables are validated by Zod on app boot. Missing/invalid values throw immediately.

Only variables prefixed with `VITE_` are exposed to the client bundle.

| Variable | Required | Default | Notes |
|---|---|---|---|
| `VITE_API_BASE_URL` | yes | — | Backend base URL (must be a valid URL) |
| `VITE_APP_NAME` | no | `Support App` | |
| `VITE_APP_ENV` | yes | `development` | `development` \| `test` \| `production` |
| `VITE_SENTRY_DSN` | no | empty | Leave blank to disable Sentry |

## Feature: Help & Support

Two components implement the feature:

- `HelpSupportButton` — renders the trigger button anywhere on a page.
- `SupportChatModal` — renders the chat modal globally (state lives in the Zustand store).

Drop both into any route that wants support:

```tsx
import { HelpSupportButton } from '@/modules/support/HelpSupportButton';
import { SupportChatModal } from '@/modules/support/SupportChatModal';

export function MyPage() {
  return (
    <>
      <HelpSupportButton />
      <SupportChatModal />
    </>
  );
}
```

## Future-ready

- **AI integration**: replacing the backend's mock bot with an LLM requires no frontend changes.
- **Realtime**: the axios client and TanStack Query coexist with websocket subscriptions. Add a socket.io client in `services/` and a hook in `hooks/` — components stay the same.
