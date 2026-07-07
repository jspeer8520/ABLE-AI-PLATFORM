import { generateKeyPairSync } from 'node:crypto';

/**
 * Test environment bootstrap. Runs before any test module is imported
 * (Jest `setupFiles`), providing the environment `config/env.ts` validates at
 * import time. These are throwaway fixtures for the test runtime only.
 */
if (!process.env.JWT_PRIVATE_KEY || !process.env.JWT_PUBLIC_KEY) {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  process.env.JWT_PRIVATE_KEY = Buffer.from(privateKey).toString('base64');
  process.env.JWT_PUBLIC_KEY = Buffer.from(publicKey).toString('base64');
}

process.env.NODE_ENV ??= 'test';
process.env.DATABASE_URL ??= 'postgresql://able:able@localhost:5432/able';
// Use Redis logical DB 1 for tests so flushing never touches dev data.
process.env.REDIS_URL ??= 'redis://localhost:6379/1';
process.env.LOG_LEVEL ??= 'silent';
process.env.BCRYPT_ROUNDS ??= '10'; // faster hashing in tests
process.env.API_URL ??= 'http://localhost:4000';
process.env.APP_URL ??= 'http://localhost:3000';

// Dummy OAuth credentials so both strategies configure and their start routes
// can be exercised (redirect to the provider). Never used against real APIs.
process.env.GOOGLE_CLIENT_ID ??= 'test-google-client-id';
process.env.GOOGLE_CLIENT_SECRET ??= 'test-google-client-secret';
process.env.MICROSOFT_CLIENT_ID ??= 'test-microsoft-client-id';
process.env.MICROSOFT_CLIENT_SECRET ??= 'test-microsoft-client-secret';
