-- Migration: 002_phase2_columns
-- Adds columns needed for Phase 2: market listings, defect engine, purchase flow.
-- All changes are additive (no column drops).

-- ── players: fix starting reputation (GMS §10.1: start at 50) ────────────────
ALTER TABLE players
  ALTER COLUMN reputation_score SET DEFAULT 50;

-- ── cars: quality tier and market value ──────────────────────────────────────
-- quality_tier: the listing quality bucket (bad / below_avg / fair / good / bargain / bargain_trap)
ALTER TABLE cars
  ADD COLUMN IF NOT EXISTS quality_tier  VARCHAR(16) NOT NULL DEFAULT 'fair',
  ADD COLUMN IF NOT EXISTS market_value  INTEGER     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_turbo      BOOLEAN     NOT NULL DEFAULT FALSE;

-- ── defects: engine columns needed by defectEngine.js ────────────────────────
-- detection_tier: 1/2/3 (GMS §6.1)
-- qf_discovery_base: base quick-fix discovery probability (0.0–1.0), null = N/A
-- resale_impact: fractional impact e.g. -0.12 (stored as NUMERIC for precision)
-- is_odometer_fraud: special flag for odometer rollback (not a repairable defect)
ALTER TABLE defects
  ADD COLUMN IF NOT EXISTS detection_tier      SMALLINT  NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS qf_discovery_base   NUMERIC(5,4),
  ADD COLUMN IF NOT EXISTS resale_impact       NUMERIC(5,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_odometer_fraud   BOOLEAN   NOT NULL DEFAULT FALSE;

-- Allow null proper_repair_cost and quick_fix_cost (some defects have no QF option)
ALTER TABLE defects
  ALTER COLUMN proper_repair_cost DROP NOT NULL,
  ALTER COLUMN quick_fix_cost     DROP NOT NULL;

-- ── cars: index for market refresh queries ────────────────────────────────────
CREATE INDEX IF NOT EXISTS cars_market_listings
  ON cars(player_id, state, market_listing_expires_at)
  WHERE state = 'available_in_market';
