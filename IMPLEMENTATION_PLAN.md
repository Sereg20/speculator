# Car Dealer Simulator — Implementation Plan

**Stack:** React Native (Expo) · Node.js + Fastify · PostgreSQL · Redis · Gemini Flash · Railway
**Design reference:** GDD_CarDealer.md · GMS_CarDealer.md
**Currency:** BYN (Belarusian Ruble)

---

## Monorepo Structure

```
car-dealer/
├── apps/
│   ├── mobile/                        # Expo React Native app
│   │   ├── app/                       # Expo Router (file-based routes)
│   │   │   ├── (auth)/login.jsx
│   │   │   ├── (tabs)/
│   │   │   │   ├── market.jsx         # Browse listings
│   │   │   │   ├── garage.jsx         # Owned cars + repairs
│   │   │   │   ├── sales.jsx          # Active listings + inquiries
│   │   │   │   └── profile.jsx        # Player stats, skills, equipment
│   │   │   └── _layout.jsx
│   │   ├── components/
│   │   │   ├── car/
│   │   │   ├── market/
│   │   │   ├── inspection/
│   │   │   ├── repair/
│   │   │   └── ui/                    # Shared primitives
│   │   ├── stores/                    # Zustand stores
│   │   ├── hooks/                     # TanStack Query hooks
│   │   └── services/                  # Typed API client wrappers
│   │
│   └── server/                        # Fastify backend
│       ├── src/
│       │   ├── routes/
│       │   │   ├── auth.js
│       │   │   ├── market.js
│       │   │   ├── cars.js
│       │   │   ├── inspection.js
│       │   │   ├── repair.js
│       │   │   ├── listings.js
│       │   │   └── player.js
│       │   ├── services/              # All game logic lives here
│       │   │   ├── defectEngine.js    # ⚠ never exposes raw defects to routes
│       │   │   ├── inspectionEngine.js
│       │   │   ├── negotiationEngine.js
│       │   │   ├── buyerGenerator.js
│       │   │   ├── listingGenerator.js
│       │   │   ├── repairQueue.js
│       │   │   ├── carStateMachine.js # ⚠ only way to change car state
│       │   │   ├── energyService.js
│       │   │   ├── xpService.js
│       │   │   └── aiProxy.js
│       │   ├── jobs/                  # node-cron background jobs
│       │   │   ├── buyerInquiry.js
│       │   │   ├── holdingCost.js
│       │   │   ├── listingExpiry.js
│       │   │   └── repairCompletion.js
│       │   ├── db/
│       │   │   ├── client.js          # postgres.js instance
│       │   │   ├── migrations/        # node-pg-migrate files
│       │   │   └── queries/           # Per-domain typed query files
│       │   ├── cache/redis.js
│       │   ├── middleware/
│       │   │   ├── auth.js
│       │   │   └── errorHandler.js
│       │   ├── config.js              # All constants from GMS Appendix A
│       │   └── server.js
│       └── test/
│           ├── unit/
│           └── integration/
│
├── packages/
│   └── shared/                        # Types + public constants only
│       ├── types/
│       │   ├── car.js
│       │   ├── player.js
│       │   ├── defect.js
│       │   └── api.js                 # Standard response shape
│       └── constants/
│           ├── carModels.js           # BY market car list
│           ├── defectTable.js         # Defect type definitions (no probabilities)
│           └── skillTree.js
│
├── .env.example
├── .github/workflows/
│   ├── ci.yml
│   └── deploy.yml
└── package.json                       # pnpm workspaces
```

> **Rule:** `packages/shared` contains TypeScript types and public constants only. Probability tables, defect roll weights, and game formulas stay in `apps/server/src/services/` and are never sent to the client.

---

## Database Schema

### `players`
Core account. One row per player.
Fields: `id` (uuid PK), `device_id` (unique), `email` (unique, nullable), `password_hash` (nullable), `display_name`, `cash` (integer BYN), `xp` (integer), `level` (integer), `reputation_score` (integer), `energy_current` (integer), `energy_last_updated_at` (timestamp), `garage_slots` (integer), `in_game_day` (integer), `cash_stress_active` (boolean), `onboarding_complete` (boolean), `expo_push_token` (varchar, nullable), `created_at`, `updated_at`

