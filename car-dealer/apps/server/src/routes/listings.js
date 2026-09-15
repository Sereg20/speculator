/**
 * Listing routes — Phase 5
 *
 * POST /listings                                    — create listing from owned car
 * GET  /listings                                    — list player's active/recent listings
 * GET  /listings/:listingId                         — single listing detail
 * DELETE /listings/:listingId                       — cancel (remove) listing
 * GET  /listings/:listingId/inquiries               — get buyer inquiries for a listing
 * POST /listings/:listingId/inquiries/:inquiryId/respond — accept / reject / counter-offer
 *
 * Sale completion:
 *   - Wrapped in a Postgres transaction
 *   - Transitions car to 'sold', closes listing, awards XP + reputation, logs transaction
 *   - Race condition guard: UPDATE listings SET status='sold' WHERE status='active' + rowCount check
 */

import { sql } from '../db/client.js';
import { requireAuth } from '../middleware/auth.js';
import { transitionCar } from '../services/carStateMachine.js';
import { consumeEnergy } from '../services/energyService.js';
import { awardXP } from '../services/xpService.js';
import { resolveSaleNegotiation } from '../services/negotiationEngine.js';
import { INGAME_DAY_REAL_MINUTES, REPUTATION_TIERS } from '../config.js';

// ─── Constants (GMS §9 + §1.2 + §1.4) ────────────────────────────────────────
const ENERGY_COST_LIST     = 1;
const ENERGY_COST_RESPOND  = 1;
const ENERGY_COST_NEGOTIATE = 2;

// Listing expiry: 3–7 in-game days, rolled at listing time (GMS §4.1)
const LISTING_EXPIRY_DISTRIBUTION = [
  { days: 3, weight: 0.20 },
  { days: 4, weight: 0.30 },
  { days: 5, weight: 0.25 },
  { days: 6, weight: 0.15 },
  { days: 7, weight: 0.10 },
];

function rollListingExpiry() {
  const r = Math.random();
  let cumulative = 0;
  for (const { days, weight } of LISTING_EXPIRY_DISTRIBUTION) {
    cumulative += weight;
    if (r < cumulative) return days;
  }
  return 5; // fallback
}

function listingExpiresAt(days) {
  const ms = days * INGAME_DAY_REAL_MINUTES * 60 * 1000;
  return new Date(Date.now() + ms);
}

function getRepTierName(score) {
  return REPUTATION_TIERS.findLast(t => score >= t.min)?.name || 'Новичок';
}

// ─── Reputation delta helpers (GMS §1.4) ─────────────────────────────────────
const REP_EVENTS = {
  sale_clean:           +3,
  sale_quick_fix_pass:   0,
  sale_quick_fix_fail:  -12,
  listing_expired:      -1,
  negotiation_sale_win: +2,
  proper_repair_bonus:  +2,
};

// ─── Route handlers ───────────────────────────────────────────────────────────

/**
 * POST /listings
 * Create a sale listing from a car the player owns (state = 'purchased').
 * Body: { carId: string, askingPrice: number }
 */
