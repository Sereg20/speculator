/**
 * Inspection routes
 *
 * POST /cars/:carId/inspect
 *   Body: { actionId: string }
 *   Performs one inspection action on an owned car.
 *   Returns only the defects revealed by this action.
 *
 * GET /cars/:carId/inspections
 *   Returns completed actions + full list of available actions with energy costs.
 *   UI uses this to render the inspection picker.
 */

import { runInspection, inspectionXP, INSPECTION_ACTIONS, resolveAvailableActions } from '../services/inspectionEngine.js';
import { consumeEnergy, refundEnergy } from '../services/energyService.js';
import { awardXP } from '../services/xpService.js';
import { sql } from '../db/client.js';
import { requireAuth } from '../middleware/auth.js';

/**
 * POST /cars/:carId/inspect
 */
async function inspect(request, reply) {
  const { carId } = request.params;
  const playerId = request.playerId;
  const { actionId } = request.body || {};

  const action = INSPECTION_ACTIONS[actionId];
  if (!action) {
    return reply.code(400).send({
      data: null,
      error: `Unknown actionId. Valid actions: ${Object.keys(INSPECTION_ACTIONS).join(', ')}`,
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

  // Each action can only be performed once per car
  const [existing] = await sql`
    SELECT id, revealed_count FROM inspections
    WHERE car_id = ${carId} AND action_id = ${actionId}
  `;
  if (existing) {
    return reply.code(409).send({
      data: null,
      error: `Action '${actionId}' already performed on this car`,
      meta: { alreadyRevealedCount: existing.revealed_count },
    });
  }

  // Consume energy first
  const energyCost = action.energy;
  const hasEnergy = await consumeEnergy(playerId, energyCost);
  if (!hasEnergy) {
    return reply.code(400).send({ data: null, error: 'Not enough energy', meta: null });
  }

  let result;
  try {
    result = await runInspection(carId, playerId, actionId);
  } catch (err) {
    // Refund energy on prerequisite failure
    await refundEnergy(playerId, energyCost);
    return reply.code(err.statusCode || 500).send({ data: null, error: err.message, meta: null });
  }

  await sql`
    INSERT INTO inspections (car_id, player_id, action_id, revealed_count, energy_cost)
    VALUES (${carId}, ${playerId}, ${actionId}, ${result.revealed.length}, ${energyCost})
    ON CONFLICT (car_id, action_id) DO NOTHING
  `;

  const xpAmount = inspectionXP(actionId);
  await awardXP(playerId, xpAmount, `inspection_${actionId}`);

  return reply.send({
    data: { revealed: result.revealed },
    error: null,
    meta: {
      actionId,
      newlyRevealedCount: result.revealed.length,
      energySpent: energyCost,
      xpAwarded: xpAmount,
    },
  });
}

/**
 * GET /cars/:carId/inspections
 * Returns completed actions and the full available-action list for the UI picker.
 */
async function getInspectionHistory(request, reply) {
  const { carId } = request.params;
  const playerId = request.playerId;

  const [car] = await sql`
    SELECT id FROM cars
    WHERE id = ${carId} AND player_id = ${playerId}
      AND state != 'available_in_market'
  `;
  if (!car) {
    return reply.code(404).send({ data: null, error: 'Car not found or not owned', meta: null });
  }

  // What the player has done on this car
  const completed = await sql`
    SELECT action_id, revealed_count, energy_cost, performed_at
    FROM inspections
    WHERE car_id = ${carId}
    ORDER BY performed_at ASC
  `;
  const completedSet = new Set(completed.map(r => r.action_id));

  // Player's skills and equipment — to compute available actions
  const [playerSkills, playerEquipment] = await Promise.all([
    sql`SELECT skill_id FROM player_skills WHERE player_id = ${playerId}`,
    sql`SELECT equipment_id FROM player_equipment WHERE player_id = ${playerId}`,
  ]);
  const skillSet = new Set(playerSkills.map(r => r.skill_id));
  const equipSet = new Set(playerEquipment.map(r => r.equipment_id));

  const availableIds = resolveAvailableActions(skillSet, equipSet);

  const availableActions = availableIds.map(id => {
    const a = INSPECTION_ACTIONS[id];
    return {
      id,
      label:      a.label,
      categories: a.categories,
      energy:     a.energy,
      alreadyDone: completedSet.has(id),
    };
  });

  return reply.send({
    data: { completedActions: completed },
    error: null,
    meta: { availableActions },
  });
}

export default async function inspectionRoutes(fastify) {
  fastify.post('/cars/:carId/inspect',    { preHandler: requireAuth }, inspect);
  fastify.get('/cars/:carId/inspections', { preHandler: requireAuth }, getInspectionHistory);
}
