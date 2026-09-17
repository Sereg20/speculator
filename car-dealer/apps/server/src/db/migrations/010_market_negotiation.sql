-- Migration: 010_market_negotiation
-- Adds comprehensive multi-round purchase negotiation for market cars.
--
-- The player can now propose a specific price (max 30% below asking).
-- The seller can accept, reject, or counter with a mid-point price.
-- Round count is tracked per car so the seller hardens on repeated attempts.

-- Track negotiation state per market listing
ALTER TABLE cars
  ADD COLUMN IF NOT EXISTS market_negotiation_round   SMALLINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS market_negotiation_floor    NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS market_last_offer           NUMERIC(10,2);

-- New AI dialogue context types for multi-outcome negotiation
ALTER TYPE context_type ADD VALUE IF NOT EXISTS 'seller_negotiate_accept';
ALTER TYPE context_type ADD VALUE IF NOT EXISTS 'seller_negotiate_counter';
