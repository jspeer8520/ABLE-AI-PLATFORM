import type { TokenType } from '../lib/jwt';

/**
 * The authenticated principal attached to a request by the auth middleware.
 * We extend Passport's `Express.User` (rather than redeclaring `req.user`) so
 * our fields and Passport's typings agree on a single shape.
 */
export interface AuthenticatedUser {
  id: string;
  email?: string;
  role?: string;
  tokenType?: TokenType;
}

declare global {
  namespace Express {
    // Merge our authenticated principal into Passport's `Express.User`. The
    // members are declared inline (rather than `extends AuthenticatedUser`,
    // which would be an empty interface and flagged by
    // `@typescript-eslint/no-empty-object-type`).
    interface User {
      id: string;
      email?: string;
      role?: string;
      tokenType?: TokenType;
    }
  }
}

export {};
