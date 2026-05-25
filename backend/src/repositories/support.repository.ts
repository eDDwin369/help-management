/**
 * Support repository.
 *
 * The ONLY layer that talks to Prisma. Keeping persistence concerns
 * isolated here means:
 *   - The service layer can be unit-tested with a mocked repo.
 *   - Swapping the DB or ORM later is a localized change.
 *   - There's a single place that knows about Prisma error shapes.
 */

import type { SupportSession, ResolutionStatus } from '@prisma/client';
import { prisma } from '../config/prisma';

export interface CreateSessionInput {
  userMessage: string;
  botResponse: string;
}

export interface UpdateStatusInput {
  id: string;
  status: ResolutionStatus;
}

export const supportRepository = {
  async create(input: CreateSessionInput): Promise<SupportSession> {
    return prisma.supportSession.create({
      data: {
        userMessage: input.userMessage,
        botResponse: input.botResponse,
      },
    });
  },

  async findById(id: string): Promise<SupportSession | null> {
    return prisma.supportSession.findUnique({ where: { id } });
  },

  async updateStatus(input: UpdateStatusInput): Promise<SupportSession | null> {
    try {
      return await prisma.supportSession.update({
        where: { id: input.id },
        data: { resolutionStatus: input.status },
      });
    } catch (err: unknown) {
      // Prisma throws P2025 when the record to update is not found.
      // We translate that to `null` so the service layer can decide
      // how to respond (NotFoundError) without depending on Prisma.
      if (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        (err as { code: string }).code === 'P2025'
      ) {
        return null;
      }
      throw err;
    }
  },
};

export type SupportRepository = typeof supportRepository;
