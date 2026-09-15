/**
 * Market routes — Phase 2
 *
 * GET  /market/listings                — browse available cars
 * GET  /market/listings/:carId/dialogue — fetch seller intro (lazy Gemini)
 * POST /market/listings/:carId/purchase — buy a car
 * POST /market/listings/refresh         — force-refresh listings (costs 80 BYN)
 */

import { getOrRefreshListings, generateListings } from '../services/listingGenerator.js';
import { generateDialogue } from '../services/aiProxy.js';
import { transitionCar } from '../services/carStateMachine.js';
import { consumeEnergy } from '../services/energyService.js';
import { awardXP } from '../services/xpService.js';
import { resolvePurchaseNegotiation } from '../services/negotiationEngine.js';
import { sql } from '../db/client.js';
import { requireAuth } from '../middleware/auth.js';
import { LISTING_REFRESH_MANUAL_COST, INGAME_DAY_REAL_MINUTES } from '../config.js';

// Energy cost per GMS §1.3
const ENERGY_COST_PURCHASE = 2;

/**
 * GET /market/listings
 * Returns current available listings for the player.
 * Generates them if absent or all expired.
 */
async function getListings(request, reply) {
  const playerId = request.playerId;

  const [player] = await sql`
    SELECT level, garage_slots FROM players WHERE id = ${playerId}
  `;
  if (!player) {
    return reply.code(404).send({ data: null, error: 'Player not found', meta: null });
  }

  // Count owned cars (purchased / in_repair / listed_for_sale)
  const [{ count: ownedCount }] = await sql`
    SELECT COUNT(*) AS count FROM cars
    WHERE player_id = ${playerId}
      AND state IN ('purchased', 'in_repair', 'listed_for_sale')
  `;

  const listings = await getOrRefreshListings(playerId, player.level);

  // Strip internal quality_tier from response — don't leak deal quality to client
  const safeListings = listings.map(({ quality_tier: _qt, ...rest }) => rest);

  return reply.send({
    data: { listings: safeListings },
    error: null,
    meta: {
      garageSlots: player.garage_slots,
      ownedCars: Number(ownedCount),
      slotsAvailable: player.garage_slots - Number(ownedCount),
    },
  });
}

/**
 * GET /market/listings/:carId/dialogue
 * Fetch (or lazily generate) the seller intro dialogue for a listing.
 * Caches result in cars.seller_dialogue.
 */
async function getDialogue(request, reply) {
  const { carId } = request.params;
  const playerId = request.playerId;

  const [car] = await sql`
    SELECT id, make, model, year, mileage, asking_price,
           seller_archetype, seller_dialogue, state,
           market_listing_expires_at
    FROM cars
    WHERE id = ${carId}
      AND player_id = ${playerId}
      AND state = 'available_in_market'
  `;

  if (!car) {
    return reply.code(404).send({ data: null, error: 'Listing not found', meta: null });
  }

  // Serve cached dialogue if present
  if (car.seller_dialogue?.intro) {
    return reply.send({ data: { dialogue: car.seller_dialogue.intro }, error: null, meta: null });
  }

  const ingameDaysListed = Math.floor(
    (Date.now() - new Date(car.market_listing_expires_at).getTime() + 7 * INGAME_DAY_REAL_MINUTES * 60000)
    / (INGAME_DAY_REAL_MINUTES * 60000),
  );

  const dialogue = await generateDialogue('seller_intro', {
    seller_archetype: car.seller_archetype,
    car_make_model_year: `${car.make} ${car.model}, ${car.year} г.`,
    car_mileage: car.mileage,
    asking_price: car.asking_price,
    days_listed: Math.max(0, ingameDaysListed),
    negotiation_attempt: false,
    region: 'Минск',
  });

  // Cache
  await sql`
    UPDATE cars
    SET seller_dialogue = jsonb_set(COALESCE(seller_dialogue, '{}'), '{intro}', to_jsonb(${dialogue}::text)),
        updated_at = NOW()
    WHERE id = ${carId}
  `;

  return reply.send({ data: { dialogue }, error: null, meta: null });
}

/**
 * POST /market/listings/:carId/purchase
 * Body: (none required)
 *
 * Validates: energy, garage slots, cash, listing still active.
 * Deducts cash, transitions car state, awards XP, writes transaction.
 */
