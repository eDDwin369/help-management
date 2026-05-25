/**
 * Server bootstrap.
 *
 * Order matters here:
 *   1. Initialize Sentry FIRST so its instrumentation patches modules
 *      before they're imported elsewhere.
 *   2. Create the Express app.
 *   3. Connect the DB. Fail fast if it can't.
 *   4. Bind the port.
 *   5. Wire SIGTERM/SIGINT to a graceful shutdown that drains
 *      in-flight requests and disconnects from Postgres.
 */

import 'dotenv-safe/config';
import { initSentry, Sentry } from './config/sentry';

initSentry(); // BEFORE everything else

import http from 'http';
import { config } from './config';
import { logger } from './logger';
import { createApp } from './app';
import { connectDatabase, disconnectDatabase } from './config/prisma';

const SHUTDOWN_TIMEOUT_MS = 10_000;

async function bootstrap(): Promise<void> {
  await connectDatabase();

  const app = createApp();
  const server = http.createServer(app);

  server.listen(config.app.port, '0.0.0.0', () => {
    logger.info('server listening', {
      port: config.app.port,
      env: config.env,
      service: config.app.name,
    });
  });

  let shuttingDown = false;

  const shutdown = async (signal: string): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;

    logger.info('shutdown initiated', { signal });

    // Force-exit if shutdown hangs (e.g. a long-lived keep-alive).
    const forceExit = setTimeout(() => {
      logger.error('shutdown timed out, forcing exit');
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
    forceExit.unref();

    server.close((err) => {
      if (err) logger.error('error closing http server', { error: err });
    });

    try {
      await disconnectDatabase();
      if (config.sentry.enabled) {
        await Sentry.close(2000);
      }
      logger.info('shutdown complete');
      process.exit(0);
    } catch (err) {
      logger.error('error during shutdown', { error: err });
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  // Last-resort safety nets. These indicate bugs — report and exit so
  // a process supervisor restarts us cleanly.
  process.on('unhandledRejection', (reason) => {
    logger.error('unhandledRejection', { reason });
    if (config.sentry.enabled) {
      Sentry.captureException(reason);
    }
  });

  process.on('uncaughtException', (err) => {
    logger.error('uncaughtException', { error: err });
    if (config.sentry.enabled) {
      Sentry.captureException(err);
    }
    void shutdown('uncaughtException');
  });
}

bootstrap().catch((err) => {
  logger.error('bootstrap failed', { error: err });
  process.exit(1);
});
