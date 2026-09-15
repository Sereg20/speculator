/**
 * Ads routes — Phase 6 / Phase 8 prep
 *
 * POST /ads/grant — server-side validation and application of rewarded ad grants.
 *
 * Ad rewards are NEVER applied client-side (GMS §Phase 8 key risk).
 * Rate limited: max 1 grant per ad_type per player per 4 real hours.
 *
 * Ad types (GMS §15):
 *   energy_refill          — full energy refill
 *   waive_holding_cost     — skip holding cost for one car for one in-game day
 *   second_chance_inspection — re-roll missed detection checks (once per car)
 *   extend_listing         — extend a listing by 2 in-game days (once per listing)
 */

import { sql } from '../db/client.js';
import { requireAuth } from '../middleware/auth.js';
import { getEnergy } from '../services/energyService.js';
import { AD_GRANT_COOLDOWN_HOURS, AD_GRANT_TYPES, INGAME_DAY_REAL_MINUTES } from '../config.js';

const COOLDOWN_MS = AD_GRANT_COOLDOWN_HOURS * 60 * 60 * 1000;

/**
 * POST /ads/grant
 * Body: { adType: string, referenceId?: string }
 *   referenceId = carId for waive_holding_cost / second_chance_inspection
 *                 listingId for extend_listing
 */
async function grantAdReward(request, reply) {
  const playerId = request.playerId;
  const { adType, referenceId } = request.body || {};

  if (!AD_GRANT_TYPES.includes(adType)) {
    return reply.code(400).send({
      data: null,
      error: `Invalid adType. Must be one of: ${AD_GRANT_TYPES.join(', ')}`,
      meta: null,
    });
  }

  // Rate limit check: one grant per adType per player per 4 hours
  const [lastGrant] = await sql`
    SELECT created_at FROM analytics_events
    WHERE player_id = ${playerId}
      AND event_type = 'ad_grant'
      AND metadata->>'adType' = ${adType}
      AND (referenceId IS NULL OR metadata->>'referenceId' = ${referenceId ?? null})
    ORDER BY created_at DESC
    LIMIT 1
  `;

  if (lastGrant) {
    const elapsed = Date.now() - new Date(lastGrant.created_at).getTime();
    if (elapsed < COOLDOWN_MS) {
      const minutesLeft = Math.ceil((COOLDOWN_MS - elapsed) / 60000);
      return reply.code(429).send({
        data: null,
        error: `Ad reward on cooldown. Try again in ${minutesLeft} minutes.`,
        meta: { cooldownMinutesLeft: minutesLeft },
      });
    }
  }

  let result;
  try {
    result = await _applyAdGrant(playerId, adType, referenceId);
  } catch (err) {
    return reply.code(err.statusCode || 500).send({ data: null, error: err.message, meta: null });
  }

  // Log analytics (also used for rate limiting)
  await sql`
    INSERT INTO analytics_events (player_id, event_type, metadata)
    VALUES (${playerId}, 'ad_grant', ${sql.json({ adType, referenceId: referenceId ?? null })})
  `;

  return reply.send({ data: result, error: null, meta: null });
}

async function _applyAdGrant(playerId, adType, referenceId) {
  switch (adType) {
    case 'energy_refill': {
      const [player] = await sql`
        SELECT level FROM players WHERE id = ${playerId}
      `;
      const maxEnergy = player.level >= 15 ? 30 : player.level >= 8 ? 25 : 20;
      await sql`
        UPDATE players
        SET energy_current = ${maxEnergy}, energy_last_updated_at = NOW(), updated_at = NOW()
        WHERE id = ${playerId}
      `;
      return { adType, energyRestored: maxEnergy };
    }

    case 'waive_holding_cost': {
      // Waive holding cost for one car for one in-game day.
      // We implement this by adding the daily holding cost back as a positive transaction.
      if (!referenceId) throw Object.assign(new Error('referenceId (carId) required'), { statusCode: 400 });

      const [car] = await sql`
        SELECT id FROM cars WHERE id = ${referenceId} AND player_id = ${playerId}
          AND state IN ('purchased', 'in_repair', 'listed_for_sale')
      `;
      if (!car) throw Object.assign(new Error('Car not found or not owned'), { statusCode: 404 });

      const [player] = await sql`SELECT level FROM players WHERE id = ${playerId}`;
      const dailyCost = player.level <= 5 ? 12 : player.level <= 12 ? 25 : 40;

      await sql`
        UPDATE players SET cash = cash + ${dailyCost}, updated_at = NOW() WHERE id = ${playerId}
      `;
      await sql`
        INSERT INTO transactions (player_id, type, amount, reference_id, description)
        VALUES (${playerId}, 'ad_reward', ${dailyCost}, ${referenceId}, 'Реклама: отмена стоимости хранения за день')
      `;
      return { adType, cashRefunded: dailyCost };
    }

    case 'second_chance_inspection': {
      // Re-roll missed detection checks at the same tier's probability.
      // This is handled in inspection route — here we just mark the grant as valid.
      // The inspection route checks for an unexpired 'second_chance_inspection' grant.
      if (!referenceId) throw Object.assign(new Error('referenceId (carId) required'), { statusCode: 400 });
      return { adType, carId: referenceId, granted: true };
    }

    case 'extend_listing': {
      if (!referenceId) throw Object.assign(new Error('referenceId (listingId) required'), { statusCode: 400 });

      const extensionMs = 2 * INGAME_DAY_REAL_MINUTES * 60 * 1000;
      const updated = await sql`
        UPDATE listings
        SET expires_at = expires_at + (${extensionMs} || ' milliseconds')::interval
        WHERE id = ${referenceId} AND player_id = ${playerId} AND status = 'active'
        RETURNING id, expires_at
      `;
      if (updated.length === 0) {
        throw Object.assign(new Error('Listing not found or not active'), { statusCode: 404 });
      }
      return { adType, listingId: referenceId, newExpiresAt: updated[0].expires_at };
    }

    default:
      throw Object.assign(new Error('Unknown ad type'), { statusCode: 400 });
  }
}

export default async function adsRoutes(fastify) {
  fastify.post('/ads/grant', { preHandler: requireAuth }, grantAdReward);
}
