-- Migration: 009_pre_purchase_inspect
-- Adds pre-purchase inspection tracking.
-- Pre-purchase inspections are performed on market cars (state = 'available_in_market')
-- before the player commits to buying. They are intentionally stored in a SEPARATE table
-- from post-purchase `inspections` so that:
--   1. Buying a car does NOT prevent re-inspection in the garage (different uniqueness scope)
--   2. The garage inspection tier runs independently at higher accuracy
--   3. Defects revealed pre-purchase stay is_revealed_to_player=true after purchase (by design)

CREATE TABLE IF NOT EXISTS pre_purchase_inspections (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id         UUID NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  player_id      UUID NOT NULL REFERENCES players(id),
  tier           VARCHAR(16) NOT NULL,   -- 'visual' | 'tap_test' | 'obd' | 'full'
  revealed_count SMALLINT NOT NULL DEFAULT 0,
  energy_cost    SMALLINT NOT NULL,
  performed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- One pre-purchase inspection per tier per player per car
  UNIQUE (car_id, player_id, tier)
);

CREATE INDEX IF NOT EXISTS pre_purchase_inspections_car_player
  ON pre_purchase_inspections(car_id, player_id);

-- New AI dialogue context types for pre-purchase interaction
ALTER TYPE context_type ADD VALUE IF NOT EXISTS 'seller_chat_hint';
ALTER TYPE context_type ADD VALUE IF NOT EXISTS 'seller_negotiate_reject';
