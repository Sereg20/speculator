/**
 * Defect Engine — server-side only.
 * Rolls defects for a car at listing-generation time and persists them hidden.
 * NEVER returns raw defect data to route handlers or the client.
 *
 * All probabilities and costs are from GMS Sections 6.2–6.8.
 */

import { sql } from '../db/client.js';

// ─── Defect definitions ───────────────────────────────────────────────────────
// Each entry: { id, category, detectionTier, occurrenceByTier, properRepair, quickFix, qfDiscovery, resaleImpact }
// occurrenceByTier: { poor, fair, good } — roll probability for each condition
// properRepair / quickFix: [min, max] BYN, null = not available
// qfDiscovery: base discovery % for quick fix (0–1), null = N/A
// resaleImpact: fraction e.g. -0.12 = −12%

const DEFECT_DEFS = [
  // ── Body ──────────────────────────────────────────────────────────────────
  {
    id: 'surface_rust',
    category: 'body',
    severity: 'minor',
    detectionTier: 1,
    occurrence: { poor: 0.60, fair: 0.35, good: 0.15 },
    properRepair: [150, 400],
    quickFix:     [40,  80],
    qfDiscovery:  0.45,
    resaleImpact: -0.12,
  },
  {
    id: 'structural_rust',
    category: 'body',
    severity: 'major',
    detectionTier: 2,
    occurrence: { poor: 0.35, fair: 0.15, good: 0.03 },
    properRepair: [700, 1800],
    quickFix:     [120, 280],
    qfDiscovery:  0.60,
    resaleImpact: -0.30,
  },
  {
    id: 'dent_minor',
    category: 'body',
    severity: 'minor',
    detectionTier: 1,
    occurrence: { poor: 0.65, fair: 0.40, good: 0.15 },
    properRepair: [80,  200],
    quickFix:     [20,   50],
    qfDiscovery:  0.25,
    resaleImpact: -0.06,
  },
  {
    id: 'dent_major',
    category: 'body',
    severity: 'major',
    detectionTier: 1,
    occurrence: { poor: 0.40, fair: 0.20, good: 0.05 },
    properRepair: [350, 900],
    quickFix:     [60,  150],
    qfDiscovery:  0.35,
    resaleImpact: -0.18,
  },
  {
    id: 'cracked_windscreen',
    category: 'body',
    severity: 'minor',
    detectionTier: 1,
    occurrence: { poor: 0.40, fair: 0.25, good: 0.08 },
    properRepair: [200, 550],
    quickFix:     [25,   70],
    qfDiscovery:  0.70,
    resaleImpact: -0.15,
  },
  {
    id: 'cracked_glass',
    category: 'body',
    severity: 'minor',
    detectionTier: 1,
    occurrence: { poor: 0.30, fair: 0.18, good: 0.05 },
    properRepair: [100, 300],
    quickFix:     [20,   50],
    qfDiscovery:  0.65,
    resaleImpact: -0.10,
  },
  {
    id: 'paint_damage',
    category: 'body',
    severity: 'minor',
    detectionTier: 1,
    occurrence: { poor: 0.55, fair: 0.30, good: 0.10 },
    properRepair: [180, 450],
    quickFix:     [50,  120],
    qfDiscovery:  0.30,
    resaleImpact: -0.08,
  },
  {
    id: 'accident_history',
    category: 'body',
    severity: 'major',
    detectionTier: 3,
    occurrence: { poor: 0.20, fair: 0.10, good: 0.03 },
    properRepair: [900, 2500],
    quickFix:     null,         // not available
    qfDiscovery:  null,
    resaleImpact: -0.35,
  },
  {
    id: 'fender_dented',
    category: 'body',
    severity: 'minor',
    detectionTier: 1,
    occurrence: { poor: 0.50, fair: 0.28, good: 0.08 },
    properRepair: [120, 320],
    quickFix:     [30,   70],
    qfDiscovery:  0.20,
    resaleImpact: -0.07,
  },
  {
    id: 'bumper_scratched',
    category: 'body',
    severity: 'minor',
    detectionTier: 1,
    occurrence: { poor: 0.55, fair: 0.32, good: 0.10 },
    properRepair: [80,  220],
    quickFix:     [20,   55],
    qfDiscovery:  0.20,
    resaleImpact: -0.05,
  },
  {
    id: 'door_rear_right_scratched',
    category: 'body',
    severity: 'minor',
    detectionTier: 1,
    occurrence: { poor: 0.45, fair: 0.25, good: 0.08 },
    properRepair: [100, 260],
    quickFix:     [25,   60],
    qfDiscovery:  0.18,
    resaleImpact: -0.05,
  },
  {
    id: 'door_rear_left_scratched',
    category: 'body',
    severity: 'minor',
    detectionTier: 1,
    occurrence: { poor: 0.45, fair: 0.25, good: 0.08 },
    properRepair: [100, 260],
    quickFix:     [25,   60],
    qfDiscovery:  0.18,
    resaleImpact: -0.05,
  },
  {
    id: 'door_front_right_scratched',
    category: 'body',
    severity: 'minor',
    detectionTier: 1,
    occurrence: { poor: 0.42, fair: 0.22, good: 0.07 },
    properRepair: [100, 260],
    quickFix:     [25,   60],
    qfDiscovery:  0.18,
    resaleImpact: -0.05,
  },
  {
    id: 'door_front_left_scratched',
    category: 'body',
    severity: 'minor',
    detectionTier: 1,
    occurrence: { poor: 0.42, fair: 0.22, good: 0.07 },
    properRepair: [100, 260],
    quickFix:     [25,   60],
    qfDiscovery:  0.18,
    resaleImpact: -0.05,
  },

  // ── Engine ───────────────────────────────────────────────────────────────
  {
    id: 'oil_leak_minor',
    category: 'engine',
    severity: 'minor',
    detectionTier: 1,
    occurrence: { poor: 0.55, fair: 0.30, good: 0.10 },
    properRepair: [120, 320],
    quickFix:     [30,   70],
    qfDiscovery:  0.50,
    resaleImpact: -0.10,
  },
  {
    id: 'oil_leak_major',
    category: 'engine',
    severity: 'major',
    detectionTier: 2,
    occurrence: { poor: 0.30, fair: 0.15, good: 0.04 },
    properRepair: [400, 1000],
    quickFix:     [80,  180],
    qfDiscovery:  0.55,
    resaleImpact: -0.20,
  },
  {
    id: 'worn_timing_belt',
    category: 'engine',
    severity: 'major',
    detectionTier: 2,
    occurrence: { poor: 0.40, fair: 0.20, good: 0.05 },
    properRepair: [280, 650],
    quickFix:     null,
    qfDiscovery:  null,
    resaleImpact: -0.22,
  },
  {
    id: 'overheating',
    category: 'engine',
    severity: 'major',
    detectionTier: 2,
    occurrence: { poor: 0.35, fair: 0.18, good: 0.05 },
    properRepair: [200, 550],
    quickFix:     [40,  120],
    qfDiscovery:  0.60,
    resaleImpact: -0.18,
  },
  {
    id: 'starting_issues',
    category: 'engine',
    severity: 'minor',
    detectionTier: 1,
    occurrence: { poor: 0.40, fair: 0.22, good: 0.06 },
    properRepair: [180, 420],
    quickFix:     [35,   90],
    qfDiscovery:  0.40,
    resaleImpact: -0.12,
  },
  {
    id: 'low_compression',
    category: 'engine',
    severity: 'major',
    detectionTier: 3,
    occurrence: { poor: 0.25, fair: 0.12, good: 0.02 },
    properRepair: [1200, 3500],
    quickFix:     [180,  400],
    qfDiscovery:  0.75,
    resaleImpact: -0.40,
  },
  {
    id: 'turbo_wear',
    category: 'engine',
    severity: 'major',
    detectionTier: 3,
    occurrence: { poor: 0.20, fair: 0.10, good: 0.02 },  // only relevant on turbo cars
    properRepair: [900, 2200],
    quickFix:     [150, 350],
    qfDiscovery:  0.65,
    resaleImpact: -0.30,
  },
  {
    id: 'engine_cold_idle',
    category: 'engine',
    severity: 'minor',
    detectionTier: 1,
    occurrence: { poor: 0.45, fair: 0.25, good: 0.07 },
    properRepair: [100, 280],
    quickFix:     [25,   65],
    qfDiscovery:  0.35,
    resaleImpact: -0.08,
  },
  {
    id: 'engine_knocking',
    category: 'engine',
    severity: 'major',
    detectionTier: 2,
    occurrence: { poor: 0.30, fair: 0.12, good: 0.02 },
    properRepair: [800, 2200],
    quickFix:     [120, 300],
    qfDiscovery:  0.60,
    resaleImpact: -0.32,
  },
  {
    id: 'engine_misfire',
    category: 'engine',
    severity: 'major',
    detectionTier: 2,
    occurrence: { poor: 0.28, fair: 0.12, good: 0.02 },
    properRepair: [350, 950],
    quickFix:     [80,  200],
    qfDiscovery:  0.55,
    resaleImpact: -0.25,
  },
  {
    id: 'blue_smoke_exhaust',
    category: 'engine',
    severity: 'major',
    detectionTier: 1,                  // visible symptom — easy to spot
    occurrence: { poor: 0.25, fair: 0.10, good: 0.02 },
    properRepair: [600, 1800],
    quickFix:     [100, 250],
    qfDiscovery:  0.65,
    resaleImpact: -0.28,
  },
  {
    id: 'soot_exhaust',
    category: 'engine',
    severity: 'minor',
    detectionTier: 1,
    occurrence: { poor: 0.40, fair: 0.22, good: 0.06 },
    properRepair: [120, 350],
    quickFix:     [30,   80],
    qfDiscovery:  0.40,
    resaleImpact: -0.10,
  },

  // ── Transmission ─────────────────────────────────────────────────────────
  {
    id: 'slipping_gears_auto',
    category: 'transmission',
    severity: 'major',
    detectionTier: 2,
    occurrence: { poor: 0.30, fair: 0.15, good: 0.03 },
    properRepair: [600, 1500],
    quickFix:     [120,  280],
    qfDiscovery:  0.55,
    resaleImpact: -0.25,
  },
  {
    id: 'slipping_gears_manual',
    category: 'transmission',
    severity: 'major',
    detectionTier: 2,
    occurrence: { poor: 0.35, fair: 0.20, good: 0.05 },
    properRepair: [380, 900],
    quickFix:     [80,  180],
    qfDiscovery:  0.50,
    resaleImpact: -0.20,
  },
  {
    id: 'transmission_fluid_leak',
    category: 'transmission',
    severity: 'minor',
    detectionTier: 1,
    occurrence: { poor: 0.40, fair: 0.25, good: 0.08 },
    properRepair: [100, 280],
    quickFix:     [30,   70],
    qfDiscovery:  0.45,
    resaleImpact: -0.10,
  },
  {
    id: 'clutch_wear',
    category: 'transmission',
    severity: 'major',
    detectionTier: 2,
    occurrence: { poor: 0.45, fair: 0.28, good: 0.08 },
    properRepair: [420, 950],
    quickFix:     null,
    qfDiscovery:  null,
    resaleImpact: -0.20,
  },
  {
    id: 'gearbox_bearing_wear',
    category: 'transmission',
    severity: 'major',
    detectionTier: 3,
    occurrence: { poor: 0.25, fair: 0.12, good: 0.02 },
    properRepair: [700, 2000],
    quickFix:     [120,  300],
    qfDiscovery:  0.60,
    resaleImpact: -0.28,
  },

  // ── Suspension ───────────────────────────────────────────────────────────
  {
    id: 'worn_shocks',
    category: 'suspension',
    severity: 'minor',
    detectionTier: 1,
    occurrence: { poor: 0.60, fair: 0.35, good: 0.10 },
    properRepair: [200, 500],
    quickFix:     [40,  100],
    qfDiscovery:  0.35,
    resaleImpact: -0.10,
  },
  {
    id: 'loose_ball_joints',
    category: 'suspension',
    severity: 'major',
    detectionTier: 2,
    occurrence: { poor: 0.40, fair: 0.22, good: 0.06 },
    properRepair: [150, 400],
    quickFix:     [30,   80],
    qfDiscovery:  0.50,
    resaleImpact: -0.14,
  },
  {
    id: 'alignment_issues',
    category: 'suspension',
    severity: 'minor',
    detectionTier: 1,
    occurrence: { poor: 0.50, fair: 0.30, good: 0.10 },
    properRepair: [60,  130],
    quickFix:     [15,   40],
    qfDiscovery:  0.20,
    resaleImpact: -0.05,
  },
  {
    id: 'worn_bushings',
    category: 'suspension',
    severity: 'minor',
    detectionTier: 2,
    occurrence: { poor: 0.45, fair: 0.25, good: 0.08 },
    properRepair: [220, 550],
    quickFix:     [50,  120],
    qfDiscovery:  0.45,
    resaleImpact: -0.12,
  },
  {
    id: 'damaged_subframe',
    category: 'suspension',
    severity: 'major',
    detectionTier: 3,
    occurrence: { poor: 0.15, fair: 0.08, good: 0.01 },
    properRepair: [900, 2500],
    quickFix:     null,
    qfDiscovery:  null,
    resaleImpact: -0.35,
  },

  // ── Interior ─────────────────────────────────────────────────────────────
  {
    id: 'torn_upholstery',
    category: 'interior',
    severity: 'minor',
    detectionTier: 1,
    occurrence: { poor: 0.60, fair: 0.35, good: 0.10 },
    properRepair: [150, 450],
    quickFix:     [35,   90],
    qfDiscovery:  0.25,
    resaleImpact: -0.08,
  },
  {
    id: 'broken_electronics',
    category: 'interior',
    severity: 'minor',
    detectionTier: 1,
    occurrence: { poor: 0.50, fair: 0.28, good: 0.08 },
    properRepair: [120, 380],
    quickFix:     [25,   70],
    qfDiscovery:  0.35,
    resaleImpact: -0.10,
  },
  {
    id: 'faulty_ac_compressor',
    category: 'interior',
    severity: 'major',
    detectionTier: 2,
    occurrence: { poor: 0.35, fair: 0.20, good: 0.05 },
    properRepair: [380, 950],
    quickFix:     [70,  180],
    qfDiscovery:  0.55,
    resaleImpact: -0.15,
  },
  {
    id: 'ac_regas',
    category: 'interior',
    severity: 'minor',
    detectionTier: 2,
    occurrence: { poor: 0.45, fair: 0.30, good: 0.10 },
    properRepair: [80,  220],
    quickFix:     [20,   55],
    qfDiscovery:  0.40,
    resaleImpact: -0.08,
  },
  {
    id: 'odometer_rollback',
    category: 'interior',
    severity: 'major',
    detectionTier: 3,
    occurrence: { poor: 0.10, fair: 0.05, good: 0.02 },
    properRepair: null,         // information event, not repairable
    quickFix:     null,
    qfDiscovery:  null,
    resaleImpact: -0.50,
    isOdometerFraud: true,
  },
  {
    id: 'water_damage',
    category: 'interior',
    severity: 'major',
    detectionTier: 2,
    occurrence: { poor: 0.20, fair: 0.08, good: 0.02 },
    properRepair: [550, 1500],
    quickFix:     [110,  280],
    qfDiscovery:  0.65,
    resaleImpact: -0.30,
  },

  // ── Electrical ───────────────────────────────────────────────────────────
  {
    id: 'dead_battery',
    category: 'electrical',
    severity: 'minor',
    detectionTier: 1,
    occurrence: { poor: 0.55, fair: 0.40, good: 0.15 },
    properRepair: [80,  180],
    quickFix:     [15,   40],
    qfDiscovery:  0.15,
    resaleImpact: -0.05,
  },
  {
    id: 'faulty_alternator',
    category: 'electrical',
    severity: 'major',
    detectionTier: 2,
    occurrence: { poor: 0.30, fair: 0.18, good: 0.05 },
    properRepair: [220, 550],
    quickFix:     [45,  110],
    qfDiscovery:  0.50,
    resaleImpact: -0.12,
  },
  {
    id: 'abs_esp_fault',
    category: 'electrical',
    severity: 'minor',
    detectionTier: 2,
    occurrence: { poor: 0.35, fair: 0.20, good: 0.06 },
    properRepair: [140, 350],
    quickFix:     [30,   80],
    qfDiscovery:  0.45,
    resaleImpact: -0.12,
  },
  {
    id: 'wiring_harness_damage',
    category: 'electrical',
    severity: 'major',
    detectionTier: 3,
    occurrence: { poor: 0.20, fair: 0.10, good: 0.02 },
    properRepair: [450, 1200],
    quickFix:     [90,   220],
    qfDiscovery:  0.55,
    resaleImpact: -0.20,
  },
  {
    id: 'airbag_fault',
    category: 'electrical',
    severity: 'major',
    detectionTier: 2,
    occurrence: { poor: 0.25, fair: 0.12, good: 0.03 },
    properRepair: [160, 420],
    quickFix:     [35,  100],
    qfDiscovery:  0.60,
    resaleImpact: -0.18,
  },
];

