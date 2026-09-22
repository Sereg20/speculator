-- Add seller_name to cars table for NPC seller display in UI.
-- NULL allowed for existing rows; new listings will always have a name.

ALTER TABLE cars ADD COLUMN IF NOT EXISTS seller_name VARCHAR(64);
