import { prisma } from '@able/db';

import { logger } from '../logging/logger';

/**
 * Shared Prisma client for the backend service.
 *
 * The client instance itself is owned by the `@able/db` package so that a
 * single connection pool is reused across the workspace. This module adds the
 * lifecycle and health helpers the HTTP service needs.
 */
export { prisma };

export async function connectDatabase(): Promise<void> {
  await prisma.$connect();
  logger.info('Database connection established');
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  logger.info('Database connection closed');
}

/**
 * Lightweight readiness probe. Returns `true` only if the database answers a
 * trivial query, so it reflects real connectivity rather than process state.
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error({ err: error }, 'Database health check failed');
    return false;
  }
}
