import { env } from '../../config/env';
import { parseDurationSeconds } from '../../lib/duration';
import {
  type DecodedToken,
  type TokenClaims,
  signAccessToken,
  signRefreshToken,
  verifyToken,
} from '../../lib/jwt';
import { UnauthorizedError } from '../../lib/errors';
import { redis } from '../redis/redis';

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number; // access token lifetime, seconds
}

const refreshTtlSeconds = parseDurationSeconds(env.JWT_REFRESH_TTL);
const accessTtlSeconds = parseDurationSeconds(env.JWT_ACCESS_TTL);

/**
 * Redis key for a live refresh token. Presence of the key means the refresh
 * token is valid; deleting it (logout, rotation) revokes it immediately even
 * though the JWT itself has not yet expired.
 */
function refreshKey(userId: string, jti: string): string {
  return `refresh:${userId}:${jti}`;
}

async function persistRefresh(userId: string, jti: string): Promise<void> {
  await redis.set(refreshKey(userId, jti), '1', 'EX', refreshTtlSeconds);
}

/** Issues a fresh access/refresh pair and records the refresh token as valid. */
export async function issueTokens(claims: TokenClaims): Promise<IssuedTokens> {
  const access = signAccessToken(claims);
  const refresh = signRefreshToken(claims);
  await persistRefresh(claims.sub, refresh.jti);

  return {
    accessToken: access.token,
    refreshToken: refresh.token,
    tokenType: 'Bearer',
    expiresIn: accessTtlSeconds,
  };
}

/**
 * Rotates a refresh token: verifies it, confirms it has not been revoked,
 * invalidates the old one, and issues a new pair. Rotation prevents refresh
 * token replay.
 */
export async function rotateTokens(refreshToken: string): Promise<IssuedTokens> {
  const decoded: DecodedToken = verifyToken(refreshToken, 'refresh');

  const exists = await redis.exists(refreshKey(decoded.sub, decoded.jti));
  if (!exists) {
    throw new UnauthorizedError('Refresh token has been revoked');
  }

  await redis.del(refreshKey(decoded.sub, decoded.jti));

  return issueTokens({ sub: decoded.sub, email: decoded.email, role: decoded.role });
}

/** Revokes a single refresh token (logout). Idempotent. */
export async function revokeRefreshToken(refreshToken: string): Promise<void> {
  let decoded: DecodedToken;
  try {
    decoded = verifyToken(refreshToken, 'refresh');
  } catch {
    // An invalid/expired token is already unusable; treat logout as successful.
    return;
  }
  await redis.del(refreshKey(decoded.sub, decoded.jti));
}
