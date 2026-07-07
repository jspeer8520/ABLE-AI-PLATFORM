import cors from 'cors';
import express, { type Express } from 'express';

import apiRouter from './api/routes';
import { corsOrigin } from './config/env';
import { configurePassport, passport } from './config/passport';
import { errorHandler, notFoundHandler } from './middleware/error';
import { globalRateLimiter } from './middleware/rate-limit';
import { requestLogger } from './middleware/request-logger';
import { securityMiddleware } from './middleware/security';

/**
 * Builds and configures the Express application. Kept free of `listen()` and
 * external connections so it can be imported directly by tests (supertest)
 * without opening a port or a database connection.
 */
export function createApp(): Express {
  const app = express();

  // Trust the first proxy hop so client IPs / protocol are read correctly
  // behind a load balancer.
  app.set('trust proxy', 1);

  app.use(securityMiddleware);
  app.use(cors({ origin: corsOrigin }));

  // Lenient, app-wide rate limit as a first line of defence against abuse.
  // Stricter per-route limits are applied to auth endpoints in their router.
  app.use(globalRateLimiter);

  // JSON-only API: parse a bounded JSON body. `urlencoded` is intentionally
  // omitted — no endpoint consumes form-encoded input, so accepting it would
  // only widen the attack surface.
  app.use(express.json({ limit: '1mb' }));
  app.use(requestLogger);

  // Stateless Passport (OAuth strategies); no sessions.
  configurePassport();
  app.use(passport.initialize());

  app.use('/api', apiRouter);

  // 404 for unmatched routes, then the central error handler (must be last).
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

const app = createApp();

export default app;
