/**
 * Express app factory.
 *
 * Separated from `server.ts` so that:
 *   - Integration tests (supertest) can import the app without
 *     opening a TCP port.
 *   - The server bootstrap (Sentry, DB connect, graceful shutdown)
 *     stays out of the request-handling code.
 */

import express, { type Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';

import { config } from './config';
import { Sentry } from './config/sentry';
import { requestIdMiddleware } from './middleware/requestId';
import { requestLoggerMiddleware } from './middleware/requestLogger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { apiV1Router } from './routes';
import { healthRouter } from './routes/health.route';

export function createApp(): Application {
  const app = express();

  // Sentry request handler must be the FIRST middleware.
  if (config.sentry.enabled) {
    Sentry.setupExpressErrorHandler(app);
  }

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(
    cors({
      origin: config.cors.origin,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  app.use(requestIdMiddleware);
  app.use(requestLoggerMiddleware);

  // Routes
  app.use('/', healthRouter);
  app.use('/api/v1', apiV1Router);

  // 404 then central error handler — must be registered LAST.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
