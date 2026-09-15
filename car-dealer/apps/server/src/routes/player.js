import { sql } from '../db/client.js';
import { requireAuth } from '../middleware/auth.js';
import { getEnergy } from '../services/energyService.js';
import { REPUTATION_TIERS, LEVEL_XP_THRESHOLDS } from '../config.js';

function reputationTier(score) {
  return REPUTATION_TIERS.findLast((t) => score >= t.min)?.name || 'Новичок';
}

/**
 * Compute XP needed to reach the next level.
 * Returns 0 if at max level in the threshold table.
 */
function xpToNextLevel(xp, level) {
  const nextThreshIdx = level; // level is 1-based; index for next threshold = level (0-based)
  if (nextThreshIdx >= LEVEL_XP_THRESHOLDS.length) {
    // Beyond table: every 300 XP = 1 level
    const xpIntoCurrentLevel = xp - LEVEL_XP_THRESHOLDS[LEVEL_XP_THRESHOLDS.length - 1]
      - (level - LEVEL_XP_THRESHOLDS.length) * 300;
    return 300 - xpIntoCurrentLevel;
  }
  return Math.max(0, LEVEL_XP_THRESHOLDS[nextThreshIdx] - xp);
}

/**
 * GET /player/me
 * Returns the authenticated player's full profile.
 */
async function getMe(request, reply) {
  const { current: energyCurrent, max: energyMax } = await getEnergy(request.playerId);

  const [player] = await sql`
    SELECT id, device_id, display_name, cash, xp, level, reputation_score,
           energy_current, garage_slots, in_game_day, cash_stress_active,
           onboarding_complete, created_at, updated_at
    FROM players WHERE id = ${request.playerId}
  `;

  if (!player) {
    return reply.code(404).send({ data: null, error: 'Player not found', meta: null });
  }

  return reply.send({
    data: {
      ...player,
      energy_current: energyCurrent,
      reputation_tier: reputationTier(player.reputation_score),
      xp_to_next_level: xpToNextLevel(player.xp, player.level),
    },
    error: null,
    meta: {
      ingameDay: player.in_game_day,
      energyCurrent,
      energyMax,
    },
  });
}

/**
 * GET /player/stats
 * Returns lightweight stats: cash, xp, level, reputation, energy.
 */
async function getStats(request, reply) {
  const { current: energyCurrent, max: energyMax } = await getEnergy(request.playerId);

  const [player] = await sql`
    SELECT cash, xp, level, reputation_score, in_game_day, cash_stress_active, garage_slots
    FROM players WHERE id = ${request.playerId}
  `;

  if (!player) {
    return reply.code(404).send({ data: null, error: 'Player not found', meta: null });
  }

  return reply.send({
    data: {
      ...player,
      energy_current: energyCurrent,
      energy_max: energyMax,
      reputation_tier: reputationTier(player.reputation_score),
      xp_to_next_level: xpToNextLevel(player.xp, player.level),
    },
    error: null,
    meta: {
      ingameDay: player.in_game_day,
      energyCurrent,
      energyMax,
    },
  });
}

// ─── Skills ──────────────────────────────────────────────────────────────────

/**
 * GET /player/skills
 * Returns all skills: full tree with `owned` flag for each.
 */
async function getSkills(request, reply) {
  const playerId = request.playerId;

  const allSkills = await sql`
    SELECT id, name, description, level_required, xp_cost, skill_type, tier, prerequisites
    FROM skill_tree
    ORDER BY skill_type, tier, level_required
  `;

  const ownedRows = await sql`
    SELECT skill_id FROM player_skills WHERE player_id = ${playerId}
  `;
  const ownedSet = new Set(ownedRows.map(r => r.skill_id));

  const skills = allSkills.map(s => ({ ...s, owned: ownedSet.has(s.id) }));

  return reply.send({ data: { skills }, error: null, meta: { total: skills.length } });
}

/**
 * POST /player/skills/:skillId/purchase
 * Spends XP to unlock a skill. Validates: level gate, prerequisites, XP, not already owned.
 */
