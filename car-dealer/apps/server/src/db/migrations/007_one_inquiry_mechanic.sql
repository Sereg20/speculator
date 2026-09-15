-- Migration 007: one-inquiry-at-a-time mechanic
-- Adds next_inquiry_allowed_at to listings so a new buyer can only
-- appear after the cooldown following a rejected inquiry.

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS next_inquiry_allowed_at TIMESTAMPTZ;

COMMENT ON COLUMN listings.next_inquiry_allowed_at IS
  'Earliest time a new buyer inquiry may be generated for this listing. '
  'NULL means immediately eligible. Set to NOW() + 1 in-game day on inquiry rejection.';
