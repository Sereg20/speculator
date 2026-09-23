/**
 * Inspection Engine — server-side only.
 *
 * Players choose a discrete inspection ACTION from their available list.
 * Each action is unlocked by owning a specific skill or tool, targets
 * one or more defect categories, and has its own energy cost and
 * per-detection-tier probability profile.
 *
 * Key rules:
 *  - No probability is ever 0.  Cheap/basic actions have very low but
 *    non-zero chances on harder tiers — finding a tier-3 defect with
 *    a visual walkround is rare but not impossible.
 *  - Each action can only be performed once per car (UNIQUE constraint).
 *  - Pre-purchase inspections use prePurchaseEnergy and a 0.65× accuracy
 *    multiplier — harder on the street than in your own garage.
 *  - Pattern-recognition bonus (+0.20) applies when a defect in the same
 *    category was already revealed earlier on the same car.
 *  - Undercarriage defects require an action with grantsUndercarAccess.
 */

import { sql } from '../db/client.js';

// ─── Inspection action definitions ───────────────────────────────────────────
// requires: null = always available
//           { skill: 'id' } = player must own this skill
//           { equipment: 'id' } = player must own this equipment
// prob: detection probability per defect detection_tier (1/2/3)
//       No zeros — minimum floor is 0.02 everywhere.
// grantsUndercarAccess: true = can detect undercarriage defect IDs

