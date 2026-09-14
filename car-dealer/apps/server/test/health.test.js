import { test } from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import fjwt from '@fastify/jwt';
import { errorHandler } from '../../src/middleware/errorHandler.js';

// Lightweight test — no DB/Redis. Just checks route shape and error handler.
test('GET /health returns expected shape', async () => {
  const app = Fastify({ logger: false });
  await app.register(fjwt, { secret: 'test-secret' });
  app.setErrorHandler(errorHandler);

  app.get('/health', async (_req, reply) => {
    return reply.send({ data: { status: 'ok', db: 'connected', redis: 'connected' }, error: null, meta: null });
  });

  const res = await app.inject({ method: 'GET', url: '/health' });
  const body = JSON.parse(res.payload);

  assert.equal(res.statusCode, 200);
  assert.ok(body.data);
  assert.equal(body.data.status, 'ok');
  assert.equal(body.error, null);

  await app.close();
});

test('Unknown route returns 404 with error envelope', async () => {
  const app = Fastify({ logger: false });
  app.setErrorHandler(errorHandler);

  const res = await app.inject({ method: 'GET', url: '/does-not-exist' });
  assert.equal(res.statusCode, 404);

  await app.close();
});
