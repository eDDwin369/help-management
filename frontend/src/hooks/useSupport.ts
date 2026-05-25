/**
 * React Query hooks for the support feature.
 *
 * Components use these instead of importing the API service
 * directly — that way TanStack Query handles caching, retries,
 * and loading/error state.
 */

import { useMutation } from '@tanstack/react-query';
import {
  supportApi,
  type ChatResponse,
  type ResolutionStatus,
  type SupportSession,
} from '../services/support.api';
import type { ApiError } from '../services/apiClient';

export function useSendSupportMessage() {
  return useMutation<ChatResponse, ApiError, string>({
    mutationKey: ['support', 'chat'],
    mutationFn: (message: string) => supportApi.createChat(message),
  });
}

export interface UpdateStatusInput {
  id: string;
  status: Exclude<ResolutionStatus, 'PENDING'>;
}

export function useUpdateSupportStatus() {
  return useMutation<SupportSession, ApiError, UpdateStatusInput>({
    mutationKey: ['support', 'status'],
    mutationFn: ({ id, status }) => supportApi.updateStatus(id, status),
  });
}
