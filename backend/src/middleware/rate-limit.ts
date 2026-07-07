import rateLimit, { type RateLimitRequestHandler } from 'express-rate-limit';

import { env, isTest } from '../config/env';
import { TooManyRequestsError } from '../lib/errors';

/**
 * HTTP rate limiting.
 *
 * Two limiters are exposed: a lenient global limiter mounted app-wide and a
 * strict limiter for authentication endpoints (login/register/verify/refresh)
 * to blunt brute-force, credential-stuffing, and account-enumeration attempts.
 *
 * STORE: an in-memory store is used deliberately. `rate-limit-redis` would be
 * required to share counters across instances via the existing Redis client,
 * which is an additional dependency and connection contract. For a single
 * instance the in-memory store is correct; when scaling horizontally, swap in a
 * `rate-limit-redis` store backed by `src/services/redis/redis.ts` so limits are
 * enforced cluster-wide. Until then, per-instance limits still provide real
 * protection.
 *
 * Breaches are surfaced through the central error handler as a 429 by handing a
 * {@link TooManyRequestsError} to `next()`, keeping the JSON error shape
 * consistent with the rest of the API.
 */
function createRateLimiter(options: {
  windowMs: number;
  max: number;
  message: string;
}): RateLimitRequestHandler {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    // Emit RateLimit-* headers, drop the deprecated X-RateLimit-* ones.
    standardHeaders: true,
    legacyHeaders: false,
    // Route a breach into the shared error pipeline instead of writing an
    // ad-hoc response, so it is logged and formatted like every other error.
    handler: (_req, _res, next) => {
      next(new TooManyRequestsError(options.message));
    },
    // Skip during tests: the suite drives many auth requests against a shared
    // in-memory store within a single process, which would otherwise trip the
    // limiter. The limiter itself is exercised by dedicated unit tests.
    skip: () => isTest,
  });
}

/** Lenient, app-wide limiter mounted in {@link createApp}. */
export const globalRateLimiter = createRateLimiter({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  message: 'Too many requests, please try again later',
});

/** Strict limiter for authentication endpoints. */
export const authRateLimiter = createRateLimiter({
  windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
  max: env.AUTH_RATE_LIMIT_MAX,
  message: 'Too many authentication attempts, please try again later',
});
