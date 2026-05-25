/**
 * Integration test for the support chat flow.
 *
 * Mocks the API service so the test stays a pure UI test — we verify
 * the wiring between the button, modal, store, and TanStack Query
 * mutations without depending on a backend.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelpSupportButton } from '../modules/support/HelpSupportButton';
import { SupportChatModal } from '../modules/support/SupportChatModal';
import { useSupportStore } from '../store/support.store';

vi.mock('../services/support.api', () => ({
  supportApi: {
    createChat: vi.fn(async (message: string) => ({
      sessionId: 'session-123',
      botResponse: `Echo: ${message}`,
      resolutionStatus: 'PENDING' as const,
      createdAt: '2024-01-01T00:00:00.000Z',
    })),
    updateStatus: vi.fn(async (id: string, status: 'RESOLVED' | 'NOT_RESOLVED') => ({
      id,
      userMessage: 'hello',
      botResponse: 'Echo: hello',
      resolutionStatus: status,
      createdAt: '2024-01-01T00:00:00.000Z',
    })),
  },
}));

function renderHarness() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <HelpSupportButton />
      <SupportChatModal />
    </QueryClientProvider>,
  );
}

describe('Support chat flow', () => {
  beforeEach(() => {
    // Reset Zustand store between tests so state doesn't leak.
    useSupportStore.getState().reset();
  });

  it('opens the modal when the Help and Support button is clicked', async () => {
    renderHarness();

    expect(screen.queryByTestId('support-chat')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /help and support/i }));

    expect(await screen.findByTestId('support-chat')).toBeInTheDocument();
  });

  it('sends a message, shows the bot reply, then shows resolution buttons', async () => {
    renderHarness();
    await userEvent.click(screen.getByRole('button', { name: /help and support/i }));

    const input = screen.getByLabelText(/your message/i);
    await userEvent.type(input, 'hello');
    await userEvent.click(screen.getByRole('button', { name: /send/i }));

    expect(await screen.findByText('Echo: hello')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /^resolved$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /not resolved/i })).toBeInTheDocument();
  });

  it('updates status to RESOLVED when the user clicks Resolved', async () => {
    renderHarness();
    await userEvent.click(screen.getByRole('button', { name: /help and support/i }));

    const input = screen.getByLabelText(/your message/i);
    await userEvent.type(input, 'hello');
    await userEvent.click(screen.getByRole('button', { name: /send/i }));

    await screen.findByRole('button', { name: /^resolved$/i });
    await userEvent.click(screen.getByRole('button', { name: /^resolved$/i }));

    await waitFor(() => {
      expect(screen.getByTestId('resolution-status')).toHaveTextContent(/marked as resolved/i);
    });
  });
});
