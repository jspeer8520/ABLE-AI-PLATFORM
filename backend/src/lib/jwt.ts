import { randomUUID } from 'node:crypto';

import jwt, { type SignOptions } from 'jsonwebtoken';

import { env } from '../config/env';
import { UnauthorizedError } from './errors';

export type TokenType = 'access' | 'refresh';

/** Application-defined claims. `sub` is the user id. */
export interface TokenClaims {
  sub: string;
  email?: string;
  role?: string;
}

/** A verified token payload including registered claims. */
export interface DecodedToken extends TokenClaims {
  type: TokenType;
  jti: string;
  iat: number;
  exp: number;
  iss: string;
}

export interface SignedToken {
  token: string;
  jti: string;
}

const ALGORITHM = 'RS256' as const;

function sign(claims: TokenClaims, type: TokenType, expiresIn: string): SignedToken {
  const jti = randomUUID();
  const options: SignOptions = {
    algorithm: ALGORITHM,
    issuer: env.JWT_ISSUER,
    jwtid: jti,
    // jsonwebtoken accepts ms-style strings ("15m") at runtime; the typed union
    // only lists specific literals, so we widen the env-provided string.
    expiresIn: expiresIn as unknown as SignOptions['expiresIn'],
  };

  const token = jwt.sign({ ...claims, type }, env.JWT_PRIVATE_KEY, options);
  return { token, jti };
}

export function signAccessToken(claims: TokenClaims): SignedToken {
  return sign(claims, 'access', env.JWT_ACCESS_TTL);
}

export function signRefreshToken(claims: TokenClaims): SignedToken {
  return sign(claims, 'refresh', env.JWT_REFRESH_TTL);
}

/**
 * Verifies signature (RS256, public key), issuer, expiry, and that the token's
 * `type` matches the expected type. Throws {@link UnauthorizedError} on any
 * failure so callers surface a consistent 401.
 */
export function verifyToken(token: string, expectedType: TokenType): DecodedToken {
  let decoded: DecodedToken;
  try {
    decoded = jwt.verify(token, env.JWT_PUBLIC_KEY, {
      algorithms: [ALGORITHM],
      issuer: env.JWT_ISSUER,
    }) as DecodedToken;
  } catch {
    throw new UnauthorizedError('Invalid or expired token');
  }

  if (decoded.type !== expectedType) {
    throw new UnauthorizedError('Invalid token type');
  }

  return decoded;
}

/**
 * Extracts a bearer token from an Authorization header value.
 * Returns `null` when the header is missing or malformed.
 */
export function extractBearerToken(header: string | undefined): string | null {
  if (!header) {
    return null;
  }

  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return null;
  }

  return token;
}
