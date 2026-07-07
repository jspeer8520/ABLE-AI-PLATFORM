import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

import { AppError, NotFoundError } from '../lib/errors';
import { isProduction } from '../config/env';
import { logger } from '../services/logging/logger';

interface ErrorResponseBody {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Terminal 404 handler for unmatched routes. Registered after all routers so a
 * request that falls through is converted into a consistent NotFound error.
 */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
}

/**
 * Central error handler. Translates known error shapes (AppError, ZodError)
 * into consistent JSON responses and logs everything through the structured
 * logger — no `console` usage. Internal (500) messages are hidden in
 * production to avoid leaking implementation details.
 */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // Express requires 4 args to treat this as an error handler.
  _next: NextFunction,
): void {
  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'Internal server error';
  let details: unknown;

  if (err instanceof ZodError) {
    statusCode = 422;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed';
    // In production, return only a trimmed summary (field path + message). The
    // raw ZodError issues can include received values and internal schema
    // metadata, which we don't want to echo back to clients. Full detail is
    // kept in non-production to aid local debugging.
    details = isProduction
      ? err.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        }))
      : err.issues;
  } else if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details;
  }

  const logContext = { err, statusCode, code };
  if (statusCode >= 500) {
    logger.error(logContext, 'Request failed');
  } else {
    logger.warn(logContext, 'Request rejected');
  }

  // Never expose internal error messages in production.
  if (statusCode >= 500 && isProduction) {
    message = 'Internal server error';
    details = undefined;
  }

  const body: ErrorResponseBody = {
    success: false,
    error: { code, message, ...(details !== undefined ? { details } : {}) },
  };

  res.status(statusCode).json(body);
}
