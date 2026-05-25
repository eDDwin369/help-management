/**
 * Zod schemas for the support feature.
 *
 * `z.infer` types are exported so the service and repository can share
 * the same shapes without redeclaring them.
 */

import { z } from 'zod';

export const ResolutionStatusEnum = z.enum([
  'PENDING',
  'RESOLVED',
  'NOT_RESOLVED',
]);

export type ResolutionStatus = z.infer<typeof ResolutionStatusEnum>;

export const createChatBodySchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, 'Message cannot be empty')
    .max(2000, 'Message too long (max 2000 chars)'),
});

export const updateStatusParamsSchema = z.object({
  id: z.string().uuid('Invalid session id'),
});

export const updateStatusBodySchema = z.object({
  // Only terminal states are allowed via this endpoint;
  // PENDING is set automatically when the session is created.
  status: z.enum(['RESOLVED', 'NOT_RESOLVED']),
});

export type CreateChatBody = z.infer<typeof createChatBodySchema>;
export type UpdateStatusParams = z.infer<typeof updateStatusParamsSchema>;
export type UpdateStatusBody = z.infer<typeof updateStatusBodySchema>;
