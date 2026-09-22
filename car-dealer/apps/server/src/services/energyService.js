/**
 * Energy service — lazy-compute regen from timestamps.
 * No background job needed. Redis is a hint only; Postgres is authoritative.
 */

import { sql } from '../db/client.js';
import {
  ENERGY_MAX_EARLY,
  ENERGY_MAX_MID,
  ENERGY_MAX_LATE,
  ENERGY_REGEN_REAL_MINUTES,
} from '../config.js';

function energyMax(level) {
  if (level >= 15) return ENERGY_MAX_LATE;
  if (level >= 8)  return ENERGY_MAX_MID;
  return ENERGY_MAX_EARLY;
}

/**
 * Get the player's current energy, applying regen since last update.
 * Lazily writes the new value to DB if regen occurred.
 *
 * @param {string} playerId
 * @returns {Promise<{ current: number, max: number }>}
 */
export async function getEnergy(playerId) {
  const [player] = await sql`
    SELECT energy_current, energy_last_updated_at, level
    FROM players WHERE id = ${playerId}
  `;
  if (!player) throw Object.assign(new Error('Player not found'), { statusCode: 404 });

  const max = energyMax(player.level);
  const elapsedMinutes = (Date.now() - new Date(player.energy_last_updated_at).getTime()) / 60000;
  const regenTicks = Math.floor(elapsedMinutes / ENERGY_REGEN_REAL_MINUTES);

  if (regenTicks === 0) {
    return { current: Math.min(player.energy_current, max), max };
  }

  const newEnergy = Math.min(player.energy_current + regenTicks, max);
  const advanceMinutes = regenTicks * ENERGY_REGEN_REAL_MINUTES;

  await sql`
    UPDATE players
    SET energy_current = ${newEnergy},
        energy_last_updated_at = energy_last_updated_at + (${advanceMinutes} * interval '1 minute')
    WHERE id = ${playerId}
  `;

  return { current: newEnergy, max };
}

/**
 * Refund energy, capped at the player's level-appropriate max.
 *
 * @param {string} playerId
 * @param {number} amount
 */
export async function refundEnergy(playerId, amount) {
  await sql`
    UPDATE players
    SET energy_current = LEAST(
          energy_current + ${amount},
          CASE WHEN level >= 15 THEN 100 WHEN level >= 8 THEN 75 ELSE 50 END
        ),
        updated_at = NOW()
    WHERE id = ${playerId}
  `;
}

/**
 * Atomically consume energy. Returns false if insufficient energy.
 *
 * @param {string} playerId
 * @param {number} amount
 * @returns {Promise<boolean>}
 */
export async function consumeEnergy(playerId, amount) {
  // First sync regen
  await getEnergy(playerId);

  const result = await sql`
    UPDATE players
    SET energy_current = energy_current - ${amount},
        updated_at = NOW()
    WHERE id = ${playerId}
      AND energy_current >= ${amount}
    RETURNING id
  `;

  return result.length > 0;
}
