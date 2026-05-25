/**
 * Health check endpoint.
 *
 * Returns:
 *   - 200 if the process is up AND the database is reachable.
 *   - 503 if the database ping fails, so a load balancer / k8s probe
 *     can take the instance out of rotation.
 */

import { Router } from 'express';
import { prisma } from '../config/prisma';
import { config } from '../config';
import { asyncHandler } from '../utils/asyncHandler';

const router: Router = Router();

router.get(
  '/health',
  asyncHandler(async (_req, res) => {
    let dbOk = false;
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbOk = true;
    } catch {
      dbOk = false;
    }

    res.status(dbOk ? 200 : 503).json({
      status: dbOk ? 'ok' : 'degraded',
      service: config.app.name,
      version: config.app.version,
      env: config.env,
      uptimeSeconds: Math.round(process.uptime()),
      checks: { database: dbOk ? 'ok' : 'fail' },
      timestamp: new Date().toISOString(),
    });
  }),
);

export { router as healthRouter };
