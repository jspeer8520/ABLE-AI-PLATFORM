import { jwtVerify } from 'jose';
import { NextRequest } from 'next/server';

// ASSUMPTION: your access tokens are signed with a secret available as
// JWT_ACCESS_SECRET. Rename this to match whatever your login/refresh
// endpoints actually use to sign tokens (e.g. JWT_SECRET, ACCESS_TOKEN_SECRET).
const secret = process.env.JWT_ACCESS_SECRET;

if (!secret) {
  throw new Error('Missing JWT_ACCESS_SECRET environment variable');
}

const encodedSecret = new TextEncoder().encode(secret);

export interface AccessTokenPayload {
  // ASSUMPTION: the token's subject claim holds the User.id (cuid).
  // Adjust the field name here if your login endpoint issues a different
  // claim (e.g. `userId` instead of the standard `sub`).
  sub: string;
  email?: string;
  [key: string]: unknown;
}

export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

/**
 * Extracts and verifies the Bearer access token from an incoming request.
 * Throws UnauthorizedError if the header is missing, malformed, or the
 * token fails signature/expiry verification.
 */
export async function requireUser(req: NextRequest): Promise<AccessTokenPayload> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or malformed Authorization header');
  }

  const token = authHeader.slice('Bearer '.length);

  try {
    const { payload } = await jwtVerify(token, encodedSecret);
    if (typeof payload.sub !== 'string') {
      throw new UnauthorizedError('Token missing subject claim');
    }
    return payload as AccessTokenPayload;
  } catch {
    throw new UnauthorizedError('Invalid or expired access token');
  }
}