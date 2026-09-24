/**
 * Repair routes — Phase 4
 *
 * POST /cars/:carId/repairs              — start a repair job
 * GET  /cars/:carId/repairs              — list all repair jobs (pending + completed)
 * POST /cars/:carId/repairs/:jobId/cancel — cancel a pending job (partial refund)
 */

import { startRepair, checkCompletion } from '../services/repairQueue.js';
import { consumeEnergy, refundEnergy } from '../services/energyService.js';
import { labelDefect } from '../services/defectEngine.js';
import { sql } from '../db/client.js';
import { requireAuth } from '../middleware/auth.js';

// Energy cost per GMS §1.3
const ENERGY_COST_REPAIR = 3;

/**
 * POST /cars/:carId/repairs
 * Body: { defectId: string, repairType: 'proper'|'quick_fix' }
 */
async function startRepairRoute(request, reply) {
  const { carId } = request.params;
  const playerId = request.playerId;
  const { defectId, repairType } = request.body || {};

  if (!defectId) {
    return reply.code(400).send({ data: null, error: 'defectId is required', meta: null });
  }
  if (!['proper', 'quick_fix'].includes(repairType)) {
    return reply.code(400).send({
      data: null,
      error: 'repairType must be "proper" or "quick_fix"',
      meta: null,
    });
  }

  // Consume energy first
  const hasEnergy = await consumeEnergy(playerId, ENERGY_COST_REPAIR);
  if (!hasEnergy) {
    return reply.code(400).send({ data: null, error: 'Not enough energy', meta: null });
  }

  let job;
  try {
    job = await startRepair(carId, defectId, repairType, playerId);
  } catch (err) {
    // Refund energy on business-logic failure
    await refundEnergy(playerId, ENERGY_COST_REPAIR);
    return reply.code(err.statusCode || 500).send({ data: null, error: err.message, meta: null });
  }

  const isImmediate = job.completed;
  return reply.code(201).send({
    data: { job },
    error: null,
    meta: {
      immediate: isImmediate,
      completesAt: job.completes_at,
    },
  });
}

/**
 * GET /cars/:carId/repairs
 * Returns all repair jobs for the car, newest first.
 */
async function listRepairs(request, reply) {
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

  // Check if any running job has completed (lazy completion check)
  const [activeJob] = await sql`
    SELECT id, completes_at FROM repair_jobs
    WHERE car_id = ${carId} AND completed = false
    LIMIT 1
  `;
  if (activeJob && new Date(activeJob.completes_at) <= new Date()) {
    await checkCompletion(activeJob.id).catch(() => {});
  }

  const jobs = await sql`
    SELECT rj.id, rj.defect_id, rj.repair_type, rj.started_at, rj.completes_at,
           rj.completed, rj.cost_charged,
           d.defect_type, d.category, d.severity
    FROM repair_jobs rj
    JOIN defects d ON d.id = rj.defect_id
    WHERE rj.car_id = ${carId}
    ORDER BY rj.started_at DESC
  `;

  const labelledJobs = labelDefect(jobs);
  const active = labelledJobs.filter(j => !j.completed);
  const completed = labelledJobs.filter(j => j.completed);

  return reply.send({
    data: { jobs: labelledJobs, active, completed },
    error: null,
    meta: {
      total: jobs.length,
      activeCount: active.length,
    },
  });
}

/**
 * POST /cars/:carId/repairs/:jobId/cancel
 * Cancels a repair job that hasn't completed yet.
 * Partial refund: 50% of cost if work hasn't started meaningfully (< 10% elapsed),
 * otherwise no refund.
 */
async function cancelRepair(request, reply) {
  const { carId, jobId } = request.params;
  const playerId = request.playerId;

  // Verify car ownership
  const [car] = await sql`
    SELECT id, state FROM cars
    WHERE id = ${carId} AND player_id = ${playerId}
  `;
  if (!car) {
    return reply.code(404).send({ data: null, error: 'Car not found or not owned', meta: null });
  }

  let refundAmount = 0;

  await sql.begin(async tx => {
    const [job] = await tx`
      SELECT id, car_id, repair_type, cost_charged, started_at, completes_at, completed
      FROM repair_jobs
      WHERE id = ${jobId} AND car_id = ${carId}
      FOR UPDATE
    `;

    if (!job) throw Object.assign(new Error('Repair job not found'), { statusCode: 404 });
    if (job.completed) throw Object.assign(new Error('Repair already completed — cannot cancel'), { statusCode: 409 });

    const now = Date.now();
    const started = new Date(job.started_at).getTime();
    const completes = new Date(job.completes_at).getTime();
    const totalDuration = completes - started;
    const elapsed = now - started;
    const fractionElapsed = totalDuration > 0 ? elapsed / totalDuration : 1;

    // Refund 50% if less than 10% of repair elapsed, else 0%
    refundAmount = fractionElapsed < 0.10 ? Math.floor(job.cost_charged * 0.5) : 0;

    // Mark job cancelled (reuse completed=true, cancel info in a future field if needed)
    await tx`
      UPDATE repair_jobs SET completed = true WHERE id = ${jobId}
    `;

    // Restore car state to purchased if it was in_repair
    await tx`
      UPDATE cars SET state = 'purchased', updated_at = NOW()
      WHERE id = ${carId} AND state = 'in_repair'
    `;

    if (refundAmount > 0) {
      await tx`
        UPDATE players
        SET cash = cash + ${refundAmount},
            cash_stress_active = CASE
              WHEN cash + ${refundAmount} > 900 THEN false
              ELSE cash_stress_active
            END,
            updated_at = NOW()
        WHERE id = ${playerId}
      `;
      await tx`
        INSERT INTO transactions (player_id, type, amount, reference_id, description)
        VALUES (${playerId}, 'repair', ${refundAmount}, ${carId}, 'Возврат за отмену ремонта (частичный)')
      `;
    }
  });

  return reply.send({
    data: { cancelled: true, refundAmount },
    error: null,
    meta: null,
  });
}

export default async function repairRoutes(fastify) {
  const auth = { preHandler: requireAuth };

  fastify.post('/cars/:carId/repairs',                  auth, startRepairRoute);
  fastify.get('/cars/:carId/repairs',                   auth, listRepairs);
  fastify.post('/cars/:carId/repairs/:jobId/cancel',    auth, cancelRepair);
}
