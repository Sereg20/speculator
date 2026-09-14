/**
 * Repair Queue — Phase 4
 *
 * Manages repair job lifecycle:
 *   startRepair  — validates, deducts cash, writes repair_jobs row, transitions car state
 *   checkCompletion — used by background job and by routes to see if a job is done
 *
 * Key invariants (GMS §8 + IMPL_PLAN Phase 4):
 *   - One active (incomplete) repair per car at a time
 *   - is_quick_fixed set on the defect at completion, not at start
 *   - Postgres is authoritative for timers; completes_at is the source of truth
 *   - Proper repair requires the relevant repair skill; without it only quick_fix allowed
 */

import { sql } from '../db/client.js';
import { transitionCar } from './carStateMachine.js';
import { awardXP } from './xpService.js';
import { INGAME_DAY_REAL_MINUTES } from '../config.js';

// ─── Repair skill → defect type capability map ───────────────────────────────
// Which defect_type IDs each repair skill unlocks for PROPER repair.
// Without the matching skill, player can only quick-fix (if quick-fix is available).
const PROPER_REPAIR_SKILLS = {
  // Tier 0
  watch_tutorial:      ['torn_upholstery', 'broken_electronics', 'alignment_issues'],
  polish_touchup:      ['paint_damage', 'surface_rust'],
  interior_tidy:       ['torn_upholstery'],
  battery_swap:        ['dead_battery'],

  // Tier 1
  basic_spanner:       ['oil_leak_minor', 'starting_issues'],
  wheel_brake_service: ['worn_shocks', 'alignment_issues', 'abs_esp_fault'],
  electrical_basics:   ['dead_battery', 'faulty_alternator', 'abs_esp_fault'],
  fluid_services:      ['transmission_fluid_leak', 'overheating', 'oil_leak_minor'],
  glass_repair:        ['cracked_windscreen', 'cracked_glass'],
  pdr_dent_removal:    ['dent_minor'],

  // Tier 2
  engine_seals_belts:  ['oil_leak_major', 'worn_timing_belt', 'overheating'],
  gearbox_service:     ['slipping_gears_manual', 'gearbox_bearing_wear'],
  suspension_rebuild:  ['worn_shocks', 'loose_ball_joints', 'worn_bushings'],
  body_filler_respray: ['dent_major', 'surface_rust', 'paint_damage'],
  clutch_replacement:  ['clutch_wear'],
  hvac_service:        ['faulty_ac_compressor', 'ac_regas'],
  electrical_diag:     ['airbag_fault', 'abs_esp_fault', 'wiring_harness_damage'],
  structural_rust:     ['structural_rust'],

  // Tier 3
  engine_overhaul:     ['low_compression'],
  auto_gearbox:        ['slipping_gears_auto', 'gearbox_bearing_wear'],
  full_respray:        ['dent_major', 'accident_history', 'paint_damage', 'surface_rust'],
  wiring_harness:      ['wiring_harness_damage'],
  subframe_chassis:    ['damaged_subframe'],
  turbo_induction:     ['turbo_wear'],
};

// Defects that have NO quick-fix option (GMS §6 "Not available" rows)
const NO_QUICK_FIX = new Set([
  'worn_timing_belt',
  'clutch_wear',
  'damaged_subframe',
  'accident_history',
  'odometer_rollback',
]);

// ─── Time multipliers per repair skill tier (GMS §8.2) ───────────────────────
// Highest applicable tier skill owned determines the multiplier.
const SKILL_TIER_MULTIPLIER = { 0: 1.0, 1: 0.9, 2: 0.85, 3: 0.80 };

// Repair skill tier classification (for time multiplier lookup)
const SKILL_REPAIR_TIER = {
  watch_tutorial: 0, polish_touchup: 0, interior_tidy: 0, battery_swap: 0,
  basic_spanner: 1, wheel_brake_service: 1, electrical_basics: 1,
  fluid_services: 1, glass_repair: 1, pdr_dent_removal: 1,
  engine_seals_belts: 2, gearbox_service: 2, suspension_rebuild: 2,
  body_filler_respray: 2, clutch_replacement: 2, hvac_service: 2,
  electrical_diag: 2, structural_rust: 2,
  engine_overhaul: 3, auto_gearbox: 3, full_respray: 3,
  wiring_harness: 3, subframe_chassis: 3, turbo_induction: 3,
};

// Base repair times in in-game days (GMS §8.2)
const BASE_DAYS_PROPER = { minor: 0.5, moderate: 1, major: 3, severe: 4 };
const BASE_DAYS_QUICK  = { minor: 0,   moderate: 0, major: 1, severe: 1.5 };

