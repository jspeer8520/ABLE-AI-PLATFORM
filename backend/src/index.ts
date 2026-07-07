import 'dotenv/config';

import type { Server } from 'node:http';

import app from './app';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './services/database/prisma';
import { connectRedis, disconnectRedis } from './services/redis/redis';
import { logger } from './services/logging/logger';

/**
 * Service entry point.
 *
 * Establishes downstream connections before accepting traffic (fail fast if a
 * dependency is unreachable) and installs signal handlers for graceful
 * shutdown so in-flight requests and connections are drained cleanly.
 */
async function bootstrap(): Promise<void> {
  await connectDatabase();
  await connectRedis();

  const server: Server = app.listen(env.PORT, () => {
    logger.info(`ABLE backend listening on port ${env.PORT} (${env.NODE_ENV})`);
  });

  const shutdown = (signal: string): void => {
    logger.info(`Received ${signal}, shutting down gracefully`);

    server.close(() => {
      void (async () => {
        try {
          await Promise.allSettled([disconnectDatabase(), disconnectRedis()]);
        } finally {
          logger.info('Shutdown complete');
          process.exit(0);
        }
      })();
    });

    // Force exit if graceful shutdown stalls.
    setTimeout(() => {
      logger.error('Graceful shutdown timed out, forcing exit');
      process.exit(1);
    }, 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((error) => {
  logger.fatal({ err: error }, 'Failed to start backend service');
  process.exit(1);
});
