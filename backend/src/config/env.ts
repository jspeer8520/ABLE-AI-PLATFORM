import { z } from 'zod';

import { logger } from '../services/logging/logger';

/**
 * A base64-encoded PEM key. Decodes to the PEM string and validates it looks
 * like a real key, so a malformed key fails at boot rather than at first sign.
 */
function base64Pem(name: string) {
  return z
    .string()
    .min(1, `${name} is required`)
    .transform((value, ctx) => {
      const decoded = Buffer.from(value, 'base64').toString('utf8');
      if (!decoded.includes('-----BEGIN')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${name} must be a base64-encoded PEM key`,
        });
        return z.NEVER;
      }
      return decoded;
    });
}

/**
 * Environment schema for the ABLE backend service.
 *
 * Every value the service depends on is declared here and validated at process
 * start. Secrets are never given default values — the process refuses to boot
 * if a required secret is missing, which prevents accidentally shipping with a
 * weak or absent signing key.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  PORT: z.coerce.number().int().positive().default(4000),

  // Comma-separated list of allowed origins, or "*" for any origin.
  // NOTE: "*" is rejected in production below (see CORS gating).
  CORS_ORIGIN: z.string().min(1).default('*'),

  // Rate limiting. Windows are in milliseconds. Auth endpoints get a stricter
  // limit than the global default to blunt credential-stuffing, brute-force,
  // and account-enumeration attempts. Values are configurable so operators can
  // tune them per environment without a code change.
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
  AUTH_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),

  // Public base URLs.
  APP_URL: z.string().url().default('http://localhost:3000'), // frontend
  API_URL: z.string().url().default('http://localhost:4000'), // this service

  // Persistence
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REDIS_URL: z.string().min(1).default('redis://localhost:6379'),

  // JWT is signed with RS256. Keys are provided as base64-encoded PEM strings
  // so multi-line key material travels safely through env/secret managers.
  JWT_PRIVATE_KEY: base64Pem('JWT_PRIVATE_KEY'),
  JWT_PUBLIC_KEY: base64Pem('JWT_PUBLIC_KEY'),
  JWT_ACCESS_TTL: z.string().min(1).default('15m'),
  JWT_REFRESH_TTL: z.string().min(1).default('7d'),
  JWT_ISSUER: z.string().min(1).default('able-ai-platform'),

  // Password hashing (bcrypt work factor).
  BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),

  // Email (Resend). When RESEND_API_KEY is absent the service falls back to a
  // log transport for local development.
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().min(1).default('ABLE <onboarding@resend.dev>'),

  // OAuth providers (optional — routes mount only when configured).
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  MICROSOFT_CLIENT_ID: z.string().optional(),
  MICROSOFT_CLIENT_SECRET: z.string().optional(),
  MICROSOFT_TENANT: z.string().default('common'),
  OAUTH_SUCCESS_REDIRECT: z.string().optional(), // defaults to `${APP_URL}/auth/callback`

  // Logging
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),

  // AI provider abstraction (used by later phases).
  AI_PROVIDER: z.string().default('local'),
  AI_MODEL: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n');

  logger.fatal(`Invalid environment configuration:\n${issues}`);

  // A misconfigured environment is unrecoverable; fail fast rather than boot
  // into an undefined state.
  process.exit(1);
}

export const env: Env = parsed.data;

export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

// CORS gating: refuse to boot in production with a wildcard origin. A `*`
// origin lets any website drive this API on a user's behalf, which is never
// acceptable for an authenticated service. Fail fast so a misconfiguration is
// caught at deploy time rather than becoming a live vulnerability.
if (isProduction && env.CORS_ORIGIN.trim() === '*') {
  const message =
    'CORS_ORIGIN must not be "*" in production; configure an explicit comma-separated allowlist.';
  logger.fatal(message);
  throw new Error(message);
}

/**
 * Resolved CORS origin for the `cors` middleware.
 *
 * - `true` reflects the request origin and is only reachable outside
 *   production (the wildcard is rejected above for prod).
 * - Otherwise, an explicit allowlist parsed from the comma-separated value.
 *   This keeps local development working (e.g. `http://localhost:3000`) while
 *   forcing production to name its trusted origins.
 */
export const corsOrigin: true | string[] =
  env.CORS_ORIGIN.trim() === '*'
    ? true
    : env.CORS_ORIGIN.split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);

/** Where to send the browser after a successful OAuth login. */
export const oauthSuccessRedirect = env.OAUTH_SUCCESS_REDIRECT ?? `${env.APP_URL}/auth/callback`;

export const googleOAuthEnabled = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
export const microsoftOAuthEnabled = Boolean(
  env.MICROSOFT_CLIENT_ID && env.MICROSOFT_CLIENT_SECRET,
);
