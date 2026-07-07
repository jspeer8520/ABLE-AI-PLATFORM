import passport from 'passport';
import { Strategy as GoogleStrategy, type Profile as GoogleProfile } from 'passport-google-oauth20';
import { Strategy as MicrosoftStrategy, type Profile as MsProfile } from 'passport-microsoft';

import { env, googleOAuthEnabled, microsoftOAuthEnabled } from './env';
import { logger } from '../services/logging/logger';
import type { OAuthProfile } from '../services/auth/auth.service';

/**
 * Configures Passport OAuth strategies. Sessions are disabled — this is a
 * stateless, JWT-based service. The profile-mapping logic is factored into pure
 * functions so it can be unit-tested without a live provider.
 */
function firstEmail(emails?: Array<{ value: string }>): string | undefined {
  return emails?.[0]?.value;
}

export function mapGoogleProfile(profile: GoogleProfile): OAuthProfile {
  const email = firstEmail(profile.emails);
  if (!email) {
    throw new Error('Google account has no email');
  }
  // Google exposes `email_verified` in the raw userinfo (`_json`). Trust the
  // email only when Google explicitly asserts it is verified; anything else
  // (missing, false, or a non-boolean) is treated as unverified.
  const rawJson = profile._json as { email_verified?: unknown } | undefined;
  const emailVerified = rawJson?.email_verified === true;
  return {
    provider: 'google',
    providerAccountId: profile.id,
    email,
    name: profile.displayName,
    emailVerified,
  };
}

export function mapMicrosoftProfile(profile: MsProfile): OAuthProfile {
  const listedEmail = firstEmail(profile.emails);
  const mailbox = profile._json?.mail;
  const email = listedEmail ?? mailbox ?? profile._json?.userPrincipalName;
  if (!email) {
    throw new Error('Microsoft account has no email');
  }
  // Microsoft does not return an `email_verified` claim. A provisioned mailbox
  // (`emails[]` / `_json.mail`) is a directory-verified address; a bare
  // `userPrincipalName` is only an identifier and may not be a deliverable,
  // verified email, so it is treated as unverified.
  const emailVerified = Boolean(listedEmail ?? mailbox);
  return {
    provider: 'microsoft',
    providerAccountId: profile.id,
    email,
    name: profile.displayName,
    emailVerified,
  };
}

export function configurePassport(): void {
  if (googleOAuthEnabled) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: env.GOOGLE_CLIENT_ID!,
          clientSecret: env.GOOGLE_CLIENT_SECRET!,
          callbackURL: `${env.API_URL}/api/auth/callback/google`,
          scope: ['profile', 'email'],
        },
        (_accessToken, _refreshToken, profile: GoogleProfile, done) => {
          try {
            done(null, mapGoogleProfile(profile) as unknown as Express.User);
          } catch (error) {
            done(error as Error);
          }
        },
      ),
    );
    logger.info('Google OAuth strategy configured');
  }

  if (microsoftOAuthEnabled) {
    passport.use(
      new MicrosoftStrategy(
        {
          clientID: env.MICROSOFT_CLIENT_ID!,
          clientSecret: env.MICROSOFT_CLIENT_SECRET!,
          callbackURL: `${env.API_URL}/api/auth/callback/microsoft`,
          scope: ['user.read'],
          tenant: env.MICROSOFT_TENANT,
        },
        (_accessToken: string, _refreshToken: string, profile: MsProfile, done) => {
          try {
            done(null, mapMicrosoftProfile(profile) as unknown as Express.User);
          } catch (error) {
            done(error as Error);
          }
        },
      ),
    );
    logger.info('Microsoft OAuth strategy configured');
  }
}

export { passport };
