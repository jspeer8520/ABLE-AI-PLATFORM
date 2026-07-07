import Redis, { type RedisOptions } from 'ioredis';

import { env } from '../../config/env';
import { logger } from '../logging/logger';

/**
 * Shared Redis client.
 *
 * `lazyConnect` defers the TCP connection until {@link connectRedis} is called,
 * which keeps module import side-effect free (important for tests and for the
 * readiness endpoint). A bounded retry strategy prevents a Redis outage from
 * producing an unbounded reconnect storm.
 */
const options: RedisOptions = {
  lazyConnect: true,
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    // Exponential-ish backoff capped at 2s.
    return Math.min(times * 200, 2000);
  },
};

export const redis = new Redis(env.REDIS_URL, options);

redis.on('error', (error) => {
  logger.error({ err: error }, 'Redis client error');
});

redis.on('connect', () => {
  logger.info('Redis connection established');
});

export async function connectRedis(): Promise<void> {
  // `status` is "ready" once connected; avoid a duplicate connect call.
  if (redis.status === 'ready' || redis.status === 'connecting') {
    return;
  }
  await redis.connect();
}

export async function disconnectRedis(): Promise<void> {
  await redis.quit();
  logger.info('Redis connection closed');
}

/**
 * Readiness probe: issues a PING and confirms the expected PONG reply.
 */
export async function checkRedisHealth(): Promise<boolean> {
  try {
    const reply = await redis.ping();
    return reply === 'PONG';
  } catch (error) {
    logger.error({ err: error }, 'Redis health check failed');
    return false;
  }
}
