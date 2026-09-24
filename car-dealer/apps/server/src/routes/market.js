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
import { consumeEnergy, refundEnergy } from '../services/energyService.js';
import { awardXP } from '../services/xpService.js';
import { resolveMarketNegotiation } from '../services/negotiationEngine.js';
import { runPrePurchaseInspection, INSPECTION_ACTIONS, inspectionXP, resolveAvailableActions } from '../services/inspectionEngine.js';
import { labelDefect } from '../services/defectEngine.js';
import { sql } from '../db/client.js';
import { requireAuth } from '../middleware/auth.js';
import { INGAME_DAY_REAL_MINUTES } from '../config.js';

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
    await refundEnergy(playerId, ENERGY_COST_PURCHASE);
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
 * Forces a market refresh. Free.
 */
async function forceRefresh(request, reply) {
  const playerId = request.playerId;

  const [player] = await sql`SELECT level FROM players WHERE id = ${playerId}`;
  if (!player) return reply.code(404).send({ data: null, error: 'Player not found', meta: null });

  const listings = await generateListings(playerId, player.level);
  const safeListings = listings.map(({ quality_tier: _qt, ...rest }) => rest);

  return reply.send({
    data: { listings: safeListings },
    error: null,
    meta: { cost: 0 },
  });
}

/**
 * POST /market/listings/:carId/negotiate
 * Player proposes a specific price to the market seller.
 * Body: { proposedPrice: number }
 *
 * Rules:
 *   - proposedPrice must be within 30% of the car's ORIGINAL asking price
 *   - Costs 2 energy per round
 *   - Seller can accept, reject, or counter with a midpoint price
 *   - Seller hardens each round (market_negotiation_round counter on the car row)
 *
 * Responses:
 *   outcome = 'accepted' → player can now call /purchase at finalPrice
 *   outcome = 'counter'  → seller proposes finalPrice; player may counter again
 *   outcome = 'rejected' → no deal; player may try again next listing cycle
 */
