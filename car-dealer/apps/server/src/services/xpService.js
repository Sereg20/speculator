/**
 * XP service — award XP and handle level-up cascade.
 */

import { sql } from '../db/client.js';
import { LEVEL_XP_THRESHOLDS } from '../config.js';

/**
 * Award XP to a player. Handles level-up if threshold crossed.
 * All state changes wrapped in a Postgres transaction.
 *
 * @param {string} playerId
 * @param {number} amount
 * @param {string} source - descriptive label for transaction log
 * @returns {Promise<{ newXp: number, newLevel: number, leveledUp: boolean }>}
 */
export async function awardXP(playerId, amount, source) {
  return await sql.begin(async (tx) => {
    const [player] = await tx`
      SELECT xp, level FROM players WHERE id = ${playerId} FOR UPDATE
    `;
    if (!player) throw Object.assign(new Error('Player not found'), { statusCode: 404 });

    const newXp = player.xp + amount;
    let newLevel = player.level;

    // Find the highest level the player qualifies for
    for (let i = LEVEL_XP_THRESHOLDS.length - 1; i > newLevel; i--) {
      if (newXp >= LEVEL_XP_THRESHOLDS[i]) {
        newLevel = i + 1; // LEVEL_XP_THRESHOLDS is 0-indexed but levels start at 1
        break;
      }
    }

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

    return { newXp, newLevel, leveledUp };
  });
}
