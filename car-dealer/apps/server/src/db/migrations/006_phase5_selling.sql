-- Migration: 006_phase5_selling
-- Phase 5 (Selling Flow) + Phase 6 (Progression)
-- Adds: tool_upkeep transaction type, listing-related columns, buyer inquiry indices.

-- ─── Add missing transaction type values ─────────────────────────────────────
-- Note: transaction_type enum already includes most values from 001_initial.
-- We add 'tool_upkeep' which is used by holdingCost job.
DO $$
BEGIN
  -- tool_upkeep (used by holdingCost job since Phase 4)
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'tool_upkeep'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'transaction_type')
  ) THEN
    ALTER TYPE transaction_type ADD VALUE 'tool_upkeep';
  END IF;

  -- sale_commission (for future use)
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'sale_commission'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'transaction_type')
  ) THEN
    ALTER TYPE transaction_type ADD VALUE 'sale_commission';
  END IF;
END$$;

-- ─── defects: add is_odometer_fraud column if not present ────────────────────
-- (may already exist from Phase 2 migration; guard with IF NOT EXISTS)
ALTER TABLE defects
  ADD COLUMN IF NOT EXISTS is_odometer_fraud BOOLEAN NOT NULL DEFAULT FALSE;

-- ─── listings: add updated_at and days_held tracking ─────────────────────────
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS days_listed_when_sold INTEGER;

-- ─── buyer_inquiries: add updated_at and negotiation_round ──────────────────
ALTER TABLE buyer_inquiries
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE buyer_inquiries
  ADD COLUMN IF NOT EXISTS negotiation_round SMALLINT NOT NULL DEFAULT 1;

-- ─── Add updated_at trigger for listings ─────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_listings_updated_at'
  ) THEN
    CREATE TRIGGER trg_listings_updated_at
      BEFORE UPDATE ON listings FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END$$;

-- ─── Additional indices for Phase 5 queries ──────────────────────────────────
CREATE INDEX IF NOT EXISTS listings_status_expires
  ON listings(status, expires_at)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS buyer_inquiries_status
  ON buyer_inquiries(listing_id, status);

-- ─── analytics_events: useful index for event_type queries ───────────────────
CREATE INDEX IF NOT EXISTS analytics_event_type_created
  ON analytics_events(event_type, created_at DESC);
