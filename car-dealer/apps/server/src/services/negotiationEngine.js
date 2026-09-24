/**
 * Negotiation Engine — Phase 5 / Phase 6
 *
 * Resolves purchase negotiations (player buys from market seller) and
 * sale negotiations (NPC buyer counters the player's asking price).
 *
 * All formulas from GMS Sections 5.1, 5.2, and 8.3.
 * Reputation effects wired in per Phase 6 (GMS §1.4).
 *
 * Key invariants:
 *   - Success cap: 85%    (NEGOTIATION_SUCCESS_CAP)
 *   - Success floor: 5%   (NEGOTIATION_SUCCESS_FLOOR)
 *   - No randomness outside this module — all rolls happen here.
 */

import { sql } from '../db/client.js';
import { REPUTATION_TIERS } from '../config.js';

const NEGOTIATION_SUCCESS_CAP   = 0.85;
const NEGOTIATION_SUCCESS_FLOOR = 0.05;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Resolve which reputation tier name a score maps to.
 */
function getRepTierName(score) {
  return REPUTATION_TIERS.findLast(t => score >= t.min)?.name || 'Новичок';
}

/**
 * Clamp value between floor and cap.
 */
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// ─── Purchase negotiation modifier table (GMS §5.1) ──────────────────────────

const PURCHASE_REP_MODS = {
  'Новичок':   0,
  'Знакомый':  0,
  'Надёжный':  0.05,
  'Авторитет': 0.10,
  'Легенда':   0.15,
};

