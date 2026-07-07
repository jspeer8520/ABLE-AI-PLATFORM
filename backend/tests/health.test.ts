import request from 'supertest';

import app from '../src/app';
import { prisma } from '../src/services/database/prisma';
import { redis } from '../src/services/redis/redis';

afterAll(async () => {
  await prisma.$disconnect();
  await redis.quit();
});

describe('GET /api/health', () => {
  it('returns a healthy liveness response without touching dependencies', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.service).toBe('able-backend');
    expect(typeof res.body.timestamp).toBe('string');
  });

  it('returns a structured 404 for unknown routes', async () => {
    const res = await request(app).get('/api/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('reports readiness with live database and redis checks', async () => {
    const res = await request(app).get('/api/health/ready');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ready');
    expect(res.body.checks).toEqual({ database: true, redis: true });
  });
});
