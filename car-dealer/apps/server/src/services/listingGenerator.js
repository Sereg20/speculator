/**
 * Listing Generator — generates the per-player market listing set.
 * Called when the player's listing pool is empty or expired (GMS §4.1).
 *
 * Distribution per refresh (GMS §4.2):
 *   bad:       2 — overpriced, 3–5 defects
 *   below_avg: 2 — slightly overpriced, 2–3 defects
 *   fair:      2 — market price, 1–2 defects
 *   good:      1 — slightly below market
 *   bargain:   1 — 70% genuine / 30% trap (1 hidden Tier-3 defect guaranteed)
 *
 * Prices are calibrated to GMS §4.3 by player level.
 */

import { sql } from '../db/client.js';
import { rollDefects } from './defectEngine.js';
import { CAR_MODELS } from '@car-dealer/shared';
import {
  MARKET_LISTINGS_PER_REFRESH,
  MARKET_LISTING_DISTRIBUTION,
  INGAME_DAY_REAL_MINUTES,
} from '../config.js';

// Listing expiry distribution (GMS §4.1)
// Each entry: [days, cumulative probability upper bound]
const EXPIRY_DISTRIBUTION = [
  [3, 0.20],
  [4, 0.50],
  [5, 0.75],
  [6, 0.90],
  [7, 1.00],
];

// Price deviation from market value per quality tier
const PRICE_FACTOR = {
  bad:       { min: 1.08, max: 1.25 },  // overpriced
  below_avg: { min: 1.03, max: 1.10 },
  fair:      { min: 0.97, max: 1.05 },
  good:      { min: 0.90, max: 0.97 },
  bargain:   { min: 0.78, max: 0.90 },
  bargain_trap: { min: 0.75, max: 0.88 },
};

// Condition tier weights per quality tier
const CONDITION_WEIGHTS = {
  bad:          { poor: 0.70, fair: 0.28, good: 0.02 },
  below_avg:    { poor: 0.45, fair: 0.50, good: 0.05 },
  fair:         { poor: 0.20, fair: 0.65, good: 0.15 },
  good:         { poor: 0.10, fair: 0.60, good: 0.30 },
  bargain:      { poor: 0.15, fair: 0.55, good: 0.30 },
  bargain_trap: { poor: 0.30, fair: 0.55, good: 0.15 },
};

const SELLER_ARCHETYPES = ['old_man', 'private_owner', 'shady_dealer', 'enthusiast', 'urgent_sale'];

const COLORS = [
  'Белый', 'Чёрный', 'Серебристый', 'Серый', 'Синий', 'Красный',
  'Зелёный', 'Бежевый', 'Коричневый', 'Жёлтый',
];

function randFloat(min, max) {
  return min + Math.random() * (max - min);
}

function randInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function pickWeighted(weights) {
  const r = Math.random();
  let cumulative = 0;
  for (const [key, w] of Object.entries(weights)) {
    cumulative += w;
    if (r <= cumulative) return key;
  }
  return Object.keys(weights)[0];
}

function rollExpiryDays() {
  const r = Math.random();
  for (const [days, upper] of EXPIRY_DISTRIBUTION) {
    if (r <= upper) return days;
  }
  return 5;
}

/**
 * Pick a car model appropriate for the player's level and quality tier.
 * Filters CAR_MODELS by the listing's implied price bracket.
 */
function pickCarModel(qualityTier, playerLevel) {
  // Determine rough price ceiling by level (GMS §4.3)
  let maxPrice;
  if (playerLevel <= 5)       maxPrice = 3500;
  else if (playerLevel <= 9)  maxPrice = 10000;
  else if (playerLevel <= 13) maxPrice = 25000;
  else                        maxPrice = 50000;

  // For good/bargain tiers at low levels, allow slightly below the normal budget range
  const adjustedMax = qualityTier === 'good' || qualityTier === 'bargain' || qualityTier === 'bargain_trap'
    ? maxPrice * 0.85
    : maxPrice;

  const eligible = CAR_MODELS.filter(m => m.priceRange[0] <= adjustedMax);
  if (eligible.length === 0) return CAR_MODELS[0];
  return eligible[Math.floor(Math.random() * eligible.length)];
}

/**
 * Generate a single market car entry (does not persist yet).
 */
