/**
 * Shared TanStack Query client.
 *
 * Centralized so we have one place to tune retry/stale defaults and
 * one cache across the whole app.
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
    mutations: {
      retry: 0,
    },
  },
});
