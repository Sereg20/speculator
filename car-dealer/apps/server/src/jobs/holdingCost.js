/**
 * Holding cost background job — Phase 4
 *
 * Ticks once per in-game day (every INGAME_DAY_REAL_MINUTES real minutes).
 *
 * Per tick, for each player:
 *   1. Advance in_game_day by the number of elapsed days since last tick
 *   2. Charge holding cost per owned car (per day)
 *   3. Charge weekly garage rent (days 8, 15, 22, … — first week rent-free)
 *   4. Charge tool upkeep every 30 in-game days
 *   5. Update cash_stress_active threshold
 *
 * Idempotency:
 *   - last_day_ticked_at tracks the last processed real timestamp.
 *   - Days elapsed = floor((now - last_day_ticked_at) / INGAME_DAY_REAL_MINUTES).
 *   - If elapsed days = 0, skip — prevents double-charge on crash recovery.
 *   - All updates inside a single transaction per player (FOR UPDATE lock).
 *
 * Tool upkeep (GMS §2.3):
 *   - Charged every 30 in-game days based on highest Tier 2–3 equipment owned.
 *   - Tier 0–1 have monthly_upkeep = 0 in the equipment table.
 *   - We pick MAX(monthly_upkeep) over the player's equipment where detection_tier >= 2.
 */

import cron from 'node-cron';
import { sql } from '../db/client.js';
import {
  INGAME_DAY_REAL_MINUTES,
  GARAGE_WEEKLY_RENT,
  HOLDING_COST_EARLY,
  HOLDING_COST_MID,
  HOLDING_COST_LATE,
  CASH_STRESS_ENTRY,
  CASH_STRESS_EXIT,
} from '../config.js';

const INGAME_DAY_REAL_MS = INGAME_DAY_REAL_MINUTES * 60 * 1000;

/** Holding cost per in-game day based on player level (GMS §2.2). */
function holdingCostPerDay(level) {
  if (level <= 5)  return HOLDING_COST_EARLY;
  if (level <= 12) return HOLDING_COST_MID;
  return HOLDING_COST_LATE;
}

/** Garage weekly rent for a given garage tier (GMS §2.1). Index = tier. */
function weeklyRent(garageTier) {
  return GARAGE_WEEKLY_RENT[garageTier] ?? 0;
}

/**
 * Process one player's tick.
 * @param {object} player - Minimal row from players (id, level, cash, garage_slots,
 *                          in_game_day, last_day_ticked_at, cash_stress_active)
 * @param {object} log    - Fastify logger
 */
