import bcrypt from 'bcryptjs';

import { env } from '../../config/env';

/**
 * Password hashing using the bcrypt algorithm (via bcryptjs, the pure-JS
 * implementation — interoperable `$2b$` hashes, no native build needed). The
 * work factor is configurable via BCRYPT_ROUNDS (default 12).
 */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, env.BCRYPT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
