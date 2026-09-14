/**
 * Inspection Engine — server-side only.
 *
 * Runs probabilistic detection rolls against a car's hidden defects.
 * Only defects that pass the roll are revealed (is_revealed_to_player = true).
 * The caller ONLY receives the revealed defect objects — never total counts,
 * never IDs of defects that failed the roll.
 *
 * Inspection tiers (GMS §7.1):
 *   1  — Visual Check       (no equipment)
 *   2A — Tap Test           (requires tap_test skill + torch_mirror equipment)
 *   2B — OBD Scan           (requires generic_obdii or obdii_live_data equipment)
 *   3  — Full Diagnostic    (requires diagnostic_stand equipment)
 *
 * Skill modifiers (GMS §7.2) are applied on top of base tier probabilities.
 */

import { sql } from '../db/client.js';

// ─── Base detection probabilities by inspection tier ─────────────────────────
// Format: { [detectionTier]: probability }
// "inspection tier" is what the player is performing (1/2A/2B/3)
// "detection tier" is the defect's difficulty (1/2/3)

const BASE_PROB = {
  visual:     { 1: 0.70, 2: 0.00, 3: 0.00 },
  tap_test:   { 1: 0.85, 2: 0.65, 3: 0.00 },
  obd_basic:  { 1: 0.85, 2: 0.65, 3: 0.00 },  // engine+electrical only at 2
  obd_pro:    { 1: 0.85, 2: 0.80, 3: 0.00 },  // named scanner
  full_diag:  { 1: 0.95, 2: 0.90, 3: 0.75 },
};

// OBD scans only cover these categories for Tier-2 defects (GMS §7.1)
const OBD_TIER2_CATEGORIES = new Set(['engine', 'electrical']);

// ─── Equipment slug → inspection profile map ─────────────────────────────────
// What tier of scan a piece of equipment enables
const EQUIPMENT_SCAN_PROFILE = {
  generic_obdii:    'obd_basic',
  obdii_live_data:  'obd_pro',
  full_obdii_can:   'obd_pro',   // same detection rates, broader protocol coverage
  diagnostic_stand: 'full_diag',
};

// ─── Skill passive detection modifiers ───────────────────────────────────────
// Applied as additive bonus to roll probability for matching defect categories
// Source: GMS §7.2, §3.1 Tier-0/1 skill effects
const SKILL_MODIFIERS = {
  // passive: applies to all inspections automatically when owned
  panel_feel:       { categories: ['body'],                    bonus: 0.20, applyTo: 'hidden_body_repairs' },
  torch_mirror:     { categories: ['body', 'interior'],        bonus: 0.20, tier: [1] },
  undercar_crawl:   { categories: ['suspension', 'body'],      bonus: 0.00, unlocks_undercarriage: true },
  paint_gauge:      { categories: ['body'],                    bonus: 0.90, tier: [2, 3], defect_ids: ['accident_history', 'paint_damage'] },
  // skill-based inspections add detection coverage
  listen_engine:    { categories: ['engine'],                  bonus: 0.15, tier: [1] },
  interior_smell:   { categories: ['interior', 'electrical'],  bonus: 0.10, tier: [1] },
  cold_start_test:  { categories: ['engine'],                  bonus: 0.15, tier: [1], defect_ids: ['starting_issues', 'overheating', 'low_compression'] },
  tyre_brake_visual:{ categories: ['suspension'],              bonus: 0.15, tier: [1] },
  fluid_level_check:{ categories: ['engine', 'transmission'],  bonus: 0.10, tier: [1, 2] },
  magnet_test:      { categories: ['body'],                    bonus: 0.10, tier: [2] },
  test_drive:       { categories: ['transmission', 'suspension'], bonus: 0.15, tier: [2] },
  tap_test:         { categories: ['body'],                    bonus: 0.10, tier: [2] },
  stethoscope:      { categories: ['engine', 'suspension'],    bonus: 0.10, tier: [2] },
  compression_tester: { categories: ['engine'],               bonus: 0.10, tier: [3], defect_ids: ['low_compression'] },
  leakdown_tester:  { categories: ['engine'],                  bonus: 0.10, tier: [3] },
  battery_tester:   { categories: ['electrical'],              bonus: 0.20, tier: [1, 2] },
  smoke_machine:    { categories: ['engine'],                  bonus: 0.10, tier: [2, 3] },
  oscilloscope:     { categories: ['electrical'],              bonus: 0.10, tier: [3] },
  lift_ramp:        { categories: ['suspension', 'body'],      bonus: 0.20, tier: [2, 3] },
  brake_fluid_tester: { categories: ['suspension'],            bonus: 0.20, tier: [1] },
};

