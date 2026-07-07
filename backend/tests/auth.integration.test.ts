import request from 'supertest';

import app from '../src/app';
import { prisma } from '../src/services/database/prisma';
import { redis } from '../src/services/redis/redis';
import { emailService } from '../src/services/email/email.service';
import { handleOAuthLogin } from '../src/services/auth/auth.service';

/**
 * End-to-end auth tests against real Postgres + Redis (docker-compose).
 * The DB and Redis test DB are cleared before each test for isolation.
 */

const api = () => request(app);

async function registerAndGetToken(email: string, password: string): Promise<string> {
  const spy = jest.spyOn(emailService, 'sendVerificationEmail');
  await api().post('/api/auth/register').send({ email, password }).expect(202);

  // The log transport receives the verification URL; extract the raw token.
  const url = spy.mock.calls[0]![1];
  const token = new URL(url).searchParams.get('token');
  spy.mockRestore();
  return token!;
}

beforeEach(async () => {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "User" RESTART IDENTITY CASCADE');
  await redis.flushdb();
});

afterAll(async () => {
  await prisma.$disconnect();
  await redis.quit();
});

describe('POST /api/auth/register', () => {
  it('registers a new user (202) with a generic response and does not verify them yet', async () => {
    const res = await api()
      .post('/api/auth/register')
      .send({ email: 'New@Example.com', password: 'password123' })
      .expect(202);

    // The response is intentionally generic — it must not echo account state
    // (see the user-enumeration privacy design in auth.service.register).
    expect(res.body.success).toBe(true);
    expect(res.body.user).toBeUndefined();

    // Creation + normalization + unverified state are confirmed via the DB,
    // not the response body.
    const user = await prisma.user.findUnique({ where: { email: 'new@example.com' } });
    expect(user).not.toBeNull();
    expect(user!.emailVerified).toBe(false);
  });

  it('does not reveal that an email is already registered (uniform 202)', async () => {
    await api()
      .post('/api/auth/register')
      .send({ email: 'dup@x.com', password: 'password123' })
      .expect(202);

    const spy = jest.spyOn(emailService, 'sendVerificationEmail');
    const res = await api()
      .post('/api/auth/register')
      .send({ email: 'dup@x.com', password: 'password123' })
      .expect(202);

    // Same generic success shape as a brand-new registration — no 409, no
    // "account exists" signal. A fresh verification email is re-sent to the
    // still-unverified account instead of confirming it exists.
    expect(res.body.success).toBe(true);
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();

    // No duplicate row is created.
    const users = await prisma.user.findMany({ where: { email: 'dup@x.com' } });
    expect(users).toHaveLength(1);
  });

  it('rejects invalid input (422)', async () => {
    const res = await api()
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: 'short' })
      .expect(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('email verification + login', () => {
  it('blocks login before verification (403), succeeds after (200)', async () => {
    const email = 'verify@example.com';
    const password = 'password123';
    const token = await registerAndGetToken(email, password);

    await api().post('/api/auth/login').send({ email, password }).expect(403);

    await api().get('/api/auth/verify').query({ token }).expect(200);

    const res = await api().post('/api/auth/login').send({ email, password }).expect(200);
    expect(res.body.tokenType).toBe('Bearer');
    expect(typeof res.body.accessToken).toBe('string');
    expect(typeof res.body.refreshToken).toBe('string');
  });

  it('rejects an invalid verification token (400)', async () => {
    await api().get('/api/auth/verify').query({ token: 'x'.repeat(20) }).expect(400);
  });

  it('rejects wrong password (401)', async () => {
    const email = 'wp@example.com';
    const token = await registerAndGetToken(email, 'password123');
    await api().get('/api/auth/verify').query({ token }).expect(200);
    await api().post('/api/auth/login').send({ email, password: 'nope' }).expect(401);
  });

  it('rejects unknown user (401)', async () => {
    await api().post('/api/auth/login').send({ email: 'ghost@x.com', password: 'password123' }).expect(401);
  });
});

describe('GET /api/auth/me', () => {
  it('requires a token (401) and returns the user with one (200)', async () => {
    const email = 'me@example.com';
    const password = 'password123';
    const token = await registerAndGetToken(email, password);
    await api().get('/api/auth/verify').query({ token }).expect(200);
    const login = await api().post('/api/auth/login').send({ email, password }).expect(200);

    await api().get('/api/auth/me').expect(401);

    const res = await api()
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .expect(200);
    expect(res.body.user.email).toBe(email);
  });

  it('rejects a malformed token (401)', async () => {
    await api().get('/api/auth/me').set('Authorization', 'Bearer garbage').expect(401);
  });
});

describe('refresh + logout', () => {
  async function verifiedLogin() {
    const email = `r${Date.now()}@example.com`;
    const password = 'password123';
    const token = await registerAndGetToken(email, password);
    await api().get('/api/auth/verify').query({ token }).expect(200);
    const res = await api().post('/api/auth/login').send({ email, password }).expect(200);
    return res.body as { accessToken: string; refreshToken: string };
  }

  it('rotates tokens on refresh and invalidates the old refresh token', async () => {
    const { refreshToken } = await verifiedLogin();

    const res = await api().post('/api/auth/refresh').send({ refreshToken }).expect(200);
    expect(res.body.refreshToken).not.toBe(refreshToken);

    // Old refresh token is now revoked.
    await api().post('/api/auth/refresh').send({ refreshToken }).expect(401);
  });

  it('rejects an invalid refresh token (401)', async () => {
    await api().post('/api/auth/refresh').send({ refreshToken: 'x'.repeat(20) }).expect(401);
  });

  it('logout revokes the refresh token', async () => {
    const { refreshToken } = await verifiedLogin();
    await api().post('/api/auth/logout').send({ refreshToken }).expect(200);
    await api().post('/api/auth/refresh').send({ refreshToken }).expect(401);
  });
});

describe('OAuth', () => {
  it('creates a user and links the account on repeat login', async () => {
    const profile = {
      provider: 'google' as const,
      providerAccountId: 'google-123',
      email: 'oauth@example.com',
      name: 'OAuth User',
      emailVerified: true,
    };

    const first = await handleOAuthLogin(profile);
    expect(typeof first.accessToken).toBe('string');

    const users = await prisma.user.findMany({ where: { email: 'oauth@example.com' } });
    expect(users).toHaveLength(1);
    expect(users[0]!.emailVerified).toBe(true);

    // Second login with same provider account resolves to the same user.
    await handleOAuthLogin(profile);
    const accounts = await prisma.oAuthAccount.findMany();
    expect(accounts).toHaveLength(1);
  });

  it('refuses to auto-link an unverified provider email to an existing account (403)', async () => {
    // A password account already owns this email.
    await api()
      .post('/api/auth/register')
      .send({ email: 'takeover@example.com', password: 'password123' })
      .expect(202);

    // An OAuth login for the same email whose provider does NOT vouch for it
    // must be rejected rather than silently linked (account-takeover guard).
    const profile = {
      provider: 'google' as const,
      providerAccountId: 'google-unverified',
      email: 'takeover@example.com',
      name: 'Attacker',
      emailVerified: false,
    };

    await expect(handleOAuthLogin(profile)).rejects.toMatchObject({ statusCode: 403 });

    // No link was created.
    const accounts = await prisma.oAuthAccount.findMany();
    expect(accounts).toHaveLength(0);
  });

  it('redirects to the provider when starting an OAuth flow', async () => {
    const google = await api().get('/api/auth/google').expect(302);
    expect(google.headers.location).toContain('accounts.google.com');

    const microsoft = await api().get('/api/auth/microsoft').expect(302);
    expect(microsoft.headers.location).toContain('login.microsoftonline.com');
  });
});
