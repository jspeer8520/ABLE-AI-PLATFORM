import type { NextFunction, Request, RequestHandler, Response } from 'express';

import { extractBearerToken, verifyToken } from '../lib/jwt';
import { ForbiddenError, UnauthorizedError } from '../lib/errors';

/**
 * Requires a valid access token. Populates `req.user` on success and throws
 * {@link UnauthorizedError} otherwise. Downstream handlers can rely on
 * `req.user` being present.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractBearerToken(req.headers.authorization);
  if (!token) {
    throw new UnauthorizedError('Missing bearer token');
  }

  const decoded = verifyToken(token, 'access');

  req.user = {
    id: decoded.sub,
    email: decoded.email,
    role: decoded.role,
    tokenType: decoded.type,
  };

  next();
}

/**
 * Restricts a route to the given roles. Must be used after {@link requireAuth}.
 */
export function requireRole(...allowedRoles: string[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    if (!req.user.role || !allowedRoles.includes(req.user.role)) {
      throw new ForbiddenError('Insufficient role');
    }
    next();
  };
}
