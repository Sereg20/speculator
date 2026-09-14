# Car Dealer Simulator — Game Mechanics Specification

**Version:** 1.1
**Status:** Ready for Implementation
**Companion to:** GDD_CarDealer.md
**Currency:** Belarusian Ruble (BYN). All monetary values calibrated against the Belarusian used-car market (av.by, 2025). 1 BYN ≈ 0.30 USD at the time of writing.

---

## Table of Contents

1. [Progression System](#1-progression-system)
2. [Garage System](#2-garage-system)
3. [Skills & Equipment](#3-skills--equipment)
4. [Car Market & Listings](#4-car-market--listings)
5. [Negotiation System](#5-negotiation-system)
6. [Defect System](#6-defect-system)
7. [Inspection System](#7-inspection-system)
8. [Repair System](#8-repair-system)
9. [Selling System](#9-selling-system)
10. [Economy Balancing](#10-economy-balancing)
11. [AI Dialogue Prompts](#11-ai-dialogue-prompts)
12. [Appendix A: Constants Reference](#appendix-a-constants-reference)
13. [Appendix B: Design Notes for Implementers](#appendix-b-design-notes-for-implementers)

---

## 1. Progression System

### 1.1 Level Thresholds

Levels use a slightly accelerating XP curve in early game that flattens at mid-game to avoid grind walls. Total XP to reach level 20 is approximately 41,550.

| Level | XP to Reach This Level | Cumulative XP | Primary Unlock |
|-------|------------------------|---------------|----------------|
| 1 | 0 | 0 | Starting state |
| 2 | 200 | 200 | Tap Test Kit available |
| 3 | 350 | 550 | Garage Tier 2 available |
| 4 | 500 | 1,050 | Smooth Talker skill |
| 5 | 700 | 1,750 | OBD Scanner available |
| 6 | 900 | 2,650 | Semi-pro Repairs |
| 7 | 1,100 | 3,750 | Garage Tier 3 available |
| 8 | 1,300 | 5,050 | Deal Closer skill |
| 9 | 1,500 | 6,550 | — |
| 10 | 1,800 | 8,350 | Full Diagnostic Stand available |
| 11 | 2,100 | 10,450 | Garage Tier 4 available |
| 12 | 2,400 | 12,850 | Workshop-grade Repairs |
| 13 | 2,700 | 15,550 | — |
| 14 | 3,000 | 18,550 | Garage Tier 5 available |
| 15 | 3,300 | 21,850 | — |
| 16 | 3,500 | 25,350 | — |
| 17 | 3,700 | 29,050 | — |
| 18 | 3,900 | 32,950 | — |
| 19 | 4,100 | 37,050 | — |
| 20 | 4,500 | 41,550 | Late-game content |

Beyond level 20: `XP_required = 4,500 + (level − 20) × 300`

### 1.2 XP Awards per Action

| Action | XP Earned | Notes |
|--------|-----------|-------|
| Purchase a car | 15 | Always |
| Complete basic inspection | 10 | Once per car |
| Complete intermediate inspection | 20 | Once per car, cumulative |
| Complete advanced inspection | 35 | Once per car, cumulative |
| Perform proper repair | 25–50 | 25 XP per 500 BYN spent, max 50 |
| Perform quick fix | 10 | Flat |
| Successful car sale | 30 | Flat |
| Successful negotiation (purchase) | 20 | Only if discount achieved |
| Successful negotiation (sale) | 20 | Only if buyer accepts above initial offer |
| Accept a buyer offer below asking | 5 | Consolation |
| Car sold with no complaints | 15 | Bonus for clean deal |
| Buyer discovers defect after sale | −5 | Applied on complaint event |

### 1.3 Energy System

Target session length: 10–15 minutes, using 8–12 energy per session.

| Parameter | Value |
|-----------|-------|
| Maximum energy (levels 1–5) | 20 |
| Maximum energy (levels 6–12) | 25 |
| Maximum energy (levels 13–20) | 30 |
| Regen rate | 1 energy per 12 real minutes |
| Full refill time (20 energy) | 4 real hours |
| Full refill time (30 energy) | 6 real hours |
| Rewarded ad refill | Full refill (once per 4 real hours) |

**Energy cost per action:**

| Action | Energy Cost |
|--------|-------------|
| Browse car listings | 0 |
| Initiate seller dialogue | 1 |
| Purchase a car | 2 |
| Basic inspection (visual) | 2 |
| Intermediate inspection (tap test / OBD) | 3 |
| Advanced inspection (diagnostic stand) | 4 |
| Perform one repair task | 3 |
| List car for sale | 1 |
| Respond to buyer inquiry | 1 |
| Negotiate with buyer | 2 |

> Design note: A player with 20 energy can buy one car (2), do full inspection with stand (2+3+4=9), and repair one defect (3) = 17 energy total. Natural "almost done, come back tomorrow" moment.

### 1.4 Reputation System

| Parameter | Value |
|-----------|-------|
| Starting reputation | 50 |
| Minimum | 0 |
| Maximum | 200 |

**Reputation Tiers:**

| Tier Name | Score Range | Summary |
|-----------|-------------|---------|
| Unknown | 0–29 | Buyers very suspicious, sellers charge premium |
| Recognized | 30–69 | Baseline behavior |
| Trusted | 70–119 | Sellers slightly more honest, buyers less likely to inspect |
| Reputable | 120–159 | Better purchase deals, faster sales |
| Legendary | 160–200 | Best listing placement, maximum negotiation leverage |

**Reputation change events:**

| Event | Change |
|-------|--------|
| Car sold cleanly (no complaints) | +3 |
| Buyer leaves positive comment | +5 |
| Buyer discovers undisclosed defect | −10 |
| Car returned / dispute raised | −15 |
| Successful negotiation (purchase) | +1 |
| Successful negotiation (sale) | +2 |
| Listing expires unsold | −1 |
| Proper repair completed before sale | +2 |
| Quick fix passes inspection | 0 |
| Quick fix fails inspection | −12 |

---

## 2. Garage System

### 2.1 Garage Tiers

| Tier | Car Slots | Unlock Level | Upgrade Cost | Weekly Rent | Description |
|------|-----------|--------------|--------------|-------------|-------------|
| 1 | 1 | 1 (starting) | 0 | 200 BYN | Yard parking spot |
| 2 | 2 | 3 | 1,500 BYN | 450 BYN | Dilapidated single lock-up |
| 3 | 3 | 7 | 3,800 BYN | 900 BYN | Proper single-bay workshop |
| 4 | 4 | 11 | 7,500 BYN | 1,700 BYN | Two-bay garage |
| 5 | 5 | 14 | 14,000 BYN | 2,800 BYN | Full dealership lot |

- Upgrade cost is one-time. Rent charges every 7 in-game days regardless of occupancy.
- Downgrade: refunds 40% of upgrade cost; lower rent applies immediately.
- First rent charge: day 8 (first week rent-free).

### 2.2 Holding Cost

Charged once per in-game day per occupied slot.

| Game Stage | Levels | Daily Holding Cost per Car |
|------------|--------|---------------------------|
| Early | 1–5 | 12 BYN |
| Mid | 6–12 | 25 BYN |
| Late | 13–20 | 40 BYN |

Rewarded ad: waive holding cost for one car for one in-game day (once per 24 real hours per car).

### 2.3 Tool Upkeep

Charged every 30 in-game days. Tier 0–1 items (hand tools, basic kits) have no upkeep — they are one-time purchases. Upkeep is based on the highest *Tier 2 or Tier 3* equipment owned.

| Highest Equipment Tier Owned | Example Item | Monthly Upkeep |
|------------------------------|-------------|---------------|
| None / Tier 0–1 only | Torch kit, Magnet | 0 |
| Tier 2 — consumer scanner | Generic OBDII Dongle | 40 BYN |
| Tier 2 — named scanner | OBDII with Live Data | 100 BYN |
| Tier 3 — full OBDII/CAN system | Full Diagnostic System | 200 BYN |
| Tier 3 — workshop equipment | Lifter / 4-Post Ramp | 300 BYN |
| Tier 3 — full stand | Full Diagnostic Stand | 450 BYN |

---

## 3. Skills & Equipment

Skills are purchased once for a permanent effect. XP is both the level-threshold currency and the skill-purchase currency (shared pool, creating a specialization choice).

Each tree progresses from human intuition and folk wisdom → basic hand tools → affordable consumer-grade tech → professional workshop equipment. Players are expected to own a few items from each tree rather than max out one tree completely.

---

### 3.1 Inspection Skills & Equipment

Skills and equipment are listed in recommended acquisition order. Detection probabilities stack on top of each other where noted.

#### Tier 0 — No tools, just eyes and ears (available from level 1)

| Item | Type | Unlock Level | Cost | Detection Effect | Notes |
|------|------|--------------|------|-----------------|-------|
| **Walk-around Glance** | Skill (default) | 1 | Free | Spots obvious body damage, rust patches, mismatched paint panels — Tier-1 body defects at 55% | Starting skill; everyone has this |
| **Ask the Seller** | Skill (default) | 1 | Free | Seller dialogue quality improved; +1 question slot per conversation | Combines with honesty_mode to reveal verbal clues |
| **Listen to the Engine** | Skill | 2 | 1,500 XP | Starting the car and listening reveals knocking, rough idle — Tier-1 engine defects at 50% | Requires car to be startable |
| **Door & Panel Feel** | Skill | 2 | 1,200 XP | Running hands along panels detects filler/putty (accident repairs) — +20% to detecting hidden body repairs | Passive; applies automatically during any inspection |
| **Interior Smell & Look** | Skill | 3 | 1,500 XP | Spotting water stains, mold smell, burnt wiring smell — Tier-1 interior and electrical defects at 45% | Triggered separately from walk-around |
| **Cold Start Test** | Skill | 3 | 2,000 XP | Asking to start car from cold reveals smoke color and starting hesitation — Tier-1 starting issues and overheating hints at 60% | Seller can refuse; probability reduced with Unknown reputation |

#### Tier 1 — Basic hand tools (unlock levels 3–6)

| Item | Type | Unlock Level | Cost | Detection Effect | Notes |
|------|------|--------------|------|-----------------|-------|
| **Torch & Mirror Set** | Equipment | 3 | 20 BYN | +20% to all Tier-1 body and interior detection rolls; reveals undercarriage rust | Small kit; fits in a bag |
| **Tap Test** | Skill | 3 | 2,500 XP | Knocking on panels with knuckles to find hollow filler zones — Tier-2 body defects (hidden accident repair, structural rust) at 55% | Requires Torch & Mirror for best results; works without |
| **Tyre & Brake Visual** | Skill | 4 | 2,000 XP | Checking tread depth, uneven wear, and visible brake disc condition — Tier-1 suspension and brake defects at 65% | Fast; no equipment needed |
| **Fluid Level Check** | Skill | 4 | 2,000 XP | Pulling dipstick and checking coolant reservoir — reveals oil condition hints, coolant contamination — Tier-1/Tier-2 engine defects at 40% | Requires Torch & Mirror; emulsion on cap = head gasket flag |
| **Magnet Test** | Equipment | 5 | 8 BYN | A fridge magnet dragged over panels reveals thick filler — +25% detection of hidden body repairs and Tier-2 panel defects | Classic folk method; still works |
| **Under-car Crawl** | Skill | 5 | 3,000 XP | Getting under the car to check frame, leaks, and exhaust — Tier-2 structural rust, Tier-1 transmission leaks, exhaust issues at 60% | Requires Torch & Mirror; takes extra time (+0.5 in-game day) |
| **Test Drive** | Skill | 6 | 3,500 XP | A short drive reveals gearbox feel, suspension knocks, brake pull, vibrations — Tier-2 transmission and suspension defects at 55% | Seller may refuse with Unknown reputation (30% chance) |

#### Tier 2 — Consumer-grade diagnostic tools (unlock levels 6–10)

| Item | Type | Unlock Level | Cost | Detection Effect | Notes |
|------|------|--------------|------|-----------------|-------|
| **Generic OBDII Dongle** ("Chinese scanner") | Equipment | 6 | 50 BYN | Reads stored and pending fault codes — Tier-2 engine and electrical defects at 65%; no live data | Budget Bluetooth dongle; works on OBDII-compliant cars (post-2004) |
| **Compression Tester** | Equipment | 7 | 60 BYN | Screw-in tester reveals cylinder compression drop — Tier-3 engine wear (low compression) at 60% | Requires Under-car Crawl skill for proper access; takes +1 in-game day |
| **Bush Scanner / Stethoscope** | Equipment | 7 | 40 BYN | Mechanical stethoscope placed on engine and suspension components — Tier-2 engine knocks, worn bushings, bearing noise at 60% | Real mechanic tool; sounds creaky/rhythmic = flag |
| **Brake Fluid Tester Strips** | Equipment | 8 | 15 BYN | Test strip dipped in reservoir measures water content — flags brake fluid condition, Tier-1 brake/hydraulic defects at 80% | Single-use consumable (100 strips per pack; no ongoing cost modeled) |
| **Battery & Alternator Tester** | Equipment | 8 | 70 BYN | Clamp-on tester checks cold-cranking amps and charging voltage — Tier-1/2 electrical defects at 85% | Eliminates guessing on battery and alternator issues |
| **Paint Thickness Gauge** | Equipment | 9 | 120 BYN | Magnetic gauge measures paint depth in microns — detects repaints and filler with 90% accuracy (Tier-2 body/accident repairs) | Best tool for spotting panel respray |
| **OBDII Scanner with Live Data** | Equipment | 9 | 350 BYN | Named-brand scanner (e.g., Launch CRP129E) — Tier-2 engine + electrical at 80%; live sensor data stream; reads transmission codes | Upgrade over dongle; covers more protocols |

#### Tier 3 — Professional workshop equipment (unlock levels 10–15)

| Item | Type | Unlock Level | Cost | Detection Effect | Notes |
|------|------|--------------|------|-----------------|-------|
| **Full OBDII/CAN Diagnostic System** | Equipment | 10 | 1,200 BYN | Workshop-grade multi-brand scanner — all Tier-2 defects at 90%; Tier-3 engine + electrical at 75% | Covers VAG, BMW, KIA/Hyundai protocols beyond generic OBDII |
| **Leak-down Tester** | Equipment | 11 | 90 BYN | Pressurizes cylinders to locate leaks (valves, rings, head gasket) — Tier-3 engine defects at 75% | Pairs with Compression Tester; combined use gives +10% to Tier-3 engine detection |
| **Smoke Machine** | Equipment | 12 | 350 BYN | Injects smoke into intake/exhaust to find vacuum leaks and exhaust cracks — Tier-2/3 engine defects at 70%; finds issues invisible to OBDII | Reveals intake leaks, cracked manifolds |
| **Oscilloscope / Waveform Analyzer** | Equipment | 13 | 700 BYN | Reads electrical signal waveforms from sensors and injectors — Tier-3 electrical defects at 80%; catches intermittent faults | Overkill for early game; real shop tool |
| **Lifter / 4-Post Ramp** | Equipment | 14 | 5,500 BYN | Full vehicle access from below — all Tier-2 suspension and structural defects at 95%; removes the time penalty of Under-car Crawl | Fixed garage equipment; requires Garage Tier 4 |
| **Full Diagnostic Stand** (combined station) | Equipment | 15 | 9,000 BYN | Integrates ramp + full scanner + oscilloscope — all Tier-3 defects at 85%; Tier-1/2 at 98% | Requires Garage Tier 5; the endgame inspection setup |

> **Tool Upkeep** (Section 2.3) is now charged based on the highest *Tier 2 or Tier 3* equipment owned. Tier 0–1 items have no upkeep.

---

### 3.2 Negotiation Skills

Negotiation is a soft-skill tree that mixes social intuition, preparation, and psychological tactics. Skills compound — later ones assume earlier ones are owned.

| Skill | Unlock Level | Cost | Effect |
|-------|--------------|------|--------|
| **Casual Chat** | 1 (default) | Free | Opening small talk before any price discussion — +5% negotiation success; seller mood slightly more readable | Everyone starts here; baseline social skill |
| **Price Research** | 2 | 2,000 XP | Player checks market prices before meeting — shows "fair price estimate" on listing; sellers who are overpriced get −5% resistance to negotiation | Represents doing homework on Avito/Drom |
| **Point Out Flaws** | 3 | 3,000 XP | During negotiation, player can reference a visible defect to justify a lower price — +10% success if at least one Tier-1 defect has been found | Requires any inspection skill to have found a defect |
| **Anchor Low** | 4 | 4,500 XP | Player opens with a lower offer before the seller anchors — shifts the discount distribution: 5% tier removed, replaced by a flat +5% to all discount tiers | Psychological anchoring tactic |
| **Comfortable Silence** | 5 | 5,000 XP | After making an offer, player waits — +8% success; seller is more likely to break and counter rather than refuse flat | Passive; triggers automatically |
| **Build Rapport** | 6 | 6,000 XP | Extended pre-negotiation conversation — if seller_archetype is `pensioner` or `estate_sale`, +15% success; all others +5% | Empathy-based approach; persona-specific bonus |
| **Show Cash** | 7 | 7,000 XP | Signals immediate payment capability — +10% success on purchase; seller walk-away probability on failed negotiation reduced by 15% | Simulates "I have the money right now" signal |
| **Deadline Pressure** | 8 | 8,000 XP | Tells seller you're looking at another car today — +8% success if listing has been active ≥ 3 days; backfires (−5%) on fresh listings | Creates artificial urgency |
| **Read the Room** | 9 | 10,000 XP | Before negotiation, reveals seller mood indicator (cooperative / neutral / guarded) — allows player to choose negotiation approach | Replaces the need for Reading People (older design) |
| **Bundle Offer** | 10 | 11,000 XP | On the sell side, offer the buyer a "freshly serviced" framing if all defects were properly repaired — +12% buyer acceptance; +5% to asking price tolerance | Sell-side technique; requires zero unfixed proper-repair defects |
| **Loss Aversion Frame** | 11 | 13,000 XP | References a cost the seller will "keep spending" if they don't sell (storage, insurance) — +10% if listing is 4+ days old; seller_archetype `corporate_sale` gets +15% | Works best on motivated sellers |
| **Walk Away** | 12 | 15,000 XP | Player initiates a walk-away; seller has 40% chance to call back with a better offer (up to 5% additional discount) | High-risk tactic; if seller doesn't call back, deal is dead for 2 in-game days |
| **Professional Closer** | 14 | 20,000 XP | Summarizes the deal positively before asking for commitment — +10% success on final confirmation; reduces buyer inspection probability by an additional 5% on the sell side | Polished sales technique; sell-side and buy-side |
| **Market Authority** | 16 | 28,000 XP | Player references specific comparable sales to justify price — on sell side: +8% to asking price tolerance; on buy side: +12% negotiation success for cars priced > 15% above market | Requires Price Research; builds on established credibility |

**Negotiation success formula** (updated for expanded skill list):

Base: 25%. All owned skill bonuses are additive. Cap: 85%. Floor: 5%. Situational modifiers from Section 5.1 still apply on top.

---

### 3.3 Repair Skills

Repair skills follow the realistic progression of a hobbyist who starts with YouTube tutorials and gradually acquires proper technique and tooling. Each tier unlocks both new defect categories and reduces time/cost.

#### Tier 0 — Absolute beginner (levels 1–3)

| Skill | Unlock Level | Cost | What It Enables | Notes |
|-------|--------------|------|-----------------|-------|
| **Watch a Tutorial** | 1 (default) | Free | Basic Tier-1 cosmetic repairs (cleaning, polishing, minor interior fixes); 1.0× time | Starting state; everyone can do this |
| **Polish & Touch-up Paint** | 2 | 2,000 XP | Proper repair of: paint fade/oxidation, minor scratches; eliminates these as "quick fix only" defects | Realistic beginner skill; rattle-can and polish |
| **Interior Tidy** | 2 | 1,500 XP | Proper repair of: torn upholstery (partial), broken trim pieces; 0.9× time on interior defects | Reupholstery foam + fabric; no specialist tools |
| **Battery Swap** | 3 | 1,500 XP | Proper repair of: dead/weak battery; immediate (0 days) — previously a 0.5-day job | Trivial once you know which battery to buy |

#### Tier 1 — Handy owner (levels 4–7)

| Skill | Unlock Level | Cost | What It Enables | Notes |
|-------|--------------|------|-----------------|-------|
| **Basic Spanner Work** | 4 | 4,000 XP | Proper repair of: minor oil leaks (gaskets, drain plug), air filter, minor exhaust brackets; 0.9× time on Tier-1 engine | Requires basic socket set (bundled; no separate cost) |
| **Wheel & Brake Service** | 4 | 3,500 XP | Proper repair of: brake pad/disc wear, alignment issues (DIY), tyre swap; 0.9× time on Tier-1 suspension | Alignment still needs a workshop visit — time cost unchanged, but player can coordinate it |
| **Electrical Basics** | 5 | 4,000 XP | Proper repair of: dead battery, blown fuses, simple sensor replacements; Tier-1 electrical defects — 0.85× time | Wire strippers and a multimeter |
| **Fluid Services** | 5 | 3,500 XP | Proper repair of: transmission fluid leak (minor), coolant flush, brake fluid change; 0.85× time on Tier-1 fluid defects | Oil service skill prerequisite |
| **Windscreen & Glass** | 6 | 5,000 XP | Proper repair of: cracked windscreen (replacement), side/rear glass; removes these from "quick fix only" | Glass sourcing adds 1 in-game day; skill reduces installation time |
| **Dent Removal (PDR)** | 7 | 6,500 XP | Proper repair of: minor dents (< 3 cm) using paintless dent repair technique; 0.8× time on body Tier-1 | PDR tool kit costs 120 BYN (one-time, bundled with skill) |

#### Tier 2 — Competent amateur (levels 8–12)

| Skill | Unlock Level | Cost | What It Enables | Notes |
|-------|--------------|------|-----------------|-------|
| **Engine Seals & Belts** | 8 | 9,000 XP | Proper repair of: major oil leaks (seals), timing belt replacement, coolant system; 0.85× time on Tier-2 engine | Timing belt job: safety-critical; skill required or repair is auto-flagged as quick fix |
| **Gearbox Service** | 9 | 10,000 XP | Proper repair of: slipping gears (manual), transmission fluid flush, minor gearbox adjustments; 0.85× time on Tier-2 transmission | Automatic transmission still requires Tier 3 |
| **Suspension Rebuild** | 9 | 9,500 XP | Proper repair of: worn shock absorbers, ball joints, control arm bushings; 0.85× time on Tier-2 suspension | Requires floor jack (120 BYN, one-time) |
| **Body Filler & Respray** | 10 | 11,000 XP | Proper repair of: major dents, surface rust, panel damage; 0.8× time on body Tier-2 | Spray booth not required at this tier; results are good but not showroom |
| **Clutch Replacement** | 10 | 12,000 XP | Proper repair of: clutch wear (manual); unlocks what was previously unrepairable at this level | Gearbox removal required — takes 3 days base; this skill reduces to 2 days |
| **HVAC Service** | 11 | 10,000 XP | Proper repair of: A/C regas, A/C compressor swap, heater matrix; 0.85× time on Tier-2 interior HVAC | Refrigerant handling; requires a regas machine (650 BYN, one-time) |
| **Electrical Diagnostics** | 11 | 11,000 XP | Proper repair of: ABS/ESP sensors, airbag fault lights, wiring harness repairs; 0.85× time on Tier-2 electrical | Requires OBDII Scanner (purchased separately in inspection tree) |
| **Structural Rust Treatment** | 12 | 14,000 XP | Proper repair of: structural rust (frame/sills); prevents "not available" status on this defect; 0.9× time | Chassis work; requires Lifter or Under-car Crawl at minimum |

#### Tier 3 — Serious hobbyist / semi-pro (levels 13–17)

| Skill | Unlock Level | Cost | What It Enables | Notes |
|-------|--------------|------|-----------------|-------|
| **Engine Overhaul Basics** | 13 | 18,000 XP | Proper repair of: low compression (basic top-end work — valve seals, rings on accessible engines); 0.8× time on Tier-3 engine | Does not cover turbo or full bottom-end rebuild |
| **Automatic Gearbox Service** | 14 | 16,000 XP | Proper repair of: slipping gears (automatic), gearbox bearing wear; 0.8× time on Tier-2/3 transmission | Requires Gearbox Service (Tier 2) as prerequisite |
| **Full Body Respray** | 14 | 17,000 XP | Proper repair of: accident body damage, full panel replacement; showroom-quality result — resale value restored to 100% (vs 80% at Tier 2) | Spray booth required: 2,000 BYN upgrade, requires Garage Tier 4 |
| **Wiring Harness Repair** | 15 | 18,000 XP | Proper repair of: wiring harness damage (Tier-3 electrical); previously only quick-fixable | Time-intensive but unlocks a formerly blocked defect category |
| **Subframe & Chassis Repair** | 16 | 22,000 XP | Proper repair of: damaged subframe (Tier-3 suspension/structural); previously "not available" | Requires Lifter (Garage Tier 4 equipment) |
| **Turbo & Forced Induction** | 17 | 25,000 XP | Proper repair of: turbo wear (Tier-3 engine); 0.8× time on turbo-related defects | Specialized; only matters on turbocharged cars in the listing pool |

---

## 4. Car Market & Listings

### 4.1 Listing Screen Parameters

| Parameter | Value |
|-----------|-------|
| Total listings per refresh | 8 |
| Visible before scroll | 4 |
| Refresh trigger | Every 3 in-game days, or pay 80 BYN for immediate refresh |
| Listing expiry (individual, rolled at listing creation) | 3–7 in-game days |
| Expiry distribution | 3 days: 20% / 4 days: 30% / 5 days: 25% / 6 days: 15% / 7 days: 10% |

### 4.2 Listing Quality Distribution (per refresh)

| Quality Tier | Count | Description |
|--------------|-------|-------------|
| Bad Deal | 2 | Overpriced for condition; 3–5 defects; seller likely evasive |
| Below Average | 2 | Slightly overpriced; 2–3 defects |
| Fair Deal | 2 | Market price; 1–2 defects; seller neutral |
| Good Deal | 1 | Slightly below market; 1–2 visible minor defects |
| Bargain | 1 | Noticeably below market; 70% genuine / 30% trap (1 hidden Tier-3 defect) |

### 4.3 Car Price Ranges by Game Stage

| Stage | Levels | Budget Cars | Mid Cars | Premium Cars | Market Value Spread |
|-------|--------|-------------|----------|--------------|---------------------|
| Early | 1–5 | 1,200–3,500 BYN | — | — | ±10% |
| Mid-early | 6–9 | 2,000–5,000 BYN | 5,000–10,000 BYN | — | ±12% |
| Mid | 10–13 | 3,000–7,000 BYN | 7,000–15,000 BYN | 15,000–25,000 BYN | ±15% |
| Late | 14–20 | 4,000–9,000 BYN | 9,000–22,000 BYN | 22,000–50,000 BYN | ±15% |

Market Value Spread: true market value of any listed car deviates from asking price within this range. Bad deals sit at the high end; bargains at the low end.

### 4.4 Seller Dialogue Honesty Probabilities

| Reputation Tier | Honest | Evasive | Actively Misleads |
|-----------------|--------|---------|-------------------|
| Unknown (0–29) | 20% | 55% | 25% |
| Recognized (30–69) | 35% | 45% | 20% |
| Trusted (70–119) | 50% | 38% | 12% |
| Reputable (120–159) | 65% | 28% | 7% |
| Legendary (160–200) | 75% | 22% | 3% |

- **Honest:** Dialogue contains at least one truthful reference to a real defect.
- **Evasive:** Deflects without outright lying.
- **Actively misleads:** Describes a known defect as minor or already fixed.

---

## 5. Negotiation System

### 5.1 Purchase Negotiation

**Base success probability: 25%**

All modifiers are additive. Cap: 85%. Floor: 5%.

| Modifier | Effect |
|----------|--------|
| Smooth Talker skill | +15% |
| Deal Closer skill | +10% |
| Reputation: Trusted | +5% |
| Reputation: Reputable | +10% |
| Reputation: Legendary | +15% |
| Seller mood: cooperative (Reading People) | +10% |
| Seller mood: neutral | 0% |
| Seller mood: guarded | −10% |
| Listing active 4+ days (seller eager) | +8% |
| Recent failed negotiation with same seller | −15% |
| Car is a Bad Deal listing | +5% |

**Discount tiers on success (roll within success space):**

| Roll | Discount |
|------|----------|
| 1–40% | 5% off asking |
| 41–70% | 10% off asking |
| 71–90% | 15% off asking |
| 91–100% (requires Deal Closer) | 20–25% off asking |

Without Deal Closer: max discount 15%. With Deal Closer: max 25%.

**On failure:** No price increase. With Smooth Talker: one retry at 2 additional energy, using 60% of the original modified probability.

### 5.2 Sale Negotiation (Buyer Counter-Offers)

When a buyer offers below asking, player can counter. Base acceptance: 40%.

| Modifier | Effect |
|----------|--------|
| Reputation: Trusted | +8% |
| Reputation: Reputable | +15% |
| Reputation: Legendary | +20% |
| Car listed < 2 days | +10% |
| Car listed 5+ days | −15% |
| Defect discovered during inspection | −30% flat |
| Deal Closer skill | +12% |

---

## 6. Defect System

### 6.1 Detection Tier Definitions

- **Tier 1:** Revealed by Visual Check (free)
- **Tier 2:** Revealed by Tap Test Kit or OBD Scanner
- **Tier 3:** Revealed only by Full Diagnostic Stand

### 6.2 Body Defects

| Defect | Occurrence % | Detection Tier | Proper Repair Cost | Quick Fix Cost | QF Discovery % (base) | Resale Impact |
|--------|-------------|----------------|-------------------|----------------|----------------------|---------------|
| Surface rust (panels) | 35% | Tier 1 | 150–400 BYN | 40–80 BYN | 45% | −12% |
| Structural rust (frame/sills) | 15% | Tier 2 | 700–1,800 BYN | 120–280 BYN | 60% | −30% |
| Minor dents (< 3 cm) | 40% | Tier 1 | 80–200 BYN | 20–50 BYN | 25% | −6% |
| Major dents / panel replacement | 20% | Tier 1 | 350–900 BYN | 60–150 BYN | 35% | −18% |
| Cracked windscreen | 25% | Tier 1 | 200–550 BYN | 25–70 BYN | 70% | −15% |
| Cracked side/rear glass | 18% | Tier 1 | 100–300 BYN | 20–50 BYN | 65% | −10% |
| Paint fade / oxidation | 30% | Tier 1 | 180–450 BYN | 50–120 BYN | 30% | −8% |
| Accident repair (hidden) | 10% | Tier 3 | 900–2,500 BYN | Not available | — | −35% |

### 6.3 Engine Defects

| Defect | Occurrence % | Detection Tier | Proper Repair Cost | Quick Fix Cost | QF Discovery % (base) | Resale Impact |
|--------|-------------|----------------|-------------------|----------------|----------------------|---------------|
| Oil leak — minor (gasket) | 30% | Tier 1 | 120–320 BYN | 30–70 BYN | 50% | −10% |
| Oil leak — major (seal) | 15% | Tier 2 | 400–1,000 BYN | 80–180 BYN | 55% | −20% |
| Worn timing belt | 20% | Tier 2 | 280–650 BYN | Not available | — | −22% |
| Overheating (coolant system) | 18% | Tier 2 | 200–550 BYN | 40–120 BYN | 60% | −18% |
| Starting issues (starter motor) | 22% | Tier 1 | 180–420 BYN | 35–90 BYN | 40% | −12% |
| Low compression (engine wear) | 12% | Tier 3 | 1,200–3,500 BYN | 180–400 BYN | 75% | −40% |
| Turbo wear (turbocharged cars) | 10% | Tier 3 | 900–2,200 BYN | 150–350 BYN | 65% | −30% |

### 6.4 Transmission Defects

| Defect | Occurrence % | Detection Tier | Proper Repair Cost | Quick Fix Cost | QF Discovery % (base) | Resale Impact |
|--------|-------------|----------------|-------------------|----------------|----------------------|---------------|
| Slipping gears (automatic) | 15% | Tier 2 | 600–1,500 BYN | 120–280 BYN | 55% | −25% |
| Slipping gears (manual) | 20% | Tier 2 | 380–900 BYN | 80–180 BYN | 50% | −20% |
| Transmission fluid leak | 25% | Tier 1 | 100–280 BYN | 30–70 BYN | 45% | −10% |
| Clutch wear (manual) | 28% | Tier 2 | 420–950 BYN | Not available | — | −20% |
| Gearbox bearing wear | 12% | Tier 3 | 700–2,000 BYN | 120–300 BYN | 60% | −28% |

### 6.5 Suspension Defects

| Defect | Occurrence % | Detection Tier | Proper Repair Cost | Quick Fix Cost | QF Discovery % (base) | Resale Impact |
|--------|-------------|----------------|-------------------|----------------|----------------------|---------------|
| Worn shock absorbers | 35% | Tier 1 | 200–500 BYN | 40–100 BYN | 35% | −10% |
| Loose ball joints | 22% | Tier 2 | 150–400 BYN | 30–80 BYN | 50% | −14% |
| Alignment issues | 30% | Tier 1 | 60–130 BYN | 15–40 BYN | 20% | −5% |
| Worn control arm bushings | 25% | Tier 2 | 220–550 BYN | 50–120 BYN | 45% | −12% |
| Damaged subframe | 8% | Tier 3 | 900–2,500 BYN | Not available | — | −35% |

### 6.6 Interior Defects

| Defect | Occurrence % | Detection Tier | Proper Repair Cost | Quick Fix Cost | QF Discovery % (base) | Resale Impact |
|--------|-------------|----------------|-------------------|----------------|----------------------|---------------|
| Torn / worn upholstery | 35% | Tier 1 | 150–450 BYN | 35–90 BYN | 25% | −8% |
| Broken dashboard electronics | 28% | Tier 1 | 120–380 BYN | 25–70 BYN | 35% | −10% |
| Faulty A/C compressor | 20% | Tier 2 | 380–950 BYN | 70–180 BYN | 55% | −15% |
| A/C regas / minor fault | 30% | Tier 2 | 80–220 BYN | 20–55 BYN | 40% | −8% |
| Odometer rollback (fraud) | 5% | Tier 3 | Not applicable | Not available | — | −50% |
| Water damage (interior) | 8% | Tier 2 | 550–1,500 BYN | 110–280 BYN | 65% | −30% |

### 6.7 Electrical Defects

| Defect | Occurrence % | Detection Tier | Proper Repair Cost | Quick Fix Cost | QF Discovery % (base) | Resale Impact |
|--------|-------------|----------------|-------------------|----------------|----------------------|---------------|
| Weak / dead battery | 40% | Tier 1 | 80–180 BYN | 15–40 BYN | 15% | −5% |
| Faulty alternator | 18% | Tier 2 | 220–550 BYN | 45–110 BYN | 50% | −12% |
| ABS / ESP sensor fault | 20% | Tier 2 | 140–350 BYN | 30–80 BYN | 45% | −12% |
| Wiring harness damage | 10% | Tier 3 | 450–1,200 BYN | 90–220 BYN | 55% | −20% |
| Airbag fault light | 12% | Tier 2 | 160–420 BYN | 35–100 BYN | 60% | −18% |

### 6.8 Defect Count per Car

| Car Quality Tier | Min Defects | Max Defects | Mean |
|------------------|-------------|-------------|------|
| Bad Deal | 3 | 6 | 4.5 |
| Below Average | 2 | 4 | 3.0 |
| Fair Deal | 1 | 3 | 2.0 |
| Good Deal | 1 | 2 | 1.5 |
| Bargain (genuine) | 1 | 2 | 1.5 |
| Bargain (trap) | 2 | 4 | 3.0 (includes 1 Tier-3 guaranteed) |

**Constraint:** No single category contributes more than 2 defects to any one car.

**Roll method:** For each defect in the full table, roll against its occurrence probability independently. If count exceeds the max for quality tier, keep the most severe defects up to the cap.

### 6.9 Undetected Defect Complaint (Post-Sale)

If a defect was never found by either the player or buyer, and it surfaces post-sale:

- Complaint event fires 2–5 in-game days after sale.
- Refund demanded: 50–80% of the defect's proper repair cost.
- Player can **pay** (cash penalty, smaller reputation loss) or **refuse** (no cash penalty, reputation loss doubles).
- Reputation loss on refusal: −15 (double the standard −10 for quick-fix discovery, as this involves seller ignorance).

---

## 7. Inspection System

### 7.1 Inspection Tiers

| Tier | Name | Equipment Required | Energy Cost | Time Cost | Defects Revealed |
|------|----|-----------------|-------------|-----------|-----------------|
| 1 | Visual Check | None | 2 | Immediate | Tier-1 defects at 70% each |
| 2A | Tap Test | Tap Test Kit | 3 | Immediate | Tier-1 at 85%; Tier-2 all at 65% |
| 2B | OBD Scan | OBD Scanner | 3 | Immediate | Tier-1 at 85%; Tier-2 engine + electrical at 80%; Tier-2 body/suspension: 0% |
| 3 | Full Diagnostic | Diagnostic Stand | 4 | 1 in-game day | Tier-1 at 95%; Tier-2 at 90%; Tier-3 at 75% |

### 7.2 Skill Modifiers to Detection Rolls

| Skill | Modifier |
|-------|----------|
| Door & Panel Feel | +20% to detecting hidden body repairs across all inspection tiers |
| Torch & Mirror Set | +20% to all Tier-1 body and interior detection rolls |
| Under-car Crawl | Unlocks undercarriage defect detection (structural rust, frame damage) |
| Paint Thickness Gauge | +90% detection of hidden body repairs and Tier-2 panel defects (replaces visual roll for this category) |
| Pattern Recognition (from Full Diagnostic Stand tier) | Finding a defect in a category gives +20% to other defects in same category in the same inspection |

### 7.3 Combining Inspection Tiers

Inspections on the same car are additive. Running Visual Check then OBD Scan will reveal what each tier finds independently (each defect roll is made once per tier). Re-running the same tier on the same car provides no additional benefit — defect presence is locked at purchase time.

### 7.4 Rewarded Ad: Second Chance Inspection

Re-rolls all missed detection checks from the most recent inspection at the same tier's probability. Does not upgrade to a higher tier. Usable once per car.

---

## 8. Repair System

### 8.1 Repair Capability by Skill

The old three-tier repair gate (DIY / Semi-pro / Workshop-grade) is replaced by the granular skill tree in Section 3.3. Each skill unlocks specific defect types. The table below summarizes what is possible at each game phase.

| Game Phase | Levels | Key Repair Skills Typically Owned | Defect Categories Accessible |
|------------|--------|------------------------------------|------------------------------|
| Beginner | 1–4 | Watch a Tutorial, Polish & Touch-up, Interior Tidy, Battery Swap | Tier-1 cosmetic, battery |
| Handy Owner | 5–8 | Basic Spanner Work, Wheel & Brake, Electrical Basics, Fluid Services, Windscreen | Most Tier-1; select Tier-2 |
| Competent Amateur | 9–12 | Engine Seals, Gearbox Service, Suspension Rebuild, Body Filler, Clutch, HVAC, Electrical Diagnostics | Most Tier-2 |
| Semi-pro | 13–17 | Engine Overhaul, Auto Gearbox, Full Respray, Wiring Harness, Subframe, Turbo | All Tier-3 accessible |

Without the relevant skill, the player can only quick-fix that defect type.

### 8.2 Time Costs

| Defect Severity | Proper Repair (base days) | Quick Fix (base days) |
|----------------|--------------------------|----------------------|
| Minor (e.g., alignment, battery) | 0.5 | 0 (immediate) |
| Moderate (e.g., minor oil leak, worn shocks) | 1 | 0 (immediate) |
| Significant (e.g., clutch, A/C compressor) | 2 | 0.5 |
| Major (e.g., structural rust, gearbox) | 3 | 1 |
| Severe (e.g., low compression, subframe) | 4 | 1.5 |

**Skill time multipliers** (applied to proper repair base time, round up to nearest 0.5 days):
- Tier 0 skills (Watch a Tutorial, etc.): 1.0×
- Tier 1 skills (Basic Spanner Work, etc.): 0.9×
- Tier 2 skills (Engine Seals, Gearbox Service, etc.): 0.85×
- Tier 3 skills (Engine Overhaul, Full Respray, etc.): 0.80×

Multiple repairs on the same car queue and run sequentially.

**Real-time calibration:** 1 in-game day = 2 real hours. A 3-day proper repair = 6 real hours (returnable next session). Adjust `INGAME_DAY_REAL_MINUTES` based on retention data.

### 8.3 Quick Fix Discovery Probability Formula

```
EffectiveDiscovery = BaseQFDiscovery + ReputationModifier + BuyerModifier

ReputationModifier:
  Legendary (160–200): −20%
  Reputable (120–159): −12%
  Trusted   (70–119):  −6%
  Recognized (30–69):   0%
  Unknown    (0–29):   +10%

BuyerModifier:
  Buyer requests professional inspection: +25%
  Casual buyer (default):                  0%

Floor: 5%   Ceiling: 95%
```

### 8.4 Resale Value Impact of Repairs

| Repair Type | Value Restoration |
|-------------|------------------|
| Proper repair | 100% — defect resale impact fully removed |
| Quick fix | 40% — partial price recovery; underlying risk remains |

**Example:** Car market value 3,500 BYN. Major dents (−18% = −630 BYN). Proper repair restores full 630 BYN. Quick fix restores 252 BYN.

---

## 9. Selling System

### 9.1 Asking Price vs Market Value

| Asking Price (% of Market Value) | Day 1 Inquiry Prob | Day 2–3 Prob | Day 4+ Prob |
|----------------------------------|-------------------|--------------|-------------|
| < 90% | 95% | 90% | 85% |
| 90–100% | 70% | 60% | 50% |
| 100–110% | 50% | 40% | 30% |
| 110–120% | 25% | 18% | 12% |
| > 120% | 8% | 5% | 3% |

Listing above 120% of market value: near-zero organic demand. Below 85%: likely sale within 1 in-game day.

**Market value estimate display accuracy:**

| Level Range | Display Accuracy |
|-------------|-----------------|
| 1–4 | ±15% of true value |
| 5–9 | ±8% of true value |
| 10+ | ±5% of true value |

**Reputation bonus to all inquiry probabilities:**

| Tier | Bonus |
|------|-------|
| Trusted | +5% |
| Reputable | +10% |
| Legendary | +15% |

### 9.2 Inquiry Count per Day (when inquiry occurs)

| Roll | Simultaneous Inquiries |
|------|----------------------|
| 1–60% | 1 |
| 61–90% | 2 |
| 91–100% | 3 |

Each inquiry is an independent buyer NPC.

### 9.3 Buyer Inspection Probability Formula

```
InspectionChance = 30% + ReputationMod + PriceMod

ReputationMod:
  Legendary: −20%
  Reputable: −12%
  Trusted:   −6%
  Recognized:  0%
  Unknown:   +15%

PriceMod:
  Asking > 110% market: +10%
  Asking 90–110%:         0%
  Asking < 90%:          −5%

Floor: 5%
```

**What buyer inspection reveals:**
- Unaddressed defects: Tier-2 equivalent inspection (Tap Test probabilities).
- Quick-fixed defects: applies Section 8.3 formula.
- Properly repaired defects: 2% residual "signs of prior repair" note (cosmetic; −5% price expectation only for Tier-3 defects).

### 9.4 Defect Discovery Consequences

| Defect Severity | Buyer Behavior |
|----------------|----------------|
| Minor (Tier-1) | Requests 50–80% of proper repair cost as price reduction; 20% walk-away |
| Moderate (Tier-2) | Requests 70–100% of proper repair cost as price reduction; 40% walk-away |
| Major/Severe (Tier-3) | Requests 100–130% of proper repair cost; 65% walk-away |

Walk-away is the probability the buyer withdraws if the price reduction demand is countered. Accepting the reduction completes the sale with reputation impact per Section 1.4.

### 9.5 Listing Expiry

- On expiry without sale: listing removed, reputation −1, player must re-list (1 energy).
- Re-listing resets the expiry timer; price is unchanged.
- Rewarded ad: extend listing by 2 days (once per listing).

---

## 10. Economy Balancing

### 10.1 Starting State

| Parameter | Value |
|-----------|-------|
| Starting money | 2,000 BYN |
| Starting energy | 20 (full) |
| Starting reputation | 50 (Recognized) |
| Starting level | 1 |
| Starting garage | Tier 1 (1 slot, free) |
| First rent charge | Day 8 (first week rent-free) |
| Tutorial car | Pre-selected Fair Deal, 1,500 BYN, 1 moderate defect, guided through full loop |

### 10.2 Target Profit Margins

| Stage | Levels | Typical Buy | Typical Repairs | Typical Sell | Target Net Profit | Margin |
|-------|--------|-------------|----------------|-------------|-------------------|--------|
| Early | 1–5 | 1,700 BYN | 300 BYN | 2,300 BYN | 250–380 BYN | 15–20% |
| Mid-early | 6–9 | 4,000 BYN | 650 BYN | 5,500 BYN | 600–900 BYN | 15–22% |
| Mid | 10–13 | 8,500 BYN | 1,200 BYN | 11,500 BYN | 1,400–2,000 BYN | 18–24% |
| Late | 14–20 | 17,000 BYN | 2,200 BYN | 23,500 BYN | 3,200–4,500 BYN | 20–28% |

Holding costs and rent are included in these margins (assuming 7–10 in-game day flip cycle).

### 10.3 Typical Flip Timeline

| Phase | Duration (in-game days) |
|-------|------------------------|
| Browse listings and decide | 0–3 |
| Purchase and initial inspection | Day 0 |
| Full inspection (if stand used) | Day 0–1 |
| Repair queue (2–3 typical defects) | Day 1–5 |
| Listing and first buyer contact | Day 5–6 |
| Negotiation and sale | Day 6–10 |
| **Total typical flip** | **7–10 days** |

At 2 real hours per in-game day: a full flip takes 14–20 real hours across 5–8 sessions.

### 10.4 Cash Stress System

| Parameter | Value |
|-----------|-------|
| Cash stress entry threshold | 400 BYN |
| Cash stress exit threshold | 900 BYN (hysteresis prevents toggling) |
| UI indicator | Red tint on currency display, "Tight on cash" label |

**Effects while in cash stress:**
- Negotiation success −10% (sellers detect desperation)
- Holding cost UI highlighted as critical
- Rewarded ad for waiving holding cost becomes more prominent

**Survival floor:** A level-1 player buying a 1,500 BYN Fair Deal, doing no repairs, and selling at 1,650 BYN nets approximately 50 BYN after rent and holding. Minimal play is survivable; optimal play yields 250–380 BYN.

### 10.5 Weekly Expense Reference (Early Game, Tier 1 Garage)

| Expense | Amount | Frequency |
|---------|--------|-----------|
| Garage rent | 200 BYN | Every 7 in-game days |
| Tool upkeep (OBDII Scanner with Live Data) | 100 BYN | Every 30 in-game days |
| Holding cost (1 car, 7 days) | 84 BYN | Per flip cycle |
| Repair parts (typical early car) | 250–500 BYN | Per flip |
| **Total operating cost per flip** | **~634–884 BYN** | |

Break-even sell price with a 1,700 BYN buy = ~2,400–2,600 BYN.

---

## 11. AI Dialogue Prompts

### 11.1 Seller Dialogue — Injected Variables

| Variable | Type | Description |
|----------|------|-------------|
| `seller_archetype` | Enum | `pensioner`, `young_lad`, `middle_aged_mechanic`, `corporate_sale`, `estate_sale` |
| `honesty_mode` | Enum | `honest`, `evasive`, `misleading` |
| `car_make_model_year` | String | e.g., "ВАЗ 2107, 2003 г." |
| `car_mileage` | Integer | Odometer in km |
| `asking_price` | Integer | Seller's listed price |
| `days_listed` | Integer | Days listing has been active |
| `known_defects_to_seller` | Array | All Tier-1 defects; 50% of Tier-2 defects; 0% of Tier-3 |
| `player_reputation_tier` | String | Tier name from Section 1.4 |
| `negotiation_attempt` | Boolean | Whether player is negotiating price |
| `region` | String | e.g., "Москва", "Екатеринбург", "Алматы" |

### 11.2 Seller Dialogue Prompt Template (Russian)

```
Ты продаёшь автомобиль через мессенджер (WhatsApp / Telegram).

ПЕРСОНАЖ: {{seller_archetype}}
  pensioner          — Пожилой мужчина. Продаёт свою единственную машину. Неспешен, с деталями о прошлом.
  young_lad          — Парень 22–25 лет. Торопится продать. Короткие сообщения, молодёжный сленг.
  middle_aged_mechanic — Мужик 40–50 лет. Технически грамотен, честен о механике.
  corporate_sale     — Продаёт корпоративный автомобиль. Официальный тон, минимум деталей.
  estate_sale        — Продаёт машину умершего родственника. Не знает деталей, немного растерян.

РЕЖИМ ЧЕСТНОСТИ: {{honesty_mode}}
  honest      — Говори правду. Упомяни хотя бы один дефект из списка: {{known_defects_to_seller}}.
  evasive     — Уходи от прямых вопросов. Не лги, но и не раскрывай проблемы.
  misleading  — Описывай {{known_defects_to_seller[0]}} как незначительный или уже устранённый.

ДАННЫЕ ОБЪЯВЛЕНИЯ:
  Машина:    {{car_make_model_year}}
  Пробег:    {{car_mileage}} км
  Цена:      {{asking_price}} BYN
  Висит:     {{days_listed}} дн.

ЗАДАЧА:
  Напиши 2–3 коротких сообщения — ответ на вопрос покупателя о состоянии автомобиля.
  {{#if negotiation_attempt}}
  Покупатель предлагает скидку. Реагируй согласно персонажу: соглашайся, торгуйся или отказывай.
  {{/if}}

ОГРАНИЧЕНИЯ:
  — Максимум 3 сообщения подряд
  — Каждое сообщение не длиннее 2 предложений
  — Разговорный стиль для региона: {{region}}
  — Не придумывай дефекты, которых нет в списке
  — Не раскрывай, что ты ИИ
```

### 11.3 Buyer Dialogue — Injected Variables

| Variable | Type | Description |
|----------|------|-------------|
| `buyer_archetype` | Enum | `first_car_buyer`, `family_man`, `mechanic`, `reseller`, `cautious_retiree` |
| `car_make_model_year` | String | |
| `asking_price` | Integer | Player's asking price |
| `market_value_estimate` | Integer | Buyer's estimate (±8% of true value) |
| `days_since_listing` | Integer | |
| `player_reputation_tier` | String | |
| `defects_discovered` | Array | Defects found during inspection (empty if none) |
| `inspection_result` | Enum | `not_requested`, `clean`, `issues_found` |
| `offer_amount` | Integer | Buyer's calculated offer (engine-computed per Section 9.4) |
| `negotiation_round` | Integer | 1 = first contact; 2+ = follow-up |
| `region` | String | |

### 11.4 Buyer Dialogue Prompt Template (Russian)

```
Ты ищешь подержанный автомобиль и переписываешься с продавцом.

ПЕРСОНАЖ: {{buyer_archetype}}
  first_car_buyer   — Первая машина. Немного наивен, задаёт базовые вопросы, легко воодушевляется.
  family_man        — Практичный, смотрит на надёжность. Торгуется умеренно.
  mechanic          — Разбирается в машинах. Технические вопросы, скептичен к размытым ответам.
  reseller          — Хочет купить дёшево и продать дальше. Ищет максимальную скидку, холоден.
  cautious_retiree  — Осторожен, не торопится, много уточняет. Честность для него важна.

ОБЪЯВЛЕНИЕ:
  Машина:             {{car_make_model_year}}
  Цена продавца:      {{asking_price}} BYN
  Объявление висит:   {{days_since_listing}} дн.
  Репутация продавца: {{player_reputation_tier}}

{{#if (eq inspection_result "issues_found")}}
РЕЗУЛЬТАТ ОСМОТРА — найдены проблемы:
  {{defects_discovered}} (перечисли по-русски)
Реагируй на находки согласно персонажу. mechanic — категоричен; first_car_buyer — растерян.
Предложи цену {{offer_amount}} BYN или откажись от сделки.
{{/if}}

{{#if (eq inspection_result "clean")}}
Осмотр прошёл хорошо. Выражай готовность к сделке. С вероятностью 35% попробуй ещё немного поторговаться.
{{/if}}

{{#if (eq inspection_result "not_requested")}}
  {{#if (eq negotiation_round 1)}}
  Первый контакт. Задай 1–2 вопроса об истории машины или состоянии.
  {{else}}
  Переходи к предложению цены: {{offer_amount}} BYN.
  {{/if}}
{{/if}}

ОГРАНИЧЕНИЯ:
  — Максимум 3 сообщения подряд
  — Каждое сообщение не длиннее 2 предложений
  — Разговорный стиль для региона: {{region}}
  — Не раскрывай, что ты ИИ
```

### 11.5 API Parameters

| Parameter | Seller Dialogue | Buyer Dialogue |
|-----------|----------------|----------------|
| Temperature | 0.85 | 0.80 |
| Max tokens | 200 | 200 |
| Top-p | 0.92 | 0.90 |
| Frequency penalty | 0.4 | 0.4 |
| Presence penalty | 0.2 | 0.2 |

Lower temperature for buyers: their mechanical outcomes (offer amount, walk-away) are already calculated by the engine. The prompt renders the dialogue, not the decision.

### 11.6 Fallback Dialogue

On API failure or timeout (> 3 seconds), fall back to a local pre-written pool:

| Pool | Minimum Size |
|------|-------------|
| Seller messages per honesty_mode | 15 (45 total) |
| Buyer messages per archetype per inspection_result | 15 (225 total) |

Fallback messages must be tagged by archetype and region to avoid obvious mismatches.

---

## Appendix A: Constants Reference

All values suitable for extraction into a typed constants file (e.g., `balance-constants.ts`).

| Constant | Value | Section |
|----------|-------|---------|
| `ENERGY_REGEN_INTERVAL_MINUTES` | 12 | 1.3 |
| `ENERGY_AD_REFILL_COOLDOWN_HOURS` | 4 | 1.3 |
| `REPUTATION_START` | 50 | 1.4 |
| `REPUTATION_MIN` | 0 | 1.4 |
| `REPUTATION_MAX` | 200 | 1.4 |
| `INGAME_DAY_REAL_MINUTES` | 120 | 8.2 |
| `STARTING_MONEY` | 2,000 BYN | 10.1 |
| `CASH_STRESS_ENTRY` | 400 BYN | 10.4 |
| `CASH_STRESS_EXIT` | 900 BYN | 10.4 |
| `LISTINGS_PER_REFRESH` | 8 | 4.1 |
| `LISTING_REFRESH_MANUAL_COST` | 80 BYN | 4.1 |
| `LISTING_REFRESH_INTERVAL_DAYS` | 3 | 4.1 |
| `MAX_NEGOTIATION_DISCOUNT_BASE` | 15% | 5.1 |
| `MAX_NEGOTIATION_DISCOUNT_DEALCLOSER` | 25% | 5.1 |
| `NEGOTIATION_BASE_SUCCESS` | 25% | 5.1 |
| `NEGOTIATION_SUCCESS_CAP` | 85% | 5.1 |
| `NEGOTIATION_SUCCESS_FLOOR` | 5% | 5.1 |
| `BUYER_BASE_INQUIRY_CHANCE_DAY1` | 70% (at market price) | 9.1 |
| `BUYER_INSPECTION_BASE_CHANCE` | 30% | 9.3 |
| `QUICK_FIX_VALUE_RESTORATION` | 40% | 8.4 |
| `PROPER_REPAIR_VALUE_RESTORATION` | 100% | 8.4 |
| `DEFECT_MAX_PER_CATEGORY` | 2 | 6.8 |
| `AI_SELLER_TEMPERATURE` | 0.85 | 11.5 |
| `AI_BUYER_TEMPERATURE` | 0.80 | 11.5 |
| `AI_MAX_TOKENS` | 200 | 11.5 |
| `AI_TIMEOUT_MS` | 3,000 | 11.6 |

---

## Appendix B: Design Notes for Implementers

**XP as dual currency.** XP advances levels *and* is spent to purchase skills. Total XP earned through level 20 (~41,550) is intentionally far less than the total cost of all skills across all three trees (inspection, negotiation, repair combined exceed 250,000 XP). Players must specialize heavily — someone who builds out the full inspection tree and several negotiation skills will barely touch the repair tree. This creates distinct player archetypes (the diagnostic specialist who buys cheap and flips fast vs. the repair-focused player who extracts maximum value per car). Playtesting should verify the tension is meaningful but not punishing.

**In-game day speed tuning.** `INGAME_DAY_REAL_MINUTES = 120` (2 real hours) is a starting point. If retention data shows players dropping off before returning for completed repairs, reduce to 90. If players feel rushed or unable to keep up with listing decay, increase to 150.

**Defect probability stacking.** Roll each defect's occurrence probability independently. If the total count exceeds the quality-tier cap (Section 6.8), keep the most severe defects up to the cap and discard the rest. This prevents a car from having 10+ defects while preserving severity distribution.

**Category cap enforcement.** No more than 2 defects per category per car (Section 6.8). Apply this as a post-roll filter: if 3 body defects roll positive, keep only the 2 most severe.

**AI dialogue budget.** With 1–2 sessions per day and ~3 AI calls per flip cycle (seller inquiry + 1–2 buyer exchanges), expect approximately 6–9 AI API calls per player per day per active car. At Garage Tier 2 (2 cars), this is 12–18 calls/player/day. Budget API costs at this rate.

**Monetization placement.** The highest-friction moments are: (1) waiting for a repair to complete, (2) holding cost accumulating on an unsold car, (3) missing a defect during inspection. Rewarded ads target exactly these three moments. They should surface as contextual in-context prompts (e.g., a "Watch ad to skip wait" button appearing on the repair timer), not as a separate monetization screen, to feel helpful rather than extractive.

**Odometer rollback (5% occurrence, Tier 3).** This defect has no proper repair — it is an information revelation event. If discovered by the buyer, the game treats it as a scam and the reputation penalty is severe (−15, as per dispute). Implementers: flag this defect type separately in code so it doesn't route through the normal repair system.

**Quick fixes marked "Not available"** for certain defects (worn timing belt, clutch wear, damaged subframe) reflect defects where a temporary fix would be unsafe or mechanically impossible. The player's only option is a proper repair or selling the car as-is (buyer will inspect and price-reduce accordingly).
