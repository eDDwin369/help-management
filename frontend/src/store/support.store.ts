/**
 * Support UI store.
 *
 * Zustand holds *ephemeral UI state* (is the modal open, what's the
 * current draft, what's the active session). Server state — i.e.
 * anything returned from the API — lives in TanStack Query, NOT here.
 */

import { create } from 'zustand';
import type { ResolutionStatus } from '../services/support.api';

export interface ChatMessage {
  role: 'user' | 'bot';
  text: string;
  at: string;
}

interface SupportUIState {
  isOpen: boolean;
  messages: ChatMessage[];
  currentSessionId: string | null;
  currentStatus: ResolutionStatus | null;

  open: () => void;
  close: () => void;
  reset: () => void;
  appendUserMessage: (text: string) => void;
  appendBotMessage: (text: string, sessionId: string) => void;
  setStatus: (status: ResolutionStatus) => void;
}

const INITIAL = {
  isOpen: false,
  messages: [] as ChatMessage[],
  currentSessionId: null as string | null,
  currentStatus: null as ResolutionStatus | null,
};

export const useSupportStore = create<SupportUIState>((set) => ({
  ...INITIAL,

  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  reset: () => set({ ...INITIAL }),

  appendUserMessage: (text) =>
    set((state) => ({
      messages: [...state.messages, { role: 'user', text, at: new Date().toISOString() }],
    })),

  appendBotMessage: (text, sessionId) =>
    set((state) => ({
      messages: [...state.messages, { role: 'bot', text, at: new Date().toISOString() }],
      currentSessionId: sessionId,
      currentStatus: 'PENDING',
    })),

  setStatus: (status) => set({ currentStatus: status }),
}));
