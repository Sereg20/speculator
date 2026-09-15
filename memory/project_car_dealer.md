---
name: Car Dealer Simulator — project status
description: Current implementation phase, conventions, and architecture decisions for the car-dealer game project
type: project
---

React Native (Expo) + Node.js/Fastify + PostgreSQL game. Project root: `\\Client\D$\AI\speculator\car-dealer\`.

**Why:** Building a used-car flip simulator calibrated to the Belarusian market (BYN currency).

**How to apply:** When resuming implementation, check which phase is next and what deliverables remain.

## Phase status
- Phase 0 (Bootstrap): ✅ done
- Phase 1 (Data model + auth): ✅ done
- Phase 2 (Market + buying): ✅ done — defectEngine, listingGenerator, market routes, cars routes, migrations 002
- Phase 3 (Inspection): ✅ done — inspectionEngine, inspection routes, player skill/equipment/garage routes, migrations 003+004
- Phase 4 (Repair): ✅ done — repairQueue, repair routes, repairCompletion job, holdingCost job
- Phase 5 (Selling): ✅ done (2026-09-15) — see details below
- Phase 6 (Progression): ✅ done (2026-09-15) — see details below
- Phase 7 (AI Dialogue): ✅ done (2026-09-15) — see details below
- Phase 8–10: pending

## Phase 5 deliverables (completed 2026-09-15)
- `negotiationEngine.js` — resolvePurchaseNegotiation, resolveSaleNegotiation, quickFixDiscoveryProb, buyerInspectionProb; reputation + cash stress effects wired in
- `buyerGenerator.js` — generateBuyerInquiry(); rolls inquiry probability, archetype selection, offered price, quick-fix discovery, dialogue via aiProxy
- `routes/listings.js` — POST /listings, GET /listings, GET /listings/:id, DELETE /listings/:id, GET /listings/:id/inquiries, POST respond (accept/reject/counter); full sale completion with reputation + XP
- `jobs/buyerInquiry.js` — runs per-listing once per in-game day
- `jobs/listingExpiry.js` — expires listings past expires_at; returns car to purchased, -1 reputation
- `routes/market.js` — added POST /market/listings/:carId/negotiate for purchase negotiation
- `migrations/006_phase5_selling.sql` — tool_upkeep enum, listing updated_at + days_listed_when_sold, buyer_inquiries updated_at + negotiation_round, indices

## Phase 6 deliverables (completed 2026-09-15)
- `xpService.js` — refactored computeLevel() exported; level-up cascade logs level_up analytics event; beyond-level-20 formula (300 XP/level)
- `routes/player.js` — added xp_to_next_level to /me and /stats; new GET /player/transactions; new GET /player/progression (available skills/equipment, career stats, reputation next tier)
- `routes/cars.js` — added days_held computed field (in-game calendar) to GET /cars
- `routes/ads.js` — POST /ads/grant with 4-hour rate limit; 4 ad types: energy_refill, waive_holding_cost, second_chance_inspection, extend_listing
- `config.js` — added XP award constants (XP_CAR_SOLD, XP_NEGOTIATION_SALE, etc.), REP event constants (REP_SALE_CLEAN, REP_QUICK_FIX_FAIL, etc.), energy cost constants, listing expiry distribution

## Phase 7 deliverables (completed 2026-09-15)
- `services/aiProxy.js` — full Gemini integration replacing stub
  - Round-robin key selection across `GEMINI_API_KEYS` array from config
  - SHA-256 cache key from `node:crypto`; lookup/store in `ai_dialogue_cache` table
  - Prompt templates for all 4 context types: `seller_intro`, `seller_negotiation`, `buyer_inquiry`, `buyer_counter` (Russian, GMS §11.2/§11.4)
  - Generation config per GMS §11.5: temperature 0.85/0.80, maxOutputTokens 200/150/180/120, topP 0.92/0.90
  - `Promise.race([geminiCall, timeoutReject(AI_DIALOGUE_TIMEOUT_MS)])` timeout — 30 s default
  - Silent fallback to `FALLBACK_DIALOGUES` on timeout or API error (15 entries per pool, GMS §11.6)
  - Structured Pino log per call: contextType, cacheHit, fallback, reason, durationMs
  - `log` param is optional — existing callers unchanged
- `config.js` — added `AI_DIALOGUE_TIMEOUT_MS = 30000` (env-overridable)

## Key conventions
- All BYN as INTEGER (no kopecks)
- Auth: `requireAuth` preHandler from `middleware/auth.js`; player ID at `request.playerId`
- Car state only changed via `carStateMachine.transitionCar()`
- Defects NEVER returned raw to client; only `is_revealed_to_player=true` rows exposed
- `quality_tier` stripped from market listing responses (don't leak deal quality)
- XP tracked in `analytics_events`; inspection uniqueness enforced by `inspections` table UNIQUE(car_id, tier)
- Shared package: `@car-dealer/shared` — only public types/constants, no game logic/probabilities
- `_completeSale()` uses `UPDATE listings WHERE status='active'` rowCount guard to prevent double-sales
- Energy refund pattern: consume energy before business logic, refund in catch block on failure

## Migration sequence
001_initial → 002_phase2_columns → 003_seed_skills_equipment → 004_inspections_log → 005_transaction_type_values → 006_phase5_selling
