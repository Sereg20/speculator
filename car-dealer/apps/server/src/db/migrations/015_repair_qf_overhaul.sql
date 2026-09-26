-- Migration 015: Repair QF overhaul
-- Adds per-defect quick-fix success probability and quick-fix failed flag on jobs.

-- qf_success_base: base probability (0.0–1.0) that a quick fix succeeds.
-- Rolled at defect creation time alongside repair costs.
ALTER TABLE defects
  ADD COLUMN IF NOT EXISTS qf_success_base NUMERIC(4,2);

-- qf_failed: true when a quick fix job completed but the fix did not hold.
-- Defect remains unfixed; player is notified and can retry or do proper repair.
ALTER TABLE repair_jobs
  ADD COLUMN IF NOT EXISTS qf_failed BOOLEAN NOT NULL DEFAULT false;
