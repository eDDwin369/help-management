/**
 * Frontend Sentry initialization.
 *
 * Safe to call when no DSN is configured — becomes a no-op. The React
 * ErrorBoundary in `components/ErrorBoundary.tsx` reports caught
 * errors here, and the axios interceptor reports network failures.
 */

import * as Sentry from '@sentry/react';
import { config } from './index';

let initialized = false;

export function initSentry(): void {
  if (initialized) return;
  initialized = true;

  if (!config.sentry.enabled) return;

  Sentry.init({
    dsn: config.sentry.dsn,
    environment: config.app.env,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: config.app.env === 'production' ? 0.1 : 1.0,
  });
}

export { Sentry };