async function negotiatePurchase(request, reply) {
  const { carId } = request.params;
  const playerId = request.playerId;
  const proposedPrice = Number(request.body?.proposedPrice);

  const ENERGY_COST_NEGOTIATE = 2;

  if (!proposedPrice || proposedPrice < 1) {
    return reply.code(400).send({ data: null, error: 'proposedPrice must be a positive number', meta: null });
  }

  const hasEnergy = await consumeEnergy(playerId, ENERGY_COST_NEGOTIATE);
  if (!hasEnergy) {
    return reply.code(400).send({ data: null, error: 'Not enough energy', meta: null });
  }

  // Fetch car listing
  const [car] = await sql`
    SELECT id, asking_price, seller_archetype, market_listing_expires_at,
           market_negotiation_round, market_last_offer,
           make, model, year
    FROM cars
    WHERE id = ${carId}
      AND player_id = ${playerId}
      AND state = 'available_in_market'
      AND market_listing_expires_at > NOW()
  `;
  if (!car) {
    // Refund energy
    await refundEnergy(playerId, ENERGY_COST_NEGOTIATE);
    return reply.code(404).send({ data: null, error: 'Listing not found or expired', meta: null });
  }

  // The "original" price is the price at the time of listing (stored as asking_price on the car).
  // If the seller previously countered, market_last_offer holds their last counter price;
  // that becomes the new "current" price for delta calculation.
  const originalPrice = car.asking_price;
  const currentPrice  = car.market_last_offer ?? car.asking_price;
  const negotiationRound = car.market_negotiation_round ?? 0;

  // Validate 30% floor — player cannot propose more than 30% below original price
  const minAllowedPrice = Math.ceil(originalPrice * 0.70);
  if (proposedPrice < minAllowedPrice) {
    // Refund energy — this is a validation error, not a game attempt
    await refundEnergy(playerId, ENERGY_COST_NEGOTIATE);
    return reply.code(400).send({
      data: null,
      error: `Proposed price is too low. Minimum is ${minAllowedPrice} BYN (70% of original ${originalPrice} BYN).`,
      meta: { minAllowedPrice, originalPrice },
    });
  }

  // Also reject if proposed price is above current asking price — nonsensical
  if (proposedPrice >= currentPrice) {
    await refundEnergy(playerId, ENERGY_COST_NEGOTIATE);
    return reply.code(400).send({
      data: null,
      error: `Proposed price must be below the current asking price of ${currentPrice} BYN.`,
      meta: { currentPrice },
    });
  }

  // Compute listing age in in-game days
  const listingAge = Math.floor(
    (Date.now() - (new Date(car.market_listing_expires_at).getTime() - 7 * INGAME_DAY_REAL_MINUTES * 60000))
    / (INGAME_DAY_REAL_MINUTES * 60000),
  );

  // Count defects already revealed by this player on this car
  const [{ count: defectsRevealed }] = await sql`
    SELECT COUNT(*)::int AS count FROM defects
    WHERE car_id = ${carId} AND is_revealed_to_player = true
  `;

  const result = await resolveMarketNegotiation(playerId, {
    originalPrice,
    currentPrice,
    proposedPrice,
    listingAge,
    negotiationRound,
    sellerArchetype: car.seller_archetype,
    defectsRevealed: Number(defectsRevealed),
  });

  // Increment negotiation round counter
  await sql`
    UPDATE cars
    SET market_negotiation_round = COALESCE(market_negotiation_round, 0) + 1,
        market_last_offer = ${result.outcome === 'counter' ? result.finalPrice : null},
        updated_at = NOW()
    WHERE id = ${carId}
  `;

  if (result.outcome === 'accepted') {
    // Write the agreed price as the new asking_price so /purchase uses it
    await sql`
      UPDATE cars SET asking_price = ${result.finalPrice}, updated_at = NOW() WHERE id = ${carId}
    `;

    await awardXP(playerId, 20, 'negotiation_purchase');

    await sql`
      INSERT INTO analytics_events (player_id, event_type, metadata)
      VALUES (${playerId}, 'negotiation_purchase_success',
        ${sql.json({ carId, originalPrice, finalPrice: result.finalPrice, round: negotiationRound + 1 })})
    `;

    await sql`
      UPDATE players SET reputation_score = GREATEST(0, LEAST(200, reputation_score + 1)),
        updated_at = NOW() WHERE id = ${playerId}
    `;

    const message = await generateDialogue('seller_negotiate_accept', {
      seller_archetype: car.seller_archetype,
      asking_price: originalPrice,
      agreed_price: result.finalPrice,
      negotiation_round: negotiationRound + 1,
    }, request.log).catch(() => 'Ладно, договорились. Забирай.');

    return reply.send({
      data: { outcome: 'accepted', finalPrice: result.finalPrice, message },
      error: null,
      meta: { originalPrice, discount: Math.round((1 - result.finalPrice / originalPrice) * 100) },
    });
  }

  if (result.outcome === 'counter') {
    const message = await generateDialogue('seller_negotiate_counter', {
      seller_archetype: car.seller_archetype,
      asking_price: originalPrice,
      proposed_price: proposedPrice,
      counter_price: result.finalPrice,
      negotiation_round: negotiationRound + 1,
    }, request.log).catch(() => 'Нет, столько не могу. Вот тебе встречное предложение.');

    await sql`
      INSERT INTO analytics_events (player_id, event_type, metadata)
      VALUES (${playerId}, 'negotiation_purchase_counter',
        ${sql.json({ carId, originalPrice, proposedPrice, counterPrice: result.finalPrice, round: negotiationRound + 1 })})
    `;

    return reply.send({
      data: { outcome: 'counter', sellerCounterPrice: result.finalPrice, message },
      error: null,
      meta: { originalPrice, currentPrice: result.finalPrice },
    });
  }

  // Rejected
  const message = await generateDialogue('seller_negotiate_reject', {
    seller_archetype: car.seller_archetype,
    asking_price: currentPrice,
    retry_allowed: false,
  }, request.log).catch(() => 'Цена окончательная, не торгуюсь.');

  await sql`
    INSERT INTO analytics_events (player_id, event_type, metadata)
    VALUES (${playerId}, 'negotiation_purchase_failed',
      ${sql.json({ carId, proposedPrice, round: negotiationRound + 1 })})
  `;

  return reply.send({
    data: { outcome: 'rejected', message },
    error: null,
    meta: { originalPrice, currentPrice },
  });
}

