import { Router } from 'express';

import { googleOAuthEnabled, microsoftOAuthEnabled } from '../../config/env';
import { asyncHandler } from '../../lib/async-handler';
import { NotFoundError } from '../../lib/errors';
import { requireAuth } from '../../middleware/auth';
import { authRateLimiter } from '../../middleware/rate-limit';
import {
  googleCallback,
  googleStart,
  loginHandler,
  logoutHandler,
  meHandler,
  microsoftCallback,
  microsoftStart,
  refreshHandler,
  registerHandler,
  verifyHandler,
} from '../controllers/auth.controller';

const router = Router();

// Email / password. These credential-sensitive endpoints get a strict rate
// limit to blunt brute-force, credential-stuffing, and enumeration attempts.
router.post('/register', authRateLimiter, asyncHandler(registerHandler));
router.get('/verify', authRateLimiter, asyncHandler(verifyHandler));
router.post('/login', authRateLimiter, asyncHandler(loginHandler));
router.post('/refresh', authRateLimiter, asyncHandler(refreshHandler));
router.post('/logout', asyncHandler(logoutHandler));

// Current user (protected)
router.get('/me', requireAuth, asyncHandler(meHandler));

// Guards so an unconfigured provider returns a clean 404 instead of a crash.
function requireGoogle(): void {
  if (!googleOAuthEnabled) {
    throw new NotFoundError('Google OAuth is not configured');
  }
}
function requireMicrosoft(): void {
  if (!microsoftOAuthEnabled) {
    throw new NotFoundError('Microsoft OAuth is not configured');
  }
}

// OAuth — Google
router.get('/google', (req, res, next) => {
  requireGoogle();
  googleStart(req, res, next);
});
router.get('/callback/google', (req, res, next) => {
  requireGoogle();
  googleCallback(req, res, next);
});

// OAuth — Microsoft
router.get('/microsoft', (req, res, next) => {
  requireMicrosoft();
  microsoftStart(req, res, next);
});
router.get('/callback/microsoft', (req, res, next) => {
  requireMicrosoft();
  microsoftCallback(req, res, next);
});

export default router;