async function createListing(request, reply) {
  const playerId = request.playerId;
  const { carId, askingPrice } = request.body || {};

  if (!carId) {
    return reply.code(400).send({ data: null, error: 'carId is required', meta: null });
  }
  if (!askingPrice || askingPrice < 1) {
    return reply.code(400).send({ data: null, error: 'askingPrice must be a positive integer', meta: null });
  }

  const hasEnergy = await consumeEnergy(playerId, ENERGY_COST_LIST);
  if (!hasEnergy) {
    return reply.code(400).send({ data: null, error: 'Not enough energy', meta: null });
  }

  let listing;
  try {
    listing = await sql.begin(async tx => {
      // Verify ownership and state
      const [car] = await tx`
        SELECT id, state, make, model, year FROM cars
        WHERE id = ${carId} AND player_id = ${playerId} AND state = 'purchased'
        FOR UPDATE
      `;
      if (!car) {
        throw Object.assign(
          new Error('Car not found, not owned, or not in a listable state (must be "purchased")'),
          { statusCode: 404 },
        );
      }

      // No active listing on this car already (UNIQUE constraint on car_id covers this too)
      const [existing] = await tx`
        SELECT id FROM listings WHERE car_id = ${carId} AND status = 'active'
      `;
      if (existing) {
        throw Object.assign(new Error('This car is already listed for sale'), { statusCode: 409 });
      }

      const expiryDays = rollListingExpiry();
      const expiresAt = listingExpiresAt(expiryDays);

      // Update asking_price on car
      await tx`
        UPDATE cars SET asking_price = ${askingPrice}, updated_at = NOW() WHERE id = ${carId}
      `;

      // Transition car state
      await transitionCar(carId, 'listed_for_sale', { sqlClient: tx });

      const [created] = await tx`
        INSERT INTO listings (car_id, player_id, asking_price, expires_at)
        VALUES (${carId}, ${playerId}, ${askingPrice}, ${expiresAt})
        RETURNING id, car_id, asking_price, listed_at, expires_at, status
      `;

      await tx`
        INSERT INTO analytics_events (player_id, event_type, metadata)
        VALUES (
          ${playerId}, 'listing_created',
          ${tx.json({ listingId: created.id, carId, askingPrice, expiryDays })}
        )
      `;

      return created;
    });
  } catch (err) {
    // Refund energy on business-logic failure
    await sql`
      UPDATE players
      SET energy_current = LEAST(energy_current + ${ENERGY_COST_LIST}, 30), updated_at = NOW()
      WHERE id = ${playerId}
    `;
    return reply.code(err.statusCode || 500).send({ data: null, error: err.message, meta: null });
  }

  return reply.code(201).send({
    data: { listing },
    error: null,
    meta: { expiresAt: listing.expires_at },
  });
}

/**
 * GET /listings
 * Returns all listings for the authenticated player (all statuses, newest first).
 */
async function getListings(request, reply) {
  const playerId = request.playerId;
  const { status } = request.query || {};

  let listings;
  if (status) {
    listings = await sql`
      SELECT l.id, l.car_id, l.asking_price, l.listed_at, l.expires_at,
             l.status, l.final_sale_price,
             c.make, c.model, c.year, c.condition_tier
      FROM listings l
      JOIN cars c ON c.id = l.car_id
      WHERE l.player_id = ${playerId} AND l.status = ${status}
      ORDER BY l.listed_at DESC
    `;
  } else {
    listings = await sql`
      SELECT l.id, l.car_id, l.asking_price, l.listed_at, l.expires_at,
             l.status, l.final_sale_price,
             c.make, c.model, c.year, c.condition_tier
      FROM listings l
      JOIN cars c ON c.id = l.car_id
      WHERE l.player_id = ${playerId}
      ORDER BY l.listed_at DESC
      LIMIT 50
    `;
  }

  // Attach inquiry counts for active listings
  const activeListingIds = listings.filter(l => l.status === 'active').map(l => l.id);
  let inquiryCounts = {};
  if (activeListingIds.length > 0) {
    const counts = await sql`
      SELECT listing_id, COUNT(*)::int AS count
      FROM buyer_inquiries
      WHERE listing_id = ANY(${activeListingIds}) AND status = 'pending'
      GROUP BY listing_id
    `;
    for (const row of counts) {
      inquiryCounts[row.listing_id] = row.count;
    }
  }

  const withCounts = listings.map(l => ({
    ...l,
    pending_inquiry_count: inquiryCounts[l.id] ?? 0,
  }));

  return reply.send({
    data: { listings: withCounts },
    error: null,
    meta: { total: listings.length },
  });
}

/**
 * GET /listings/:listingId
 * Returns a single listing with full detail (car, inquiries count).
 */
async function getListing(request, reply) {
  const { listingId } = request.params;
  const playerId = request.playerId;

  const [listing] = await sql`
    SELECT l.id, l.car_id, l.asking_price, l.listed_at, l.expires_at,
           l.status, l.final_sale_price,
           c.make, c.model, c.year, c.mileage, c.color, c.condition_tier, c.market_value
    FROM listings l
    JOIN cars c ON c.id = l.car_id
    WHERE l.id = ${listingId} AND l.player_id = ${playerId}
  `;

  if (!listing) {
    return reply.code(404).send({ data: null, error: 'Listing not found', meta: null });
  }

  const inquiryStats = await sql`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
      COUNT(*) FILTER (WHERE status = 'accepted')::int AS accepted
    FROM buyer_inquiries WHERE listing_id = ${listingId}
  `;

  return reply.send({
    data: { listing, inquiries: inquiryStats[0] },
    error: null,
    meta: null,
  });
}

