/**
 * Support controller.
 *
 * Thin HTTP adapter — receives validated input from middleware,
 * delegates to the service, and shapes the HTTP response.
 *
 * NO business logic and NO direct DB access belongs here.
 */

import type { Request, Response } from 'express';
import { supportService } from './support.service';
import type {
  CreateChatBody,
  UpdateStatusBody,
  UpdateStatusParams,
} from '../../validations/support.schema';

export const supportController = {
  async createChat(
    req: Request<unknown, unknown, CreateChatBody>,
    res: Response,
  ): Promise<void> {
    const result = await supportService.handleChat(req.body.message);
    res.status(201).json({
      data: {
        sessionId: result.session.id,
        botResponse: result.botResponse,
        resolutionStatus: result.session.resolutionStatus,
        createdAt: result.session.createdAt,
      },
    });
  },

  async updateStatus(
    req: Request<UpdateStatusParams, unknown, UpdateStatusBody>,
    res: Response,
  ): Promise<void> {
    const updated = await supportService.updateResolutionStatus(
      req.params.id,
      req.body.status,
    );
    res.status(200).json({ data: updated });
  },
};
