-- Phase 7: add is_direct_buy flag to buyer_inquiries
-- When true, the buyer is offering the asking price and expects no negotiation.
-- The player still explicitly accepts; this is purely informational.

ALTER TABLE buyer_inquiries
  ADD COLUMN IF NOT EXISTS is_direct_buy BOOLEAN NOT NULL DEFAULT FALSE;
