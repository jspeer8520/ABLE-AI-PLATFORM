import { Router } from 'express';

import { asyncHandler } from '../../lib/async-handler';

const router = Router();

/**
 * Liveness probe. Answers only whether the process is up and serving; it must
 * not touch external dependencies so orchestrators don't restart a healthy
 * process during a transient database/Redis blip.
 */
router.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'able-backend',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Readiness probe. Reports whether the service can actually serve traffic by
 * checking its downstream dependencies. Returns 503 when any dependency is
 * unavailable. Dependency modules are imported lazily so the liveness route and
 * unit tests never open a database/Redis connection.
 */
router.get(
  '/health/ready',
  asyncHandler(async (_req, res) => {
    const [{ checkDatabaseHealth }, { checkRedisHealth }] = await Promise.all([
      import('../../services/database/prisma'),
      import('../../services/redis/redis'),
    ]);

    const [database, redis] = await Promise.all([checkDatabaseHealth(), checkRedisHealth()]);

    const ready = database && redis;

    res.status(ready ? 200 : 503).json({
      status: ready ? 'ready' : 'not_ready',
      checks: { database, redis },
      timestamp: new Date().toISOString(),
    });
  }),
);

export default router;