/**
 * DELETE /listings/:listingId
 * Cancel an active listing. Returns car to 'purchased' state.
 */
async function cancelListing(request, reply) {
  const { listingId } = request.params;
  const playerId = request.playerId;

  await sql.begin(async tx => {
    const [listing] = await tx`
      SELECT id, car_id, status FROM listings
      WHERE id = ${listingId} AND player_id = ${playerId}
      FOR UPDATE
    `;
    if (!listing) throw Object.assign(new Error('Listing not found'), { statusCode: 404 });
    if (listing.status !== 'active') {
      throw Object.assign(new Error('Only active listings can be cancelled'), { statusCode: 400 });
    }

    await tx`
      UPDATE listings SET status = 'cancelled', updated_at = NOW() WHERE id = ${listingId}
    `;

    // Expire any pending inquiries
    await tx`
      UPDATE buyer_inquiries SET status = 'expired'
      WHERE listing_id = ${listingId} AND status IN ('pending', 'negotiating')
    `;

    // Return car to purchased
    await transitionCar(listing.car_id, 'purchased', { sqlClient: tx });
  });

  return reply.send({ data: { cancelled: true }, error: null, meta: null });
}

/**
 * GET /listings/:listingId/inquiries
 * Returns all buyer inquiries for a listing, newest first.
 */
async function getInquiries(request, reply) {
  const { listingId } = request.params;
  const playerId = request.playerId;

  // Verify listing ownership
  const [listing] = await sql`
    SELECT id FROM listings WHERE id = ${listingId} AND player_id = ${playerId}
  `;
  if (!listing) {
    return reply.code(404).send({ data: null, error: 'Listing not found', meta: null });
  }

  const inquiries = await sql`
    SELECT id, buyer_archetype, buyer_name, offered_price, message_text,
           player_counter_offer, final_agreed_price, status,
           did_inspect, discovered_quick_fixes, negotiation_round,
           generated_at, expires_at
    FROM buyer_inquiries
    WHERE listing_id = ${listingId}
    ORDER BY generated_at DESC
  `;

  return reply.send({
    data: { inquiries },
    error: null,
    meta: { total: inquiries.length },
  });
}

/**
 * POST /listings/:listingId/inquiries/:inquiryId/respond
 * Player responds to a buyer inquiry: accept / reject / counter-offer.
 *
 * Body: { action: 'accept'|'reject'|'counter', counterPrice?: number }
 *
 * On accept:
 *   - Locks listing row with FOR UPDATE
 *   - Sets listing status = 'sold' WHERE status = 'active' (race condition guard)
 *   - Transitions car to 'sold'
 *   - Awards XP + reputation
 *   - Logs sale_revenue transaction
 *   - Expires all other pending inquiries for this listing
 */
async function respondToInquiry(request, reply) {
  const { listingId, inquiryId } = request.params;
  const playerId = request.playerId;
  const { action, counterPrice } = request.body || {};

  if (!['accept', 'reject', 'counter'].includes(action)) {
    return reply.code(400).send({
      data: null,
      error: 'action must be "accept", "reject", or "counter"',
      meta: null,
    });
  }
  if (action === 'counter' && (!counterPrice || counterPrice < 1)) {
    return reply.code(400).send({
      data: null,
      error: 'counterPrice is required and must be positive for counter action',
      meta: null,
    });
  }

  // Energy cost depends on action
  const energyCost = action === 'counter' ? ENERGY_COST_NEGOTIATE : ENERGY_COST_RESPOND;
  const hasEnergy = await consumeEnergy(playerId, energyCost);
  if (!hasEnergy) {
    return reply.code(400).send({ data: null, error: 'Not enough energy', meta: null });
  }

  let result;
  try {
    result = await _processInquiryResponse(playerId, listingId, inquiryId, action, counterPrice);
  } catch (err) {
    // Refund energy on business-logic failure
    await sql`
      UPDATE players
      SET energy_current = LEAST(energy_current + ${energyCost}, 30), updated_at = NOW()
      WHERE id = ${playerId}
    `;
    return reply.code(err.statusCode || 500).send({ data: null, error: err.message, meta: null });
  }

  return reply.send({ data: result, error: null, meta: null });
}

/**
 * Internal: process inquiry response inside a transaction.
 */