### `cars`
The central state machine entity. Exists from first market appearance through final sale.
Fields: `id` (uuid PK), `player_id` (uuid FK, nullable — null = market listing not yet purchased), `make`, `model`, `year`, `mileage`, `color`, `condition_tier` (enum: poor/fair/good), `state` (enum: available_in_market / purchased / in_repair / listed_for_sale / sold), `purchase_price` (integer), `asking_price` (integer, nullable), `final_sale_price` (integer, nullable), `market_listing_expires_at` (timestamp), `seller_archetype` (enum), `seller_dialogue` (jsonb — cached Gemini response), `created_at`, `updated_at`

### `defects`
Server-side only. Never returned to client raw.
Fields: `id` (uuid PK), `car_id` (uuid FK), `defect_type` (varchar — matches GMS defect table key), `severity` (enum: minor/moderate/major), `is_revealed_to_player` (boolean, default false), `is_quick_fixed` (boolean, default false), `proper_repair_cost` (integer BYN), `quick_fix_cost` (integer BYN), `repair_time_minutes` (integer), `created_at`

### `repair_jobs`
One row per repair action.
Fields: `id` (uuid PK), `car_id` (uuid FK), `defect_id` (uuid FK), `repair_type` (enum: proper/quick_fix), `started_at` (timestamp), `completes_at` (timestamp), `completed` (boolean), `cost_charged` (integer BYN), `created_at`

### `listings`
A car the player has put up for sale.
Fields: `id` (uuid PK), `car_id` (uuid FK unique), `player_id` (uuid FK), `asking_price` (integer), `listed_at` (timestamp), `expires_at` (timestamp), `status` (enum: active/sold/expired/cancelled), `final_sale_price` (integer, nullable)

### `buyer_inquiries`
NPC buyer interactions. Pre-generated by background job.
Fields: `id` (uuid PK), `listing_id` (uuid FK), `buyer_archetype` (enum), `buyer_name` (varchar), `offered_price` (integer), `message_text` (text — cached Gemini), `player_counter_offer` (integer, nullable), `final_agreed_price` (integer, nullable), `status` (enum: pending/negotiating/accepted/rejected/expired), `did_inspect` (boolean), `discovered_quick_fixes` (boolean, nullable), `generated_at` (timestamp), `expires_at` (timestamp)

### `skill_tree` (seed data, never modified at runtime)
All skills from GMS Section 3.2 and 3.3.
Fields: `id` (varchar PK slug), `name`, `description`, `level_required`, `xp_cost`, `skill_type` (enum: inspection/negotiation/repair), `effect_key`, `effect_value` (numeric), `prerequisites` (varchar array)

### `player_skills`
Which skills the player owns.
Fields: `player_id` (uuid FK) + `skill_id` (varchar FK) — composite PK, `unlocked_at`

### `equipment` (seed data)
All equipment from GMS Section 3.1.
Fields: `id` (varchar PK slug), `name`, `purchase_price` (integer BYN), `level_required`, `monthly_upkeep` (integer BYN), `detection_tier` (integer), `detection_bonus` (numeric), `defect_categories_targeted` (varchar array, null = all)

### `player_equipment`
Fields: `player_id` (uuid FK) + `equipment_id` (varchar FK) — composite PK, `purchased_at`

### `transactions`
Audit log of all cash movements.
Fields: `id` (uuid PK), `player_id` (uuid FK), `type` (enum: car_purchase/repair/sale_revenue/holding_cost/rent/skill_purchase/equipment_purchase/ad_reward/...), `amount` (integer, negative = expense), `reference_id` (uuid, nullable), `description` (text), `created_at`

### `ai_dialogue_cache`
Stores all generated Gemini responses.
Fields: `id` (uuid PK), `context_type` (enum: seller_intro/seller_negotiation/buyer_inquiry/buyer_counter), `context_key` (varchar — SHA-256 hash of input variables), `response_text` (text), `model_version` (varchar), `created_at`, `expires_at` (nullable)

### `analytics_events`
Lightweight server-side event log.
Fields: `id` (uuid PK), `player_id` (uuid FK), `event_type` (varchar), `metadata` (jsonb), `created_at`

---

## Critical Path

```
Phase 0 (Bootstrap)
    ↓
Phase 1 (Data Model + Auth)
    ↓
Phase 2 (Market + Buying)  ← Phase 7 AI proxy stub starts here in parallel
    ↓
Phase 3 (Inspection)
    ↓
Phase 4 (Repair)
    ↓
Phase 5 (Selling)          ← Phase 7 AI hardening integrates here
    ↓
Phase 6 (Progression)      ← Phase 8 polish can start in parallel (2-person team)
    ↓
Phase 8 (Polish + Ads)
    ↓
Phase 9 (Testing)          ← Unit tests should be written during each phase
    ↓
Phase 10 (Deploy + Launch)
```