async function tickPlayer(player, log) {
  const now = Date.now();
  const lastTickMs = new Date(player.last_day_ticked_at).getTime();
  const elapsedMs = now - lastTickMs;
  const daysElapsed = Math.floor(elapsedMs / INGAME_DAY_REAL_MS);

  if (daysElapsed <= 0) return;  // nothing to process yet

  await sql.begin(async tx => {
    // Re-lock the player row with the latest state
    const [p] = await tx`
      SELECT id, level, cash, garage_slots, in_game_day,
             last_day_ticked_at, cash_stress_active
      FROM players
      WHERE id = ${player.id}
      FOR UPDATE
    `;
    if (!p) return;

    // Re-check elapsed after lock (another process may have beaten us)
    const lockedNow = Date.now();
    const lockedLastTickMs = new Date(p.last_day_ticked_at).getTime();
    const lockedElapsed = Math.floor((lockedNow - lockedLastTickMs) / INGAME_DAY_REAL_MS);
    if (lockedElapsed <= 0) return;

    const daysBefore = p.in_game_day;
    const daysAfter  = p.in_game_day + lockedElapsed;

    // ── Count owned cars (purchased / in_repair / listed_for_sale) ──
    const [{ car_count }] = await tx`
      SELECT COUNT(*)::int AS car_count
      FROM cars
      WHERE player_id = ${p.id}
        AND state IN ('purchased', 'in_repair', 'listed_for_sale')
    `;

    // ── 1. Holding cost ──────────────────────────────────────────────
    const dailyCost = holdingCostPerDay(p.level);
    const holdingDeduct = dailyCost * car_count * lockedElapsed;

    // ── 2. Weekly rent ───────────────────────────────────────────────
    // First charge on day 8, then every 7 days after that.
    // Count how many rent periods land in (daysBefore, daysAfter].
    let rentDeduct = 0;
    const rent = weeklyRent(p.garage_slots);
    if (rent > 0) {
      for (let d = daysBefore + 1; d <= daysAfter; d++) {
        // Rent on day 8, 15, 22, … (first week rent-free means day 1–7 are free)
        if (d >= 8 && (d - 8) % 7 === 0) {
          rentDeduct += rent;
        }
      }
    }

    // ── 3. Tool upkeep (every 30 in-game days) ───────────────────────
    // Based on highest monthly_upkeep among Tier 2+ equipment the player owns.
    let toolUpkeepDeduct = 0;
    const [upkeepRow] = await tx`
      SELECT COALESCE(MAX(eq.monthly_upkeep), 0)::int AS max_upkeep
      FROM player_equipment pe
      JOIN equipment eq ON eq.id = pe.equipment_id
      WHERE pe.player_id = ${p.id}
        AND eq.detection_tier >= 2
        AND eq.monthly_upkeep > 0
    `;
    const monthlyUpkeep = upkeepRow?.max_upkeep ?? 0;
    if (monthlyUpkeep > 0) {
      // Count how many 30-day boundaries fall in (daysBefore, daysAfter]
      const periodsBefore = Math.floor((daysBefore - 1) / 30);
      const periodsAfter  = Math.floor((daysAfter  - 1) / 30);
      const newPeriods = periodsAfter - periodsBefore;
      toolUpkeepDeduct = monthlyUpkeep * newPeriods;
    }

    const totalDeduct = holdingDeduct + rentDeduct + toolUpkeepDeduct;
    const newCash = p.cash - totalDeduct;
    const newCashStress = newCash < CASH_STRESS_ENTRY
      ? true
      : newCash > CASH_STRESS_EXIT
        ? false
        : p.cash_stress_active;

    // ── Apply all changes ────────────────────────────────────────────
    await tx`
      UPDATE players
      SET in_game_day        = ${daysAfter},
          last_day_ticked_at = NOW(),
          cash               = GREATEST(0, ${newCash}),
          cash_stress_active = ${newCashStress},
          updated_at         = NOW()
      WHERE id = ${p.id}
    `;

    // ── Write transaction records (only if something was charged) ────
    if (holdingDeduct > 0 && car_count > 0) {
      await tx`
        INSERT INTO transactions (player_id, type, amount, reference_id, description)
        VALUES (
          ${p.id}, 'holding_cost', ${-holdingDeduct}, NULL,
          ${`Стоимость хранения: ${car_count} авто × ${lockedElapsed} дн. × ${dailyCost} BYN`}
        )
      `;
    }
    if (rentDeduct > 0) {
      await tx`
        INSERT INTO transactions (player_id, type, amount, reference_id, description)
        VALUES (
          ${p.id}, 'rent', ${-rentDeduct}, NULL,
          ${`Аренда гаража (уровень ${p.garage_slots}): ${rentDeduct} BYN`}
        )
      `;
    }
    if (toolUpkeepDeduct > 0) {
      await tx`
        INSERT INTO transactions (player_id, type, amount, reference_id, description)
        VALUES (
          ${p.id}, 'tool_upkeep', ${-toolUpkeepDeduct}, NULL,
          ${`Обслуживание оборудования: ${toolUpkeepDeduct} BYN`}
        )
      `;
    }

    if (totalDeduct > 0) {
      log.info(
        { playerId: p.id, days: lockedElapsed, holdingDeduct, rentDeduct, toolUpkeepDeduct },
        '[holdingCost] Charged player',
      );
    }
  });
}

export function startHoldingCostJob(log) {
  // Check every minute; actual logic is gated by INGAME_DAY_REAL_MS elapsed.
  cron.schedule('* * * * *', async () => {
    let players;
    try {
      // Fetch players who are due for at least one tick
      players = await sql`
        SELECT id, level, cash, garage_slots, in_game_day,
               last_day_ticked_at, cash_stress_active
        FROM players
        WHERE last_day_ticked_at <= NOW() - (${INGAME_DAY_REAL_MINUTES} || ' minutes')::interval
      `;
    } catch (err) {
      log.error({ err }, '[holdingCost] Failed to query players due for tick');
      return;
    }

    if (players.length === 0) return;

    for (const player of players) {
      try {
        await tickPlayer(player, log);
      } catch (err) {
        log.error({ err, playerId: player.id }, '[holdingCost] Failed to tick player');
      }
    }
  });

  log.info('[holdingCost] Scheduled (every minute, ticks when in-game day elapses)');
}
