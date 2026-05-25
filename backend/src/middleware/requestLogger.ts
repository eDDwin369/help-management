/**
 * Request logging middleware.
 *
 * Emits a single structured log line per request when the response
 * finishes, with method, path, status, latency, and the requestId
 * set by `requestIdMiddleware`.
 *
 * One log per request (not one on entry + one on exit) keeps log
 * volume manageable while still capturing latency.
 */

import type { Request, Response, NextFunction } from 'express';
import { logger } from '../logger';

export function requestLoggerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
    const meta = {
      requestId: req.id,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: Math.round(durationMs * 100) / 100,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    };

    if (res.statusCode >= 500) {
      logger.error('request completed', meta);
    } else if (res.statusCode >= 400) {
      logger.warn('request completed', meta);
    } else {
      logger.info('request completed', meta);
    }
  });

  next();
}
