/**
 * Defect type definitions — public identifiers only.
 * Occurrence probabilities, detection tiers, and repair costs live
 * in apps/server/src/services/defectEngine.js (never sent to client).
 */
export const DEFECT_TYPES = {
  // Body
  SURFACE_RUST:        { id: 'surface_rust',        category: 'body',         severity: 'minor' },
  STRUCTURAL_RUST:     { id: 'structural_rust',      category: 'body',         severity: 'major' },
  DENT_MINOR:          { id: 'dent_minor',           category: 'body',         severity: 'minor' },
  DENT_MAJOR:          { id: 'dent_major',           category: 'body',         severity: 'moderate' },
  CRACKED_GLASS:       { id: 'cracked_glass',        category: 'body',         severity: 'minor' },
  PAINT_DAMAGE:        { id: 'paint_damage',         category: 'body',         severity: 'minor' },
  PANEL_GAP:           { id: 'panel_gap',            category: 'body',         severity: 'minor' },
  ACCIDENT_HISTORY:    { id: 'accident_history',     category: 'body',         severity: 'major' },

  // Engine
  OIL_LEAK:            { id: 'oil_leak',             category: 'engine',       severity: 'moderate' },
  COOLANT_LEAK:        { id: 'coolant_leak',         category: 'engine',       severity: 'moderate' },
  WORN_BELTS:          { id: 'worn_belts',           category: 'engine',       severity: 'moderate' },
  LOW_COMPRESSION:     { id: 'low_compression',      category: 'engine',       severity: 'major' },
  OVERHEATING:         { id: 'overheating',          category: 'engine',       severity: 'major' },
  STARTING_ISSUES:     { id: 'starting_issues',      category: 'engine',       severity: 'moderate' },
  SMOKE_EXHAUST:       { id: 'smoke_exhaust',        category: 'engine',       severity: 'moderate' },

  // Transmission
  SLIPPING_GEARS:      { id: 'slipping_gears',       category: 'transmission', severity: 'major' },
  FLUID_LEAK_GEARBOX:  { id: 'fluid_leak_gearbox',  category: 'transmission', severity: 'moderate' },
  CLUTCH_WEAR:         { id: 'clutch_wear',          category: 'transmission', severity: 'moderate' },
  ROUGH_SHIFTING:      { id: 'rough_shifting',       category: 'transmission', severity: 'minor' },
  DIFF_NOISE:          { id: 'diff_noise',           category: 'transmission', severity: 'moderate' },

  // Suspension
  WORN_SHOCKS:         { id: 'worn_shocks',          category: 'suspension',   severity: 'moderate' },
  WORN_BALL_JOINTS:    { id: 'worn_ball_joints',     category: 'suspension',   severity: 'moderate' },
  ALIGNMENT_ISSUES:    { id: 'alignment_issues',     category: 'suspension',   severity: 'minor' },
  WORN_BUSHINGS:       { id: 'worn_bushings',        category: 'suspension',   severity: 'minor' },
  BENT_SUBFRAME:       { id: 'bent_subframe',        category: 'suspension',   severity: 'major' },

  // Interior
  BROKEN_ELECTRONICS:  { id: 'broken_electronics',  category: 'interior',     severity: 'minor' },
  TORN_UPHOLSTERY:     { id: 'torn_upholstery',     category: 'interior',     severity: 'minor' },
  FAULTY_AC:           { id: 'faulty_ac',            category: 'interior',     severity: 'moderate' },
  ODOR_PROBLEM:        { id: 'odor_problem',         category: 'interior',     severity: 'minor' },
  DASHBOARD_LIGHTS:    { id: 'dashboard_lights',    category: 'interior',     severity: 'minor' },

  // Electrics
  DEAD_BATTERY:        { id: 'dead_battery',         category: 'electrics',    severity: 'minor' },
  FAULTY_ALTERNATOR:   { id: 'faulty_alternator',   category: 'electrics',    severity: 'moderate' },
  WIRING_ISSUES:       { id: 'wiring_issues',        category: 'electrics',    severity: 'moderate' },
  FAULTY_SENSORS:      { id: 'faulty_sensors',       category: 'electrics',    severity: 'minor' },
  ABS_FAULT:           { id: 'abs_fault',            category: 'electrics',    severity: 'moderate' },
  AIRBAG_FAULT:        { id: 'airbag_fault',         category: 'electrics',    severity: 'major' },
};