async function purchaseSkill(request, reply) {
  const { skillId } = request.params;
  const playerId = request.playerId;

  const [skill] = await sql`
    SELECT id, name, level_required, xp_cost, prerequisites
    FROM skill_tree WHERE id = ${skillId}
  `;
  if (!skill) {
    return reply.code(404).send({ data: null, error: 'Skill not found', meta: null });
  }

  if (skill.xp_cost === 0) {
    // Free default skills (casual_chat, walkaround_glance, etc.) are auto-owned — not purchasable
    return reply.code(400).send({ data: null, error: 'This skill cannot be purchased (it is free/default)', meta: null });
  }

  await sql.begin(async tx => {
    const [player] = await tx`
      SELECT xp, level FROM players WHERE id = ${playerId} FOR UPDATE
    `;
    if (!player) throw Object.assign(new Error('Player not found'), { statusCode: 404 });

    if (player.level < skill.level_required) {
      throw Object.assign(
        new Error(`Level ${skill.level_required} required to unlock this skill`),
        { statusCode: 400 },
      );
    }

    if (player.xp < skill.xp_cost) {
      throw Object.assign(
        new Error(`Not enough XP (need ${skill.xp_cost}, have ${player.xp})`),
        { statusCode: 400 },
      );
    }

    // Check already owned
    const [existing] = await tx`
      SELECT 1 FROM player_skills WHERE player_id = ${playerId} AND skill_id = ${skillId}
    `;
    if (existing) {
      throw Object.assign(new Error('Skill already owned'), { statusCode: 409 });
    }

    // Check prerequisites
    if (skill.prerequisites?.length > 0) {
      const ownedPrereqs = await tx`
        SELECT skill_id FROM player_skills
        WHERE player_id = ${playerId}
          AND skill_id = ANY(${skill.prerequisites})
      `;
      if (ownedPrereqs.length < skill.prerequisites.length) {
        const missing = skill.prerequisites.filter(p => !ownedPrereqs.find(o => o.skill_id === p));
        throw Object.assign(
          new Error(`Missing prerequisites: ${missing.join(', ')}`),
          { statusCode: 400 },
        );
      }
    }

    // Deduct XP and insert skill
    await tx`
      UPDATE players SET xp = xp - ${skill.xp_cost}, updated_at = NOW()
      WHERE id = ${playerId}
    `;
    await tx`
      INSERT INTO player_skills (player_id, skill_id) VALUES (${playerId}, ${skillId})
    `;

    await tx`
      INSERT INTO analytics_events (player_id, event_type, metadata)
      VALUES (${playerId}, 'skill_purchased', ${tx.json({ skillId, xpSpent: skill.xp_cost })})
    `;
  });

  const [updatedPlayer] = await sql`SELECT xp, level FROM players WHERE id = ${playerId}`;

  return reply.code(201).send({
    data: { skillId, name: skill.name },
    error: null,
    meta: { xpAfter: updatedPlayer.xp },
  });
}

// ─── Equipment ───────────────────────────────────────────────────────────────

/**
 * GET /player/equipment
 * Returns all equipment with `owned` flag.
 */
async function getEquipment(request, reply) {
  const playerId = request.playerId;

  const allEquipment = await sql`
    SELECT id, name, purchase_price, level_required, monthly_upkeep,
           detection_tier, detection_bonus, defect_categories_targeted
    FROM equipment
    ORDER BY detection_tier, level_required
  `;

  const ownedRows = await sql`
    SELECT equipment_id FROM player_equipment WHERE player_id = ${playerId}
  `;
  const ownedSet = new Set(ownedRows.map(r => r.equipment_id));

  const equipment = allEquipment.map(e => ({ ...e, owned: ownedSet.has(e.id) }));

  return reply.send({ data: { equipment }, error: null, meta: { total: equipment.length } });
}

/**
 * POST /player/equipment/:equipmentId/purchase
 * Deducts BYN cash. Validates: level gate, not already owned, sufficient funds.
 */
