/**
 * XP service — award XP and handle level-up cascade.
 *
 * Level thresholds from GMS §1.1 (LEVEL_XP_THRESHOLDS).
 * All state changes wrapped in a Postgres transaction.
 *
 * Key invariants:
 *   - XP only ever increases — it is NEVER spent or decremented.
 *   - Level is computed from total XP and only ever increases.
 *   - Skills and equipment are purchased with BYN cash (not XP).
 *   - Level-up cascade logs the event; skill eligibility is not auto-unlocked.
 */

import { sql } from '../db/client.js';
import { LEVEL_XP_THRESHOLDS } from '../config.js';

/**
 * Compute the level a player is at given their total XP.
 * LEVEL_XP_THRESHOLDS is a 0-indexed array where index = (level - 1).
 * LEVEL_XP_THRESHOLDS[0] = 0 (level 1 starts at 0 XP)
 * LEVEL_XP_THRESHOLDS[1] = 400 (level 2 requires 400 total XP)
 * ...
 *
 * @param {number} xp - total XP
 * @returns {number} level (1-based)
 */
export function computeLevel(xp) {
  let level = 1;
  for (let i = 0; i < LEVEL_XP_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_XP_THRESHOLDS[i]) {
      level = i + 1;
    } else {
      break;
    }
  }
  // Beyond level 20: XP_required = THRESHOLD[19] + (level - 20) * 300
  // (GMS §1.1: "Beyond level 20: XP_required = 4,500 + (level − 20) × 300")
  // We compute cumulative: level 21 needs THRESHOLD[19] + 300, etc.
  if (xp >= LEVEL_XP_THRESHOLDS[LEVEL_XP_THRESHOLDS.length - 1]) {
    const xpBeyond = xp - LEVEL_XP_THRESHOLDS[LEVEL_XP_THRESHOLDS.length - 1];
    const extraLevels = Math.floor(xpBeyond / 300);
    level = LEVEL_XP_THRESHOLDS.length + extraLevels;
  }
  return Math.max(1, level);
}

/**
 * Award XP to a player. Handles level-up if threshold crossed.
 * All state changes wrapped in a Postgres transaction.
 *
 * @param {string} playerId
 * @param {number} amount
 * @param {string} source - descriptive label for analytics
 * @returns {Promise<{ newXp: number, newLevel: number, leveledUp: boolean }>}
 */
export async function awardXP(playerId, amount, source) {
  return await sql.begin(async (tx) => {
    const [player] = await tx`
      SELECT xp, level FROM players WHERE id = ${playerId} FOR UPDATE
    `;
    if (!player) throw Object.assign(new Error('Player not found'), { statusCode: 404 });

    const newXp    = player.xp + amount;
    const newLevel = computeLevel(newXp);
    const leveledUp = newLevel > player.level;

    await tx`
      UPDATE players SET xp = ${newXp}, level = ${newLevel}, updated_at = NOW()
      WHERE id = ${playerId}
    `;

    // Log the XP award
    await tx`
      INSERT INTO analytics_events (player_id, event_type, metadata)
      VALUES (${playerId}, 'xp_awarded', ${tx.json({ amount, source, newXp, newLevel, leveledUp })})
    `;

    if (leveledUp) {
      // Level-up cascade: log the event. Skill/equipment eligibility is checked
      // by the client on the next GET /player/skills (no auto-unlock per GMS §6).
      await tx`
        INSERT INTO analytics_events (player_id, event_type, metadata)
        VALUES (${playerId}, 'level_up', ${tx.json({ fromLevel: player.level, toLevel: newLevel, totalXp: newXp })})
      `;
    }

    return { newXp, newLevel, leveledUp };
  });
}