export const INSPECTION_ACTIONS = {
  visual_walkaround: {
    label:             'Визуальный осмотр',
    categories:        ['body', 'interior'],
    energy:            1,
    prePurchaseEnergy: 2,
    requires:          null,
    prob:              { 1: 0.30, 2: 0.05, 3: 0.02 },
  },
  listen_engine: {
    label:             'Послушать двигатель',
    categories:        ['engine'],
    energy:            1,
    prePurchaseEnergy: 2,
    requires:          { skill: 'listen_engine' },
    prob:              { 1: 0.45, 2: 0.06, 3: 0.02 },
  },
  cold_start_test: {
    label:             'Холодный запуск',
    categories:        ['engine'],
    energy:            1,
    prePurchaseEnergy: 2,
    requires:          { skill: 'cold_start_test' },
    prob:              { 1: 0.55, 2: 0.15, 3: 0.03 },
  },
  interior_smell: {
    label:             'Осмотр и запах салона',
    categories:        ['interior', 'electrical'],
    energy:            1,
    prePurchaseEnergy: 2,
    requires:          { skill: 'interior_smell' },
    prob:              { 1: 0.45, 2: 0.06, 3: 0.02 },
  },
  panel_feel: {
    label:             'Проверка панелей на ощупь',
    categories:        ['body'],
    energy:            1,
    prePurchaseEnergy: 2,
    requires:          { skill: 'panel_feel' },
    prob:              { 1: 0.50, 2: 0.15, 3: 0.03 },
  },
  tap_test: {
    label:             'Простукивание кузова',
    categories:        ['body'],
    energy:            1,
    prePurchaseEnergy: 2,
    requires:          { skill: 'tap_test' },
    prob:              { 1: 0.55, 2: 0.35, 3: 0.04 },
  },
  fluid_check: {
    label:             'Проверка уровня жидкостей',
    categories:        ['engine', 'transmission'],
    energy:            1,
    prePurchaseEnergy: 2,
    requires:          { skill: 'fluid_level_check' },
    prob:              { 1: 0.40, 2: 0.20, 3: 0.03 },
  },
  tyre_brake_visual: {
    label:             'Осмотр шин и тормозов',
    categories:        ['suspension'],
    energy:            1,
    prePurchaseEnergy: 2,
    requires:          { skill: 'tyre_brake_visual' },
    prob:              { 1: 0.55, 2: 0.10, 3: 0.02 },
  },
  undercar_crawl: {
    label:             'Осмотр снизу',
    categories:        ['suspension', 'body', 'transmission'],
    energy:            2,
    prePurchaseEnergy: 3,
    requires:          { skill: 'undercar_crawl' },
    prob:              { 1: 0.50, 2: 0.35, 3: 0.05 },
    grantsUndercarAccess: true,
  },
  test_drive: {
    label:             'Тест-драйв',
    categories:        ['transmission', 'suspension'],
    energy:            2,
    prePurchaseEnergy: 3,
    requires:          { skill: 'test_drive' },
    prob:              { 1: 0.50, 2: 0.40, 3: 0.05 },
  },
  obd_basic: {
    label:             'OBD сканер (базовый)',
    categories:        ['engine', 'electrical'],
    energy:            2,
    prePurchaseEnergy: 3,
    requires:          { equipment: 'generic_obdii' },
    prob:              { 1: 0.70, 2: 0.55, 3: 0.05 },
  },
  obd_live: {
    label:             'OBD с живыми данными',
    categories:        ['engine', 'electrical', 'transmission'],
    energy:            2,
    prePurchaseEnergy: 3,
    requires:          { equipment: 'obdii_live_data' },
    prob:              { 1: 0.75, 2: 0.65, 3: 0.08 },
  },
  obd_pro: {
    label:             'Профи OBD CAN',
    categories:        ['engine', 'electrical', 'transmission'],
    energy:            3,
    prePurchaseEnergy: 4,
    requires:          { equipment: 'full_obdii_can' },
    prob:              { 1: 0.80, 2: 0.75, 3: 0.12 },
  },
  compression_test: {
    label:             'Компрессометр',
    categories:        ['engine'],
    energy:            2,
    prePurchaseEnergy: 3,
    requires:          { equipment: 'compression_tester' },
    prob:              { 1: 0.70, 2: 0.60, 3: 0.25 },
  },
  stethoscope: {
    label:             'Автомобильный стетоскоп',
    categories:        ['engine', 'suspension'],
    energy:            2,
    prePurchaseEnergy: 3,
    requires:          { equipment: 'stethoscope' },
    prob:              { 1: 0.65, 2: 0.55, 3: 0.06 },
  },
  smoke_test: {
    label:             'Дымогенератор',
    categories:        ['engine'],
    energy:            2,
    prePurchaseEnergy: 3,
    requires:          { equipment: 'smoke_machine' },
    prob:              { 1: 0.70, 2: 0.65, 3: 0.18 },
  },
  paint_gauge: {
    label:             'Толщиномер краски',
    categories:        ['body'],
    energy:            1,
    prePurchaseEnergy: 2,
    requires:          { equipment: 'paint_gauge' },
    prob:              { 1: 0.80, 2: 0.75, 3: 0.08 },
  },
  brake_fluid_test: {
    label:             'Тестер тормозной жидкости',
    categories:        ['suspension'],
    energy:            1,
    prePurchaseEnergy: 2,
    requires:          { equipment: 'brake_fluid_tester' },
    prob:              { 1: 0.80, 2: 0.30, 3: 0.04 },
  },
  battery_test: {
    label:             'Тестер АКБ/генератора',
    categories:        ['electrical'],
    energy:            1,
    prePurchaseEnergy: 2,
    requires:          { equipment: 'battery_tester' },
    prob:              { 1: 0.80, 2: 0.50, 3: 0.04 },
  },
  oscilloscope: {
    label:             'Осциллограф',
    categories:        ['electrical'],
    energy:            2,
    prePurchaseEnergy: 3,
    requires:          { equipment: 'oscilloscope' },
    prob:              { 1: 0.75, 2: 0.70, 3: 0.38 },
  },
  lift_ramp: {
    label:             'Подъёмник',
    categories:        ['suspension', 'body'],
    energy:            3,
    prePurchaseEnergy: 4,
    requires:          { equipment: 'lift_ramp' },
    prob:              { 1: 0.75, 2: 0.70, 3: 0.38 },
    grantsUndercarAccess: true,
  },
  full_diagnostic: {
    label:             'Диагностический стенд',
    categories:        ['body', 'engine', 'transmission', 'suspension', 'electrical', 'interior'],
    energy:            4,
    prePurchaseEnergy: 5,
    requires:          { equipment: 'diagnostic_stand' },
    prob:              { 1: 0.90, 2: 0.85, 3: 0.68 },
    grantsUndercarAccess: true,
  },
};

