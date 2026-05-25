/**
 * Prisma client singleton.
 *
 * In development, ts-node-dev reloads the module on every change.
 * Without this guard we'd create a new PrismaClient (and a new
 * connection pool) on every reload, eventually exhausting the
 * database's connection limit.
 */

import { PrismaClient } from '@prisma/client';
import { config } from '../config';
import { logger } from '../logger';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  global.__prisma ??
  new PrismaClient({
    log: config.isDev ? ['warn', 'error'] : ['error'],
  });

if (config.isDev) {
  global.__prisma = prisma;
}

export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('Database connected');
  } catch (error) {
    logger.error('Database connection failed', { error });
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  logger.info('Database disconnected');
}
