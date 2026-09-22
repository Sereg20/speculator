-- Migration: 013_inspection_actions
-- Replaces the fixed 4-tier inspection model with open-ended action IDs.
-- Each action (e.g. 'obd_basic', 'visual_walkaround') is unique per car.

-- Post-purchase inspections
ALTER TABLE inspections RENAME COLUMN tier TO action_id;
ALTER TABLE inspections ALTER COLUMN action_id TYPE VARCHAR(32);
ALTER TABLE inspections DROP CONSTRAINT IF EXISTS inspections_car_id_tier_key;
ALTER TABLE inspections ADD CONSTRAINT inspections_car_id_action_key UNIQUE (car_id, action_id);

-- Pre-purchase inspections
ALTER TABLE pre_purchase_inspections RENAME COLUMN tier TO action_id;
ALTER TABLE pre_purchase_inspections ALTER COLUMN action_id TYPE VARCHAR(32);
ALTER TABLE pre_purchase_inspections DROP CONSTRAINT IF EXISTS pre_purchase_inspections_car_player;
ALTER TABLE pre_purchase_inspections ADD CONSTRAINT pre_purchase_inspections_car_player_action UNIQUE (car_id, player_id, action_id);
