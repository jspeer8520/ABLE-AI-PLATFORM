import type { NextFunction, Request, Response } from 'express';

import { UnauthorizedError } from '../../lib/errors';
import { passport } from '../../config/passport';
import {
  type OAuthProfile,
  getUserById,
  handleOAuthLogin,
  login,
  register,
} from '../../services/auth/auth.service';
import { revokeRefreshToken, rotateTokens } from '../../services/auth/token.service';
import { consumeEmailVerificationToken } from '../../services/auth/verification.service';
import {
  loginSchema,
  logoutSchema,
  refreshSchema,
  registerSchema,
  verifyQuerySchema,
} from '../validators/auth.validators';

export async function registerHandler(req: Request, res: Response): Promise<void> {
  const { email, password, name } = registerSchema.parse(req.body);
  await register(email, password, name);
  // Generic, uniform response so the endpoint never reveals whether the email
  // was already registered (see auth.service.register). 202 Accepted reflects
  // that a verification email may be dispatched asynchronously.
  res.status(202).json({
    success: true,
    message: 'If the email address can be registered, a verification link has been sent.',
  });
}

export async function verifyHandler(req: Request, res: Response): Promise<void> {
  const { token } = verifyQuerySchema.parse(req.query);
  await consumeEmailVerificationToken(token);
  res.status(200).json({ success: true });
}

export async function loginHandler(req: Request, res: Response): Promise<void> {
  const { email, password } = loginSchema.parse(req.body);
  const tokens = await login(email, password);
  res.status(200).json(tokens);
}

export async function refreshHandler(req: Request, res: Response): Promise<void> {
  const { refreshToken } = refreshSchema.parse(req.body);
  const tokens = await rotateTokens(refreshToken);
  res.status(200).json(tokens);
}

export async function logoutHandler(req: Request, res: Response): Promise<void> {
  const { refreshToken } = logoutSchema.parse(req.body);
  await revokeRefreshToken(refreshToken);
  res.status(200).json({ success: true });
}

export async function meHandler(req: Request, res: Response): Promise<void> {
  // requireAuth guarantees req.user.
  const user = await getUserById(req.user!.id);
  if (!user) {
    throw new UnauthorizedError('User no longer exists');
  }
  res.status(200).json({ user });
}

/**
 * Runs a Passport OAuth strategy with a custom callback so token issuance stays
 * out of Passport and `req.user` typing is avoided.
 */
function oauthCallback(strategy: 'google' | 'microsoft') {
  return (req: Request, res: Response, next: NextFunction): void => {
    passport.authenticate(
      strategy,
      { session: false },
      (err: unknown, user: Express.User | false | null) => {
        if (err || !user) {
          next(err instanceof Error ? err : new UnauthorizedError('OAuth authentication failed'));
          return;
        }
        const profile = user as unknown as OAuthProfile;
        handleOAuthLogin(profile)
          .then((tokens) => res.status(200).json(tokens))
          .catch(next);
      },
    )(req, res, next);
  };
}

export const googleStart = (req: Request, res: Response, next: NextFunction): void =>
  passport.authenticate('google', { session: false })(req, res, next);

export const googleCallback = oauthCallback('google');

export const microsoftStart = (req: Request, res: Response, next: NextFunction): void =>
  passport.authenticate('microsoft', { session: false })(req, res, next);

export const microsoftCallback = oauthCallback('microsoft');