async function _processInquiryResponse(playerId, listingId, inquiryId, action, counterPrice) {
  // Load listing
  const [listing] = await sql`
    SELECT l.id, l.car_id, l.asking_price, l.status,
           l.listed_at,
           c.market_value,
           p.reputation_score, p.in_game_day
    FROM listings l
    JOIN cars c ON c.id = l.car_id
    JOIN players p ON p.id = l.player_id
    WHERE l.id = ${listingId} AND l.player_id = ${playerId}
  `;
  if (!listing) throw Object.assign(new Error('Listing not found'), { statusCode: 404 });
  if (listing.status !== 'active') {
    throw Object.assign(new Error('This listing is no longer active'), { statusCode: 409 });
  }

  // Load inquiry
  const [inquiry] = await sql`
    SELECT id, offered_price, status, did_inspect, discovered_quick_fixes,
           player_counter_offer, negotiation_round, buyer_archetype
    FROM buyer_inquiries
    WHERE id = ${inquiryId} AND listing_id = ${listingId}
  `;
  if (!inquiry) throw Object.assign(new Error('Inquiry not found'), { statusCode: 404 });
  if (!['pending', 'negotiating'].includes(inquiry.status)) {
    throw Object.assign(
      new Error(`Inquiry is already ${inquiry.status} — cannot respond`),
      { statusCode: 409 },
    );
  }

  if (action === 'reject') {
    await sql`
      UPDATE buyer_inquiries SET status = 'rejected', updated_at = NOW() WHERE id = ${inquiryId}
    `;
    return { outcome: 'rejected', inquiryId };
  }

  if (action === 'accept') {
    return await _completeSale(playerId, listing, inquiry, inquiry.offered_price);
  }

  // Counter-offer flow
  const daysListed = Math.floor(
    (Date.now() - new Date(listing.listed_at).getTime()) /
    (INGAME_DAY_REAL_MINUTES * 60 * 1000)
  );

  const negotiationResult = await resolveSaleNegotiation(playerId, {
    askingPrice: listing.asking_price,
    buyerOfferedPrice: inquiry.offered_price,
    playerCounterOffer: counterPrice,
    daysListed,
    defectDiscovered: inquiry.discovered_quick_fixes || false,
    buyerArchetype: inquiry.buyer_archetype,
  });

  // Update counter-offer on inquiry
  await sql`
    UPDATE buyer_inquiries
    SET player_counter_offer = ${counterPrice},
        negotiation_round = negotiation_round + 1,
        status = ${negotiationResult.outcome === 'rejected' ? 'rejected' : 'negotiating'}
    WHERE id = ${inquiryId}
  `;

  if (negotiationResult.outcome === 'accepted') {
    return await _completeSale(playerId, listing, inquiry, negotiationResult.finalPrice);
  }

  if (negotiationResult.outcome === 'counter') {
    // Buyer sends back a mid-point counter
    await sql`
      UPDATE buyer_inquiries
      SET offered_price = ${negotiationResult.finalPrice}, status = 'negotiating'
      WHERE id = ${inquiryId}
    `;
    return {
      outcome: 'counter',
      inquiryId,
      buyerNewOffer: negotiationResult.finalPrice,
      message: 'Покупатель предлагает встречную цену.',
    };
  }

  return { outcome: 'rejected', inquiryId };
}

/**
 * Complete a sale atomically.
 * Guards against double-sale with WHERE status = 'active' check.
 */
