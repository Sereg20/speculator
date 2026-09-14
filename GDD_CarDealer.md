# Car Dealer Simulator — Game Design Document

## 1. Overview

A mobile car-dealing simulation game for Russian-speaking CIS users. The player acts as a car dealer: buying cars, diagnosing defects, repairing them, and reselling at a profit. The killer feature is AI-generated dialogue — every seller and buyer responds uniquely, keeping the experience fresh indefinitely.

---

## 2. Core Concept

The player flips used cars for profit. Every car bought has hidden defects. The player must diagnose, repair, and sell — balancing quality of repairs against cost, speed, and reputation. Poor repairs risk blowback; overpricing kills demand. The game rewards smart decisions, not grinding.

---

## 3. Player Stats & Progression

| Stat | Description |
|---|---|
| **Money** | Primary currency. Used for buying cars, parts, tools, garage upgrades. |
| **Experience (XP)** | Earned by completing deals. Drives level-up. |
| **Level** | Unlocks new skills, equipment, garage tiers, and car types. |
| **Energy** | Spent on actions (inspection, repair, negotiation). Replenishes over time or via ads. |
| **Reputation** | Affected by repair quality, pricing fairness, and deal outcomes. |

---

## 4. Garage System

The garage is the player's base. It has a limited number of parking spaces — cars can only be bought if a space is free.

| Tier | Description | Spaces |
|---|---|---|
| 1 | Yard parking spot | 1 |
| 2 | Dilapidated single garage | 2 |
| 3 | Two-car garage | 3 |
| 4 | Proper workshop | 4 |
| 5 | Full dealership lot | 5 |

Upgrades unlock at specific player levels and cost money. Each tier also has a higher recurring rent cost (see Section 13.2).

---

## 5. Skills & Equipment

Skills are purchased with XP or money as the player levels up. They reduce costs, improve outcomes, and unlock new actions.

**Inspection skills** (affect how many defects are found before/after purchase):
- Visual check (basic) → Tap test → OBD scanner → Full diagnostic stand

**Negotiation skills** (affect haggling success probability):
- Basic bargaining → Smooth talker → Deal closer

**Repair skills** (affect repair quality ceiling and cost):
- DIY repairs → Semi-pro → Workshop-grade

**Concealment** is intentionally excluded — repairs are either proper or a "quick fix" (see Section 9).

---

## 6. Car Listings & Market

A randomized list of cars is generated each session refresh. The list is balanced:
- A portion of listings are clearly bad deals (overpriced, heavily damaged)
- A portion are fair deals
- A small portion are genuine bargains

Listings contain: make, model, year, mileage, asking price, and a brief seller description. Not all defects are visible in the listing — the player must inspect after purchase.

**Listing expiry:** Each listing is available for a limited number of in-game days. If the player doesn't act, the car is sold to another buyer and disappears from the list.

---

## 7. Buying Flow

1. Player browses the listing.
2. Player can optionally ask the seller: *"What's the deal with this car?"*
   - Seller responds via AI-generated dialogue.
   - Probability of honest disclosure scales with player Reputation — higher reputation = seller more likely to reveal issues.
   - Default: seller stays vague or deflects.
3. Player can attempt to negotiate the price (governed by Negotiation skill + Reputation).
4. Player confirms purchase — car is placed in a garage slot.

---

## 8. Diagnostics & Inspection

After purchase, the player can inspect the car to reveal hidden defects. Inspection depth depends on available skills and equipment:

- **Basic (early game):** Visual + tap test — reveals obvious defects only.
- **Intermediate:** OBD scan — reveals engine/electronics issues.
- **Advanced:** Full diagnostic stand — reveals all defects.

Undetected defects remain hidden until the buyer inspects the car during the sale, at which point they become the player's problem.

---

## 9. Repair System

Each defect can be fixed in one of two ways:

| Type | Cost | Time | Risk |
|---|---|---|---|
| **Proper repair** | Higher | Longer | Problem is fully resolved |
| **Quick fix** | Lower | Shorter | Problem may resurface during buyer's inspection |

The chance of a quick fix being discovered scales with the buyer's scrutiny level (affected by player Reputation — high-reputation sellers face less scrutiny).

Repair costs are paid upfront from the player's cash balance.

---

## 10. Selling Flow

1. Player lists the car with an asking price.
2. AI-generated buyer messages arrive over in-game time — inquiries, offers, and objections.
3. Buyer may request an inspection (probability reduced by high Reputation).
4. If a quick-fix defect is discovered, the deal may fall through or require a price reduction.
5. Successful sale adds money and XP; failed inspection damages Reputation.

**Buyer demand decay:** The longer a car sits listed, the fewer daily inquiries it receives. Price it right and sell fast.

---

## 11. Reputation System

Reputation is a core stat that acts as a multiplier across many game systems.

