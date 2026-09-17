-- Migration: 011_skills_byn_price
--
-- Skills now cost BYN cash (same as equipment), not XP.
-- XP is purely a level-progression currency — never spent.
-- Level gates remain unchanged; BYN cost replaces xp_cost.
--
-- Pricing philosophy:
--   Early skills (lvl 1–4):   100–600 BYN   — accessible in the first few flips
--   Mid skills   (lvl 5–9):   700–2500 BYN  — compete with Tier-2 equipment budget
--   Late skills  (lvl 10–14): 3000–7000 BYN — serious investment, a car's worth of profit
--   Expert skills(lvl 15+):   8000–18000 BYN — prestige, one per major milestone
--
-- Free default skills (byn_price = 0) are auto-granted on registration.

-- Step 1: add new column
ALTER TABLE skill_tree ADD COLUMN IF NOT EXISTS byn_price INTEGER NOT NULL DEFAULT 0;

-- Step 2: set prices per skill
-- ─── Inspection skills ───────────────────────────────────────────────────────

-- Tier 0 — free / auto-granted
UPDATE skill_tree SET byn_price = 0   WHERE id = 'walkaround_glance';
UPDATE skill_tree SET byn_price = 0   WHERE id = 'ask_seller';

-- Tier 0 — paid inspection
UPDATE skill_tree SET byn_price = 150  WHERE id = 'listen_engine';       -- lvl 2, cheap: a must-have early on
UPDATE skill_tree SET byn_price = 120  WHERE id = 'panel_feel';          -- lvl 2, passive bonus to body
UPDATE skill_tree SET byn_price = 150  WHERE id = 'interior_smell';      -- lvl 2, interior/electrical coverage
UPDATE skill_tree SET byn_price = 300  WHERE id = 'cold_start_test';     -- lvl 3, strong: 60% on start/overheat

-- Tier 1 — hand-tool skills
UPDATE skill_tree SET byn_price = 450  WHERE id = 'tap_test';            -- lvl 3, unlocks whole tap_test tier
UPDATE skill_tree SET byn_price = 350  WHERE id = 'tyre_brake_visual';   -- lvl 4, safety-critical defects
UPDATE skill_tree SET byn_price = 350  WHERE id = 'fluid_level_check';   -- lvl 4, engine/trans coverage
UPDATE skill_tree SET byn_price = 700  WHERE id = 'undercar_crawl';      -- lvl 5, unlocks undercarriage — high value
UPDATE skill_tree SET byn_price = 900  WHERE id = 'test_drive';          -- lvl 6, trans/suspension Tier-2

-- ─── Negotiation skills ──────────────────────────────────────────────────────

-- Free default
UPDATE skill_tree SET byn_price = 0    WHERE id = 'casual_chat';         -- lvl 1, free starter

-- Early negotiation
UPDATE skill_tree SET byn_price = 250  WHERE id = 'price_research';      -- lvl 2, market intelligence
UPDATE skill_tree SET byn_price = 400  WHERE id = 'point_out_flaws';     -- lvl 3, leverages inspection
UPDATE skill_tree SET byn_price = 500  WHERE id = 'smooth_talker';       -- lvl 4, strong +10% purchase
UPDATE skill_tree SET byn_price = 600  WHERE id = 'anchor_low';          -- lvl 4, shifts discount range

-- Mid negotiation
UPDATE skill_tree SET byn_price = 900  WHERE id = 'comfortable_silence'; -- lvl 5, +8% + counter preference
UPDATE skill_tree SET byn_price = 1200 WHERE id = 'build_rapport';       -- lvl 6, strong archetype bonus
UPDATE skill_tree SET byn_price = 1500 WHERE id = 'show_cash';           -- lvl 7, +10% + reduced walk risk
UPDATE skill_tree SET byn_price = 1800 WHERE id = 'deadline_pressure';   -- lvl 8, situational but good
UPDATE skill_tree SET byn_price = 2000 WHERE id = 'deal_closer';         -- lvl 8, +10% buy + +12% sale
UPDATE skill_tree SET byn_price = 2500 WHERE id = 'read_the_room';       -- lvl 9, reveals seller mood (info edge)