async function purchaseCar(request, reply) {
  const { carId } = request.params;
  const playerId = request.playerId;

  // Check energy
  const hasEnergy = await consumeEnergy(playerId, ENERGY_COST_PURCHASE);
  if (!hasEnergy) {
    return reply.code(400).send({ data: null, error: 'Not enough energy', meta: null });
  }

  // Run within a transaction
  let car;
  try {
    await sql.begin(async tx => {
      // Lock player row
      const [player] = await tx`
        SELECT id, cash, garage_slots, level FROM players
        WHERE id = ${playerId} FOR UPDATE
      `;
      if (!player) throw Object.assign(new Error('Player not found'), { statusCode: 404 });

      // Count active cars
      const [{ count: ownedCount }] = await tx`
        SELECT COUNT(*) AS count FROM cars
        WHERE player_id = ${playerId}
          AND state IN ('purchased', 'in_repair', 'listed_for_sale')
      `;
      if (Number(ownedCount) >= player.garage_slots) {
        throw Object.assign(new Error('No free garage slot'), { statusCode: 400 });
      }

      // Lock the car row — must still be available
      const [listing] = await tx`
        SELECT id, asking_price, make, model, year, state
        FROM cars
        WHERE id = ${carId}
          AND player_id = ${playerId}
          AND state = 'available_in_market'
          AND market_listing_expires_at > NOW()
        FOR UPDATE
      `;
      if (!listing) {
        throw Object.assign(new Error('Listing not found or expired'), { statusCode: 404 });
      }

      const price = listing.asking_price;
      if (player.cash < price) {
        throw Object.assign(new Error('Insufficient funds'), { statusCode: 400 });
      }

      // Deduct cash
      await tx`
        UPDATE players
        SET cash = cash - ${price},
            cash_stress_active = CASE
              WHEN cash - ${price} < 400 THEN true
              WHEN cash - ${price} > 900 THEN false
              ELSE cash_stress_active
            END,
            updated_at = NOW()
        WHERE id = ${playerId}
      `;

      // Record purchase price on car
      await tx`
        UPDATE cars
        SET purchase_price = ${price},
            updated_at = NOW()
        WHERE id = ${carId}
      `;

      // Transition state (validates + updates)
      await transitionCar(carId, 'purchased', { sqlClient: tx });

      // Write transaction log
      await tx`
        INSERT INTO transactions (player_id, type, amount, reference_id, description)
        VALUES (
          ${playerId}, 'car_purchase', ${-price}, ${carId},
          ${`Куплен ${listing.make} ${listing.model} ${listing.year}`}
        )
      `;

      car = listing;
    });
  } catch (err) {
    // Refund energy on business-logic failure
    await sql`
      UPDATE players
      SET energy_current = LEAST(energy_current + ${ENERGY_COST_PURCHASE}, 30),
          updated_at = NOW()
      WHERE id = ${playerId}
    `;
    const statusCode = err.statusCode || 500;
    return reply.code(statusCode).send({ data: null, error: err.message, meta: null });
  }

  // Award XP (outside transaction — non-critical)
  await awardXP(playerId, 15, 'car_purchase');

  // Fetch updated player for response
  const [updatedPlayer] = await sql`
    SELECT cash, xp, level, energy_current, reputation_score
    FROM players WHERE id = ${playerId}
  `;

  return reply.code(201).send({
    data: {
      car: { id: car.id, make: car.make, model: car.model, year: car.year },
    },
    error: null,
    meta: {
      cashAfter: updatedPlayer.cash,
      xpAfter: updatedPlayer.xp,
      levelAfter: updatedPlayer.level,
    },
  });
}

/**
 * POST /market/listings/refresh
 * Forces a market refresh. Costs LISTING_REFRESH_MANUAL_COST BYN (GMS §4.1).
 */
async function forceRefresh(request, reply) {
  const playerId = request.playerId;

  await sql.begin(async tx => {
    const [player] = await tx`
      SELECT cash, level FROM players WHERE id = ${playerId} FOR UPDATE
    `;
    if (!player) throw Object.assign(new Error('Player not found'), { statusCode: 404 });

    if (player.cash < LISTING_REFRESH_MANUAL_COST) {
      throw Object.assign(new Error('Insufficient funds for manual refresh'), { statusCode: 400 });
    }

    await tx`
      UPDATE players
      SET cash = cash - ${LISTING_REFRESH_MANUAL_COST},
          updated_at = NOW()
      WHERE id = ${playerId}
    `;

    await tx`
      INSERT INTO transactions (player_id, type, amount, description)
      VALUES (${playerId}, 'listing_refresh', ${-LISTING_REFRESH_MANUAL_COST}, 'Обновление объявлений')
    `;
  });

  const [player] = await sql`SELECT level FROM players WHERE id = ${playerId}`;
  const listings = await generateListings(playerId, player.level);
  const safeListings = listings.map(({ quality_tier: _qt, ...rest }) => rest);

  return reply.send({
    data: { listings: safeListings },
    error: null,
    meta: { cost: LISTING_REFRESH_MANUAL_COST },
  });
}

