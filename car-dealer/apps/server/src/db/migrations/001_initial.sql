-- Migration: 001_initial
-- All monetary amounts stored as INTEGER (whole BYN). No kopecks.
-- Car state machine: available_in_market → purchased → in_repair → listed_for_sale → sold

-- ─── ENUMs ────────────────────────────────────────────────────────────────────
CREATE TYPE car_state AS ENUM (
  'available_in_market',
  'purchased',
  'in_repair',
  'listed_for_sale',
  'sold'
);

CREATE TYPE condition_tier AS ENUM ('poor', 'fair', 'good');

CREATE TYPE seller_archetype AS ENUM (
  'old_man',
  'private_owner',
  'shady_dealer',
  'enthusiast',
  'urgent_sale'
);

CREATE TYPE buyer_archetype AS ENUM (
  'careful_buyer',
  'bargain_hunter',
  'impulsive_buyer',
  'skeptic',
  'enthusiast'
);

CREATE TYPE repair_type AS ENUM ('proper', 'quick_fix');

CREATE TYPE defect_severity AS ENUM ('minor', 'major');

CREATE TYPE skill_type AS ENUM ('inspection', 'negotiation', 'repair');

CREATE TYPE listing_status AS ENUM ('active', 'sold', 'expired', 'cancelled');

CREATE TYPE inquiry_status AS ENUM (
  'pending',
  'negotiating',
  'accepted',
  'rejected',
  'expired'
);

CREATE TYPE context_type AS ENUM (
  'seller_intro',
  'seller_negotiation',
  'buyer_inquiry',
  'buyer_counter'
);

CREATE TYPE transaction_type AS ENUM (
  'car_purchase',
  'repair',
  'sale_revenue',
  'holding_cost',
  'rent',
  'skill_purchase',
  'equipment_purchase',
  'garage_upgrade',
  'ad_reward',
  'listing_refresh',
  'listing_extend',
  'inspection_second_chance',
  'tutorial_bonus'
);

