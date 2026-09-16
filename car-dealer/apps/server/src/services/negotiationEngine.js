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
import {
  NEGOTIATION_BASE_SUCCESS,
  REPUTATION_TIERS,
} from '../config.js';

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

// ─── Discount tier table (GMS §5.1) ──────────────────────────────────────────
// Used on purchase negotiation success roll.
// Roll 0–1 within the success space.
function rollPurchaseDiscount(hasDealCloser) {
  const r = Math.random();
  if (!hasDealCloser) {
    // Max discount 15%
    if (r <= 0.40) return 0.05;
    if (r <= 0.70) return 0.10;
    return 0.15;
  } else {
    // Max discount 25%
    if (r <= 0.40) return 0.05;
    if (r <= 0.70) return 0.10;
    if (r <= 0.90) return 0.15;
    return 0.20 + Math.random() * 0.05; // 20–25%
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Resolve a PURCHASE negotiation attempt (player vs market seller).
 *
 * Context fields:
 *   - listingAge: number of in-game days the listing has been active
 *   - sellerMoodRevealed: 'cooperative'|'neutral'|'guarded'|null (null = unknown)
 *   - recentFailedNegotiation: boolean — player already failed with this seller
 *   - carQualityTier: 'bad'|'below_avg'|'fair'|'good'|'bargain'
 *
 * @param {string} playerId
 * @param {object} context
 * @returns {Promise<{ outcome: 'success'|'failure', discount: number, retryAllowed: boolean }>}
 */
export async function resolvePurchaseNegotiation(playerId, context) {
  const {
    listingAge = 0,
    sellerMoodRevealed = null,
    recentFailedNegotiation = false,
    carQualityTier = 'fair',
  } = context;

  // Load player state
  const [player] = await sql`
    SELECT reputation_score, cash_stress_active FROM players WHERE id = ${playerId}
  `;
  if (!player) throw Object.assign(new Error('Player not found'), { statusCode: 404 });

  const ownedSkills = await sql`
    SELECT skill_id FROM player_skills WHERE player_id = ${playerId}
  `;
  const skillSet = new Set(ownedSkills.map(r => r.skill_id));

  const repTier = getRepTierName(player.reputation_score);

  // ── Compute probability ───────────────────────────────────────────────────
  let prob = NEGOTIATION_BASE_SUCCESS;

  // Negotiation skills (GMS §3.2 + §5.1)
  if (skillSet.has('smooth_talker'))      prob += 0.15;
  if (skillSet.has('deal_closer'))        prob += 0.10;
  if (skillSet.has('casual_chat'))        prob += 0.05;
  if (skillSet.has('price_research'))     prob += 0.05; // sellers overpriced get −5% resistance
  if (skillSet.has('point_out_flaws'))    prob += 0.10; // requires at least 1 defect found (context)
  if (skillSet.has('anchor_low'))         prob += 0.05;
  if (skillSet.has('comfortable_silence')) prob += 0.08;
  if (skillSet.has('show_cash'))          prob += 0.10;
  if (skillSet.has('professional_closer')) prob += 0.10;
  if (skillSet.has('market_authority') && skillSet.has('price_research')) prob += 0.12;

  // Reputation modifier
  prob += PURCHASE_REP_MODS[repTier] ?? 0;

  // Seller mood (GMS §5.1)
  if (sellerMoodRevealed === 'cooperative') prob += 0.10;
  if (sellerMoodRevealed === 'guarded')     prob -= 0.10;

  // Listing age
  if (listingAge >= 4) prob += 0.08;

  // Recent failed negotiation with same seller
  if (recentFailedNegotiation) prob -= 0.15;

  // Bad deal listing
  if (carQualityTier === 'bad') prob += 0.05;

  // Cash stress (Phase 6: GMS §10.4)
  if (player.cash_stress_active) prob -= 0.10;

  // Build Rapport bonus for specific seller archetypes is handled in caller context
  if (context.buildRapportBonus) prob += context.buildRapportBonus;

  prob = clamp(prob, NEGOTIATION_SUCCESS_FLOOR, NEGOTIATION_SUCCESS_CAP);

  const succeeded = Math.random() < prob;

  if (!succeeded) {
    // Smooth Talker allows one retry at 60% of modified probability (2 extra energy — enforced by route)
    const retryAllowed = skillSet.has('smooth_talker');
    return { outcome: 'failure', discount: 0, retryAllowed };
  }

  const hasDealCloser = skillSet.has('deal_closer');
  const discount = rollPurchaseDiscount(hasDealCloser);

  return { outcome: 'success', discount, retryAllowed: false };
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

  if (!askingPrice || !buyerOfferedPrice || !playerCounterOffer) {
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
  if (Math.abs(playerCounterOffer - buyerOfferedPrice) / askingPrice <= 0.01) {
    return { outcome: 'accepted', finalPrice: playerCounterOffer };
  }

  // Counter-offer delta: how far above buyer's offer is the player asking?
  // Larger delta = harder to accept
  const delta = playerCounterOffer - buyerOfferedPrice;
  const maxAcceptableDelta = askingPrice - buyerOfferedPrice;
  const deltaFraction = maxAcceptableDelta > 0 ? delta / maxAcceptableDelta : 1;

  // Penalty proportional to how aggressive the counter-offer is.
  // Capped at 0.20 so even a counter near asking price still leaves a
  // meaningful buyer counter-back chance rather than instant rejection.
  const deltapenalty = deltaFraction * 0.20;
  const adjustedProb = clamp(prob - deltapenalty, NEGOTIATION_SUCCESS_FLOOR, NEGOTIATION_SUCCESS_CAP);

  const r = Math.random();

  if (r < adjustedProb) {
    return { outcome: 'accepted', finalPrice: playerCounterOffer };
  }

  // Walk Away skill: 40% chance buyer calls back with up to 5% additional discount
  if (skillSet.has('walk_away') && Math.random() < 0.40) {
    const callbackDiscount = 1 - (Math.random() * 0.05);
    const callbackPrice = Math.round(playerCounterOffer * callbackDiscount);
    return {
      outcome: 'accepted',
      finalPrice: Math.max(callbackPrice, buyerOfferedPrice),
    };
  }

  // Buyer counter-back: high probability so multi-round bargaining is the norm.
  // Only outright rejects (~30%) when the player's counter is far from their offer.
  const buyerCounter = Math.random() < 0.70;
  if (buyerCounter) {
    const midpoint = Math.round((buyerOfferedPrice + playerCounterOffer) / 2);
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
