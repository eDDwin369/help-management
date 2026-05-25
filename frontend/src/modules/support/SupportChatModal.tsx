/**
 * Support chat modal.
 *
 * Flow:
 *   1. User types a message and hits Send.
 *   2. `useSendSupportMessage` posts to the backend; the bot's reply
 *      and the new sessionId are appended to the local message list.
 *   3. Once a sessionId exists, "Resolved" / "Not Resolved" buttons
 *      appear. Clicking one calls `useUpdateSupportStatus` and
 *      reflects the new status in the UI.
 *
 * Server state goes through TanStack Query mutations; UI state
 * (messages array, modal open/close, current session) lives in the
 * Zustand store.
 */

import { useState, type FormEvent } from 'react';
import { Modal } from '../../components/Modal';
import { Button } from '../../components/Button';
import { useSupportStore } from '../../store/support.store';
import {
  useSendSupportMessage,
  useUpdateSupportStatus,
} from '../../hooks/useSupport';
import './SupportChatModal.css';

export function SupportChatModal() {
  const isOpen = useSupportStore((s) => s.isOpen);
  const messages = useSupportStore((s) => s.messages);
  const currentSessionId = useSupportStore((s) => s.currentSessionId);
  const currentStatus = useSupportStore((s) => s.currentStatus);
  const close = useSupportStore((s) => s.close);
  const reset = useSupportStore((s) => s.reset);
  const appendUserMessage = useSupportStore((s) => s.appendUserMessage);
  const appendBotMessage = useSupportStore((s) => s.appendBotMessage);
  const setStatus = useSupportStore((s) => s.setStatus);

  const [draft, setDraft] = useState('');

  const sendMessage = useSendSupportMessage();
  const updateStatus = useUpdateSupportStatus();

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || sendMessage.isPending) return;

    appendUserMessage(trimmed);
    setDraft('');

    sendMessage.mutate(trimmed, {
      onSuccess: (data) => {
        appendBotMessage(data.botResponse, data.sessionId);
      },
      // Errors surface in the UI via the mutation's error state below;
      // the axios interceptor has already reported 5xx to Sentry.
    });
  };

  const handleResolution = (
    status: 'RESOLVED' | 'NOT_RESOLVED',
  ): void => {
    if (!currentSessionId || updateStatus.isPending) return;
    updateStatus.mutate(
      { id: currentSessionId, status },
      {
        onSuccess: (session) => {
          setStatus(session.resolutionStatus);
        },
      },
    );
  };

  const handleClose = (): void => {
    close();
    // Clear chat for the next open. If you want chat to persist
    // across opens, remove this line.
    reset();
  };

  const isResolved = currentStatus === 'RESOLVED' || currentStatus === 'NOT_RESOLVED';
  const showResolutionButtons = !!currentSessionId && !isResolved;

  return (
    <Modal open={isOpen} onClose={handleClose} title="Help & Support">
      <div className="chat" data-testid="support-chat">
        <div className="chat__messages" role="log" aria-live="polite">
          {messages.length === 0 && (
            <p className="chat__empty">
              Ask us anything — we&apos;ll do our best to help.
            </p>
          )}
          {messages.map((m, i) => (
            <div
              key={`${m.at}-${i}`}
              className={`chat__bubble chat__bubble--${m.role}`}
            >
              {m.text}
            </div>
          ))}
          {sendMessage.isPending && (
            <div className="chat__bubble chat__bubble--bot chat__bubble--typing">
              …
            </div>
          )}
        </div>

        {sendMessage.isError && (
          <div className="chat__error" role="alert">
            Couldn&apos;t send your message: {sendMessage.error.message}
          </div>
        )}

        <form className="chat__input" onSubmit={handleSubmit}>
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type a message…"
            aria-label="Your message"
            maxLength={2000}
            disabled={isResolved}
          />
          <Button
            type="submit"
            variant="primary"
            disabled={!draft.trim() || sendMessage.isPending || isResolved}
          >
            Send
          </Button>
        </form>

        {showResolutionButtons && (
          <div className="chat__resolution">
            <p>Did this answer your question?</p>
            <div className="chat__resolution-buttons">
              <Button
                variant="success"
                onClick={() => handleResolution('RESOLVED')}
                disabled={updateStatus.isPending}
              >
                Resolved
              </Button>
              <Button
                variant="danger"
                onClick={() => handleResolution('NOT_RESOLVED')}
                disabled={updateStatus.isPending}
              >
                Not Resolved
              </Button>
            </div>
          </div>
        )}

        {isResolved && (
          <div className="chat__status" data-testid="resolution-status">
            {currentStatus === 'RESOLVED'
              ? 'Marked as resolved. Thanks for your feedback!'
              : 'Marked as not resolved. A teammate will follow up.'}
          </div>
        )}

        {updateStatus.isError && (
          <div className="chat__error" role="alert">
            Couldn&apos;t update status: {updateStatus.error.message}
          </div>
        )}
      </div>
    </Modal>
  );
}