async function _completeSale(playerId, listing, inquiry, finalPrice) {
  let saleResult;

  await sql.begin(async tx => {
    // Lock listing — guard against concurrent sales
    const updated = await tx`
      UPDATE listings
      SET status = 'sold', final_sale_price = ${finalPrice},
          days_listed_when_sold = FLOOR(
            EXTRACT(EPOCH FROM (NOW() - listed_at)) / ${INGAME_DAY_REAL_MINUTES * 60}
          )::int
      WHERE id = ${listing.id} AND status = 'active'
      RETURNING id
    `;
    if (updated.length === 0) {
      throw Object.assign(new Error('Listing already sold or no longer active'), { statusCode: 409 });
    }

    // Mark inquiry as accepted
    await tx`
      UPDATE buyer_inquiries
      SET status = 'accepted', final_agreed_price = ${finalPrice}
      WHERE id = ${inquiry.id}
    `;

    // Expire all other pending inquiries for this listing
    await tx`
      UPDATE buyer_inquiries
      SET status = 'expired'
      WHERE listing_id = ${listing.id}
        AND id != ${inquiry.id}
        AND status IN ('pending', 'negotiating')
    `;

    // Transition car to sold
    await transitionCar(listing.car_id, 'sold', { sqlClient: tx });

    // Update car final_sale_price
    await tx`
      UPDATE cars SET final_sale_price = ${finalPrice}, updated_at = NOW() WHERE id = ${listing.car_id}
    `;

    // Credit player with cash
    await tx`
      UPDATE players
      SET cash = cash + ${finalPrice},
          cash_stress_active = CASE
            WHEN cash + ${finalPrice} > 900 THEN false
            ELSE cash_stress_active
          END,
          updated_at = NOW()
      WHERE id = ${playerId}
    `;

    // Log sale revenue transaction
    await tx`
      INSERT INTO transactions (player_id, type, amount, reference_id, description)
      VALUES (${playerId}, 'sale_revenue', ${finalPrice}, ${listing.car_id},
              ${`Продажа: ${finalPrice} BYN`})
    `;

    // Reputation: determine clean sale vs quick-fix issues
    const hadQuickFixIssue = inquiry.discovered_quick_fixes;
    const repDelta = hadQuickFixIssue
      ? REP_EVENTS.sale_quick_fix_fail
      : REP_EVENTS.sale_clean;

    if (repDelta !== 0) {
      await tx`
        UPDATE players
        SET reputation_score = GREATEST(0, LEAST(200, reputation_score + ${repDelta})),
            updated_at = NOW()
        WHERE id = ${playerId}
      `;
    }

    // Check if all defects were properly repaired (bonus reputation, GMS §1.4)
    const [unrepaired] = await tx`
      SELECT COUNT(*)::int AS cnt
      FROM defects
      WHERE car_id = ${listing.car_id}
        AND is_revealed_to_player = true
        AND is_quick_fixed = false
        AND id NOT IN (
          SELECT defect_id FROM repair_jobs WHERE car_id = ${listing.car_id} AND completed = true AND repair_type = 'proper'
        )
    `;
    const allProperlyRepaired = (unrepaired?.cnt ?? 1) === 0;
    if (allProperlyRepaired) {
      await tx`
        UPDATE players
        SET reputation_score = GREATEST(0, LEAST(200, reputation_score + ${REP_EVENTS.proper_repair_bonus})),
            updated_at = NOW()
        WHERE id = ${playerId}
      `;
    }

    // Log analytics
    await tx`
      INSERT INTO analytics_events (player_id, event_type, metadata)
      VALUES (
        ${playerId}, 'car_sold',
        ${tx.json({
          carId: listing.car_id,
          listingId: listing.id,
          finalPrice,
          askingPrice: listing.asking_price,
          repDelta,
          hadQuickFixIssue,
        })}
      )
    `;

    saleResult = {
      outcome: 'sold',
      finalPrice,
      listingId: listing.id,
      carId: listing.car_id,
      repDelta: repDelta + (allProperlyRepaired ? REP_EVENTS.proper_repair_bonus : 0),
    };
  });

  // Award XP outside transaction (awardXP opens its own tx)
  const xpRewards = [];
  xpRewards.push(awardXP(playerId, 30, 'car_sold'));           // GMS §1.2: successful sale +30
  if (!inquiry.discovered_quick_fixes) {
    xpRewards.push(awardXP(playerId, 15, 'clean_deal'));       // GMS §1.2: clean deal +15
  }
  // Negotiation XP: counter-offer that got accepted counts as successful negotiation
  if (inquiry.player_counter_offer) {
    xpRewards.push(awardXP(playerId, 20, 'negotiation_sale')); // GMS §1.2: +20
  }

  await Promise.allSettled(xpRewards);

  return saleResult;
}

// ─── Route registration ────────────────────────────────────────────────────────

export default async function listingRoutes(fastify) {
  const auth = { preHandler: requireAuth };

  fastify.post('/listings',                                       auth, createListing);
  fastify.get('/listings',                                        auth, getListings);
  fastify.get('/listings/:listingId',                            auth, getListing);
  fastify.delete('/listings/:listingId',                         auth, cancelListing);
  fastify.get('/listings/:listingId/inquiries',                  auth, getInquiries);
  fastify.post(
    '/listings/:listingId/inquiries/:inquiryId/respond',
    auth,
    respondToInquiry,
  );
}
