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
- Phase 4 (Repair): ✅ done — repairQueue, repair routes, repairCompletion job, holdingCost job, migrations (no new migration needed — repair_jobs table was in 001_initial)
- Phase 5–10: pending

## Key conventions
- All BYN as INTEGER (no kopecks)
- Auth: `requireAuth` preHandler from `middleware/auth.js`; player ID at `request.playerId`
- Car state only changed via `carStateMachine.transitionCar()`
- Defects NEVER returned raw to client; only `is_revealed_to_player=true` rows exposed
- `quality_tier` stripped from market listing responses (don't leak deal quality)
- XP tracked in `analytics_events`; inspection uniqueness enforced by `inspections` table UNIQUE(car_id, tier)
- Shared package: `@car-dealer/shared` — only public types/constants, no game logic/probabilities

## Migration sequence
001_initial → 002_phase2_columns → 003_seed_skills_equipment → 004_inspections_log