// ─── Defect labels (Russian) ──────────────────────────────────────────────────

export const DEFECT_LABELS = {
  // Body
  surface_rust:               'Поверхностная ржавчина',
  structural_rust:            'Сквозная ржавчина кузова',
  dent_minor:                 'Небольшая вмятина',
  dent_major:                 'Серьёзная вмятина',
  cracked_windscreen:         'Трещина на лобовом стекле',
  cracked_glass:              'Трещина на стекле',
  paint_damage:               'Повреждение лакокрасочного покрытия',
  panel_gap:                  'Неравномерные зазоры панелей',
  accident_history:           'История ДТП',
  fender_dented:              'Вмятина на крыле',
  bumper_scratched:           'Царапины на бампере',
  door_rear_right_scratched:  'Царапины на задней правой двери',
  door_rear_left_scratched:   'Царапины на задней левой двери',
  door_front_right_scratched: 'Царапины на передней правой двери',
  door_front_left_scratched:  'Царапины на передней левой двери',

  // Engine
  oil_leak_minor:   'Небольшой подтёк масла',
  oil_leak_major:   'Серьёзная утечка масла',
  worn_timing_belt: 'Износ ремня ГРМ',
  overheating:      'Перегрев двигателя',
  starting_issues:  'Проблемы с запуском',
  low_compression:  'Низкая компрессия',
  turbo_wear:       'Износ турбины',
  engine_cold_idle: 'Нестабильный холодный пуск',
  engine_knocking:  'Стук двигателя',
  engine_misfire:   'Пропуски зажигания',
  blue_smoke_exhaust: 'Синий дым из выхлопа',
  soot_exhaust:     'Сажа в выхлопе',

  // Transmission
  slipping_gears_auto:    'Пробуксовка АКПП',
  slipping_gears_manual:  'Пробуксовка МКПП',
  transmission_fluid_leak: 'Утечка жидкости КПП',
  clutch_wear:            'Износ сцепления',
  gearbox_bearing_wear:   'Износ подшипников КПП',

  // Suspension
  worn_shocks:       'Износ амортизаторов',
  loose_ball_joints: 'Люфт шаровых опор',
  alignment_issues:  'Нарушение развал-схождения',
  worn_bushings:     'Износ сайлентблоков',
  damaged_subframe:  'Повреждение подрамника',

  // Interior
  torn_upholstery:      'Порванная обивка',
  broken_electronics:   'Неисправная электроника салона',
  faulty_ac_compressor: 'Неисправность компрессора кондиционера',
  ac_regas:             'Требуется заправка кондиционера',
  odometer_rollback:    'Скрутка пробега',
  water_damage:         'Следы залива водой',

  // Electrical
  dead_battery:         'Разряженный аккумулятор',
  faulty_alternator:    'Неисправность генератора',
  abs_esp_fault:        'Ошибка ABS/ESP',
  wiring_harness_damage: 'Повреждение проводки',
  airbag_fault:         'Ошибка подушек безопасности',
};