// Undercarriage defects only visible with undercar_crawl or lift_ramp (GMS §7.2)
const UNDERCARRIAGE_DEFECT_IDS = new Set([
  'structural_rust', 'damaged_subframe', 'gearbox_bearing_wear',
  'transmission_fluid_leak',
]);

/**
 * Determine inspection profile from player's owned equipment.
 * Higher capability overrides lower.
 *
 * @param {string[]} ownedEquipmentIds
 * @returns {'visual'|'tap_test'|'obd_basic'|'obd_pro'|'full_diag'}
 */
function resolveInspectionProfile(inspectionTier, ownedEquipmentIds, ownedSkillIds) {
  if (inspectionTier === 'visual') return 'visual';

  if (inspectionTier === 'tap_test') {
    // tap_test skill required
    if (!ownedSkillIds.includes('tap_test')) {
      throw Object.assign(new Error('tap_test skill required for Tap Test inspection'), { statusCode: 400 });
    }
    return 'tap_test';
  }

  if (inspectionTier === 'obd') {
    // Require at least one OBD device
    for (const eq of ['full_obdii_can', 'obdii_live_data', 'generic_obdii']) {
      if (ownedEquipmentIds.includes(eq)) return EQUIPMENT_SCAN_PROFILE[eq];
    }
    throw Object.assign(new Error('OBD scanner equipment required for OBD inspection'), { statusCode: 400 });
  }

  if (inspectionTier === 'full') {
    if (!ownedEquipmentIds.includes('diagnostic_stand')) {
      throw Object.assign(new Error('diagnostic_stand equipment required for Full Diagnostic'), { statusCode: 400 });
    }
    return 'full_diag';
  }

  throw Object.assign(new Error(`Unknown inspection tier: ${inspectionTier}`), { statusCode: 400 });
}

/**
 * Compute the effective detection probability for a single defect,
 * given inspection profile and owned skills/equipment.
 *
 * @param {object} defect - defect row from DB
 * @param {string} profile - inspection profile key
 * @param {Set<string>} skillSet
 * @param {Set<string>} equipSet
 * @param {boolean} hasUndercarAccess
 * @returns {number} probability 0–1
 */
function computeDetectionProb(defect, profile, skillSet, equipSet, hasUndercarAccess) {
  // Undercarriage defects require access
  if (UNDERCARRIAGE_DEFECT_IDS.has(defect.defect_type) && !hasUndercarAccess) {
    return 0;
  }

  const probs = BASE_PROB[profile];
  let base = probs[defect.detection_tier] ?? 0;

  // OBD scans only cover engine+electrical for Tier-2
  if ((profile === 'obd_basic' || profile === 'obd_pro') &&
      defect.detection_tier === 2 &&
      !OBD_TIER2_CATEGORIES.has(defect.category)) {
    base = 0;
  }

  if (base === 0) return 0;  // no point applying bonuses

  // Apply skill modifiers
  let bonus = 0;
  for (const [skillId, mod] of Object.entries(SKILL_MODIFIERS)) {
    if (!skillSet.has(skillId) && !equipSet.has(skillId)) continue;

    // Check category match
    if (!mod.categories.includes(defect.category)) continue;

    // Check detection tier match (if specified)
    if (mod.tier && !mod.tier.includes(defect.detection_tier)) continue;

    // Check specific defect_ids match (if specified)
    if (mod.defect_ids && !mod.defect_ids.includes(defect.defect_type)) continue;

    bonus += mod.bonus;
  }

  // Pattern recognition: if another defect in same category was already revealed
  // this is applied post-roll in the loop — handled separately

  return Math.min(base + bonus, 0.98);  // cap at 98%
}

