-- Migration: 004_inspections_log
-- Tracks which inspection tiers have been performed per car.
-- Used to enforce "XP once per car per tier" and to show inspection history.

CREATE TABLE inspections (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id       UUID NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  player_id    UUID NOT NULL REFERENCES players(id),
  tier         VARCHAR(16) NOT NULL,  -- 'visual' | 'tap_test' | 'obd' | 'full'
  revealed_count SMALLINT NOT NULL DEFAULT 0,
  energy_cost  SMALLINT NOT NULL,
  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Enforce once-per-tier-per-car: player can only do each tier once on a car
  UNIQUE (car_id, tier)
);

CREATE INDEX inspections_car_id ON inspections(car_id);
CREATE INDEX inspections_player_id ON inspections(player_id, performed_at DESC);