// ─── Seller hint probabilities by archetype ───────────────────────────────────
// Base probability that the seller mentions the FIRST defect.
// Each subsequent defect decays by HINT_DECAY_FACTOR — so revealing many is
// naturally rare but not impossible.
//
// Example with old_man (0.30) and DECAY 0.45:
//   defect #1: 30%  → defect #2: 13.5%  → defect #3: 6%  → defect #4: 2.7%
// Example with shady_dealer (0.05):
//   defect #1:  5%  → defect #2:  2.25% → ...
const SELLER_HINT_PROB = {
  old_man:       0.30,
  private_owner: 0.15,
  enthusiast:    0.20,
  shady_dealer:  0.05,
  urgent_sale:   0.10,
};
const HINT_DECAY_FACTOR = 0.45;

/**
 * POST /market/listings/:carId/chat
 * Player talks to the NPC seller. The seller may spontaneously reveal defects.
 * One attempt per player per listing. Costs 1 energy.
 *
 * Each unrevealed defect gets an independent roll with geometrically decaying
 * probability — so 0–1 hints is common, 2–3 rare, revealing many is very rare.
 *
 * Response:
 *   data.dialogue — NPC dialogue line
 *   data.hints    — array of { defectType, category, severity } (may be empty)
 */
async function chatWithSeller(request, reply) {
  const { carId } = request.params;
  const playerId = request.playerId;

  const ENERGY_COST_CHAT = 1;

  // Verify listing is still active
  const [car] = await sql`
    SELECT id, make, model, year, seller_archetype
    FROM cars
    WHERE id = ${carId}
      AND state = 'available_in_market'
      AND market_listing_expires_at > NOW()
  `;
  if (!car) {
    return reply.code(404).send({ data: null, error: 'Listing not found or expired', meta: null });
  }

  // One chat per player per listing — stored as action_id='chat' in pre_purchase_inspections
  const [alreadyChatted] = await sql`
    SELECT 1 FROM pre_purchase_inspections
    WHERE car_id = ${carId} AND player_id = ${playerId} AND action_id = 'chat'
  `;
  if (alreadyChatted) {
    return reply.code(409).send({
      data: null,
      error: 'You have already spoken with this seller',
      meta: null,
    });
  }

  const hasEnergy = await consumeEnergy(playerId, ENERGY_COST_CHAT);
  if (!hasEnergy) {
    return reply.code(400).send({ data: null, error: 'Not enough energy', meta: null });
  }

  // Record the chat before rolling so even a zero-hint result counts
  await sql`
    INSERT INTO pre_purchase_inspections (car_id, player_id, action_id, revealed_count, energy_cost)
    VALUES (${carId}, ${playerId}, 'chat', 0, ${ENERGY_COST_CHAT})
    ON CONFLICT DO NOTHING
  `;

  // Fetch all unrevealed non-fraud defects in a stable random order
  const hiddenDefects = await sql`
    SELECT id, defect_type, category, severity, detection_tier,
           proper_repair_cost, quick_fix_cost, repair_time_minutes,
           resale_impact, is_odometer_fraud
    FROM defects
    WHERE car_id = ${carId}
      AND is_revealed_to_player = false
      AND is_odometer_fraud = false
    ORDER BY RANDOM()
  `;

  // Roll each defect independently with geometrically decaying probability.
  // Stop as soon as a roll fails — seller loses track of what they were saying.
  const baseProb = SELLER_HINT_PROB[car.seller_archetype] ?? 0.10;
  const hints = [];

  for (let i = 0; i < hiddenDefects.length; i++) {
    const prob = baseProb * Math.pow(HINT_DECAY_FACTOR, i);
    if (Math.random() >= prob) break;  // failed roll — no more hints this chat
    hints.push(hiddenDefects[i]);
  }

  // Mark revealed defects
  if (hints.length > 0) {
    const hintIds = hints.map(h => h.id);
    await sql`
      UPDATE defects
      SET is_revealed_to_player = true
      WHERE id = ANY(${hintIds})
        AND is_revealed_to_player = false
    `;
  }

  const hintPayload = labelDefect(hints.map(({ id, defect_type, category, severity, detection_tier,
    proper_repair_cost, quick_fix_cost, repair_time_minutes, resale_impact, is_odometer_fraud }) => ({
    id,
    defect_type,
    category,
    severity,
    detection_tier,
    proper_repair_cost,
    quick_fix_cost,
    repair_time_minutes,
    resale_impact,
    is_odometer_fraud,
  })));

  const dialogue = await generateDialogue('seller_chat_hint', {
    seller_archetype:    car.seller_archetype,
    car_make_model_year: `${car.make} ${car.model}, ${car.year} г.`,
    hint_category:       hints[0]?.category ?? null,
    hint_severity:       hints[0]?.severity ?? null,
  }, request.log).catch(() => hints.length > 0
    ? 'Ну, мелочи по кузову есть, как без них. Ничего серьёзного.'
    : 'Слушай, хорошая машина, я бы сам на ней ещё ездил.'
  );

  // Update revealed_count
  if (hints.length > 0) {
    await sql`
      UPDATE pre_purchase_inspections
      SET revealed_count = ${hints.length}
      WHERE car_id = ${carId} AND player_id = ${playerId} AND action_id = 'chat'
    `;
  }

  return reply.send({
    data: { dialogue, revealed: hintPayload },
    error: null,
    meta: { newlyRevealedCount: hints.length },
  });
}

