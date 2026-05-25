/**
 * Application shell.
 *
 * Composes the cross-cutting providers exactly once at the root:
 *   - ErrorBoundary wraps everything so any render error is caught.
 *   - QueryClientProvider enables TanStack Query hooks app-wide.
 *   - AppRouter mounts the route tree.
 *
 * Order matters: ErrorBoundary must be OUTSIDE the providers so it
 * catches errors thrown during provider initialization too.
 */

import { QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { AppRouter } from '../routes';
import { queryClient } from '../services/queryClient';

export function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppRouter />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
