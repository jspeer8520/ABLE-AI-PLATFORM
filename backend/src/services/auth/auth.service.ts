import { env } from '../../config/env';
import { ForbiddenError, UnauthorizedError } from '../../lib/errors';
import { type TokenClaims } from '../../lib/jwt';
import { prisma } from '../database/prisma';
import { emailService } from '../email/email.service';
import { logger } from '../logging/logger';
import { hashPassword, verifyPassword } from './password.service';
import { createEmailVerificationToken } from './verification.service';
import { type IssuedTokens, issueTokens } from './token.service';

export interface PublicUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  emailVerified: boolean;
}

export interface OAuthProfile {
  provider: 'google' | 'microsoft';
  providerAccountId: string;
  email: string;
  name?: string;
  /**
   * Whether the OAuth provider asserts the email address is verified. Only a
   * provider-verified email may be auto-linked to an existing account.
   */
  emailVerified: boolean;
}

function toPublicUser(user: {
  id: string;
  email: string;
  name: string | null;
  role: string;
  emailVerified: boolean;
}): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    emailVerified: user.emailVerified,
  };
}

function claimsFor(user: { id: string; email: string; role: string }): TokenClaims {
  return { sub: user.id, email: user.email, role: user.role };
}

/**
 * Registers a new email/password user and dispatches a verification email.
 * Emails are normalized to lowercase.
 *
 * PRIVACY: this endpoint must not reveal whether an email is already
 * registered — otherwise an attacker could enumerate accounts, defeating the
 * uniform-failure design of {@link login}. So the outcome is intentionally
 * indistinguishable to the caller:
 *
 *  - New email → create the user and send a verification link.
 *  - Existing but still-unverified password account → re-send a fresh
 *    verification link (a legitimate user who lost the first email recovers;
 *    an attacker learns nothing new).
 *  - Existing verified / OAuth-only account → silently do nothing (we never
 *    email "you already have an account", which would confirm existence).
 *
 * The caller always receives the same generic, success-shaped response.
 */
export async function register(email: string, password: string, name?: string): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    // Only re-send verification for an unverified password account; do not
    // touch verified or OAuth-only accounts, and never disclose the state.
    if (existing.passwordHash && !existing.emailVerified) {
      const rawToken = await createEmailVerificationToken(existing.id);
      const verificationUrl = `${env.API_URL}/api/auth/verify?token=${rawToken}`;
      await emailService.sendVerificationEmail(existing.email, verificationUrl);
    }
    logger.info({ userId: existing.id }, 'Registration attempt for existing email');
    return;
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email: normalizedEmail, passwordHash, name: name ?? null },
  });

  const rawToken = await createEmailVerificationToken(user.id);
  // Verification is handled by this API service.
  const verificationUrl = `${env.API_URL}/api/auth/verify?token=${rawToken}`;
  await emailService.sendVerificationEmail(user.email, verificationUrl);
  logger.info({ userId: user.id }, 'User registered');
}

/**
 * Authenticates an email/password user. Requires a verified email. Throws
 * {@link UnauthorizedError} for bad credentials and {@link ForbiddenError} when
 * the email is unverified.
 */
export async function login(email: string, password: string): Promise<IssuedTokens> {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  // Uniform failure for missing user / OAuth-only user / wrong password to
  // avoid leaking which accounts exist.
  if (!user || !user.passwordHash) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  if (!user.emailVerified) {
    throw new ForbiddenError('Email not verified');
  }

  return issueTokens(claimsFor(user));
}

export async function getUserById(userId: string): Promise<PublicUser | null> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  return user ? toPublicUser(user) : null;
}

/**
 * Resolves (or creates) a user from an OAuth profile and issues tokens.
 *
 * - Existing linked account → that user.
 * - Email already registered → link the OAuth account ONLY if the provider
 *   asserts the email is verified. Otherwise refuse: auto-linking an
 *   unverified provider email to an existing (possibly password) account would
 *   let an attacker who controls an unverified provider account take over
 *   someone else's account by claiming their email. Such users must verify
 *   ownership explicitly.
 * - Otherwise → create a user, marking the email verified only when the
 *   provider vouches for it.
 */
export async function handleOAuthLogin(profile: OAuthProfile): Promise<IssuedTokens> {
  const normalizedEmail = profile.email.trim().toLowerCase();

  const user = await prisma.$transaction(async (tx) => {
    const linked = await tx.oAuthAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider: profile.provider,
          providerAccountId: profile.providerAccountId,
        },
      },
      include: { user: true },
    });
    if (linked) {
      return linked.user;
    }

    const existing = await tx.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      if (!profile.emailVerified) {
        throw new ForbiddenError(
          'This email is already registered. Verify your email with the provider before linking this account.',
        );
      }
      await tx.oAuthAccount.create({
        data: {
          userId: existing.id,
          provider: profile.provider,
          providerAccountId: profile.providerAccountId,
        },
      });
      return existing;
    }

    return tx.user.create({
      data: {
        email: normalizedEmail,
        name: profile.name ?? null,
        emailVerified: profile.emailVerified,
        emailVerifiedAt: profile.emailVerified ? new Date() : null,
        oauthAccounts: {
          create: {
            provider: profile.provider,
            providerAccountId: profile.providerAccountId,
          },
        },
      },
    });
  });

  logger.info({ userId: user.id, provider: profile.provider }, 'OAuth login');
  return issueTokens(claimsFor(user));
}