// Defect severity overrides: some defects are "significant" (2 days base)
const SIGNIFICANT_DEFECTS = new Set([
  'clutch_wear', 'faulty_ac_compressor', 'gearbox_bearing_wear',
  'oil_leak_major', 'worn_timing_belt',
]);

function getBaseDays(defect, repairType) {
  let severity = defect.severity;
  // "Significant" is not a DB enum value; it maps to 2 days base time
  const isSignificant = SIGNIFICANT_DEFECTS.has(defect.defect_type);

  if (repairType === 'proper') {
    if (isSignificant) return 2;
    return BASE_DAYS_PROPER[severity] ?? 1;
  } else {
    if (isSignificant) return 0.5;
    return BASE_DAYS_QUICK[severity] ?? 0;
  }
}

/**
 * Determine the best applicable repair skill tier the player has for a defect.
 * Returns the tier number (0–3) or null if no skill covers this defect for proper repair.
 */
function resolveBestRepairSkillTier(defectType, ownedSkillIds) {
  let bestTier = null;
  for (const skillId of ownedSkillIds) {
    const covers = PROPER_REPAIR_SKILLS[skillId];
    if (!covers || !covers.includes(defectType)) continue;
    const tier = SKILL_REPAIR_TIER[skillId] ?? 0;
    if (bestTier === null || tier > bestTier) bestTier = tier;
  }
  return bestTier;
}

/**
 * Start a repair job.
 *
 * @param {string} carId
 * @param {string} defectId
 * @param {'proper'|'quick_fix'} repairType
 * @param {string} playerId
 * @returns {Promise<object>} the created repair_jobs row
 */
export async function startRepair(carId, defectId, repairType, playerId) {
  return await sql.begin(async tx => {
    // Lock player
    const [player] = await tx`
      SELECT id, cash, level FROM players WHERE id = ${playerId} FOR UPDATE
    `;
    if (!player) throw Object.assign(new Error('Player not found'), { statusCode: 404 });

    // Verify car ownership and valid state
    const [car] = await tx`
      SELECT id, state FROM cars
      WHERE id = ${carId} AND player_id = ${playerId}
        AND state IN ('purchased', 'in_repair')
      FOR UPDATE
    `;
    if (!car) throw Object.assign(new Error('Car not found or not owned'), { statusCode: 404 });

    // Only one active repair at a time per car
    const [activeJob] = await tx`
      SELECT id FROM repair_jobs
      WHERE car_id = ${carId} AND completed = false
    `;
    if (activeJob) {
      throw Object.assign(
        new Error('Car already has an active repair job. Wait for it to complete or cancel it.'),
        { statusCode: 409 },
      );
    }

    // Fetch the defect — must be revealed
    const [defect] = await tx`
      SELECT id, defect_type, category, severity, proper_repair_cost, quick_fix_cost,
             repair_time_minutes, is_odometer_fraud
      FROM defects
      WHERE id = ${defectId} AND car_id = ${carId}
        AND is_revealed_to_player = true AND is_quick_fixed = false
    `;
    if (!defect) {
      throw Object.assign(
        new Error('Defect not found, not revealed, or already repaired'),
        { statusCode: 404 },
      );
    }

    // Odometer rollback: not repairable
    if (defect.is_odometer_fraud) {
      throw Object.assign(new Error('Odometer rollback cannot be repaired'), { statusCode: 400 });
    }

    // Quick fix availability check
    if (repairType === 'quick_fix' && NO_QUICK_FIX.has(defect.defect_type)) {
      throw Object.assign(
        new Error(`${defect.defect_type} has no quick-fix option. Proper repair required.`),
        { statusCode: 400 },
      );
    }

    // Proper repair: check skill availability
    let skillTier = null;
    if (repairType === 'proper') {
      const ownedSkills = await tx`
        SELECT skill_id FROM player_skills WHERE player_id = ${playerId}
      `;
      const ownedSkillIds = ownedSkills.map(r => r.skill_id);
      skillTier = resolveBestRepairSkillTier(defect.defect_type, ownedSkillIds);
      if (skillTier === null) {
        throw Object.assign(
          new Error('You lack the repair skill for a proper repair on this defect. Quick fix only.'),
          { statusCode: 400 },
        );
      }
    }

    // Determine cost
    const cost = repairType === 'proper'
      ? (defect.proper_repair_cost ?? 0)
      : (defect.quick_fix_cost ?? 0);

    if (player.cash < cost) {
      throw Object.assign(new Error('Insufficient funds'), { statusCode: 400 });
    }

    // Compute repair duration
    const baseDays = getBaseDays(defect, repairType);
    const multiplier = repairType === 'proper'
      ? (SKILL_TIER_MULTIPLIER[skillTier] ?? 1.0)
      : 1.0;
    // Round up to nearest 0.5 days, then convert to real milliseconds
    const rawDays = baseDays * multiplier;
    const roundedDays = Math.ceil(rawDays * 2) / 2;  // nearest 0.5
    const durationMs = roundedDays * INGAME_DAY_REAL_MINUTES * 60 * 1000;
    const completesAt = new Date(Date.now() + durationMs);
    // Immediate repairs (0 days) complete right away
    const isImmediate = roundedDays === 0;

    // Deduct cash
    await tx`
      UPDATE players
      SET cash = cash - ${cost},
          cash_stress_active = CASE
            WHEN cash - ${cost} < 400 THEN true
            WHEN cash - ${cost} > 900 THEN false
            ELSE cash_stress_active
          END,
          updated_at = NOW()
      WHERE id = ${playerId}
    `;

    // Write transaction log
    await tx`
      INSERT INTO transactions (player_id, type, amount, reference_id, description)
      VALUES (
        ${playerId}, 'repair', ${-cost}, ${carId},
        ${`${repairType === 'proper' ? 'Ремонт' : 'Быстрый ремонт'}: ${defect.defect_type}`}
      )
    `;

    // Create repair job
    const [job] = await tx`
      INSERT INTO repair_jobs (car_id, defect_id, repair_type, completes_at, cost_charged)
      VALUES (${carId}, ${defectId}, ${repairType}, ${completesAt}, ${cost})
      RETURNING id, car_id, defect_id, repair_type, started_at, completes_at, completed, cost_charged
    `;

    // If immediate (0-duration), complete inline
    if (isImmediate) {
      await tx`
        UPDATE repair_jobs SET completed = true WHERE id = ${job.id}
      `;
      await tx`
        UPDATE defects
        SET is_quick_fixed = ${repairType === 'quick_fix'},
            is_revealed_to_player = true
        WHERE id = ${defectId}
      `;
      // Car state stays 'purchased' (no state change needed for immediate repair)
      return { ...job, completed: true };
    }

    // Transition car to in_repair (non-immediate)
    await transitionCar(carId, 'in_repair', { sqlClient: tx });

    return job;
  });
}