// Undercarriage defects require grantsUndercarAccess on the chosen action
const UNDERCARRIAGE_DEFECT_IDS = new Set([
  'structural_rust', 'damaged_subframe', 'gearbox_bearing_wear',
  'transmission_fluid_leak',
]);

// Pre-purchase accuracy multiplier — harder on the street than in your garage
const PRE_PURCHASE_ACCURACY = 0.65;

// Pattern-recognition bonus when a defect in same category was already revealed
const PATTERN_BONUS = 0.20;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Returns action IDs the player can currently perform, given owned skills/equipment.
 * Always includes visual_walkaround (no requirements).
 *
 * @param {Set<string>} skillSet
 * @param {Set<string>} equipSet
 * @returns {string[]}
 */
export function resolveAvailableActions(skillSet, equipSet) {
  return Object.entries(INSPECTION_ACTIONS)
    .filter(([, action]) => {
      if (!action.requires) return true;
      if (action.requires.skill)      return skillSet.has(action.requires.skill);
      if (action.requires.equipment)  return equipSet.has(action.requires.equipment);
      return false;
    })
    .map(([id]) => id);
}

/**
 * Compute detection probability for a single defect under a given action.
 *
 * @param {object} defect          - defect row from DB
 * @param {object} action          - INSPECTION_ACTIONS entry
 * @param {boolean} hasPatternBonus - true if same category already revealed
 * @param {number}  baseMultiplier  - 1.0 for garage, 0.65 for pre-purchase
 * @returns {number} probability 0.02–0.97
 */
function computeDetectionProb(defect, action, hasPatternBonus, baseMultiplier = 1.0) {
  // Action only covers its declared categories
  if (!action.categories.includes(defect.category)) return 0;

  // Undercarriage defects need explicit undercar access
  if (UNDERCARRIAGE_DEFECT_IDS.has(defect.defect_type) && !action.grantsUndercarAccess) return 0;

  const base = (action.prob[defect.detection_tier] ?? 0.02) * baseMultiplier;
  const bonus = hasPatternBonus ? PATTERN_BONUS * baseMultiplier : 0;

  return Math.min(base + bonus, 0.97);
}

// ─── Core inspection runner ───────────────────────────────────────────────────

/**
 * Shared inspection logic used by both post-purchase and pre-purchase flows.
 *
 * @param {string}  carId
 * @param {string}  playerId
 * @param {string}  actionId        - key from INSPECTION_ACTIONS
 * @param {object}  client          - postgres client (sql or transaction)
 * @param {number}  baseMultiplier  - 1.0 or PRE_PURCHASE_ACCURACY
 * @param {string|null} category    - optional single-category filter (must be in action.categories)
 * @returns {Promise<{ revealed: object[], alreadyKnown: number }>}
 */
