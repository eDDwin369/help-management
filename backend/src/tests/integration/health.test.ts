/**
 * Integration test for the health endpoint.
 *
 * We mock the Prisma client so this test:
 *   - Doesn't require a running Postgres in CI.
 *   - Still exercises the real Express stack (middleware, router,
 *     error handler) via supertest.
 *
 * A separate suite running against a real test DB would cover the
 * happy path of the DB ping itself.
 */

import { vi, describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app';

vi.mock('../../config/prisma', () => ({
  prisma: {
    $queryRaw: vi.fn().mockResolvedValue([{ '?column?': 1 }]),
    $connect: vi.fn().mockResolvedValue(undefined),
    $disconnect: vi.fn().mockResolvedValue(undefined),
  },
  connectDatabase: vi.fn().mockResolvedValue(undefined),
  disconnectDatabase: vi.fn().mockResolvedValue(undefined),
}));

describe('GET /health', () => {
  it('returns 200 + ok when the database is reachable', async () => {
    const app = createApp();
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.checks.database).toBe('ok');
    expect(res.headers['x-request-id']).toBeDefined();
  });
});

describe('POST /api/v1/support/chat — validation', () => {
  it('rejects an empty message with 400', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/api/v1/support/chat')
      .send({ message: '' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects missing body with 400', async () => {
    const app = createApp();
    const res = await request(app).post('/api/v1/support/chat').send({});

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('Unknown route', () => {
  it('returns 404 with NOT_FOUND', async () => {
    const app = createApp();
    const res = await request(app).get('/nope');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