const SALE_REP_MODS = {
  'Новичок':   0,
  'Знакомый':  0,
  'Надёжный':  0.08,
  'Авторитет': 0.15,
  'Легенда':   0.20,
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Resolve a MARKET PURCHASE negotiation (player proposes price to market seller).
 *
 * Multi-round system mirroring resolveSaleNegotiation:
 *   - Seller can accept, reject, or counter with a midpoint offer.
 *   - Acceptance probability is driven by how aggressive the player's offer is.
 *   - Seller hardens after each round (negotiationRound counter).
 *   - Max player discount: 30% below original asking price (validated in route).
 *
 * Context fields:
 *   - originalPrice:     number — the car's original asking_price before any discounts
 *   - currentPrice:      number — current asking_price (may already be discounted)
 *   - proposedPrice:     number — player's proposed price
 *   - listingAge:        number — in-game days the listing has been active
 *   - negotiationRound:  number — how many rounds have already happened (0 = first attempt)
 *   - sellerArchetype:   string — seller_archetype value
 *   - defectsRevealed:   number — count of defects already revealed (via chat/pre-inspect)
 *
 * @param {string} playerId
 * @param {object} context
 * @returns {Promise<{ outcome: 'accepted'|'rejected'|'counter', finalPrice: number }>}
 */
export async function resolveMarketNegotiation(playerId, context) {
  const {
    originalPrice,
    currentPrice,
    proposedPrice,
    listingAge = 0,
    negotiationRound = 0,
    sellerArchetype = 'private_owner',
    defectsRevealed = 0,
  } = context;

  // Coerce to numbers
  const _original = Number(originalPrice);
  const _current  = Number(currentPrice);
  const _proposed = Number(proposedPrice);

  if (!_original || !_current || !_proposed) {
    throw Object.assign(new Error('Missing required negotiation context'), { statusCode: 400 });
  }

  const [player] = await sql`
    SELECT reputation_score, cash_stress_active FROM players WHERE id = ${playerId}
  `;
  if (!player) throw Object.assign(new Error('Player not found'), { statusCode: 404 });

  const ownedSkills = await sql`
    SELECT skill_id FROM player_skills WHERE player_id = ${playerId}
  `;
  const skillSet = new Set(ownedSkills.map(r => r.skill_id));
  const repTier = getRepTierName(player.reputation_score);

  // ── Base acceptance probability ───────────────────────────────────────────
  // Starts lower than sale negotiation — the market seller has the product,
  // they're less desperate than an NPC buyer.
  let prob = 0.22;

  // Reputation modifiers (GMS §5.1)
  prob += PURCHASE_REP_MODS[repTier] ?? 0;

  // Negotiation skills
  if (skillSet.has('smooth_talker'))       prob += 0.10;
  if (skillSet.has('deal_closer'))         prob += 0.10;
  if (skillSet.has('casual_chat'))         prob += 0.05;
  if (skillSet.has('price_research'))      prob += 0.05;
  if (skillSet.has('anchor_low'))          prob += 0.05;
  if (skillSet.has('comfortable_silence')) prob += 0.08;
  if (skillSet.has('show_cash'))           prob += 0.10;
  if (skillSet.has('professional_closer')) prob += 0.10;
  if (skillSet.has('market_authority') && skillSet.has('price_research')) prob += 0.10;

  // Defects revealed strengthen player's position — they have leverage
  if (defectsRevealed >= 1) prob += 0.08;
  if (defectsRevealed >= 3) prob += 0.05; // cumulative: 3+ defects found = +0.13 total

  // Listing age: seller more eager to deal if listing is stale
  if (listingAge >= 4) prob += 0.08;
  if (listingAge >= 6) prob += 0.05; // cumulative

  // Seller archetype: some are more flexible than others
  const ARCHETYPE_FLEX = {
    urgent_sale:    +0.15,  // desperate to sell
    old_man:        +0.08,  // tends to negotiate informally
    private_owner:  +0.00,  // baseline
    enthusiast:     -0.05,  // attached to the car, won't budge much
    shady_dealer:   -0.10,  // experienced, doesn't discount easily
  };
  prob += ARCHETYPE_FLEX[sellerArchetype] ?? 0;

  // Round penalty: seller hardens each round
  if (negotiationRound >= 1) prob -= 0.08 * negotiationRound;

  // Cash stress: desperation shows, seller exploits it
  if (player.cash_stress_active) prob -= 0.10;

  prob = clamp(prob, NEGOTIATION_SUCCESS_FLOOR, NEGOTIATION_SUCCESS_CAP);

  // Auto-accept when player's price is within 2% of current asking — deal is done
  if ((_current - _proposed) / _current <= 0.02) {
    return { outcome: 'accepted', finalPrice: _proposed };
  }

  // ── Delta penalty — how aggressive is the offer? ──────────────────────────
  // delta = how much below current price the player is asking
  // maxAcceptableDelta = maximum discount from original price (30%)
  const delta = _current - _proposed;
  const maxAcceptableDelta = _original * 0.30;
  const deltaFraction = maxAcceptableDelta > 0 ? delta / maxAcceptableDelta : 1;

  // Multiplicative crush: at max discount (deltaFraction=1) prob is scaled to ~30% of its value;
  // at deltaFraction=0 (tiny offer) the multiplier is 1.0 (no penalty).
  // This ensures skills/rep can't inflate the adjusted probability at aggressive discounts.
  const deltaMultiplier = 1 - deltaFraction * 0.70;
  const adjustedProb = clamp(prob * deltaMultiplier, NEGOTIATION_SUCCESS_FLOOR, NEGOTIATION_SUCCESS_CAP);

  const r = Math.random();

  if (r < adjustedProb) {
    return { outcome: 'accepted', finalPrice: _proposed };
  }

  // Walk Away skill: 35% chance seller calls back with up to 3% additional movement
  // (seller is less generous than NPC buyer — only 3% extra wiggle)
  if (skillSet.has('walk_away') && Math.random() < 0.35) {
    const callbackDiscount = 1 - Math.random() * 0.03;
    const callbackPrice = Math.round(_proposed * callbackDiscount);
    return {
      outcome: 'accepted',
      finalPrice: Math.max(callbackPrice, Math.round(_original * 0.70)),
    };
  }

  // Counter-back: 65% of the time the seller counters (midpoint), else outright reject
  const sellerCounters = Math.random() < 0.65;
  if (sellerCounters) {
    // Seller meets halfway between their current price and the player's offer
    const midpoint = Math.round((_current + _proposed) / 2);
    return { outcome: 'counter', finalPrice: midpoint };
  }

  return { outcome: 'rejected', finalPrice: 0 };
}

/**
 * Resolve a SALE negotiation (NPC buyer counter-offer response).
 *
 * Called when the player submits a counter-offer to a buyer inquiry.
 * Returns whether the buyer accepts the counter and at what final price.
 *
 * Context fields:
 *   - askingPrice: player's current asking price
 *   - buyerOfferedPrice: what the buyer offered initially
 *   - playerCounterOffer: what the player is countering with
 *   - daysListed: how many in-game days the listing has been active
 *   - defectDiscovered: boolean — buyer found a defect during inspection
 *   - buyerArchetype: buyer_archetype value
 *
 * @param {string} playerId
 * @param {object} context
 * @returns {Promise<{ outcome: 'accepted'|'rejected'|'counter', finalPrice: number }>}
 */
export async function resolveSaleNegotiation(playerId, context) {
  const {
    askingPrice,
    buyerOfferedPrice,
    playerCounterOffer,
    daysListed = 0,
    defectDiscovered = false,
    buyerArchetype = 'careful_buyer',
  } = context;

  // Coerce to numbers — guards against string values arriving from request body
  const _asking   = Number(askingPrice);
  const _buyer    = Number(buyerOfferedPrice);
  const _counter  = Number(playerCounterOffer);

  if (!_asking || !_buyer || !_counter) {
    throw Object.assign(new Error('Missing required negotiation context'), { statusCode: 400 });
  }

  const [player] = await sql`
    SELECT reputation_score, cash_stress_active FROM players WHERE id = ${playerId}
  `;
  if (!player) throw Object.assign(new Error('Player not found'), { statusCode: 404 });

  const ownedSkills = await sql`
    SELECT skill_id FROM player_skills WHERE player_id = ${playerId}
  `;
  const skillSet = new Set(ownedSkills.map(r => r.skill_id));
  const repTier = getRepTierName(player.reputation_score);

  // ── Base acceptance probability ───────────────────────────────────────────
  // Kept low intentionally — the buyer is expected to counter back multiple
  // times before accepting or walking. The delta penalty and buyer counter-back
  // probability together create the multi-round bargaining feel.
  let prob = 0.25;

  // Reputation modifiers
  prob += SALE_REP_MODS[repTier] ?? 0;

  // Listing freshness
  if (daysListed < 2)  prob += 0.10;
  if (daysListed >= 5) prob -= 0.15;

  // Defect discovered during inspection — major drop
  if (defectDiscovered) prob -= 0.30;

  // Skills
  if (skillSet.has('deal_closer'))         prob += 0.12;
  if (skillSet.has('comfortable_silence')) prob += 0.08;
  if (skillSet.has('professional_closer')) prob += 0.10;
  if (skillSet.has('bundle_offer'))        prob += 0.12; // requires all defects properly repaired — caller verifies
  if (skillSet.has('loss_aversion_frame') && daysListed >= 4) {
    prob += buyerArchetype === 'reseller' ? 0.15 : 0.10;
  }

  // Cash stress (GMS §10.4) — desperation reduces effectiveness
  if (player.cash_stress_active) prob -= 0.10;

  prob = clamp(prob, NEGOTIATION_SUCCESS_FLOOR, NEGOTIATION_SUCCESS_CAP);

  // Auto-accept when prices are within 1% of asking price — deal is effectively done.
  if (Math.abs(_counter - _buyer) / _asking <= 0.01) {
    return { outcome: 'accepted', finalPrice: _counter };
  }

  // Counter-offer delta: how far above buyer's offer is the player asking?
  // Larger delta = harder to accept
  const delta = _counter - _buyer;
  const maxAcceptableDelta = _asking - _buyer;
  const deltaFraction = maxAcceptableDelta > 0 ? delta / maxAcceptableDelta : 1;

  // Penalty proportional to how aggressive the counter-offer is.
  // Capped at 0.20 so even a counter near asking price still leaves a
  // meaningful buyer counter-back chance rather than instant rejection.
  const deltapenalty = deltaFraction * 0.20;
  const adjustedProb = clamp(prob - deltapenalty, NEGOTIATION_SUCCESS_FLOOR, NEGOTIATION_SUCCESS_CAP);

  const r = Math.random();

  if (r < adjustedProb) {
    return { outcome: 'accepted', finalPrice: _counter };
  }

  // Walk Away skill: 40% chance buyer calls back with up to 5% additional discount
  if (skillSet.has('walk_away') && Math.random() < 0.40) {
    const callbackDiscount = 1 - (Math.random() * 0.05);
    const callbackPrice = Math.round(_counter * callbackDiscount);
    return {
      outcome: 'accepted',
      finalPrice: Math.max(callbackPrice, _buyer),
    };
  }

  // Buyer counter-back: high probability so multi-round bargaining is the norm.
  // Only outright rejects (~30%) when the player's counter is far from their offer.
  const buyerCounter = Math.random() < 0.70;
  if (buyerCounter) {
    const midpoint = Math.round((_buyer + _counter) / 2);
    return { outcome: 'counter', finalPrice: midpoint };
  }

  return { outcome: 'rejected', finalPrice: 0 };
}

/**
 * Compute the quick-fix discovery probability for a single defect
 * when a buyer inspects the car (GMS §8.3).
 *
 * @param {number} baseQFDiscovery  - from defects.qf_discovery_base (e.g. 0.45)
 * @param {number} reputationScore
 * @param {boolean} buyerRequestedInspection
 * @returns {number} effective probability 0–1
 */
export function quickFixDiscoveryProb(baseQFDiscovery, reputationScore, buyerRequestedInspection) {
  const repTier = getRepTierName(reputationScore);

  const REP_MOD = {
    'Легенда':   -0.20,
    'Авторитет': -0.12,
    'Надёжный':  -0.06,
    'Знакомый':   0,
    'Новичок':   +0.10,
  };

  let p = baseQFDiscovery + (REP_MOD[repTier] ?? 0);
  if (buyerRequestedInspection) p += 0.25;

  return clamp(p, 0.05, 0.95);
}

/**
 * Compute buyer inspection probability (GMS §9.3).
 *
 * @param {number} reputationScore
 * @param {number} askingPrice
 * @param {number} marketValue
 * @returns {number} probability 0–1
 */
export function buyerInspectionProb(reputationScore, askingPrice, marketValue) {
  const repTier = getRepTierName(reputationScore);

  const REP_MOD = {
    'Легенда':   -0.20,
    'Авторитет': -0.12,
    'Надёжный':  -0.06,
    'Знакомый':   0,
    'Новичок':  +0.15,
  };

  let p = 0.30 + (REP_MOD[repTier] ?? 0);

  if (marketValue > 0) {
    const ratio = askingPrice / marketValue;
    if (ratio > 1.10) p += 0.10;
    else if (ratio < 0.90) p -= 0.05;
  }

  return clamp(p, 0.05, 1.0);
}
