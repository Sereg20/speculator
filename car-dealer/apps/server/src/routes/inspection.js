/**
 * Inspection route — Phase 3
 *
 * POST /cars/:carId/inspect
 *   Body: { tier: 'visual'|'tap_test'|'obd'|'full' }
 *   Reveals defects probabilistically. Returns ONLY revealed defects.
 *   Never returns total defect count or IDs of unrevealed defects.
 *
 * GET /cars/:carId/inspections
 *   Returns inspection history for the car (tiers performed, counts found).
 */

import { runInspection, INSPECTION_XP } from '../services/inspectionEngine.js';
import { consumeEnergy } from '../services/energyService.js';
import { awardXP } from '../services/xpService.js';
import { sql } from '../db/client.js';
import { requireAuth } from '../middleware/auth.js';

// Energy costs per inspection tier (GMS §1.3)
const ENERGY_COST = {
  visual:   2,
  tap_test: 3,
  obd:      3,
  full:     4,
};

/**
 * POST /cars/:carId/inspect
 */
async function inspect(request, reply) {
  const { carId } = request.params;
  const playerId = request.playerId;
  const { tier } = request.body || {};

  if (!tier || !ENERGY_COST[tier]) {
    return reply.code(400).send({
      data: null,
      error: 'tier must be one of: visual, tap_test, obd, full',
      meta: null,
    });
  }

  // Verify car ownership and valid state
  const [car] = await sql`
    SELECT id, state FROM cars
    WHERE id = ${carId}
      AND player_id = ${playerId}
      AND state IN ('purchased', 'in_repair', 'listed_for_sale')
  `;
  if (!car) {
    return reply.code(404).send({ data: null, error: 'Car not found or not owned', meta: null });
  }

  // Check if this tier was already performed on this car (re-running same tier yields nothing)
  const [existingInspection] = await sql`
    SELECT id, revealed_count FROM inspections
    WHERE car_id = ${carId} AND tier = ${tier}
  `;
  if (existingInspection) {
    return reply.code(409).send({
      data: null,
      error: `${tier} inspection already performed on this car`,
      meta: { alreadyRevealedCount: existingInspection.revealed_count },
    });
  }

  // Consume energy atomically first
  const energyCost = ENERGY_COST[tier];
  const hasEnergy = await consumeEnergy(playerId, energyCost);
  if (!hasEnergy) {
    return reply.code(400).send({ data: null, error: 'Not enough energy', meta: null });
  }

  let result;
  try {
    result = await runInspection(carId, playerId, tier);
  } catch (err) {
    // Refund energy on prerequisite/validation failure
    await sql`
      UPDATE players
      SET energy_current = LEAST(energy_current + ${energyCost}, 30),
          updated_at = NOW()
      WHERE id = ${playerId}
    `;
    const statusCode = err.statusCode || 500;
    return reply.code(statusCode).send({ data: null, error: err.message, meta: null });
  }

  // Log the inspection (also enforces uniqueness via UNIQUE constraint)
  await sql`
    INSERT INTO inspections (car_id, player_id, tier, revealed_count, energy_cost)
    VALUES (${carId}, ${playerId}, ${tier}, ${result.revealed.length}, ${energyCost})
    ON CONFLICT (car_id, tier) DO NOTHING
  `;

  // Award XP once per car per tier
  const xpAmount = INSPECTION_XP[tier] || 10;
  await awardXP(playerId, xpAmount, `inspection_${tier}`);

  return reply.send({
    data: { revealed: result.revealed },
    error: null,
    meta: {
      newlyRevealedCount: result.revealed.length,
      xpAwarded: xpAmount,
    },
  });
}

/**
 * GET /cars/:carId/inspections
 * Returns which inspection tiers have been done on the car.
 */
async function getInspectionHistory(request, reply) {
  const { carId } = request.params;
  const playerId = request.playerId;

  // Verify ownership
  const [car] = await sql`
    SELECT id FROM cars
    WHERE id = ${carId} AND player_id = ${playerId}
      AND state != 'available_in_market'
  `;
  if (!car) {
    return reply.code(404).send({ data: null, error: 'Car not found or not owned', meta: null });
  }

  const inspections = await sql`
    SELECT tier, revealed_count, performed_at
    FROM inspections
    WHERE car_id = ${carId}
    ORDER BY performed_at ASC
  `;

  const completedTiers = new Set(inspections.map(i => i.tier));

  return reply.send({
    data: { inspections },
    error: null,
    meta: {
      tiersCompleted: [...completedTiers],
      canDoVisual:   !completedTiers.has('visual'),
      canDoTapTest:  !completedTiers.has('tap_test'),
      canDoObd:      !completedTiers.has('obd'),
      canDoFull:     !completedTiers.has('full'),
    },
  });
}

export default async function inspectionRoutes(fastify) {
  fastify.post('/cars/:carId/inspect',       { preHandler: requireAuth }, inspect);
  fastify.get('/cars/:carId/inspections',    { preHandler: requireAuth }, getInspectionHistory);
}
