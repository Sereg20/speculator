/**
 * Dev-only routes — only registered when NODE_ENV !== 'production'.
 *
 * POST /dev/listings/:listingId/force-inquiry
 *   Immediately runs generateBuyerInquiry for the given listing,
 *   bypassing the in-game day timing gate.
 */

import { generateBuyerInquiry } from '../services/buyerGenerator.js';
import { requireAuth } from '../middleware/auth.js';
import { sql } from '../db/client.js';

async function forceInquiry(request, reply) {
  const { listingId } = request.params;
  const playerId = request.playerId;

  // Verify the listing belongs to this player and is active
  const [listing] = await sql`
    SELECT id FROM listings
    WHERE id = ${listingId}
      AND player_id = ${playerId}
      AND status = 'active'
  `;
  if (!listing) {
    return reply.code(404).send({ data: null, error: 'Active listing not found', meta: null });
  }

  const count = await generateBuyerInquiry(listingId, request.log, { force: true });

  return reply.send({
    data: { inquiriesGenerated: count },
    error: null,
    meta: { listingId },
  });
}

export default async function devRoutes(fastify) {
  fastify.post('/dev/listings/:listingId/force-inquiry', { preHandler: requireAuth }, forceInquiry);
}
