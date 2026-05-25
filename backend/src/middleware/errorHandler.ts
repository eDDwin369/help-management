/**
 * Centralized error handling.
 *
 * - `notFoundHandler` produces a 404 for unmatched routes.
 * - `errorHandler` is the single funnel for everything else:
 *      * `AppError` subclasses → clean HTTP response, no Sentry noise
 *      * everything else      → 500 + report to Sentry
 *
 * Stack traces are only returned in non-production environments.
 */

import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors';
import { logger } from '../logger';
import { config } from '../config';
import { Sentry } from '../config/sentry';

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found`,
      requestId: req.id,
    },
  });
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // next is required by Express to recognize this as an error handler.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  // Zod errors that escaped the validation middleware
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: err.flatten(),
        requestId: req.id,
      },
    });
    return;
  }

  if (err instanceof AppError) {
    logger.warn('handled application error', {
      requestId: req.id,
      code: err.code,
      message: err.message,
      statusCode: err.statusCode,
    });

    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
        requestId: req.id,
      },
    });
    return;
  }

  // Unknown / programmer error — log + report
  const error = err instanceof Error ? err : new Error(String(err));

  logger.error('unhandled error', {
    requestId: req.id,
    message: error.message,
    stack: error.stack,
    path: req.originalUrl,
    method: req.method,
  });

  if (config.sentry.enabled) {
    Sentry.withScope((scope) => {
      scope.setTag('requestId', req.id);
      scope.setContext('request', {
        method: req.method,
        path: req.originalUrl,
      });
      Sentry.captureException(error);
    });
  }

  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: config.isProd ? 'Internal server error' : error.message,
      ...(config.isProd ? {} : { stack: error.stack }),
      requestId: req.id,
    },
  });
}