async function purchaseEquipment(request, reply) {
  const { equipmentId } = request.params;
  const playerId = request.playerId;

  const [equip] = await sql`
    SELECT id, name, purchase_price, level_required
    FROM equipment WHERE id = ${equipmentId}
  `;
  if (!equip) {
    return reply.code(404).send({ data: null, error: 'Equipment not found', meta: null });
  }

  await sql.begin(async tx => {
    const [player] = await tx`
      SELECT cash, level FROM players WHERE id = ${playerId} FOR UPDATE
    `;
    if (!player) throw Object.assign(new Error('Player not found'), { statusCode: 404 });

    if (player.level < equip.level_required) {
      throw Object.assign(
        new Error(`Level ${equip.level_required} required for this equipment`),
        { statusCode: 400 },
      );
    }

    if (player.cash < equip.purchase_price) {
      throw Object.assign(new Error('Insufficient funds'), { statusCode: 400 });
    }

    const [existing] = await tx`
      SELECT 1 FROM player_equipment WHERE player_id = ${playerId} AND equipment_id = ${equipmentId}
    `;
    if (existing) throw Object.assign(new Error('Equipment already owned'), { statusCode: 409 });

    await tx`
      UPDATE players
      SET cash = cash - ${equip.purchase_price},
          cash_stress_active = CASE
            WHEN cash - ${equip.purchase_price} < 400 THEN true
            WHEN cash - ${equip.purchase_price} > 900 THEN false
            ELSE cash_stress_active
          END,
          updated_at = NOW()
      WHERE id = ${playerId}
    `;
    await tx`
      INSERT INTO player_equipment (player_id, equipment_id) VALUES (${playerId}, ${equipmentId})
    `;
    await tx`
      INSERT INTO transactions (player_id, type, amount, reference_id, description)
      VALUES (${playerId}, 'equipment_purchase', ${-equip.purchase_price}, NULL, ${`Куплено: ${equip.name}`})
    `;
  });

  const [updatedPlayer] = await sql`SELECT cash FROM players WHERE id = ${playerId}`;

  return reply.code(201).send({
    data: { equipmentId, name: equip.name },
    error: null,
    meta: { cashAfter: updatedPlayer.cash },
  });
}

// ─── Garage upgrade ───────────────────────────────────────────────────────────

/**
 * POST /player/garage/upgrade
 * Upgrades garage to the next tier. Costs BYN, requires level gate.
 */
async function upgradeGarage(request, reply) {
  const playerId = request.playerId;

  const UPGRADE_COSTS    = [0, 0, 1500, 3800, 7500, 14000];
  const UPGRADE_LEVELS   = [0, 1, 3,    7,    11,   14];
  const MAX_GARAGE_SLOTS = 5;

  await sql.begin(async tx => {
    const [player] = await tx`
      SELECT cash, level, garage_slots FROM players WHERE id = ${playerId} FOR UPDATE
    `;
    if (!player) throw Object.assign(new Error('Player not found'), { statusCode: 404 });

    const currentSlots = player.garage_slots;
    if (currentSlots >= MAX_GARAGE_SLOTS) {
      throw Object.assign(new Error('Garage already at maximum tier'), { statusCode: 400 });
    }

    const nextSlots = currentSlots + 1;
    const cost = UPGRADE_COSTS[nextSlots] || 0;
    const levelRequired = UPGRADE_LEVELS[nextSlots] || 1;

    if (player.level < levelRequired) {
      throw Object.assign(
        new Error(`Level ${levelRequired} required for Garage Tier ${nextSlots}`),
        { statusCode: 400 },
      );
    }
    if (player.cash < cost) {
      throw Object.assign(new Error('Insufficient funds'), { statusCode: 400 });
    }

    await tx`
      UPDATE players
      SET cash = cash - ${cost}, garage_slots = ${nextSlots}, updated_at = NOW()
      WHERE id = ${playerId}
    `;
    if (cost > 0) {
      await tx`
        INSERT INTO transactions (player_id, type, amount, description)
        VALUES (${playerId}, 'garage_upgrade', ${-cost}, ${`Гараж улучшен до уровня ${nextSlots}`})
      `;
    }
  });

  const [updatedPlayer] = await sql`
    SELECT cash, garage_slots FROM players WHERE id = ${playerId}
  `;

  return reply.send({
    data: { garageSlots: updatedPlayer.garage_slots },
    error: null,
    meta: { cashAfter: updatedPlayer.cash },
  });
}

// ─── Transactions ─────────────────────────────────────────────────────────────

/**
 * GET /player/transactions
 * Returns the player's transaction history, newest first.
 * Optional query param: limit (default 50, max 100), offset (default 0).
 */