function buildCarEntry(qualityTier, playerLevel) {
  const conditionTier = pickWeighted(CONDITION_WEIGHTS[qualityTier] || CONDITION_WEIGHTS.fair);
  const model = pickCarModel(qualityTier, playerLevel);

  const year = randInt(model.yearRange[0], model.yearRange[1]);
  const baseMarketValue = randInt(model.priceRange[0], model.priceRange[1]);

  // Scale market value by condition
  const conditionMultiplier = { poor: 0.75, fair: 1.00, good: 1.20 }[conditionTier] ?? 1.00;
  const marketValue = Math.round(baseMarketValue * conditionMultiplier);

  const pf = PRICE_FACTOR[qualityTier] || PRICE_FACTOR.fair;
  const askingPrice = Math.round(marketValue * randFloat(pf.min, pf.max));

  const mileageBase = { poor: 180000, fair: 110000, good: 60000 }[conditionTier];
  const mileage = randInt(
    Math.max(10000, mileageBase - 60000),
    mileageBase + 60000,
  );

  const sellerArchetype = SELLER_ARCHETYPES[Math.floor(Math.random() * SELLER_ARCHETYPES.length)];
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  const expiryDays = rollExpiryDays();

  // Turbo: small chance based on model era (post-2000 cars more likely)
  const isTurbo = year >= 2000 && Math.random() < 0.15;

  return {
    make: model.make,
    model: model.model,
    year,
    mileage,
    color,
    condition_tier: conditionTier,
    quality_tier: qualityTier,
    market_value: marketValue,
    asking_price: askingPrice,
    purchase_price: 0,       // set on actual purchase
    seller_archetype: sellerArchetype,
    is_turbo: isTurbo,
    expiryDays,
  };
}

/**
 * Generate and persist fresh market listings for a player.
 * Deletes any existing unsold listings for that player first.
 *
 * @param {string} playerId
 * @param {number} playerLevel  — used to filter appropriate car price ranges
 * @returns {Promise<Array>}    — array of car rows (no defect data)
 */
export async function generateListings(playerId, playerLevel = 1) {
  // Build the quality tier sequence per GMS §4.2
  const tiers = [];
  for (const [tier, count] of Object.entries(MARKET_LISTING_DISTRIBUTION)) {
    for (let i = 0; i < count; i++) {
      tiers.push(tier);
    }
  }

  // Randomly decide if the bargain is genuine or a trap (GMS §4.2: 70/30)
  const bargainIdx = tiers.lastIndexOf('bargain');
  if (bargainIdx !== -1 && Math.random() < 0.30) {
    tiers[bargainIdx] = 'bargain_trap';
  }

  // Shuffle to avoid predictable ordering
  for (let i = tiers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tiers[i], tiers[j]] = [tiers[j], tiers[i]];
  }

  const ingameDayMs = INGAME_DAY_REAL_MINUTES * 60 * 1000;

  return await sql.begin(async tx => {
    // Remove old available listings for this player
    await tx`
      DELETE FROM defects
      WHERE car_id IN (
        SELECT id FROM cars
        WHERE player_id = ${playerId}
          AND state = 'available_in_market'
      )
    `;
    await tx`
      DELETE FROM cars
      WHERE player_id = ${playerId}
        AND state = 'available_in_market'
    `;

    const createdCars = [];

    for (const qualityTier of tiers) {
      const entry = buildCarEntry(qualityTier, playerLevel);

      const expiresAt = new Date(Date.now() + entry.expiryDays * ingameDayMs);

      const [car] = await tx`
        INSERT INTO cars (
          player_id, make, model, year, mileage, color,
          condition_tier, quality_tier, market_value, asking_price, purchase_price,
          seller_archetype, is_turbo, state, market_listing_expires_at
        ) VALUES (
          ${playerId},
          ${entry.make}, ${entry.model}, ${entry.year}, ${entry.mileage}, ${entry.color},
          ${entry.condition_tier}, ${entry.quality_tier}, ${entry.market_value},
          ${entry.asking_price}, ${entry.purchase_price},
          ${entry.seller_archetype}, ${entry.is_turbo},
          'available_in_market', ${expiresAt}
        )
        RETURNING id, make, model, year, mileage, color,
                  condition_tier, quality_tier, market_value, asking_price,
                  seller_archetype, is_turbo, state, market_listing_expires_at,
                  created_at
      `;

      // Roll and persist defects (hidden), scaled to this car's market value
      await rollDefects(car.id, entry.condition_tier, qualityTier, {
        sqlClient: tx,
        marketValue: entry.market_value,
      });

      createdCars.push(car);
    }

    return createdCars;
  });
}

/**
 * Retrieve the current available market listings for a player.
 * Generates fresh ones if none exist or all have expired.
 *
 * @param {string} playerId
 * @param {number} playerLevel
 * @returns {Promise<Array>}
 */
export async function getOrRefreshListings(playerId, playerLevel = 1) {
  const now = new Date();

  // Check for live listings
  const existing = await sql`
    SELECT id, make, model, year, mileage, color,
           condition_tier, quality_tier, market_value, asking_price,
           seller_archetype, is_turbo, state, market_listing_expires_at,
           seller_dialogue, created_at
    FROM cars
    WHERE player_id = ${playerId}
      AND state = 'available_in_market'
      AND market_listing_expires_at > ${now}
    ORDER BY created_at ASC
  `;

  if (existing.length === MARKET_LISTINGS_PER_REFRESH) {
    return existing;
  }

  // Regenerate
  return generateListings(playerId, playerLevel);
}