-- ─── players ──────────────────────────────────────────────────────────────────
CREATE TABLE players (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id             VARCHAR(128) UNIQUE NOT NULL,
  email                 VARCHAR(255) UNIQUE,
  password_hash         VARCHAR(255),
  display_name          VARCHAR(64) NOT NULL DEFAULT 'Перекупщик',
  -- All BYN amounts are INTEGER (whole rubles, no kopecks)
  cash                  INTEGER NOT NULL DEFAULT 2000,
  xp                    INTEGER NOT NULL DEFAULT 0,
  level                 INTEGER NOT NULL DEFAULT 1,
  reputation_score      INTEGER NOT NULL DEFAULT 0 CHECK (reputation_score BETWEEN 0 AND 200),
  energy_current        INTEGER NOT NULL DEFAULT 20,
  energy_last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  garage_slots          INTEGER NOT NULL DEFAULT 1,
  in_game_day           INTEGER NOT NULL DEFAULT 1,
  last_day_ticked_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cash_stress_active    BOOLEAN NOT NULL DEFAULT FALSE,
  onboarding_complete   BOOLEAN NOT NULL DEFAULT FALSE,
  expo_push_token       VARCHAR(256),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── cars ─────────────────────────────────────────────────────────────────────
CREATE TABLE cars (
  id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- NULL = market listing not yet purchased
  player_id                  UUID REFERENCES players(id),
  make                       VARCHAR(64) NOT NULL,
  model                      VARCHAR(64) NOT NULL,
  year                       SMALLINT NOT NULL,
  mileage                    INTEGER NOT NULL,
  color                      VARCHAR(32) NOT NULL DEFAULT 'Неизвестно',
  condition_tier             condition_tier NOT NULL,
  state                      car_state NOT NULL DEFAULT 'available_in_market',
  purchase_price             INTEGER NOT NULL DEFAULT 0,
  asking_price               INTEGER,
  final_sale_price           INTEGER,
  market_listing_expires_at  TIMESTAMPTZ NOT NULL,
  seller_archetype           seller_archetype NOT NULL,
  -- Cached Gemini response JSON: { seller_intro, seller_negotiation }
  seller_dialogue            JSONB,
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX cars_player_id_state ON cars(player_id, state);
CREATE INDEX cars_state ON cars(state);

-- ─── defects ──────────────────────────────────────────────────────────────────
-- NEVER returned to client raw. Only is_revealed_to_player = true rows
-- are exposed via GET /cars/:id/defects
CREATE TABLE defects (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id                UUID NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  defect_type           VARCHAR(64) NOT NULL,   -- matches DEFECT_TYPES key in shared
  category              VARCHAR(32) NOT NULL,
  severity              defect_severity NOT NULL,
  is_revealed_to_player BOOLEAN NOT NULL DEFAULT FALSE,
  is_quick_fixed        BOOLEAN NOT NULL DEFAULT FALSE,
  proper_repair_cost    INTEGER NOT NULL,
  quick_fix_cost        INTEGER NOT NULL,
  repair_time_minutes   INTEGER NOT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX defects_car_id ON defects(car_id);

-- ─── repair_jobs ──────────────────────────────────────────────────────────────
CREATE TABLE repair_jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id          UUID NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  defect_id       UUID NOT NULL REFERENCES defects(id),
  repair_type     repair_type NOT NULL,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completes_at    TIMESTAMPTZ NOT NULL,
  completed       BOOLEAN NOT NULL DEFAULT FALSE,
  cost_charged    INTEGER NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX repair_jobs_car_id ON repair_jobs(car_id);
CREATE INDEX repair_jobs_pending ON repair_jobs(completed, completes_at) WHERE completed = FALSE;

-- ─── listings ─────────────────────────────────────────────────────────────────
CREATE TABLE listings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id            UUID NOT NULL UNIQUE REFERENCES cars(id),
  player_id         UUID NOT NULL REFERENCES players(id),
  asking_price      INTEGER NOT NULL,
  listed_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at        TIMESTAMPTZ NOT NULL,
  status            listing_status NOT NULL DEFAULT 'active',
  final_sale_price  INTEGER,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX listings_player_id ON listings(player_id, status);

-- ─── buyer_inquiries ──────────────────────────────────────────────────────────
CREATE TABLE buyer_inquiries (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id             UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  buyer_archetype        buyer_archetype NOT NULL,
  buyer_name             VARCHAR(64) NOT NULL,
  offered_price          INTEGER NOT NULL,
  message_text           TEXT NOT NULL DEFAULT '',
  player_counter_offer   INTEGER,
  final_agreed_price     INTEGER,
  status                 inquiry_status NOT NULL DEFAULT 'pending',
  did_inspect            BOOLEAN NOT NULL DEFAULT FALSE,
  discovered_quick_fixes BOOLEAN,
  generated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at             TIMESTAMPTZ NOT NULL
);

CREATE INDEX buyer_inquiries_listing_id ON buyer_inquiries(listing_id);

-- ─── skill_tree (seed data — never modified at runtime) ───────────────────────
CREATE TABLE skill_tree (
  id              VARCHAR(64) PRIMARY KEY,  -- slug e.g. 'tap_test'
  name            VARCHAR(128) NOT NULL,
  description     TEXT NOT NULL DEFAULT '',
  level_required  SMALLINT NOT NULL DEFAULT 1,
  xp_cost         INTEGER NOT NULL DEFAULT 0,
  skill_type      skill_type NOT NULL,
  tier            SMALLINT NOT NULL DEFAULT 0,
  -- Numeric effect: e.g. effect_key='detection_bonus', effect_value=0.15
  effect_key      VARCHAR(64),
  effect_value    NUMERIC(6,4),
  prerequisites   VARCHAR(64)[] NOT NULL DEFAULT '{}'
);

-- ─── player_skills ────────────────────────────────────────────────────────────
CREATE TABLE player_skills (
  player_id   UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  skill_id    VARCHAR(64) NOT NULL REFERENCES skill_tree(id),
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (player_id, skill_id)
);

-- ─── equipment (seed data — never modified at runtime) ────────────────────────
CREATE TABLE equipment (
  id                         VARCHAR(64) PRIMARY KEY,  -- slug
  name                       VARCHAR(128) NOT NULL,
  purchase_price             INTEGER NOT NULL,
  level_required             SMALLINT NOT NULL DEFAULT 1,
  monthly_upkeep             INTEGER NOT NULL DEFAULT 0,
  detection_tier             SMALLINT NOT NULL DEFAULT 0,
  detection_bonus            NUMERIC(4,2) NOT NULL DEFAULT 0,
  defect_categories_targeted VARCHAR(32)[]  -- NULL = all categories
);

-- ─── player_equipment ─────────────────────────────────────────────────────────
CREATE TABLE player_equipment (
  player_id    UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  equipment_id VARCHAR(64) NOT NULL REFERENCES equipment(id),
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (player_id, equipment_id)
);

-- ─── transactions ─────────────────────────────────────────────────────────────
CREATE TABLE transactions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id     UUID NOT NULL REFERENCES players(id),
  type          transaction_type NOT NULL,
  -- Negative = expense, positive = income (BYN integers)
  amount        INTEGER NOT NULL,
  reference_id  UUID,   -- car_id, listing_id, etc.
  description   TEXT NOT NULL DEFAULT '',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX transactions_player_id ON transactions(player_id, created_at DESC);

-- ─── ai_dialogue_cache ────────────────────────────────────────────────────────
CREATE TABLE ai_dialogue_cache (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  context_type  context_type NOT NULL,
  -- SHA-256 hash of (contextType + sorted input variables)
  context_key   VARCHAR(64) UNIQUE NOT NULL,
  response_text TEXT NOT NULL,
  model_version VARCHAR(64) NOT NULL DEFAULT 'gemini-1.5-flash',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at    TIMESTAMPTZ   -- NULL = never expires
);

CREATE INDEX ai_cache_key ON ai_dialogue_cache(context_key);

-- ─── analytics_events ─────────────────────────────────────────────────────────
CREATE TABLE analytics_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id   UUID NOT NULL REFERENCES players(id),
  event_type  VARCHAR(64) NOT NULL,
  metadata    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX analytics_player_event ON analytics_events(player_id, event_type, created_at DESC);

-- ─── updated_at trigger ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_players_updated_at
  BEFORE UPDATE ON players FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_cars_updated_at
  BEFORE UPDATE ON cars FOR EACH ROW EXECUTE FUNCTION set_updated_at();
