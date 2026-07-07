import { createHash, randomBytes } from 'node:crypto';

import { BadRequestError } from '../../lib/errors';
import { prisma } from '../database/prisma';

const TOKEN_BYTES = 32;
const EXPIRY_MS = 1000 * 60 * 60 * 24; // 24 hours

function hashToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}

/**
 * Creates a single-use email-verification token. Only the SHA-256 hash is
 * stored; the returned raw token is embedded in the emailed link and never
 * persisted in plaintext.
 */
export async function createEmailVerificationToken(userId: string): Promise<string> {
  const rawToken = randomBytes(TOKEN_BYTES).toString('hex');
  const expiresAt = new Date(Date.now() + EXPIRY_MS);

  await prisma.verificationToken.create({
    data: {
      userId,
      tokenHash: hashToken(rawToken),
      type: 'email_verify',
      expiresAt,
    },
  });

  return rawToken;
}

/**
 * Consumes an email-verification token: validates it, marks the user verified,
 * and deletes the token. Throws {@link BadRequestError} for invalid or expired
 * tokens. The lookup + mutations run in a transaction to avoid a token being
 * used twice concurrently.
 */
export async function consumeEmailVerificationToken(rawToken: string): Promise<{ userId: string }> {
  const tokenHash = hashToken(rawToken);

  return prisma.$transaction(async (tx) => {
    const record = await tx.verificationToken.findUnique({ where: { tokenHash } });

    if (!record || record.type !== 'email_verify') {
      throw new BadRequestError('Invalid verification token');
    }

    // Always delete the token so it cannot be retried.
    await tx.verificationToken.delete({ where: { id: record.id } });

    if (record.expiresAt.getTime() < Date.now()) {
      throw new BadRequestError('Verification token has expired');
    }

    await tx.user.update({
      where: { id: record.userId },
      data: { emailVerified: true, emailVerifiedAt: new Date() },
    });

    return { userId: record.userId };
  });
}
