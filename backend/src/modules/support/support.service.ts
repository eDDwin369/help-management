/**
 * Support service.
 *
 * Holds the business logic for the support feature. This layer:
 *   - Knows nothing about HTTP (no req/res).
 *   - Coordinates the chatbot and the repository.
 *   - Translates "not found" from the repo into a domain error.
 *
 * Dependencies are injected via the factory so unit tests can pass
 * fakes/mocks without monkey-patching modules.
 */

import type { ChatBot } from '../../services/chatBot.service';
import { mockChatBot } from '../../services/chatBot.service';
import { supportRepository, type SupportRepository } from '../../repositories/support.repository';
import { NotFoundError } from '../../utils/errors';
import { logger } from '../../logger/index';
import type { ResolutionStatus } from '../../validations/support.schema';

export interface SupportSessionDto {
  id: string;
  userMessage: string;
  botResponse: string;
  resolutionStatus: ResolutionStatus;
  createdAt: string;
}

export interface CreateChatResult {
  session: SupportSessionDto;
  botResponse: string;
}

export interface SupportServiceDeps {
  repository: SupportRepository;
  chatBot: ChatBot;
}

export function createSupportService(deps: SupportServiceDeps) {
  const { repository, chatBot } = deps;

  function toDto(session: {
    id: string;
    userMessage: string;
    botResponse: string;
    resolutionStatus: ResolutionStatus;
    createdAt: Date;
  }): SupportSessionDto {
    return {
      id: session.id,
      userMessage: session.userMessage,
      botResponse: session.botResponse,
      resolutionStatus: session.resolutionStatus,
      createdAt: session.createdAt.toISOString(),
    };
  }

  return {
    async handleChat(userMessage: string): Promise<CreateChatResult> {
      const botReply = await chatBot.reply(userMessage);

      const session = await repository.create({
        userMessage,
        botResponse: botReply.text,
      });

      logger.info('support session created', {
        sessionId: session.id,
        botModel: botReply.model,
        botLatencyMs: botReply.latencyMs,
      });

      return {
        session: toDto(session),
        botResponse: botReply.text,
      };
    },

    async updateResolutionStatus(
      id: string,
      status: ResolutionStatus,
    ): Promise<SupportSessionDto> {
      const updated = await repository.updateStatus({ id, status });

      if (!updated) {
        throw new NotFoundError('Support session');
      }

      logger.info('support session status updated', {
        sessionId: id,
        status,
      });

      return toDto(updated);
    },
  };
}

export type SupportService = ReturnType<typeof createSupportService>;

// Default instance wired with the real dependencies. Tests can call
// `createSupportService` directly with mocks.
export const supportService: SupportService = createSupportService({
  repository: supportRepository,
  chatBot: mockChatBot,
});
