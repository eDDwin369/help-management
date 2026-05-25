/**
 * Winston structured logger.
 *
 * - JSON output in production for ingestion by log aggregators.
 * - Human-readable colored output in development.
 * - Every log line is tagged with env + service so they're filterable
 *   in a shared log pipeline.
 */

import winston, { Logger } from 'winston';
import { config } from '../config';

const { combine, timestamp, errors, json, colorize, printf, splat } = winston.format;

const devFormat = printf(({ level, message, timestamp: ts, requestId, ...meta }) => {
  const reqId = requestId ? ` [req:${String(requestId).slice(0, 8)}]` : '';
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `${ts} ${level}${reqId} ${message}${metaStr}`;
});

const baseFormat = combine(
  errors({ stack: true }),
  splat(),
  timestamp(),
);

const logger: Logger = winston.createLogger({
  level: config.log.level,
  defaultMeta: {
    service: config.app.name,
    env: config.env,
    version: config.app.version,
  },
  format: config.isProd
    ? combine(baseFormat, json())
    : combine(baseFormat, colorize(), devFormat),
  transports: [
    new winston.transports.Console({
      handleExceptions: true,
      handleRejections: true,
    }),
  ],
  // Don't exit on handled exceptions; let our process-level handlers
  // decide whether to shut down gracefully.
  exitOnError: false,
});

// Silence logs during tests unless explicitly opted in. Verbose
// Winston output drowns Jest assertion failures.
if (config.isTest && !process.env.ENABLE_TEST_LOGS) {
  logger.transports.forEach((t) => {
    t.silent = true;
  });
}

export { logger };
export default logger;