| Action | Effect |
|---|---|
| Proper repair + fair price | Reputation +++ |
| Quick fix discovered by buyer | Reputation --- |
| Overpriced car takes weeks to sell | Reputation - |
| Successful negotiation (buy side) | Reputation + |
| Seller reveals issues to you (buy side) | Driven by your Reputation |
| Buyer skips inspection (sell side) | Driven by your Reputation |

---

## 12. Breakdown Types

A static but broad list, balanced for probability and repair cost. Categories:

- **Body:** Rust, dents, cracked glass, paint damage
- **Engine:** Oil leaks, worn belts, overheating, starting issues
- **Transmission:** Slipping gears, fluid leaks, clutch wear
- **Suspension:** Worn shocks, loose joints, alignment issues
- **Interior:** Broken electronics, torn upholstery, faulty A/C
- **Electrics:** Dead battery, faulty sensors, wiring issues

Each breakdown has:
- Detection difficulty (affects which inspection tier reveals it)
- Repair cost range
- Quick-fix failure probability
- Impact on resale value if discovered

---

## 13. Time & Economy

### 13.1 Time Pressure

The game runs on an **in-game day cycle**. Key actions advance time:

- Browsing listings: free (no time cost)
- Traveling to view/buy a car: costs time
- Each repair task: costs 1–3 in-game days depending on complexity
- Listing a car for sale: free, but each day it sits costs holding fees

**Listing expiry:** Car listings on the market are available for a limited window (e.g., 3–7 in-game days). If the player delays, the car is gone.

**Buyer demand decay:** Once a car is listed for sale, daily inquiry rate peaks early and declines if the car sits. The player is incentivized to price correctly and sell promptly.

**In-game calendar:** The player can see the current day and track upcoming expenses (see 13.2). This creates natural planning tension — do you buy another car now, or wait until after you sell the one you're holding?

### 13.2 Cash Flow & Expenses

The player has recurring costs that must be paid regardless of deal activity:

| Expense | Frequency | Notes |
|---|---|---|
| **Garage rent** | Per in-game week | Scales with garage tier. Not paying triggers a grace period, then lockout. |
| **Tool/equipment upkeep** | Per in-game month | Minor cost; scales with equipment owned. |
| **Repair parts** | Per repair job | Paid upfront before the car is sold. |
| **Holding cost** | Per unsold car per day | A small daily fee for each car sitting in the garage. |

**Cash stress state:** If the player's balance drops near zero, certain actions become unavailable (e.g., can't buy a new car, repair options limited to quick fixes only). This creates a meaningful risk state without a hard game-over — the player must hustle to recover.

> Loans and credit mechanics are deferred to a future version (see Section 16).

---

## 14. AI Integration

AI-generated dialogue replaces all hard-coded NPC responses, ensuring every interaction feels unique.

**Seller dialogue (buy flow):**
- Triggered when player asks "What's the deal with this car?"
- AI generates a contextually appropriate response: honest, evasive, or misleading — weighted by game mechanics
- Tone matches the seller persona (e.g., old man, shady dealer, private owner)

**Buyer dialogue (sell flow):**
- AI generates inquiry messages, counter-offers, complaints, and acceptance messages
- Reflects the car's condition, price, and player's reputation
- Creates the feeling of dealing with real people

All AI calls are lightweight prompts with game state injected as context (car details, defects found, player reputation, etc.).

---

## 15. Monetization — Ads

Ads are integrated non-intrusively into natural game moments:

| Trigger | Ad Type | Benefit |
|---|---|---|
| Energy runs out | Rewarded video | Restore full energy |
| Holding cost due | Rewarded video | Waive today's holding fee |
| Inspection failed | Rewarded video | Get a second chance / partial refund |
| Listing expires | Rewarded video | Extend listing by N days |

Ads are **never forced** — always player-initiated in exchange for a tangible benefit.

---

## 16. Extension Plan (Future Versions)

The following features are explicitly planned for post-launch updates. They are **not** part of v1 scope but should be kept in mind during architecture to avoid blocking them later.

### Progression & Retention
- **Daily / weekly challenges:** "Sell 3 cars this week", "Earn X profit on a single flip" — drives return visits
- **Event system:** Seasonal demand spikes, market fluctuations, special car drops
- **Competitor NPCs:** Other dealers bidding on the same listing — adds FOMO and urgency
- **Leaderboards:** Reputation or profit rankings between players
- **Achievement system:** Milestone rewards for long-term engagement

### Economy Depth
- **Loan / credit system:** Borrow money early game at risk — high tension mechanic
- **Parts marketplace:** Source specific parts at varying prices instead of flat repair costs
- **Car condition degradation:** Unsold cars slowly deteriorate (battery drain, tire flat) — urgency to sell

### Monetization Expansion
- **Premium currency:** Soft currency for convenience items, cosmetics, or skip timers
- **Battle / season pass:** Timed progression track with exclusive rewards

### New Content
- **Car tuning:** Upgrade a car before selling for a higher margin (cosmetic + performance)
- **New car types:** Trucks, motorcycles, classic cars — each with unique breakdown profiles
- **New garage locations / regions**
