/**
 * Sentry initialization.
 *
 * IMPORTANT: `initSentry()` must be called before Express is required
 * for Sentry's auto-instrumentation to patch http/express correctly.
 */

import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { config } from '../config';
import { logger } from '../logger';

let initialized = false;

export function initSentry(): void {
  if (initialized) return;
  initialized = true;

  if (!config.sentry.enabled) {
    logger.info('Sentry disabled (no SENTRY_DSN set)');
    return;
  }

  Sentry.init({
    dsn: config.sentry.dsn,
    environment: config.env,
    release: `${config.app.name}@${config.app.version}`,
    tracesSampleRate: config.sentry.tracesSampleRate,
    profilesSampleRate: config.sentry.tracesSampleRate,
    integrations: [nodeProfilingIntegration()],
  });

  logger.info('Sentry initialized', { environment: config.env });
}

export { Sentry };