/**
 * POST /market/listings/:carId/pre-inspect
 * Body: { actionId: string, category?: string }
 *
 * Inspect a market car before buying. Uses action.prePurchaseEnergy (+1 vs garage)
 * and 0.65× detection accuracy. Revealed defects persist after purchase.
 * Optional `category` narrows inspection to a single category within the action's scope.
 */
async function prePurchaseInspect(request, reply) {
  const { carId } = request.params;
  const playerId = request.playerId;
  const { actionId, category = null } = request.body || {};

  const action = INSPECTION_ACTIONS[actionId];
  if (!action) {
    return reply.code(400).send({
      data: null,
      error: `Unknown actionId. Valid actions: ${Object.keys(INSPECTION_ACTIONS).join(', ')}`,
      meta: null,
    });
  }

  if (category !== null && !action.categories.includes(category)) {
    return reply.code(400).send({
      data: null,
      error: `Category '${category}' is not covered by action '${actionId}'. Valid: ${action.categories.join(', ')}`,
      meta: null,
    });
  }

  // If the action covers multiple categories, category is required so the player
  // is explicit about what they're inspecting — prevents ambiguous duplicate detection.
  if (category === null && action.categories.length > 1) {
    return reply.code(400).send({
      data: null,
      error: `Action '${actionId}' covers multiple categories (${action.categories.join(', ')}). Specify one via 'category'.`,
      meta: null,
    });
  }

  const energyCost = action.prePurchaseEnergy;

  // Check if this action+category combo was already performed by this player on this listing
  const [existing] = await sql`
    SELECT id, revealed_count FROM pre_purchase_inspections
    WHERE car_id = ${carId} AND player_id = ${playerId}
      AND action_id = ${actionId}
      AND category IS NOT DISTINCT FROM ${category}
  `;
  if (existing) {
    return reply.code(409).send({
      data: null,
      error: `Action '${actionId}'${category ? ` (${category})` : ''} already performed on this listing`,
      meta: { alreadyRevealedCount: existing.revealed_count },
    });
  }

  const hasEnergy = await consumeEnergy(playerId, energyCost);
  if (!hasEnergy) {
    return reply.code(400).send({ data: null, error: 'Not enough energy', meta: null });
  }

  let result;
  try {
    result = await runPrePurchaseInspection(carId, playerId, actionId, category);
  } catch (err) {
    await refundEnergy(playerId, energyCost);
    return reply.code(err.statusCode || 500).send({ data: null, error: err.message, meta: null });
  }

  await sql`
    INSERT INTO pre_purchase_inspections (car_id, player_id, action_id, category, revealed_count, energy_cost)
    VALUES (${carId}, ${playerId}, ${actionId}, ${category}, ${result.revealed.length}, ${energyCost})
    ON CONFLICT DO NOTHING
  `;

  const xpAmount = inspectionXP(actionId);
  await awardXP(playerId, xpAmount, `pre_purchase_inspection_${actionId}`);

  return reply.send({
    data: { revealed: result.revealed },
    error: null,
    meta: {
      actionId,
      category,
      newlyRevealedCount: result.revealed.length,
      energySpent: energyCost,
      xpAwarded: xpAmount,
    },
  });
}