**Strictly sequential:** 0 → 1 → 2 → 3 → 4 → 5
**Parallelizable:** Phase 7 alongside 3–5 · Phase 8 alongside Phase 6 · Unit tests written per-phase

---

## Phase 0 — Project Bootstrap
**Goal:** Both apps run locally, connected to Railway dev databases, with CI checking every push.

### Deliverables
- [ ] pnpm workspace monorepo: `apps/mobile`, `apps/server`, `packages/shared`
- [ ] Expo app via `create-expo-app` — TypeScript strict, Expo Router
- [ ] Fastify server — TypeScript, `tsx` for dev, `GET /health` route
- [ ] PostgreSQL + Redis on Railway (dev env), connection strings in `.env`
- [ ] `postgres.js` client + `node-pg-migrate` migration runner, one empty baseline migration
- [ ] `ioredis` client connected
- [ ] `.env.example` documenting all required keys: `DATABASE_URL`, `REDIS_URL`, `GEMINI_API_KEY`, `JWT_SECRET`
- [ ] GitHub Actions CI: lint + typecheck on PR (no deploy)
- [ ] `turbo.json` with `build`, `dev`, `lint`, `test` pipelines

### Key Risks
- Commit to Expo Router now — switching later is painful
- Decide: amounts stored as whole BYN integers (recommended) or kopecks. Document in a schema comment and never change

**Duration estimate:** 3–4 days

---

## Phase 1 — Core Data Model
**Goal:** All tables migrated, authenticated routes working, car state machine enforced.

### Deliverables
- [ ] Migrations for all tables listed in the schema above
- [ ] Seed files for `skill_tree` and `equipment` (from GMS Sections 3.1–3.3)
- [ ] `carStateMachine.js`: `transition(carId, targetState)` — validates allowed next states, throws on illegal transitions. **No route handler ever does a direct SQL UPDATE on car state.**
- [ ] Fastify plugin structure: route registration, AJV schema validation, error handler
- [ ] Auth routes: `POST /auth/register`, `POST /auth/login` → JWT
- [ ] Auth middleware: `preHandler` hook attaches `playerId` to request
- [ ] `GET /player/me`, `GET /player/stats`
- [ ] Standard response shape in `packages/shared/types/api.js`: `{ data, error, meta }`

### Key Risks
- Use device ID auth for v1 (UUID generated on first launch, stored in `expo-secure-store`). Add email/password columns now so migration later is clean — no need to implement it yet
- JWT long-lived tokens (mobile game pattern). Add `refresh_token` table only post-launch if needed
- State machine is load-bearing — any bypass via direct SQL will corrupt game state

**Duration estimate:** 1 week

---

## Phase 2 — Car Market and Buying Flow
**Goal:** Players browse a randomized market, read seller dialogue, and purchase cars. All rolls happen server-side.

### Deliverables
- [ ] `listingGenerator.js`: generates per-player market listings using GMS Section 4 distribution (2 bad / 2 below avg / 2 fair / 1 good / 1 bargain). Parameters from GMS constants, not inline.
- [ ] `defectEngine.js`: given condition tier, rolls defect set per GMS Section 6.8. Writes to `defects` table. **Returns nothing to the caller that gets sent to the client.** Defects are in DB with `is_revealed_to_player = false`.
- [ ] Redis TTL for listing expiry: `listing:{carId}:expires` key. Postgres `market_listing_expires_at` is the authoritative check; Redis is a fast hint.
- [ ] `GET /market/listings` — returns active listings (no defect data)
- [ ] `GET /market/listings/:carId/dialogue` — fetch or generate seller intro via Gemini (lazy, cached)
- [ ] `POST /market/listings/:carId/purchase` — validate cash + garage slot, deduct cash, transition state to `purchased`, write transaction
- [ ] Mobile: Market screen (listing cards, pull-to-refresh, seller dialogue modal)
- [ ] Mobile: Garage screen (purchased cars list)
- [ ] `aiProxy.js` stub: returns a hardcoded string (replaced in Phase 7)

