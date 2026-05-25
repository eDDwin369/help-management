/**
 * Support API service.
 *
 * Thin wrapper around the axios client that gives the rest of the
 * frontend strongly-typed access to the backend's support endpoints.
 * Components/hooks should never call axios directly.
 */

import { apiClient } from './apiClient';

export type ResolutionStatus = 'PENDING' | 'RESOLVED' | 'NOT_RESOLVED';

export interface ChatResponse {
  sessionId: string;
  botResponse: string;
  resolutionStatus: ResolutionStatus;
  createdAt: string;
}

export interface SupportSession {
  id: string;
  userMessage: string;
  botResponse: string;
  resolutionStatus: ResolutionStatus;
  createdAt: string;
}

interface ChatEnvelope {
  data: ChatResponse;
}

interface SessionEnvelope {
  data: SupportSession;
}

export const supportApi = {
  async createChat(message: string): Promise<ChatResponse> {
    const res = await apiClient.post<ChatEnvelope>('/api/v1/support/chat', {
      message,
    });
    return res.data.data;
  },

  async updateStatus(
    id: string,
    status: Exclude<ResolutionStatus, 'PENDING'>,
  ): Promise<SupportSession> {
    const res = await apiClient.patch<SessionEnvelope>(
      `/api/v1/support/${id}/status`,
      { status },
    );
    return res.data.data;
  },
};
