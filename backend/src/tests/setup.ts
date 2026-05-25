/**
 * Vitest setup.
 *
 * Provides safe default env vars BEFORE the config module is loaded,
 * so test files can `import { createApp }` etc. without requiring
 * developers to maintain a real .env.test.
 */

process.env.NODE_ENV = 'test';
process.env.PORT = process.env.PORT || '3000';
process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/support_app_test?schema=public';
process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'error';
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';
process.env.SENTRY_DSN = process.env.SENTRY_DSN || '';
process.env.SENTRY_TRACES_SAMPLE_RATE =
  process.env.SENTRY_TRACES_SAMPLE_RATE || '0';
process.env.APP_NAME = process.env.APP_NAME || 'support-app-backend';
process.env.APP_VERSION = process.env.APP_VERSION || '1.0.0';
