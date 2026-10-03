-- Migration: 016_inspections_category
-- Adds optional category column to post-purchase inspections,
-- mirroring pre_purchase_inspections. Allows the same action_id to be
-- used multiple times on a car, once per category.

ALTER TABLE inspections
  ADD COLUMN IF NOT EXISTS category VARCHAR(32) NULL;

-- Widen the unique constraint to (car_id, action_id, category)
ALTER TABLE inspections
  DROP CONSTRAINT IF EXISTS inspections_car_id_action_key;

ALTER TABLE inspections
  ADD CONSTRAINT inspections_car_id_action_category_key
  UNIQUE (car_id, action_id, category);