/**
 * Check and complete a repair job if its timer has elapsed.
 * Called by the background job and optionally by the route to get current status.
 *
 * @param {string} repairJobId
 * @returns {Promise<{ completed: boolean, job: object }>}
 */
export async function checkCompletion(repairJobId) {
  const [job] = await sql`
    SELECT id, car_id, defect_id, repair_type, completes_at, completed
    FROM repair_jobs WHERE id = ${repairJobId}
  `;

  if (!job) throw Object.assign(new Error('Repair job not found'), { statusCode: 404 });
  if (job.completed) return { completed: true, job };
  if (new Date(job.completes_at) > new Date()) return { completed: false, job };

  await completeRepairJob(job);
  return { completed: true, job };
}

/**
 * Finalise a completed repair job.
 * Called by checkCompletion and the background cron job.
 * Safe to call multiple times — the UPDATE WHERE completed=false is idempotent.
 *
 * @param {object} job - repair_jobs row
 */
export async function completeRepairJob(job) {
  await sql.begin(async tx => {
    // Atomic guard: only process if still incomplete
    const result = await tx`
      UPDATE repair_jobs SET completed = true
      WHERE id = ${job.id} AND completed = false
      RETURNING id
    `;
    if (result.length === 0) return;  // already completed by another process

    // Mark defect repaired
    await tx`
      UPDATE defects
      SET is_quick_fixed = ${job.repair_type === 'quick_fix'}
      WHERE id = ${job.defect_id}
    `;

    // Transition car back to purchased (ready for next action)
    // Use raw UPDATE here instead of transitionCar to avoid double-lock issues in tx
    await tx`
      UPDATE cars SET state = 'purchased', updated_at = NOW()
      WHERE id = ${job.car_id} AND state = 'in_repair'
    `;

    // Award XP: 25 XP per 500 BYN spent, max 50 (GMS §1.2)
    const [fullJob] = await tx`
      SELECT cost_charged FROM repair_jobs WHERE id = ${job.id}
    `;
    const xpBase = Math.min(Math.floor((fullJob.cost_charged / 500)) * 25, 50);
    const xp = job.repair_type === 'quick_fix' ? 10 : Math.max(xpBase, 25);

    // Fetch player_id via car
    const [car] = await tx`SELECT player_id FROM cars WHERE id = ${job.car_id}`;
    if (car?.player_id) {
      // awardXP opens its own transaction; call after this tx completes
      // Store for post-transaction call
      job._xpToAward = xp;
      job._playerId = car.player_id;
    }
  });

  // Award XP outside the transaction
  if (job._playerId && job._xpToAward) {
    await awardXP(job._playerId, job._xpToAward, 'repair_complete').catch(() => {});
  }
}