### Key Risks
- **Market is per-player** (not shared pool) — simpler, avoids purchase race conditions
- Gemini called lazily on listing tap, not at market load — avoids wasting API quota
- `defectEngine` must be called during listing generation only, never during purchase. By purchase time, defects already exist in DB but are hidden.

**Duration estimate:** 1.5 weeks

---

## Phase 3 — Inspection System
**Goal:** Tiered inspection reveals defects probabilistically server-side. Client only sees what passed the detection roll.

### Deliverables
- [ ] `inspectionEngine.js`: given car ID + inspection tier + player skills/equipment, runs GMS Section 7 detection rolls. Sets `is_revealed_to_player = true` only on passing defects. Never returns failing defect IDs.
- [ ] `POST /cars/:carId/inspect` — validate equipment owned + energy, call inspection engine, return `{ revealed_defects: [...] }` only
- [ ] `GET /cars/:carId/defects` — returns only `is_revealed_to_player = true` rows
- [ ] `POST /player/skills/:skillId/purchase` — level gate + XP cost + prerequisites check
- [ ] `POST /player/equipment/:equipmentId/purchase` — level gate + cash check
- [ ] `GET /player/skills`, `GET /player/equipment`
- [ ] Mobile: Inspection screen (equipment selector, animated defect reveal)
- [ ] Mobile: Skill tree screen (tree view, unlock buttons)
- [ ] Mobile: Equipment shop screen

### Key Risks
- **Energy deduction must be atomic:** use `UPDATE players SET energy_current = energy_current - $cost WHERE id = $id AND energy_current >= $cost` and check `rowCount`. If 0, reject.
- **Never return total defect count** — even "2 found out of 5" leaks hidden information. Return only the revealed defect objects.
- Detection rolls are not seeded/reproducible — each inspection is a fresh probabilistic event. Do not add a seed parameter.

**Duration estimate:** 1.5 weeks

---

## Phase 4 — Repair System
**Goal:** Revealed defects can be queued for repair with server-side timers. Holding costs and rent run automatically.

### Deliverables
- [ ] `repairQueue.js`:
  - `startRepair(carId, defectId, repairType)` — validate defect revealed + no active repair on this car, deduct cash, write `repair_jobs` row with `completes_at`, transition car state to `in_repair`, set Redis TTL hint
  - `checkCompletion(repairJobId)` — used by background job and polling
- [ ] Background job `repairCompletion.js` (node-cron, every minute): query `repair_jobs WHERE completed = false AND completes_at <= now()`, mark complete, transition car state back, award XP
- [ ] `POST /cars/:carId/repairs` — start repair
- [ ] `GET /cars/:carId/repairs` — list all jobs (completed + pending)
- [ ] `POST /cars/:carId/repairs/:jobId/cancel` — cancel queued job (partial refund if not started)
- [ ] Background job `holdingCost.js` (runs on in-game day tick): charge holding cost + rent per GMS Section 2, write transactions, update `players.in_game_day`, check cash stress threshold
- [ ] Mobile: Repair screen (defect list, proper vs quick fix choice, cost/time, active timer countdown, queue)
- [ ] Timer countdown: calculate `completes_at - now()` on mount, animate locally with `react-native-reanimated`. **Do not poll every second.**

### Key Risks
- **Postgres is authoritative for timers.** Redis TTL key is only a lookup hint. Design so cold Redis still works — background job queries Postgres directly.
- **One repair job per car at a time.** Enforce at route level: reject if any `repair_jobs` row for that car has `completed = false`.
- **`is_quick_fixed` set on job completion**, not on start.
- **`holdingCost.js` must be idempotent** — add `last_day_processed` tracking to prevent double-charges on crash recovery.
- Use `node-cron` inside Fastify for v1. No BullMQ or separate worker process yet.

**Duration estimate:** 1 week

---

## Phase 5 — Selling Flow
**Goal:** Cars can be listed for sale, receive AI-generated buyer inquiries, be negotiated, and sold — including quick-fix discovery risk.

