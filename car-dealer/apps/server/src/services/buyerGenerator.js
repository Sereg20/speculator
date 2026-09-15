/**
 * Buyer Generator — Phase 5
 *
 * Generates NPC buyer inquiries for active player listings.
 * Called by the buyerInquiry background job (once per in-game day per listing).
 *
 * Key rules (GMS §9):
 *   - Inquiry probability depends on asking price vs market value, listing age, reputation
 *   - 1–3 simultaneous inquiries per day (rolled per GMS §9.2)
 *   - Buyer archetype determines negotiation style and inspection behaviour
 *   - Buyer offered price computed here; dialogue generated via aiProxy
 *   - Quick-fix discovery runs at inquiry time if buyer inspects
 */

import { sql } from '../db/client.js';
import { generateDialogue } from './aiProxy.js';
import { buyerInspectionProb, quickFixDiscoveryProb } from './negotiationEngine.js';
import { REPUTATION_TIERS, INGAME_DAY_REAL_MINUTES } from '../config.js';

// ─── Buyer archetypes ─────────────────────────────────────────────────────────
const BUYER_ARCHETYPES = [
  'careful_buyer',
  'bargain_hunter',
  'impulsive_buyer',
  'skeptic',
  'enthusiast',
];

// Archetype weights (probability distribution for random selection)
const ARCHETYPE_WEIGHTS = {
  careful_buyer:  0.25,
  bargain_hunter: 0.25,
  impulsive_buyer: 0.15,
  skeptic:        0.20,
  enthusiast:     0.15,
};

// Archetype negotiation profiles: how aggressively they negotiate
const ARCHETYPE_OFFER_DISCOUNT = {
  careful_buyer:  { min: 0.03, max: 0.10 },  // modest reduction
  bargain_hunter: { min: 0.10, max: 0.25 },  // wants big discount
  impulsive_buyer: { min: 0.00, max: 0.05 }, // nearly full price, might not negotiate
  skeptic:        { min: 0.08, max: 0.20 },  // cautious, expects issues
  enthusiast:     { min: 0.02, max: 0.08 },  // genuinely interested
};