/**
 * Append a `label` field to a defect object (or array of defect objects).
 * Safe to call on any shape — unknown defect_type gets a fallback label.
 *
 * @param {object|object[]} defect
 * @returns {object|object[]}
 */
export function labelDefect(defect) {
  if (Array.isArray(defect)) return defect.map(labelDefect);
  return { ...defect, label: DEFECT_LABELS[defect.defect_type] ?? defect.defect_type };
}

// Max 2 defects per category (GMS §6.8)
const MAX_DEFECTS_PER_CATEGORY = 2;

// Defect count ranges per quality tier (GMS §6.8)
const DEFECT_COUNT_BY_QUALITY = {
  bad:       { min: 3, max: 6 },
  below_avg: { min: 2, max: 4 },
  fair:      { min: 1, max: 3 },
  good:      { min: 1, max: 2 },
  bargain:   { min: 1, max: 2 },
  bargain_trap: { min: 2, max: 4 },  // includes 1 Tier-3 guaranteed
};

function randInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

/**
 * Scale repair cost ranges by car market value.
 * Cheap beaters stay affordable; expensive cars remain challenging at any player level.
 * Uses log-scale brackets so the curve feels natural, not exponential.
 */
function carValueMultiplier(marketValue) {
  if (marketValue < 2000)  return 0.60;
  if (marketValue < 5000)  return 0.85;
  if (marketValue < 12000) return 1.00;
  if (marketValue < 25000) return 1.35;
  if (marketValue < 50000) return 1.75;
  return 2.20;
}

