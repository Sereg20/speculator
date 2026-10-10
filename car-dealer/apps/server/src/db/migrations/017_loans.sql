-- Migration 017: Loan system
-- Adds loan tracking columns to players and new transaction types.

ALTER TABLE players
  ADD COLUMN IF NOT EXISTS loan_principal        INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS loan_remaining         INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS loan_daily_instalment  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS loan_tier              VARCHAR(16) NULL,
  ADD COLUMN IF NOT EXISTS loan_started_at        TIMESTAMPTZ NULL;

ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'loan_taken';
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'loan_repayment';
