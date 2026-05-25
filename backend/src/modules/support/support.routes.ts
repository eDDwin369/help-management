/**
 * Support routes.
 *
 * Routes only wire middleware → controller. They never touch the DB
 * or contain business logic.
 */

import { Router } from 'express';
import { supportController } from './support.controller';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import {
  createChatBodySchema,
  updateStatusBodySchema,
  updateStatusParamsSchema,
} from '../../validations/support.schema';

const router: Router = Router();

router.post(
  '/chat',
  validate({ body: createChatBodySchema }),
  asyncHandler(supportController.createChat),
);

router.patch(
  '/:id/status',
  validate({
    params: updateStatusParamsSchema,
    body: updateStatusBodySchema,
  }),
  asyncHandler(supportController.updateStatus),
);

export { router as supportRouter };
