-- Migration: 005_transaction_type_values
-- Adds missing transaction_type enum values used by the holdingCost background job.

ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'tool_upkeep';