/**
 * GET /market/listings/:carId/inspections
 * Returns available inspection actions for a market listing.
 * Same shape as GET /cars/:carId/inspections so the UI can reuse the same component.
 */
async function getListingInspections(request, reply) {
  const { carId } = request.params;
  const playerId = request.playerId;

  const [car] = await sql`
    SELECT id FROM cars
    WHERE id = ${carId}
      AND player_id = ${playerId}
      AND state = 'available_in_market'
      AND market_listing_expires_at > NOW()
  `;
  if (!car) {
    return reply.code(404).send({ data: null, error: 'Listing not found', meta: null });
  }

  const completedRows = await sql`
    SELECT action_id, category, revealed_count, energy_cost, performed_at
    FROM pre_purchase_inspections
    WHERE car_id = ${carId} AND player_id = ${playerId}
    ORDER BY performed_at ASC
  `;
  const completedSet = new Set(completedRows.map(r => r.action_id));

  const [playerSkills, playerEquipment] = await Promise.all([
    sql`SELECT skill_id FROM player_skills WHERE player_id = ${playerId}`,
    sql`SELECT equipment_id FROM player_equipment WHERE player_id = ${playerId}`,
  ]);
  const skillSet = new Set(playerSkills.map(r => r.skill_id));
  const equipSet = new Set(playerEquipment.map(r => r.equipment_id));

  const availableIds = resolveAvailableActions(skillSet, equipSet);

  const availableActions = availableIds.map(id => {
    const a = INSPECTION_ACTIONS[id];
    return {
      id,
      label:       a.label,
      categories:  a.categories,
      energy:      a.prePurchaseEnergy,
      alreadyDone: completedSet.has(id),
    };
  });

  return reply.send({
    data: { completedActions: completedRows },
    error: null,
    meta: { availableActions },
  });
}

export default async function marketRoutes(fastify) {
  const auth = { preHandler: requireAuth };

  fastify.get('/market/listings',                              auth, getListings);
  fastify.get('/market/listings/:carId/dialogue',              auth, getDialogue);
  fastify.get('/market/listings/:carId/inspections',           auth, getListingInspections);
  fastify.post('/market/listings/:carId/purchase',             auth, purchaseCar);
  fastify.post('/market/listings/:carId/negotiate',            auth, negotiatePurchase);
  fastify.post('/market/listings/:carId/chat',                 auth, chatWithSeller);
  fastify.post('/market/listings/:carId/pre-inspect',          auth, prePurchaseInspect);
  fastify.post('/market/listings/refresh',                     auth, forceRefresh);
}