### Deliverables
- [ ] `POST /listings` — create listing from car in `purchased` state, transition to `listed_for_sale`, set `expires_at`
- [ ] `buyerGenerator.js`: given listing, rolls GMS Section 9.1 inquiry probability, selects archetype, generates offered price, queues Gemini dialogue generation
- [ ] Background job `buyerInquiry.js` (runs on in-game day tick): for each active listing, run `buyerGenerator`, write `buyer_inquiries` row, trigger `aiProxy` for buyer message, store result
- [ ] `GET /listings/:listingId/inquiries` — returns all inquiries (client polls)
- [ ] `POST /listings/:listingId/inquiries/:inquiryId/respond` — accept / reject / counter-offer
- [ ] `negotiationEngine.js`: resolves counter-offer per GMS Section 5 formula: `{ outcome: accepted|rejected|counter, final_price }`
- [ ] Quick-fix discovery: if `buyer_inquiry.did_inspect = true`, run GMS Section 8.3 formula against all `is_quick_fixed = true` defects. If discovered, apply GMS Section 9.4 price penalty / rejection.
- [ ] Sale completion: transition car to `sold`, close listing, award XP (GMS Section 1.2), update reputation score, write transaction. **Wrap in a Postgres transaction.**
- [ ] Mobile: Listings screen (active listings with inquiry badges)
- [ ] Mobile: Inquiry detail screen (message, offer, accept/counter/reject)
- [ ] Mobile: Sale summary screen (profit breakdown, XP, reputation delta)

### Key Risks
- **Multiple concurrent inquiries:** First accepted offer wins. Use `UPDATE listings SET status = 'sold' WHERE id = $id AND status = 'active'` and check `rowCount` to prevent double-sale.
- **Buyer dialogue is pre-generated** by the background job and stored. Routes read stored text — never call Gemini at read time.
- **XP + reputation + cash must be atomic** — wrap in a single Postgres transaction.
- Phase 7 AI proxy must have a working stub before this phase ships.

**Duration estimate:** 2 weeks

---

## Phase 6 — Progression and Economy
**Goal:** XP, leveling, energy, reputation tiers, cash stress, and garage upgrades all work and affect every relevant system.

### Deliverables
- [ ] `xpService.js`: `awardXP(playerId, amount, source)` — add XP, check level-up thresholds (from GMS Section 1.1 seeded constants), execute level-up cascade inside a Postgres transaction
- [ ] Level-up cascade: update `players.level`, check if new skill tree nodes become eligible (no auto-unlock — just eligibility), write notification record
- [ ] `energyService.js`:
  - `consumeEnergy(playerId, amount)` — atomic SQL UPDATE
  - `getEnergy(playerId)` — lazy compute: `floor((now - energy_last_updated_at) / regen_interval_seconds)`, clamp to max, update DB lazily. **Correctness must not depend on Redis.**
  - Redis key `energy:regen:{playerId}` TTL = seconds to next tick (push hint for notifications only)
- [ ] Reputation tier computed on read from `reputation_score` thresholds (GMS Section 1.4). Never store tier directly.
- [ ] Reputation effects wired into: `negotiationEngine` (modifier table), `buyerGenerator` (inquiry probability), `aiProxy` (honesty_mode selection)
- [ ] Cash stress: `holdingCost.js` sets `cash_stress_active = true/false` based on GMS Section 10.4 thresholds
- [ ] Negotiation modifier for cash stress (−10% success, GMS Section 10.4)
- [ ] `POST /player/garage/upgrade` — pay cost, increase `garage_slots`, write transaction
- [ ] In-game calendar on client: display `in_game_day`, days car held (computed)

### Key Risks
- Energy correctness is lazy-computed from timestamps — no background regen job needed. Redis is a push notification hint only.
- Level-up cascades must be processed synchronously inside `xpService.awardXP` — no pub/sub events for v1.
- Reputation tier threshold changes must only update the constants file, not DB migrations.

**Duration estimate:** 1 week

---

## Phase 7 — AI Integration Hardening
**Goal:** Gemini Flash proxy is production-ready: cached, rate-limited, timeout-safe, with full prompt variable injection from GMS Section 11.

### Deliverables
- [ ] `aiProxy.js` (replaces Phase 2 stub):
  - `generateDialogue(contextType, variables)` — build prompt from template, compute `context_key` (SHA-256 of contextType + sorted variables), check `ai_dialogue_cache`, call Gemini Flash with `AI_TIMEOUT_MS = 3000` hard cutoff, store result, return text
  - On timeout/error: select random fallback from local pool, return transparently (no error to client), log event via Pino