// Archetype Russian names (for buyer_name generation)
const ARCHETYPE_NAMES = {
  careful_buyer:  ['Андрей', 'Сергей', 'Николай', 'Иван', 'Михаил'],
  bargain_hunter: ['Дима', 'Алексей', 'Вася', 'Костя', 'Рома'],
  impulsive_buyer: ['Артём', 'Тимур', 'Макс', 'Данил', 'Евгений'],
  skeptic:        ['Пётр', 'Владимир', 'Геннадий', 'Аркадий', 'Борис'],
  enthusiast:     ['Кирилл', 'Денис', 'Илья', 'Виктор', 'Антон'],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRepTierName(score) {
  return REPUTATION_TIERS.findLast(t => score >= t.min)?.name || 'Новичок';
}

function pickWeightedArchetype() {
  const r = Math.random();
  let cumulative = 0;
  for (const [archetype, weight] of Object.entries(ARCHETYPE_WEIGHTS)) {
    cumulative += weight;
    if (r < cumulative) return archetype;
  }
  return 'careful_buyer';
}

function randomName(archetype) {
  const names = ARCHETYPE_NAMES[archetype] || ARCHETYPE_NAMES.careful_buyer;
  return names[Math.floor(Math.random() * names.length)];
}

/**
 * Compute inquiry probability per GMS §9.1.
 * Returns 0–1.
 */
function inquiryProbability(askingPrice, marketValue, daysListed, reputationScore) {
  // Base probability from asking price ratio
  const ratio = marketValue > 0 ? askingPrice / marketValue : 1.0;

  let base;
  if (ratio < 0.90)      base = 0.95;
  else if (ratio <= 1.00) base = 0.70;
  else if (ratio <= 1.10) base = 0.50;
  else if (ratio <= 1.20) base = 0.25;
  else                    base = 0.08;

  // Day modifiers (GMS §9.1 table)
  let prob;
  if (daysListed <= 1) {
    prob = base;
  } else if (daysListed <= 3) {
    prob = base * (ratio < 0.90 ? 0.95 : ratio <= 1.0 ? 0.86 : ratio <= 1.1 ? 0.80 : ratio <= 1.2 ? 0.72 : 0.63);
  } else {
    prob = base * (ratio < 0.90 ? 0.89 : ratio <= 1.0 ? 0.71 : ratio <= 1.1 ? 0.60 : ratio <= 1.2 ? 0.48 : 0.38);
  }

  // Reputation bonus (GMS §9.1)
  const repTier = getRepTierName(reputationScore);
  const REP_BONUS = {
    'Надёжный':  0.05,
    'Авторитет': 0.10,
    'Легенда':   0.15,
  };
  prob += REP_BONUS[repTier] ?? 0;

  return Math.min(prob, 0.98);
}

/**
 * Compute direct-buy probability (buyer pays asking price with no negotiation).
 * Base 8%, small rep bonus, impulsive_buyer gets extra.
 * Max ~14% even at Legend so it stays a pleasant surprise, not the norm.
 */
function directBuyProbability(reputationScore, archetype) {
  let p = 0.08;

  const repTier = getRepTierName(reputationScore);
  const REP_BONUS = {
    'Надёжный':  0.02,
    'Авторитет': 0.03,
    'Легенда':   0.04,
  };
  p += REP_BONUS[repTier] ?? 0;

  if (archetype === 'impulsive_buyer') p += 0.04;

  return Math.min(p, 0.16); // hard cap at 16% — stays rare
}


function computeOfferPrice(askingPrice, archetype) {
  const profile = ARCHETYPE_OFFER_DISCOUNT[archetype] || ARCHETYPE_OFFER_DISCOUNT.careful_buyer;
  const discount = profile.min + Math.random() * (profile.max - profile.min);
  return Math.round(askingPrice * (1 - discount));
}

/**
 * Inquiry expiry: 2–3 in-game days from generation.
 */
function inquiryExpiresAt() {
  const daysToExpire = 2 + Math.floor(Math.random() * 2); // 2 or 3 days
  const msToExpire = daysToExpire * INGAME_DAY_REAL_MINUTES * 60 * 1000;
  return new Date(Date.now() + msToExpire);
}

// ─── Quick-fix discovery check ────────────────────────────────────────────────

/**
 * Check if a buyer who inspects discovers any quick-fixed defects.
 * Returns array of discovered defect IDs.
 *
 * @param {string} carId
 * @param {number} reputationScore
 * @param {boolean} buyerRequested - whether buyer specifically requested inspection
 * @returns {Promise<string[]>} discovered defect IDs
 */
async function checkQuickFixDiscovery(carId, reputationScore, buyerRequested) {
  const quickFixedDefects = await sql`
    SELECT id, qf_discovery_base
    FROM defects
    WHERE car_id = ${carId}
      AND is_quick_fixed = true
  `;

  const discovered = [];
  for (const defect of quickFixedDefects) {
    const prob = quickFixDiscoveryProb(
      defect.qf_discovery_base ?? 0.40,
      reputationScore,
      buyerRequested,
    );
    if (Math.random() < prob) {
      discovered.push(defect.id);
    }
  }

  return discovered;
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Generate buyer inquiries for a single listing.
 * Called once per listing per in-game day by the buyerInquiry background job.
 *
 * @param {string} listingId
 * @param {object} log - Fastify logger
 * @returns {Promise<number>} count of inquiries generated
 */
export async function generateBuyerInquiry(listingId, log, { force = false } = {}) {
  // Load listing + car + player state
  const [listing] = await sql`
    SELECT l.id, l.asking_price, l.listed_at, l.status, l.next_inquiry_allowed_at,
           c.id AS car_id, c.make, c.model, c.year, c.market_value,
           p.id AS player_id, p.reputation_score, p.in_game_day
    FROM listings l
    JOIN cars c ON c.id = l.car_id
    JOIN players p ON p.id = l.player_id
    WHERE l.id = ${listingId}
  `;

  if (!listing || listing.status !== 'active') return 0;

  // One inquiry at a time: skip if a pending/negotiating inquiry already exists
  const [activeInquiry] = await sql`
    SELECT 1 FROM buyer_inquiries
    WHERE listing_id = ${listingId}
      AND status IN ('pending', 'negotiating')
    LIMIT 1
  `;
  if (activeInquiry) return 0;

  // Respect cooldown after rejection (unless forced by dev endpoint)
  if (!force && listing.next_inquiry_allowed_at && new Date(listing.next_inquiry_allowed_at) > new Date()) {
    return 0;
  }

  // Compute days listed (in-game days since listing was created)
  const msListed = Date.now() - new Date(listing.listed_at).getTime();
  const daysListed = Math.floor(msListed / (INGAME_DAY_REAL_MINUTES * 60 * 1000));

  const prob = inquiryProbability(
    listing.asking_price,
    listing.market_value ?? listing.asking_price,
    daysListed,
    listing.reputation_score,
  );

  // No inquiry today?
  if (!force && Math.random() >= prob) return 0;

  const archetype = pickWeightedArchetype();
  const buyerName = randomName(archetype);
  const offeredPrice = computeOfferPrice(listing.asking_price, archetype);
  const expiresAt = inquiryExpiresAt();

    // Determine if buyer inspects (GMS §9.3)
    const inspectProb = buyerInspectionProb(
      listing.reputation_score,
      listing.asking_price,
      listing.market_value ?? listing.asking_price,
    );
    const didInspect = Math.random() < inspectProb;

    // Quick-fix discovery if buyer inspects (GMS §8.3)
    let discoveredQuickFixes = false;
    let discoveredDefectIds = [];
    if (didInspect) {
      discoveredDefectIds = await checkQuickFixDiscovery(
        listing.car_id,
        listing.reputation_score,
        didInspect,
      );
      discoveredQuickFixes = discoveredDefectIds.length > 0;
    }

    // Generate buyer dialogue via aiProxy (stub in Phase 5, real in Phase 7)
    let messageText = '';
    try {
      messageText = await generateDialogue('buyer_inquiry', {
        buyer_archetype: archetype,
        car_make_model_year: `${listing.make} ${listing.model}, ${listing.year}`,
        asking_price: listing.asking_price,
        days_since_listing: daysListed,
        player_reputation_tier: getRepTierName(listing.reputation_score),
        offer_amount: offeredPrice,
        negotiation_round: 1,
        inspection_result: didInspect
          ? (discoveredQuickFixes ? 'issues_found' : 'clean')
          : 'not_requested',
        defects_discovered: discoveredDefectIds,
        region: 'Беларусь',
      });
    } catch (err) {
      log?.warn({ err, listingId }, '[buyerGenerator] Failed to generate dialogue, using empty');
      messageText = '';
    }

    // Compute offered price penalty if quick fixes discovered (GMS §9.4)
    let finalOfferedPrice = offeredPrice;
    if (discoveredQuickFixes && discoveredDefectIds.length > 0) {
      // Fetch repair costs of discovered defects to compute penalty
      const defects = await sql`
        SELECT proper_repair_cost, severity
        FROM defects WHERE id = ANY(${discoveredDefectIds})
      `;
      // Buyer demands 50–130% of proper repair cost depending on severity
      for (const d of defects) {
        const severityFactor = d.severity === 'major' ? 1.15 : d.severity === 'moderate' ? 0.85 : 0.65;
        const penalty = Math.round(d.proper_repair_cost * severityFactor);
        finalOfferedPrice = Math.max(0, finalOfferedPrice - penalty);
      }
    }

    // ── Direct-buy roll ────────────────────────────────────────────────────
    // Small chance the buyer is willing to pay asking price without negotiating.
    // Blocked if they found defects — they'd want a discount in that case.
    const isDirectBuy = !discoveredQuickFixes && Math.random() < directBuyProbability(listing.reputation_score, archetype);

    const insertPrice = isDirectBuy ? listing.asking_price : finalOfferedPrice;

    await sql`
      INSERT INTO buyer_inquiries (
        listing_id, buyer_archetype, buyer_name, offered_price,
        message_text, status, did_inspect, discovered_quick_fixes, is_direct_buy, expires_at
      ) VALUES (
        ${listingId}, ${archetype}, ${buyerName}, ${insertPrice},
        ${messageText}, 'pending', ${didInspect}, ${discoveredQuickFixes}, ${isDirectBuy}, ${expiresAt}
      )
    `;

    log?.info(
      { listingId, archetype, offeredPrice: insertPrice, didInspect, isDirectBuy },
      '[buyerGenerator] Inquiry generated',
    );

  return 1;
}