async function executeInspectionAction(carId, playerId, actionId, client, baseMultiplier = 1.0, category = null) {
  const action = INSPECTION_ACTIONS[actionId];
  if (!action) {
    throw Object.assign(new Error(`Unknown inspection action: ${actionId}`), { statusCode: 400 });
  }

  const targetCategories = category ? [category] : action.categories;

  // Validate player owns the required skill or equipment
  if (action.requires) {
    if (action.requires.skill) {
      const [row] = await client`
        SELECT 1 FROM player_skills WHERE player_id = ${playerId} AND skill_id = ${action.requires.skill}
      `;
      if (!row) {
        throw Object.assign(
          new Error(`Skill '${action.requires.skill}' required for this inspection`),
          { statusCode: 400 },
        );
      }
    } else if (action.requires.equipment) {
      const [row] = await client`
        SELECT 1 FROM player_equipment WHERE player_id = ${playerId} AND equipment_id = ${action.requires.equipment}
      `;
      if (!row) {
        throw Object.assign(
          new Error(`Equipment '${action.requires.equipment}' required for this inspection`),
          { statusCode: 400 },
        );
      }
    }
  }

  // Fetch hidden defects in the targeted categories
  const hiddenDefects = await client`
    SELECT id, defect_type, category, severity, detection_tier,
           proper_repair_cost, quick_fix_cost, repair_time_minutes,
           resale_impact, is_odometer_fraud, qf_discovery_base
    FROM defects
    WHERE car_id = ${carId}
      AND is_revealed_to_player = false
      AND category = ANY(${targetCategories})
  `;

  // Pattern recognition: categories that already have a revealed defect
  const alreadyRevealed = await client`
    SELECT category FROM defects
    WHERE car_id = ${carId} AND is_revealed_to_player = true
  `;
  const revealedCategories = new Set(alreadyRevealed.map(d => d.category));

  const newlyRevealed = [];

  for (const defect of hiddenDefects) {
    const hasPatternBonus = revealedCategories.has(defect.category);
    const prob = computeDetectionProb(defect, action, hasPatternBonus, baseMultiplier);

    if (prob === 0) continue;

    if (Math.random() < prob) {
      newlyRevealed.push(defect);
      revealedCategories.add(defect.category); // enables pattern bonus for later defects in same run
    }
  }

  // Persist revealed defects
  if (newlyRevealed.length > 0) {
    const revealedIds = newlyRevealed.map(d => d.id);
    await client`
      UPDATE defects SET is_revealed_to_player = true
      WHERE id = ANY(${revealedIds}::uuid[])
    `;
  }

  // Strip internal field before returning
  const safeRevealed = newlyRevealed.map(({ qf_discovery_base: _qf, ...rest }) => rest);

  return {
    revealed:     safeRevealed,
    alreadyKnown: alreadyRevealed.length,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Run a post-purchase inspection action on an owned car.
 *
 * @param {string} carId
 * @param {string} playerId
 * @param {string} actionId
 * @param {object} [opts]
 * @param {object} [opts.sqlClient]
 * @returns {Promise<{ revealed: object[], alreadyKnown: number }>}
 */
export async function runInspection(carId, playerId, actionId, opts = {}) {
  const client = opts.sqlClient || sql;
  return executeInspectionAction(carId, playerId, actionId, client, 1.0, opts.category ?? null);
}

/**
 * Run a pre-purchase inspection action on a market listing.
 * Defects revealed persist through purchase.
 *
 * @param {string} carId
 * @param {string} playerId
 * @param {string} actionId
 * @param {string|null} [category] - optional single-category filter
 * @returns {Promise<{ revealed: object[], alreadyKnown: number }>}
 */
export async function runPrePurchaseInspection(carId, playerId, actionId, category = null) {
  // Verify car is still an active market listing
  const [car] = await sql`
    SELECT id FROM cars
    WHERE id = ${carId}
      AND state = 'available_in_market'
      AND market_listing_expires_at > NOW()
  `;
  if (!car) {
    throw Object.assign(new Error('Listing not found or expired'), { statusCode: 404 });
  }

  return executeInspectionAction(carId, playerId, actionId, sql, PRE_PURCHASE_ACCURACY, category);
}

/**
 * XP awarded per inspection action (same for garage and pre-purchase).
 * More expensive/accurate actions yield more XP.
 */
export function inspectionXP(actionId) {
  const action = INSPECTION_ACTIONS[actionId];
  if (!action) return 10;
  // Scale by energy cost as a proxy for complexity
  const base = action.energy;
  if (base <= 1) return 10;
  if (base <= 2) return 20;
  if (base <= 3) return 30;
  return 40;
}
