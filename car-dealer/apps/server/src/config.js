import 'dotenv/config';

// ─── Server ──────────────────────────────────────────────────────────────────
export const PORT = Number(process.env.PORT) || 3000;
export const NODE_ENV = process.env.NODE_ENV || 'development';
export const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

// ─── Database / Cache ────────────────────────────────────────────────────────
export const DATABASE_URL = process.env.DATABASE_URL;
// export const REDIS_URL = process.env.REDIS_URL;

// ─── Auth ────────────────────────────────────────────────────────────────────
export const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';

// ─── AI ──────────────────────────────────────────────────────────────────────
export const GEMINI_API_KEYS = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
].filter(Boolean);
export const AI_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS) || 3000;

// ─── Time ────────────────────────────────────────────────────────────────────
/** How many real-world minutes = 1 in-game day */
export const INGAME_DAY_REAL_MINUTES = Number(process.env.INGAME_DAY_REAL_MINUTES) || 120;

// ─── GMS Appendix A — Game constants ─────────────────────────────────────────
// All monetary values in whole BYN (Belarusian Rubles). No kopecks.

// Economy
export const STARTING_MONEY = 2000;          // BYN (GMS §10.1)
export const CASH_STRESS_ENTRY = 400;        // BYN — stress activates below this
export const CASH_STRESS_EXIT = 900;         // BYN — stress clears above this (hysteresis)
export const LISTING_REFRESH_MANUAL_COST = 80; // BYN

// Garage (weekly rent in BYN per tier 1–5)
export const GARAGE_WEEKLY_RENT = [0, 200, 450, 850, 1400, 2800];
// Holding cost per unsold car per in-game day (early/mid/late stage)
export const HOLDING_COST_EARLY = 12;   // BYN/day
export const HOLDING_COST_MID   = 25;   // BYN/day
export const HOLDING_COST_LATE  = 40;   // BYN/day

// Garage upgrade costs (BYN, index = target tier)
export const GARAGE_UPGRADE_COST = [0, 0, 900, 2200, 5500, 14000];
export const GARAGE_UPGRADE_LEVEL_REQUIRED = [0, 1, 3, 6, 10, 15];

// Energy (GMS §1.3)
export const ENERGY_MAX_EARLY = 20;   // levels 1–7
export const ENERGY_MAX_MID   = 25;   // levels 8–14
export const ENERGY_MAX_LATE  = 30;   // levels 15+
export const ENERGY_REGEN_REAL_MINUTES = 12; // 1 energy per 12 real minutes

// Reputation thresholds (GMS §1.4)
export const REPUTATION_TIERS = [
  { name: 'Новичок',     min: 0,   max: 29  },
  { name: 'Знакомый',    min: 30,  max: 69  },
  { name: 'Надёжный',    min: 70,  max: 119 },
  { name: 'Авторитет',   min: 120, max: 159 },
  { name: 'Легенда',     min: 160, max: 200 },
];

// XP thresholds per level (GMS §1.1) — index = level, value = total XP needed
export const LEVEL_XP_THRESHOLDS = [
  0,      // level 1 (start)
  400,    // level 2
  900,    // level 3
  1600,   // level 4
  2500,   // level 5
  3600,   // level 6
  5000,   // level 7
  6800,   // level 8
  9000,   // level 9
  11800,  // level 10
  15000,  // level 11
  18800,  // level 12
  23200,  // level 13
  28200,  // level 14
  34000,  // level 15
  40600,  // level 16
  48200,  // level 17
  56800,  // level 18
  66400,  // level 19
  77200,  // level 20
];

// Market listings per refresh (GMS §4)
export const MARKET_LISTINGS_PER_REFRESH = 8;
export const MARKET_LISTING_DISTRIBUTION = {
  bad:       2,  // overpriced or wrecked
  below_avg: 2,  // fair car but below-avg deal
  fair:      2,  // fair price, fair car
  good:      1,  // good deal
  bargain:   1,  // genuine bargain
};

// Negotiation base success probability (GMS §5)
export const NEGOTIATION_BASE_SUCCESS = 0.25;

// Repair value restoration (GMS §8.4)
export const PROPER_REPAIR_VALUE_RESTORE = 1.0;   // 100%
export const QUICK_FIX_VALUE_RESTORE = 0.4;       // 40%

// Ad reward rate limiting
export const AD_GRANT_COOLDOWN_HOURS = 4;
