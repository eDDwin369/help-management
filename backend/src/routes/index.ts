/**
 * API v1 root router.
 *
 * Each feature module exports its own router; they all mount here.
 * Versioning the prefix at this level (rather than per-feature) makes
 * it trivial to introduce /api/v2 alongside v1 later.
 */

import { Router } from 'express';
import { supportRouter } from '../modules/support/support.routes';

const router: Router = Router();

router.use('/support', supportRouter);

export { router as apiV1Router };