/**
 * POST /market/listings/:carId/negotiate
 * Attempt to negotiate a lower purchase price from the market seller.
 * Costs 2 energy (GMS §1.3). On success, reduces the asking price by the rolled discount.
 * On failure with smooth_talker skill, sets a retry flag for one more attempt at half cost.
 *
 * Body: { context?: { sellerMoodRevealed?: string } }
 */
async function negotiatePurchase(request, reply) {
  const { carId } = request.params;
  const playerId = request.playerId;
  const { context: extraContext = {} } = request.body || {};

  const ENERGY_COST_NEGOTIATE = 2;

  const hasEnergy = await consumeEnergy(playerId, ENERGY_COST_NEGOTIATE);
  if (!hasEnergy) {
    return reply.code(400).send({ data: null, error: 'Not enough energy', meta: null });
  }

  // Fetch car listing
  const [car] = await sql`
    SELECT id, asking_price, seller_archetype, market_listing_expires_at, player_id
    FROM cars
    WHERE id = ${carId}
      AND player_id = ${playerId}
      AND state = 'available_in_market'
      AND market_listing_expires_at > NOW()
  `;
  if (!car) {
    // Refund energy
    await sql`
      UPDATE players SET energy_current = LEAST(energy_current + ${ENERGY_COST_NEGOTIATE}, 30),
        updated_at = NOW() WHERE id = ${playerId}
    `;
    return reply.code(404).send({ data: null, error: 'Listing not found or expired', meta: null });
  }

  // Compute listing age in in-game days
  const listingAge = Math.floor(
    (Date.now() - (new Date(car.market_listing_expires_at).getTime() - 7 * INGAME_DAY_REAL_MINUTES * 60000))
    / (INGAME_DAY_REAL_MINUTES * 60000),
  );

  // Check if player already failed a negotiation on this car (in analytics)
  const [recentFail] = await sql`
    SELECT 1 FROM analytics_events
    WHERE player_id = ${playerId}
      AND event_type = 'negotiation_purchase_failed'
      AND metadata->>'carId' = ${carId}
    LIMIT 1
  `;

  const result = await resolvePurchaseNegotiation(playerId, {
    listingAge,
    sellerMoodRevealed: extraContext.sellerMoodRevealed ?? null,
    recentFailedNegotiation: !!recentFail,
    carQualityTier: extraContext.carQualityTier ?? 'fair',
    buildRapportBonus: extraContext.buildRapportBonus ?? 0,
  });

  if (result.outcome === 'success') {
    const discountAmount = Math.round(car.asking_price * result.discount);
    const newPrice = car.asking_price - discountAmount;

    // Apply discount to the car's asking_price
    await sql`
      UPDATE cars SET asking_price = ${newPrice}, updated_at = NOW() WHERE id = ${carId}
    `;

    // Award negotiation XP
    await awardXP(playerId, 20, 'negotiation_purchase');

    // Log analytics
    await sql`
      INSERT INTO analytics_events (player_id, event_type, metadata)
      VALUES (${playerId}, 'negotiation_purchase_success',
        ${sql.json({ carId, discount: result.discount, discountAmount, newPrice })})
    `;

    // Reputation +1 for successful purchase negotiation
    await sql`
      UPDATE players SET reputation_score = GREATEST(0, LEAST(200, reputation_score + 1)),
        updated_at = NOW() WHERE id = ${playerId}
    `;

    return reply.send({
      data: { outcome: 'success', newPrice, discountAmount },
      error: null,
      meta: { discount: result.discount },
    });
  }

  // Failure — log it
  await sql`
    INSERT INTO analytics_events (player_id, event_type, metadata)
    VALUES (${playerId}, 'negotiation_purchase_failed',
      ${sql.json({ carId, retryAllowed: result.retryAllowed })})
  `;

  return reply.send({
    data: { outcome: 'failure', retryAllowed: result.retryAllowed },
    error: null,
    meta: null,
  });
}

export default async function marketRoutes(fastify) {
  const auth = { preHandler: requireAuth };

  fastify.get('/market/listings',                          auth, getListings);
  fastify.get('/market/listings/:carId/dialogue',          auth, getDialogue);
  fastify.post('/market/listings/:carId/purchase',         auth, purchaseCar);
  fastify.post('/market/listings/:carId/negotiate',        auth, negotiatePurchase);
  fastify.post('/market/listings/refresh',                 auth, forceRefresh);
}