/**
 * Run inspection on a car. Writes revealed defects to DB.
 * Returns ONLY the defect objects that passed the detection roll.
 *
 * @param {string} carId
 * @param {string} playerId
 * @param {'visual'|'tap_test'|'obd'|'full'} inspectionTier
 * @param {object} [opts]
 * @param {object} [opts.sqlClient]
 * @returns {Promise<{ revealed: object[], alreadyKnown: number }>}
 */
export async function runInspection(carId, playerId, inspectionTier, opts = {}) {
  const client = opts.sqlClient || sql;

  // Fetch player's owned skills and equipment
  const playerSkills = await client`
    SELECT skill_id FROM player_skills WHERE player_id = ${playerId}
  `;
  const playerEquipment = await client`
    SELECT equipment_id FROM player_equipment WHERE player_id = ${playerId}
  `;

  const skillSet = new Set(playerSkills.map(r => r.skill_id));
  const equipSet = new Set(playerEquipment.map(r => r.equipment_id));

  // Resolve to a named profile (validates prerequisites)
  const ownedSkillIds = [...skillSet];
  const ownedEquipmentIds = [...equipSet];
  const profile = resolveInspectionProfile(inspectionTier, ownedEquipmentIds, ownedSkillIds);

  // Undercarriage access = undercar_crawl skill OR lift_ramp equipment
  const hasUndercarAccess = skillSet.has('undercar_crawl') || equipSet.has('lift_ramp') || equipSet.has('diagnostic_stand');

  // Fetch ALL hidden defects (not yet revealed) on this car
  const hiddenDefects = await client`
    SELECT id, defect_type, category, severity, detection_tier,
           proper_repair_cost, quick_fix_cost, repair_time_minutes,
           resale_impact, is_odometer_fraud, qf_discovery_base
    FROM defects
    WHERE car_id = ${carId}
      AND is_revealed_to_player = false
  `;

  // Fetch already-revealed defects (for pattern recognition bonus)
  const alreadyRevealed = await client`
    SELECT category FROM defects
    WHERE car_id = ${carId}
      AND is_revealed_to_player = true
  `;
  const revealedCategories = new Set(alreadyRevealed.map(d => d.category));

  const newlyRevealed = [];

  for (const defect of hiddenDefects) {
    let prob = computeDetectionProb(defect, profile, skillSet, equipSet, hasUndercarAccess);

    if (prob === 0) continue;

    // Pattern recognition bonus (GMS §7.2): +20% if a defect in same category already found
    if (revealedCategories.has(defect.category)) {
      prob = Math.min(prob + 0.20, 0.98);
    }

    if (Math.random() < prob) {
      newlyRevealed.push(defect);
      revealedCategories.add(defect.category);  // enables pattern recognition for later in same inspection
    }
  }

  // Mark revealed defects in DB
  if (newlyRevealed.length > 0) {
    const revealedIds = newlyRevealed.map(d => d.id);
    await client`
      UPDATE defects
      SET is_revealed_to_player = true
      WHERE id = ANY(${revealedIds}::uuid[])
    `;
  }

  // Return only the safe subset of revealed defect fields (no qf_discovery_base)
  const safeRevealed = newlyRevealed.map(({ qf_discovery_base: _qf, ...rest }) => rest);

  return {
    revealed: safeRevealed,
    alreadyKnown: alreadyRevealed.length,
  };
}

/**
 * XP awards for inspection (GMS §1.2).
 * basic=10, intermediate=20, advanced=35 (cumulative per car, awarded once each tier).
 */
export const INSPECTION_XP = {
  visual:   10,
  tap_test: 20,
  obd:      20,
  full:     35,
};