- [ ] Prompt templates for all 4 context types (`seller_intro`, `seller_negotiation`, `buyer_inquiry`, `buyer_counter`) matching GMS Sections 11.2 and 11.4 — loaded from config files, not inline
- [ ] Fallback dialogue pool: `server/src/config/fallbackDialogue.json`, 10+ strings per context type, tagged by archetype
- [ ] Rate limiting: Fastify rate-limit plugin on dialogue routes. Background job processes max 5 Gemini calls per run, queues the rest for the next tick.
- [ ] Prompt injection safety: sanitize all player-controlled text before injection (strip newlines, prompt-injection patterns)
- [ ] Structured logging: every Gemini call logged with duration, cache hit/miss, fallback triggered
- [ ] Multi-key support: `GEMINI_API_KEY_1`, `GEMINI_API_KEY_2` in env, round-robin selection

### Key Risks
- **Cache key must be deterministic** — sort variable keys alphabetically before hashing. Include `listing_id` (not just `car_id`) in seller dialogue keys to handle cars that are resold.
- Client never sees "AI unavailable" — fallback fires silently.
- Monitor token usage from day one. GMS Section 11.5 defines `maxOutputTokens: 200`.

**Duration estimate:** 1 week (runs parallel with Phases 3–5)

---

## Phase 8 — Polish and Monetization
**Goal:** Rewarded ads work at all GMS-defined trigger points, push notifications fire on key events, onboarding guides new players, and UI is animated.

### Deliverables
- [ ] `react-native-google-mobile-ads` integrated (test ad units for dev, production units for release)
- [ ] Ad trigger points (per GMS Section 15):
  - Energy refill (Profile screen)
  - Waive holding cost (Garage screen, when cost is due)
  - Second chance inspection (Inspection screen, after missed defects)
  - Extend listing expiry (Sales screen, expiring listing)
- [ ] `POST /ads/grant` route: validate ad type, apply effect server-side. **Ad rewards are never applied client-side.** Rate-limited: max 1 grant per ad type per player per 4 hours.
- [ ] Push notifications via `expo-notifications`:
  - Channels: `repair_complete`, `buyer_inquiry`, `listing_expiring`, `energy_full`
  - `POST /notifications/register` — save `expo_push_token` on player
  - Notification sends triggered from background jobs via Expo push API
- [ ] Onboarding: `onboarding_complete` flag on player. Client-side guided overlay walking through first flip. Skippable from step 1.
- [ ] Animations via `react-native-reanimated`: car purchase confirmation, defect reveal (staggered card slide-in), sale completion

### Key Risks
- Ask for push notification permission **after first sale**, not on app launch.
- Test ad reward grant rate limiting before launch — without it, a client can call the grant endpoint repeatedly.
- Test animations on a mid-range Android device. Reanimated performance is noticeably worse on budget Android than iOS simulator.

**Duration estimate:** 1.5 weeks

---

## Phase 9 — Testing and QA
**Goal:** Game logic is covered by automated tests. Economy balance verified manually against GMS targets.

### Deliverables
- [ ] Unit tests (`vitest`):
  - `defectEngine.test.js` — 1000-run distribution test per condition tier, verify counts fall in GMS Section 6.8 ranges
  - `inspectionEngine.test.js` — detection probability per tier, verify no hidden defect IDs leak to caller
  - `negotiationEngine.test.js` — all archetype + delta combinations, boundary conditions
  - `qfDiscovery.test.js` — GMS Section 8.3 formula against known input/output pairs
  - `xpService.test.js` — level-up thresholds, cascade fires exactly once
  - `energyService.test.js` — lazy regen computation, atomic consumption
- [ ] Integration tests (`vitest` + Fastify `inject`):
  - Full flip: seed player → browse market → purchase → inspect → start repair → fast-forward timer via test helper → list → generate inquiry → accept → verify all table states
  - State machine violation: attempt illegal transitions → verify 4xx
  - Auth: unauthenticated → 401, wrong player's car → 403
- [ ] `fastForwardRepair(repairJobId)` test helper: sets `completes_at` to past timestamp, calls completion job handler directly. **Only callable when `NODE_ENV=test`.**
- [ ] Gemini proxy load test (`k6`): 50 concurrent dialogue requests, verify cache hit rate after first run, verify fallback under artificial timeout
- [ ] Manual QA checklist:
  - [ ] Buy 10 cars across condition tiers — verify profit margins match GMS Section 10.2 targets
  - [ ] Buy 20 cars — log defect counts, verify distribution matches GMS tables
  - [ ] Verify energy regen real-world timing matches GMS Section 1.3
  - [ ] Estimate time to level 5 — verify matches intended session pacing