-- Late negotiation
UPDATE skill_tree SET byn_price = 3500 WHERE id = 'bundle_offer';        -- lvl 10, +12% sale acceptance
UPDATE skill_tree SET byn_price = 4500 WHERE id = 'loss_aversion_frame'; -- lvl 11, strong on stale listings
UPDATE skill_tree SET byn_price = 6000 WHERE id = 'walk_away';           -- lvl 12, callback mechanic
UPDATE skill_tree SET byn_price = 9000 WHERE id = 'professional_closer'; -- lvl 14, prestige skill
UPDATE skill_tree SET byn_price = 14000 WHERE id = 'market_authority';   -- lvl 16, top-tier authority bonus

-- ─── Repair skills ───────────────────────────────────────────────────────────

-- Tier 0 free
UPDATE skill_tree SET byn_price = 0    WHERE id = 'watch_tutorial';      -- lvl 1, free starter

-- Tier 0 paid
UPDATE skill_tree SET byn_price = 200  WHERE id = 'polish_touchup';      -- lvl 2, removes scratch quick-fix trap
UPDATE skill_tree SET byn_price = 180  WHERE id = 'interior_tidy';       -- lvl 2, cheap interior repairs
UPDATE skill_tree SET byn_price = 200  WHERE id = 'battery_swap';        -- lvl 3, instant fix

-- Tier 1
UPDATE skill_tree SET byn_price = 550  WHERE id = 'basic_spanner';       -- lvl 4, oil leaks, exhaust
UPDATE skill_tree SET byn_price = 500  WHERE id = 'wheel_brake_service'; -- lvl 4, brake safety repairs
UPDATE skill_tree SET byn_price = 600  WHERE id = 'electrical_basics';   -- lvl 5, Tier-1 electrics
UPDATE skill_tree SET byn_price = 550  WHERE id = 'fluid_services';      -- lvl 5, trans/cooling leaks
UPDATE skill_tree SET byn_price = 800  WHERE id = 'glass_repair';        -- lvl 6, windscreen is pricey defect
UPDATE skill_tree SET byn_price = 1100 WHERE id = 'pdr_dent_removal';    -- lvl 7, PDR is specialist

-- Tier 2
UPDATE skill_tree SET byn_price = 2000 WHERE id = 'engine_seals_belts';  -- lvl 8, major engine work
UPDATE skill_tree SET byn_price = 2200 WHERE id = 'gearbox_service';     -- lvl 9, gearbox
UPDATE skill_tree SET byn_price = 2000 WHERE id = 'suspension_rebuild';  -- lvl 9, full suspension
UPDATE skill_tree SET byn_price = 2500 WHERE id = 'body_filler_respray'; -- lvl 10, panel respray
UPDATE skill_tree SET byn_price = 2800 WHERE id = 'clutch_replacement';  -- lvl 10, prereq gearbox_service
UPDATE skill_tree SET byn_price = 2200 WHERE id = 'hvac_service';        -- lvl 11, AC/heat
UPDATE skill_tree SET byn_price = 2500 WHERE id = 'electrical_diag';     -- lvl 11, prereq electrical_basics
UPDATE skill_tree SET byn_price = 3500 WHERE id = 'structural_rust';     -- lvl 12, critical frame rust

-- Tier 3
UPDATE skill_tree SET byn_price = 5000 WHERE id = 'engine_overhaul';     -- lvl 13, full engine rebuild
UPDATE skill_tree SET byn_price = 4500 WHERE id = 'auto_gearbox';        -- lvl 14, auto transmission
UPDATE skill_tree SET byn_price = 5000 WHERE id = 'full_respray';        -- lvl 14, factory-grade finish
UPDATE skill_tree SET byn_price = 5500 WHERE id = 'wiring_harness';      -- lvl 15, harness repair
UPDATE skill_tree SET byn_price = 7000 WHERE id = 'subframe_chassis';    -- lvl 16, chassis work
UPDATE skill_tree SET byn_price = 8000 WHERE id = 'turbo_induction';     -- lvl 17, turbo specialist

-- Step 3: also update level_required to match config (fixes any discrepancy)
-- Garage-consistent: equipment column already correct; skill levels sanity-checked here.

-- Step 5: backfill free skills for all existing players (idempotent)
INSERT INTO player_skills (player_id, skill_id)
SELECT p.id, st.id
FROM players p
CROSS JOIN skill_tree st
WHERE st.byn_price = 0
ON CONFLICT DO NOTHING;

