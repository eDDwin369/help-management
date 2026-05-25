/**
 * Frontend centralized config.
 *
 * The ONLY module allowed to read from `import.meta.env`. Every other
 * file imports `config` from here. Zod validates the shape; missing
 * values fail loudly during boot rather than producing undefined
 * behavior at runtime.
 */

import { z } from 'zod';

const EnvSchema = z.object({
  VITE_API_BASE_URL: z.string().url('VITE_API_BASE_URL must be a valid URL'),
  VITE_APP_NAME: z.string().min(1).default('Support App'),
  VITE_APP_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  VITE_SENTRY_DSN: z.string().optional().default(''),
});

const parsed = EnvSchema.safeParse(import.meta.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error(
    '[config] Invalid environment variables:',
    parsed.error.flatten().fieldErrors,
  );
  throw new Error('Invalid frontend environment configuration');
}

const env = parsed.data;

export const config = {
  api: {
    baseUrl: env.VITE_API_BASE_URL,
  },
  app: {
    name: env.VITE_APP_NAME,
    env: env.VITE_APP_ENV,
  },
  sentry: {
    dsn: env.VITE_SENTRY_DSN,
    enabled: env.VITE_SENTRY_DSN.length > 0,
  },
  isProd: env.VITE_APP_ENV === 'production',
} as const;

export type AppConfig = typeof config;
