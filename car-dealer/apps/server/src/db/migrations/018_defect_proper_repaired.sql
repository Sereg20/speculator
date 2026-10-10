-- Migration 018: Mark properly repaired defects
-- Proper repair makes a defect disappear from the car.
-- is_quick_fixed = false was previously ambiguous (means both "never touched" and
-- "properly repaired"). This column resolves the ambiguity cleanly.

ALTER TABLE defects
  ADD COLUMN IF NOT EXISTS is_properly_repaired BOOLEAN NOT NULL DEFAULT false;