function rollCost([min, max], multiplier = 1.0) {
  return Math.round(randInt(min, max) * multiplier);
}

/**
 * Roll repair time in fractional in-game days based on severity.
 * Mapped to GMS §8.2 "Proper Repair" base times.
 */
function repairTimeMinutes(severity, quickFix) {
  // Base times in in-game days; 1 in-game day = 120 real minutes
  const INGAME_DAY = 120;
  const baseDays = {
    minor:    quickFix ? 0     : 0.5,
    major:    quickFix ? 1     : 3,
  };
  return Math.ceil((baseDays[severity] || 1) * INGAME_DAY);
}

/**
 * Roll the full defect set for a car.
 * Writes rows to the defects table (all hidden). Returns nothing useful to callers.
 *
 * @param {string} carId
 * @param {'poor'|'fair'|'good'} conditionTier
 * @param {'bad'|'below_avg'|'fair'|'good'|'bargain'|'bargain_trap'} qualityTier
 * @param {object} [opts]
 * @param {object} [opts.sqlClient] - optional postgres transaction client
 * @param {number} [opts.marketValue] - car market value in BYN; scales repair costs
 * @returns {Promise<void>}
 */
export async function rollDefects(carId, conditionTier, qualityTier, opts = {}) {
  const client = opts.sqlClient || sql;
  const multiplier = carValueMultiplier(opts.marketValue ?? 5000);

  const counts = DEFECT_COUNT_BY_QUALITY[qualityTier] || DEFECT_COUNT_BY_QUALITY.fair;
  const maxCount = randInt(counts.min, counts.max);

  // Roll each defect independently
  const rolled = [];
  for (const def of DEFECT_DEFS) {
    const prob = def.occurrence[conditionTier] ?? 0;
    if (Math.random() < prob) {
      rolled.push(def);
    }
  }

  // For bargain_trap: guarantee at least one Tier-3 defect
  if (qualityTier === 'bargain_trap') {
    const hasTier3 = rolled.some(d => d.detectionTier === 3);
    if (!hasTier3) {
      const tier3Defs = DEFECT_DEFS.filter(d => d.detectionTier === 3);
      const pick = tier3Defs[Math.floor(Math.random() * tier3Defs.length)];
      if (pick && !rolled.find(d => d.id === pick.id)) {
        rolled.push(pick);
      }
    }
  }

  // Sort by severity (major first) so we keep the worst when trimming
  const severityOrder = { major: 0, minor: 1 };
  rolled.sort((a, b) => (severityOrder[a.severity] ?? 2) - (severityOrder[b.severity] ?? 2));

  // Apply category cap (max 2 per category)
  const catCount = {};
  const capped = [];
  for (const def of rolled) {
    catCount[def.category] = (catCount[def.category] || 0);
    if (catCount[def.category] < MAX_DEFECTS_PER_CATEGORY) {
      capped.push(def);
      catCount[def.category]++;
    }
  }

  // Trim to quality tier max count
  const final = capped.slice(0, maxCount);

  if (final.length === 0) return;

  // Build insert rows
  const rows = final.map(def => ({
    car_id: carId,
    defect_type: def.id,
    category: def.category,
    severity: def.severity,
    detection_tier: def.detectionTier,
    is_revealed_to_player: false,
    is_quick_fixed: false,
    proper_repair_cost: def.properRepair ? rollCost(def.properRepair, multiplier) : null,
    quick_fix_cost: def.quickFix ? rollCost(def.quickFix, multiplier) : null,
    qf_discovery_base: def.qfDiscovery ?? null,
    resale_impact: def.resaleImpact,
    repair_time_minutes: repairTimeMinutes(def.severity, false),
    is_odometer_fraud: def.isOdometerFraud ?? false,
  }));

  await client`INSERT INTO defects ${client(rows)}`;
}

/**
 * Compute the total resale impact of all hidden (not-yet-repaired) defects on a car.
 * Used when calculating market value in listingGenerator.
 * Returns a multiplier e.g. 0.75 means 25% reduction.
 *
 * @param {string} carId
 * @returns {Promise<number>}
 */
export async function computeDefectResaleMultiplier(carId) {
  const defects = await sql`
    SELECT resale_impact FROM defects
    WHERE car_id = ${carId}
      AND is_quick_fixed = false
  `;

  let total = 0;
  for (const d of defects) {
    total += d.resale_impact;
  }
  return 1 + total; // e.g. -0.30 total → 0.70 multiplier
}