### Key Risks
- **GMS document is the spec.** Any discrepancy between GMS formulas and test expected values means the implementation is wrong.
- Use a separate test database — never run integration tests against the dev database.
- Write unit tests during phases 2–6; Phase 9 is for integration tests, load tests, and QA pass.

**Duration estimate:** 1 week

---

## Phase 10 — Deployment and Launch
**Goal:** App is live on both stores, backend runs on Railway production, monitoring is in place.

### Deliverables
- [ ] Railway production environment: separate from dev, production Postgres + Redis. All secrets in Railway env vars (never committed).
- [ ] `deploy.yml` GitHub Actions: on push to `main` → run migrations → deploy to Railway. Deploy never runs without migrations passing.
- [ ] Migration policy: all migrations backward-compatible. No column drops/renames without alias columns. Document in `MIGRATIONS.md`.
- [ ] `eas.json` with `development`, `preview`, `production` build profiles
- [ ] Google Play: internal test track → 3-day soak → production. `eas submit --platform android`
- [ ] App Store: TestFlight → App Store review. `eas submit --platform ios`
- [ ] App Store metadata: screenshots, description, privacy policy URL (required — host on GitHub Pages). Do not use language implying real-money transactions.
- [ ] Sentry: `@sentry/react-native` + `@sentry/node`. Forward all unhandled exceptions. Log game-logic errors at `warn`, unhandled at `error`.
- [ ] `analytics_events` table live: log `car_purchased`, `inspection_completed`, `repair_started`, `car_sold`, `level_up`, `ad_watched` from server-side. SQL view for weekly reporting.
- [ ] Verify Railway automated Postgres backups are enabled before go-live.
- [ ] `SIGTERM` handler in Fastify: `fastify.close()` for graceful drain on Railway restarts.

### Key Risks
- First EAS builds take 20–40 minutes. Schedule production build well before launch date.
- Apple requires a privacy policy URL before submission. Write and host it before submitting.
- Railway free tier has sleep intervals — upgrade to paid tier before launch.
- Verify database backup restore procedure before go-live, not after.

**Duration estimate:** 3–5 days

---

## Estimated Timeline

| Phase | What | Solo Dev | 2-Person Team |
|-------|------|----------|---------------|
| 0 | Bootstrap | 4 days | 4 days |
| 1 | Data model | 1 week | 1 week |
| 2 | Market + buying | 1.5 weeks | 1.5 weeks |
| 3 | Inspection | 1.5 weeks | 1.5 weeks |
| 4 | Repair | 1 week | 1 week |
| 5 | Selling | 2 weeks | 2 weeks |
| 6 | Progression | 1 week | 1 week |
| 7 | AI hardening | 1 week | parallel with 3–5 |
| 8 | Polish + ads | 1.5 weeks | parallel with 6 |
| 9 | Testing | 1 week | 1 week |
| 10 | Deploy + launch | 4 days | 4 days |
| **Total** | | **~14–15 weeks** | **~10–11 weeks** |

---

## Critical Files (Load-bearing)

| File | Why it matters |
|------|---------------|
| `apps/server/src/services/defectEngine.js` | All economic integrity depends on correct probability rolls. Must never leak raw defect data to route handlers. Exhaustively tested. |
| `apps/server/src/services/carStateMachine.js` | Only place car state transitions are allowed. Any bypass via direct SQL UPDATE corrupts the game. |
| `apps/server/src/services/aiProxy.js` | Every AI interaction flows here. Cache key design, timeout handling, and fallback logic affect all phases. |
| `apps/server/src/db/migrations/` | Schema decisions made here constrain every subsequent phase. State machine enum values and amounts-as-integers convention must be correct from the start. |
| `packages/shared/types/api.js` | Client–server contract. Breaking changes require coordinated updates across both apps. |

---

## Environment Variables Reference

```env
# Server
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
GEMINI_API_KEY_1=
GEMINI_API_KEY_2=          # optional, enables round-robin
JWT_SECRET=
NODE_ENV=development        # development | test | production
LOG_LEVEL=info
AI_TIMEOUT_MS=3000
INGAME_DAY_REAL_MINUTES=120

# Mobile (Expo)
EXPO_PUBLIC_API_URL=https://your-railway-app.up.railway.app
EXPO_PUBLIC_SENTRY_DSN=
```
