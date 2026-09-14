/**
 * Car routes — Phase 2+
 *
 * GET /cars           — list all owned cars
 * GET /cars/:carId    — return car details (player must own it)
 * GET /cars/:carId/defects — return only revealed defects (Phase 3)
 *
 * Inspection, repair, and listing routes are in their own route files.
 */

import { sql } from '../db/client.js';
import { requireAuth } from '../middleware/auth.js';

/**
 * GET /cars/:carId
 * Returns full car details including revealed defects.
 * Player must own the car (player_id matches and state != available_in_market).
 */
async function getCar(request, reply) {
  const { carId } = request.params;
  const playerId = request.playerId;

  const [car] = await sql`
    SELECT id, make, model, year, mileage, color,
           condition_tier, quality_tier, market_value, purchase_price, asking_price,
           seller_archetype, is_turbo, state, created_at, updated_at
    FROM cars
    WHERE id = ${carId}
      AND player_id = ${playerId}
      AND state != 'available_in_market'
  `;

  if (!car) {
    return reply.code(404).send({ data: null, error: 'Car not found', meta: null });
  }

  // Fetch only revealed defects
  const revealedDefects = await sql`
    SELECT id, defect_type, category, severity, detection_tier,
           is_quick_fixed, proper_repair_cost, quick_fix_cost,
           repair_time_minutes, resale_impact, is_odometer_fraud
    FROM defects
    WHERE car_id = ${carId}
      AND is_revealed_to_player = true
    ORDER BY severity DESC, detection_tier ASC
  `;

  // Fetch active repair job (if any)
  const [activeRepair] = await sql`
    SELECT id, repair_type, started_at, completes_at, defect_id
    FROM repair_jobs
    WHERE car_id = ${carId}
      AND completed = false
    ORDER BY started_at ASC
    LIMIT 1
  `;

  return reply.send({
    data: {
      car: {
        ...car,
        // Don't expose quality_tier (reveals listing deal quality to client)
        quality_tier: undefined,
      },
      revealedDefects,
      activeRepair: activeRepair || null,
    },
    error: null,
    meta: {
      revealedDefectCount: revealedDefects.length,
      hasActiveRepair: !!activeRepair,
    },
  });
}

/**
 * GET /cars
 * Returns all cars owned by the player (excluding market listings and sold).
 */
async function getMyCars(request, reply) {
  const playerId = request.playerId;

  const cars = await sql`
    SELECT id, make, model, year, mileage, color,
           condition_tier, purchase_price, asking_price,
           seller_archetype, is_turbo, state, created_at, updated_at
    FROM cars
    WHERE player_id = ${playerId}
      AND state IN ('purchased', 'in_repair', 'listed_for_sale')
    ORDER BY created_at DESC
  `;

  return reply.send({
    data: { cars },
    error: null,
    meta: { total: cars.length },
  });
}

export default async function carRoutes(fastify) {
  const auth = { preHandler: requireAuth };

  fastify.get('/cars',                 auth, getMyCars);
  fastify.get('/cars/:carId',          auth, getCar);
  fastify.get('/cars/:carId/defects',  auth, getDefects);
}

/**
 * GET /cars/:carId/defects
 * Returns only is_revealed_to_player = true defect rows.
 * Never returns hidden defect counts or IDs.
 */
async function getDefects(request, reply) {
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

  const defects = await sql`
    SELECT id, defect_type, category, severity, detection_tier,
           is_quick_fixed, proper_repair_cost, quick_fix_cost,
           repair_time_minutes, resale_impact, is_odometer_fraud
    FROM defects
    WHERE car_id = ${carId}
      AND is_revealed_to_player = true
    ORDER BY severity DESC, detection_tier ASC
  `;

  return reply.send({
    data: { defects },
    error: null,
    meta: { count: defects.length },
  });
}
