/**
 * Centralized config module.
 *
 * - Loads environment variables via `dotenv-safe` (fails fast if any
 *   variable listed in `.env.example` is missing).
 * - Validates and coerces them with Zod.
 * - This is the ONLY file in the codebase that is allowed to read
 *   from `process.env`. Everything else imports `config` from here.
 */

import path from 'path';
import dotenvSafe from 'dotenv-safe';
import { z } from 'zod';

// Load + validate presence against .env.example. In test env we don't
// require a real .env file (CI may inject vars directly).
const isTest = process.env.NODE_ENV === 'test';

dotenvSafe.config({
  allowEmptyValues: true,
  example: path.resolve(process.cwd(), '.env.example'),
  path: path.resolve(process.cwd(), isTest ? '.env.test' : '.env'),
});

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  APP_NAME: z.string().min(1).default('support-app-backend'),
  APP_VERSION: z.string().min(1).default('1.0.0'),

  DATABASE_URL: z.string().url(),

  LOG_LEVEL: z
    .enum(['error', 'warn', 'info', 'http', 'debug', 'silly'])
    .default('info'),

  CORS_ORIGIN: z.string().min(1).default('http://localhost:5173'),

  SENTRY_DSN: z.string().optional().default(''),
  SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0.1),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  // We deliberately use process.stderr here because the logger
  // depends on this config, so it isn't available yet.
  process.stderr.write(
    `[config] Invalid environment variables:\n${JSON.stringify(
      parsed.error.flatten().fieldErrors,
      null,
      2,
    )}\n`,
  );
  process.exit(1);
}

const env = parsed.data;

export const config = {
  env: env.NODE_ENV,
  isProd: env.NODE_ENV === 'production',
  isDev: env.NODE_ENV === 'development',
  isTest: env.NODE_ENV === 'test',

  app: {
    name: env.APP_NAME,
    version: env.APP_VERSION,
    port: env.PORT,
  },

  db: {
    url: env.DATABASE_URL,
  },

  log: {
    level: env.LOG_LEVEL,
  },

  cors: {
    origin: env.CORS_ORIGIN.split(',').map((s) => s.trim()),
  },

  sentry: {
    dsn: env.SENTRY_DSN,
    enabled: env.SENTRY_DSN.length > 0,
    tracesSampleRate: env.SENTRY_TRACES_SAMPLE_RATE,
  },
} as const;

export type AppConfig = typeof config;
