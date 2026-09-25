-- Migration: 014_listings_partial_unique
-- Replace the unconditional UNIQUE (car_id) constraint on listings with a
-- partial unique index that only enforces uniqueness for active listings.
-- This allows the same car to be re-listed after a previous listing expires or is sold.

ALTER TABLE listings DROP CONSTRAINT IF EXISTS listings_car_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS listings_car_id_active_unique
  ON listings (car_id)
  WHERE status = 'active';
