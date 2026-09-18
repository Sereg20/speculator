import Fastify from 'fastify';
import fjwt from '@fastify/jwt';
import { checkDbConnection } from './db/client.js';
import { errorHandler } from './middleware/errorHandler.js';
import registerRoutes from './routes/index.js';
import { PORT, LOG_LEVEL, JWT_SECRET } from './config.js';
import { startRepairCompletionJob } from './jobs/repairCompletion.js';
import { startHoldingCostJob } from './jobs/holdingCost.js';
import { startBuyerInquiryJob } from './jobs/buyerInquiry.js';
import { startListingExpiryJob } from './jobs/listingExpiry.js';
import cors from '@fastify/cors';

const fastify = Fastify({
  logger: {
    level: LOG_LEVEL,
    transport: process.env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
  },
});

// ─── Plugins ────────────────────────────────────────────────────────────────

await fastify.register(cors, { origin: [ 'http://localhost:8081', 'http://127.0.0.1:8081', ], credentials: true, });

await fastify.register(fjwt, { secret: JWT_SECRET });

// ─── Error handler ──────────────────────────────────────────────────────────
fastify.setErrorHandler(errorHandler);

// ─── Health ─────────────────────────────────────────────────────────────────
fastify.get('/health', async (_request, reply) => {
  const health = { status: 'ok', db: 'unknown' };

  try {
    await checkDbConnection();
    health.db = 'connected';
  } catch (err) {
    health.db = 'error';
    health.status = 'degraded';
    fastify.log.error({ err }, 'DB health check failed');
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  return reply.code(statusCode).send({ data: health, error: null, meta: null });
});

// ─── Routes ─────────────────────────────────────────────────────────────────
await registerRoutes(fastify);

// ─── Start ──────────────────────────────────────────────────────────────────

try {
  await fastify.listen({ port: PORT, host: '0.0.0.0' });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}

// ─── Background jobs ─────────────────────────────────────────────────────────
startRepairCompletionJob(fastify.log);
startHoldingCostJob(fastify.log);
startBuyerInquiryJob(fastify.log);
startListingExpiryJob(fastify.log);

// ─── Graceful shutdown ──────────────────────────────────────────────────────
process.on('SIGTERM', async () => {
  fastify.log.info('SIGTERM received — shutting down gracefully');
  await fastify.close();
  process.exit(0);
});