async function getTransactions(request, reply) {
  const playerId = request.playerId;
  const limit  = Math.min(Number(request.query.limit  ?? 50), 100);
  const offset = Number(request.query.offset ?? 0);

  const transactions = await sql`
    SELECT id, type, amount, reference_id, description, created_at
    FROM transactions
    WHERE player_id = ${playerId}
    ORDER BY created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  const [{ total }] = await sql`
    SELECT COUNT(*)::int AS total FROM transactions WHERE player_id = ${playerId}
  `;

  return reply.send({
    data: { transactions },
    error: null,
    meta: { total, limit, offset },
  });
}

// ─── Progression summary ──────────────────────────────────────────────────────

/**
 * GET /player/progression
 * Returns a summary suitable for the progression/level-up screen:
 *   - Current level, XP, XP to next level
 *   - Reputation score and tier
 *   - Recently unlocked skills/equipment (level-gated items the player can now buy)
 *   - Total cars bought/sold, total profit
 */
async function getProgression(request, reply) {
  const playerId = request.playerId;

  const [player] = await sql`
    SELECT xp, level, reputation_score, in_game_day
    FROM players WHERE id = ${playerId}
  `;
  if (!player) {
    return reply.code(404).send({ data: null, error: 'Player not found', meta: null });
  }

  // Skills unlockable at current level (not yet owned)
  const availableSkills = await sql`
    SELECT st.id, st.name, st.xp_cost, st.skill_type, st.tier, st.level_required
    FROM skill_tree st
    WHERE st.level_required <= ${player.level}
      AND st.xp_cost > 0
      AND NOT EXISTS (
        SELECT 1 FROM player_skills ps
        WHERE ps.player_id = ${playerId} AND ps.skill_id = st.id
      )
    ORDER BY st.tier, st.level_required
    LIMIT 10
  `;

  // Equipment unlockable at current level (not yet owned)
  const availableEquipment = await sql`
    SELECT eq.id, eq.name, eq.purchase_price, eq.detection_tier, eq.level_required
    FROM equipment eq
    WHERE eq.level_required <= ${player.level}
      AND NOT EXISTS (
        SELECT 1 FROM player_equipment pe
        WHERE pe.player_id = ${playerId} AND pe.equipment_id = eq.id
      )
    ORDER BY eq.detection_tier, eq.level_required
    LIMIT 10
  `;

  // Career stats
  const [carStats] = await sql`
    SELECT
      COUNT(*) FILTER (WHERE state != 'available_in_market')::int AS total_cars_purchased,
      COUNT(*) FILTER (WHERE state = 'sold')::int AS total_cars_sold
    FROM cars WHERE player_id = ${playerId}
  `;

  const [profitStats] = await sql`
    SELECT COALESCE(SUM(amount), 0)::int AS total_profit
    FROM transactions
    WHERE player_id = ${playerId}
      AND type IN ('sale_revenue', 'car_purchase')
  `;

  const repTierInfo = REPUTATION_TIERS.find(t =>
    player.reputation_score >= t.min && player.reputation_score <= t.max
  ) || REPUTATION_TIERS[0];

  const nextRepTier = REPUTATION_TIERS.find(t => t.min > player.reputation_score);

  return reply.send({
    data: {
      level: player.level,
      xp: player.xp,
      xp_to_next_level: xpToNextLevel(player.xp, player.level),
      reputation_score: player.reputation_score,
      reputation_tier: repTierInfo.name,
      reputation_next_tier: nextRepTier
        ? { name: nextRepTier.name, score_needed: nextRepTier.min - player.reputation_score }
        : null,
      in_game_day: player.in_game_day,
      available_skills: availableSkills,
      available_equipment: availableEquipment,
      career: {
        cars_purchased: carStats.total_cars_purchased,
        cars_sold: carStats.total_cars_sold,
        total_profit: profitStats.total_profit,
      },
    },
    error: null,
    meta: null,
  });
}

export default async function playerRoutes(fastify) {
  fastify.get('/player/me',    { preHandler: requireAuth }, getMe);
  fastify.get('/player/stats', { preHandler: requireAuth }, getStats);

  // Skills
  fastify.get('/player/skills',                          { preHandler: requireAuth }, getSkills);
  fastify.post('/player/skills/:skillId/purchase',       { preHandler: requireAuth }, purchaseSkill);

  // Equipment
  fastify.get('/player/equipment',                              { preHandler: requireAuth }, getEquipment);
  fastify.post('/player/equipment/:equipmentId/purchase',       { preHandler: requireAuth }, purchaseEquipment);

  // Garage
  fastify.post('/player/garage/upgrade',                        { preHandler: requireAuth }, upgradeGarage);

  // Transactions & Progression
  fastify.get('/player/transactions',  { preHandler: requireAuth }, getTransactions);
  fastify.get('/player/progression',   { preHandler: requireAuth }, getProgression);
}
