# Car Dealer Simulator — UI Implementation Plan

**Stack:** React Native (Expo) · Expo Router (file-based) · TanStack Query · Zustand · NativeWind (Tailwind for RN)
**Design language:** Dark-themed, utilitarian — Soviet-garage aesthetic. Deep grays, amber accents, worn-metal textures.
**API base:** All data from the Fastify backend. No game logic on the client.
**Currency display:** BYN everywhere. Format: `4 200 BYN` (space as thousands separator).

---

## Monorepo Wiring

```
apps/mobile/
├── app/                        # Expo Router — file = route
│   ├── _layout.jsx             # Root layout: auth gate, theme, QueryClient
│   ├── (auth)/
│   │   └── login.jsx           # Device ID registration / login
│   └── (tabs)/
│       ├── _layout.jsx         # Tab bar config
│       ├── market.jsx          # Browse listings
│       ├── garage.jsx          # Owned cars + repairs
│       ├── sales.jsx           # Active listings + inquiries
│       └── profile.jsx         # Stats, skills, equipment
├── components/
│   ├── ui/                     # Primitives (Button, Card, Badge, Modal, ...)
│   ├── market/                 # ListingCard, SellerDialogueModal, NegotiateSheet
│   ├── car/                    # CarCard, DefectList, DefectBadge
│   ├── inspection/             # InspectionTierPicker, RevealAnimation
│   ├── repair/                 # RepairCard, RepairTimer, RepairTypeToggle
│   └── sales/                  # InquiryCard, NegotiationThread, SaleSummary
├── hooks/                      # TanStack Query hooks (one file per domain)
│   ├── useMarket.js
│   ├── useGarage.js
│   ├── useInspection.js
│   ├── useRepair.js
│   ├── useSales.js
│   └── usePlayer.js
├── stores/                     # Zustand (UI-only ephemeral state)
│   ├── authStore.js            # token + playerId
│   └── uiStore.js              # modals, active tab overrides
├── services/
│   └── api.js                  # Typed fetch wrappers (one per endpoint)
└── constants/
    └── theme.js                # Colors, spacing, typography tokens
```

---

## Phase Map

```
Phase UI-0 (Bootstrap)
    ↓
Phase UI-1 (Auth + Shell)
    ↓
Phase UI-2 (Market — Browse + Buy)
    ↓
Phase UI-3 (Garage + Inspection)
    ↓
Phase UI-4 (Repair)
    ↓
Phase UI-5 (Selling + Inquiries)
    ↓
Phase UI-6 (Progression — Profile, Skills, Equipment)
    ↓
Phase UI-7 (Polish + Animations)
    ↓
Phase UI-8 (Ads + Push Notifications)
```

---

## Phase UI-0 — Bootstrap
**Goal:** Expo app runs on device/simulator, connects to the server, hot-reload works.

### Deliverables
- [ ] `npx create-expo-app@latest apps/mobile --template blank-typescript` inside the monorepo
- [ ] Expo Router installed and configured (`expo-router`, `expo-linking`)
- [ ] NativeWind v4 installed (`nativewind`, `tailwindcss`) — `tailwind.config.js` with design tokens
- [ ] TanStack Query v5: `QueryClient` in root `_layout.jsx`, `useQuery`/`useMutation` available
- [ ] Zustand: `authStore` holding `{ token, playerId, setAuth, clearAuth }`
- [ ] `services/api.js`: base `apiFetch(path, options)` that injects `Authorization: Bearer <token>` and parses `{ data, error, meta }` envelope — throws on `error !== null`
- [ ] `.env` wired: `EXPO_PUBLIC_API_URL` used everywhere, never hardcoded
- [ ] `app/_layout.jsx`: wraps children in `QueryClientProvider`, reads token from `expo-secure-store` on mount, redirects to `/(auth)/login` if absent
- [ ] `GET /health` check on launch — if server unreachable show a full-screen error with retry
- [ ] Minimal `constants/theme.js`:
  ```js
  export const colors = {
    bg:       '#141414',   // near-black
    surface:  '#1F1F1F',   // card background
    border:   '#2E2E2E',
    accent:   '#E8A020',   // amber
    textPrimary: '#F0F0F0',
    textSecondary: '#8A8A8A',
    success:  '#4CAF50',
    danger:   '#E53935',
    warning:  '#FF9800',
  };
  ```
- [ ] EAS project initialized (`eas.json` with `development` profile pointing to local server)

### Key Risks
- Lock Expo SDK version (52+) before any other package installs — version drift between `expo-router` and `expo` causes cryptic errors
- NativeWind v4 requires `babel-plugin-nativewind` AND the Metro transformer configured in `metro.config.js`
- `expo-secure-store` is sync on native but requires `await` on web — use `getItemAsync` everywhere

**Exit criterion:** `npx expo start` launches, hits `/health`, and renders a blank `<View>` for each tab.

---

## Phase UI-1 — Auth + App Shell
**Goal:** Player can register (new device) or log in (returning), lands on the tab shell with energy bar visible.

### Screens
- `(auth)/login.jsx` — Device registration / login

### Components
- `ui/Button.jsx` — primary / secondary / ghost variants, loading state
- `ui/Screen.jsx` — `<SafeAreaView>` wrapper with bg color
- `ui/EnergyBar.jsx` — `current / max` display with amber fill, auto-refetch every 60s
- `ui/CashDisplay.jsx` — formatted BYN amount with amber accent
- `(tabs)/_layout.jsx` — bottom tab bar: Market · Garage · Sales · Profile

### Data hooks
- `usePlayer.js`:
  - `usePlayerStats()` — `GET /player/stats`, refetch interval 60s
  - `usePlayerMe()` — `GET /player/me`, on-demand

### Logic
- On first launch: generate UUID v4 with `expo-crypto`, store in `expo-secure-store` as `deviceId`
- `POST /auth/register` → on 409 fall through to `POST /auth/login`
- On success: store JWT in `expo-secure-store`, set `authStore`, redirect to `/(tabs)/market`
- Token included automatically by `apiFetch` from `authStore`

### Tab bar spec
| Tab | Icon | Badge |
|-----|------|-------|
| Market | `car` | — |
| Garage | `wrench` | active repair count (amber dot) |
| Sales | `tag` | pending inquiry count (amber dot) |
| Profile | `person` | — |

### Key Risks
- Device ID must be generated once and never rotated. Generate on first install only — check store before generating.
- JWT is long-lived (365d). Expired token → silent re-login with stored deviceId, no user-visible prompt.

**Exit criterion:** New device sees login screen, registers, lands on tab shell with energy bar showing correct value.

---

## Phase UI-2 — Market: Browse, Dialogue, Chat, Inspect, Negotiate, Buy
**Goal:** Full pre-purchase flow end-to-end. Player can find a car, talk to seller, inspect it, haggle, and buy it.

### Screens / Sheets
- `(tabs)/market.jsx` — listing grid + pull-to-refresh + refresh button
- `ListingDetailSheet` — bottom sheet opened on listing tap: full card + all action buttons
- `SellerDialogueModal` — shows NPC dialogue text, "Ask again" disabled (one-time)
- `ChatSheet` — 1-energy chat with seller; shows hint badge if defect revealed
- `PreInspectSheet` — tier picker (visual / tap test / OBD / full); shows revealed defects inline
- `NegotiateSheet` — price input, round counter, seller response; disabled after acceptance

### Components
- `market/ListingCard.jsx` — make/model/year, mileage, price, condition badge, expires-in timer
- `market/ConditionBadge.jsx` — poor / fair / good with color coding
- `market/SellerArchetypeBadge.jsx` — old_man / shady_dealer / etc with icon
- `market/DefectHintBadge.jsx` — shown in ChatSheet when hint fires
- `market/NegotiateRoundIndicator.jsx` — "Round 2 of ∞" style dots
- `market/PriceInput.jsx` — numeric input clamped to [70% of original, current-1]

### Data hooks (`useMarket.js`)
- `useListings()` — `GET /market/listings`
- `useForceRefresh()` — `POST /market/listings/refresh` mutation
- `useDialogue(carId)` — `GET /market/listings/:carId/dialogue`
- `useChatWithSeller(carId)` — `POST /market/listings/:carId/chat` mutation
- `usePreInspect(carId)` — `POST /market/listings/:carId/pre-inspect` mutation
- `useNegotiate(carId)` — `POST /market/listings/:carId/negotiate` mutation
- `usePurchase(carId)` — `POST /market/listings/:carId/purchase` mutation

### Listing card data shown
```
[MAKE MODEL YEAR]          [CONDITION badge]
Mileage: 124 000 km
Price:   8 400 BYN         [expires in 3d 12h]
[Seller archetype badge]
```

### Pre-inspect tier picker
Show energy cost next to each tier. Disable tiers already done (show checkmark). Disable tiers whose prerequisite equipment the player doesn't own.

### Negotiate sheet state machine
```
idle → proposing → [accepted → purchase auto-unlocked] 
                 → [counter → proposing (new floor)]
                 → [rejected → locked, show message]
```
After `accepted`: "Buy Now" button becomes prominent, pre-filled at `finalPrice`. Negotiation re-entry disabled.

### Key Risks
- Listings have `market_listing_expires_at` — compute and display time remaining locally, do not poll for it
- Pull-to-refresh does NOT cost BYN (calls `GET /market/listings` which auto-refreshes if expired). The refresh button costs 80 BYN — make it distinct visually
- 409 from `/chat` or `/pre-inspect` means already done — show completed state, not error

**Exit criterion:** Full path: browse → dialogue → chat → pre-inspect → negotiate → buy works with real API.

---

## Phase UI-3 — Garage: Car Detail + Post-Purchase Inspection
**Goal:** Player sees owned cars, can inspect each one, and sees revealed defects.

### Screens / Sheets
- `(tabs)/garage.jsx` — list of owned cars with status chips
- `CarDetailScreen` — pushed on tap: full info, defect list, action buttons
- `InspectSheet` — tier selector + equipment check + reveal animation

### Components
- `car/CarCard.jsx` — make/model/year, state chip, days held, quick stats
- `car/StateChip.jsx` — purchased / in_repair / listed_for_sale with color
- `car/DefectList.jsx` — list of revealed defects (safe subset from API)
- `car/DefectItem.jsx` — defect_type, severity badge, repair cost range, quick-fix indicator
- `car/DaysHeldBadge.jsx` — shows days in garage, amber if > 7 days (holding cost warning)
- `inspection/InspectionTierPicker.jsx` — reused from market pre-inspect; energy cost shown
- `inspection/RevealAnimation.jsx` — staggered card slide-in for newly revealed defects

### Data hooks (`useGarage.js`, `useInspection.js`)
- `useOwnedCars()` — `GET /cars`
- `useCarDetail(carId)` — `GET /cars/:carId`
- `useCarDefects(carId)` — `GET /cars/:carId/defects`
- `useInspect(carId)` — `POST /cars/:carId/inspect` mutation

### Defect item display
```
[severity dot] DEFECT NAME          [category badge]
Proper repair: 800–1 200 BYN · 1 day
Quick fix:     200 BYN · instant
```
Quick fix badge shown in amber if `quick_fix_cost` is set; missing if defect has no quick-fix option.

### Key Risks
- `GET /cars/:carId/defects` returns only revealed defects. Never show "X defects hidden" — that leaks count.
- Inspection tiers are independent from pre-purchase tiers (different table). A player who did `visual` pre-purchase can do `visual` again in garage.
- `RevealAnimation` fires only for the `newly_revealed` array in the response, not the full defect list.

**Exit criterion:** Owned cars list shows, tapping a car shows defects, running an inspection reveals new defects with animation.

---

## Phase UI-4 — Repair System
**Goal:** Player can start, monitor, and (implicitly) complete repairs. Timer counts down locally.

### Screens / Sheets
- `RepairSheet` — opened from DefectItem: proper vs quick fix toggle, cost, time, confirm button
- `ActiveRepairCard` — shown inline on CarDetail when `state = 'in_repair'`

### Components
- `repair/RepairTypeToggle.jsx` — proper / quick fix selector; shows cost + time for each
- `repair/RepairTimer.jsx` — live countdown from `completes_at`, no polling. Marks complete locally when countdown hits zero, then invalidates query.
- `repair/RepairCard.jsx` — summary of an active or completed job
- `repair/ToolDiscountBadge.jsx` — shows `"−20% (2 tools)"` if `toolDiscountApplied` is non-null

### Data hooks (`useRepair.js`)
- `useRepairJobs(carId)` — `GET /cars/:carId/repairs`
- `useStartRepair(carId)` — `POST /cars/:carId/repairs` mutation
- `useCheckCompletion(jobId)` — `GET /cars/:carId/repairs/:jobId` — called once when timer hits zero

### Repair sheet spec
```
[DEFECT NAME]  severity badge

  PROPER REPAIR          QUICK FIX
  1 200 BYN              300 BYN
  1 day 12 h             instant
  [−20% tool discount]

  Skills: engine_seals_belts ✓  (time −15%)

  [START REPAIR]
```
If no skill covers this defect type, show `"No matching skill — base repair time applies"` in muted text (not an error).

### Timer implementation
```js
// No polling. Compute once, count down with setInterval.
const remaining = new Date(job.completes_at) - Date.now();
// When remaining <= 0: call checkCompletion once, invalidate queries.
```

### Key Risks
- Repair blocks further repairs on the same car (`state = 'in_repair'`). Show this clearly — grey out all other defect repair buttons.
- Timer must survive tab switches — use a ref, not state, for the interval ID.
- `toolDiscountApplied` is returned on job creation only, not on subsequent GETs. Store it in query cache or show it only at creation time.

**Exit criterion:** Player starts a repair, timer counts down, car returns to `purchased` state after completion.

---

## Phase UI-5 — Selling Flow: List, Inquiries, Negotiate, Sale
**Goal:** Player can list a car, receive buyer inquiries, negotiate, and close a sale.

### Screens / Sheets
- `ListCarSheet` — price input + listing duration, launched from CarDetail
- `(tabs)/sales.jsx` — active listings with inquiry badge per listing
- `ListingDetailScreen` — listing info + inquiry list
- `InquiryDetailScreen` — buyer message, offer, accept / counter / reject actions
- `SaleSummaryModal` — full-screen on successful sale: profit, XP delta, reputation delta

### Components
- `sales/ListingCard.jsx` — car summary, asking price, inquiry count, days listed, expires-in
- `sales/InquiryCard.jsx` — buyer archetype avatar, offer, message preview, status chip
- `sales/NegotiationThread.jsx` — chat-style view of offer history (buyer offer → player counter → buyer response)
- `sales/SaleSummaryCard.jsx` — buy price, sell price, profit, XP awarded, reputation change
- `sales/BuyerArchetypeAvatar.jsx` — illustrated icon per archetype (skeptic / bargain_hunter / serious_buyer / etc.)
- `sales/QuickFixWarningBanner.jsx` — shown on listing if car has unrevealed defects or quick-fixed defects

### Data hooks (`useSales.js`)
- `useActiveListings()` — `GET /listings`
- `useListingDetail(listingId)` — `GET /listings/:listingId`
- `useInquiries(listingId)` — `GET /listings/:listingId/inquiries`, poll every 30s
- `useCreateListing(carId)` — `POST /listings` mutation
- `useRespondToInquiry(inquiryId)` — `POST /listings/:listingId/inquiries/:inquiryId/respond` mutation

### Sale flow state
```
car in `purchased` state
  → ListCarSheet (set price)
  → car transitions to `listed_for_sale`
  → Inquiries arrive (background job, client polls)
  → Player accepts / negotiates
  → SaleSummaryModal shown on accepted sale
  → car transitions to `sold`, removed from garage list
```

### Quick-fix warning
Show `"⚠ Unrevealed defects may surface during buyer inspection"` banner if:
- car has any `is_revealed_to_player = false` defects (backend: check `GET /cars/:carId/defects` revealed count vs known total — but we never leak totals)
- Simplification: show banner if any `is_quick_fixed = true` defect exists in the revealed list

### Key Risks
- Buyer inquiries are pre-generated server-side and polled, not pushed. 30s poll is acceptable for v1. Show last-updated timestamp.
- Negotiation thread: render each round as a message bubble. Store rounds in local state — server returns current status only.
- `SaleSummaryModal` should appear immediately on mutation success, before query invalidation.

**Exit criterion:** Player lists a car, an inquiry appears, player accepts it, sale summary shows correct profit.

---

## Phase UI-6 — Profile: Stats, Skills, Equipment, Progression
**Goal:** Player has full visibility into their character: stats, owned skills/equipment, what's available to buy.

### Screens / Sheets
- `(tabs)/profile.jsx` — stats + quick nav cards
- `ProgressionScreen` — XP bar, level, rep tier, career stats
- `SkillTreeScreen` — categorized skill list with buy buttons
- `EquipmentShopScreen` — equipment catalog with buy buttons
- `TransactionsScreen` — scrollable transaction history
- `GarageUpgradeSheet` — current tier, next tier cost and level gate

### Components
- `profile/StatCard.jsx` — single stat (cash / xp / level / reputation / energy)
- `profile/XpProgressBar.jsx` — fills from current XP toward next level threshold
- `profile/ReputationTierBadge.jsx` — tier name + score with colored indicator
- `profile/SkillCard.jsx` — skill name, type, tier, description, level gate, BYN price, owned/locked state
- `profile/EquipmentCard.jsx` — name, detection tier, cost, owned state, defect categories
- `profile/GarageTierVisual.jsx` — slot grid showing used/free slots, upgrade CTA

### Skill tree layout
Group by `skill_type` (inspection / negotiation / repair), then sort by `tier` within each group. Show:
```
[SKILL NAME]              Tier 2 · Lvl 8
Brief description line.
Prerequisite: basic_spanner ✓

                               2 000 BYN
                             [UNLOCK]
```
Locked (level gate not met): muted card, lock icon, level required shown.
Owned: green checkmark, no price shown.

### Equipment layout
Group by `detection_tier`. Show owned equipment first.

### Data hooks (`usePlayer.js` additions)
- `useSkills()` — `GET /player/skills`
- `usePurchaseSkill()` — `POST /player/skills/:skillId/purchase` mutation
- `useEquipment()` — `GET /player/equipment`
- `usePurchaseEquipment()` — `POST /player/equipment/:equipmentId/purchase` mutation
- `useProgression()` — `GET /player/progression`
- `useTransactions(limit, offset)` — `GET /player/transactions`
- `useGarageUpgrade()` — `POST /player/garage/upgrade` mutation

### Key Risks
- Skills and equipment both cost BYN — never show XP costs. Prices from API `byn_price` field.
- After purchase, invalidate `useSkills()` + `usePlayerStats()` (cash changed) in the same mutation `onSuccess`.
- Level-gate check is server-side. Client shows the gate as UX only — do not enforce it client-side.

**Exit criterion:** Player sees their full skill tree, can buy an unlocked skill, cash decreases, skill shows as owned.

---

## Phase UI-7 — Polish + Animations
**Goal:** The game feels alive. Key moments have satisfying feedback.

### Animation inventory

| Moment | Animation |
|--------|-----------|
| Defect revealed in inspection | Card slides in from bottom, staggered 80ms per card |
| Car purchased | Brief full-screen flash (amber → transparent) + car card pops into garage |
| Sale complete | `SaleSummaryModal` slides up with profit number counting up |
| Negotiation accepted | Seller dialogue line fades in with a soft pulse |
| Level up | XP bar fills then overflows with glow; level number flips |
| Energy at zero | Shake animation on energy bar when action attempted |
| Repair complete | Timer flips to ✓, card border pulses green |

### Implementation notes
- All animations via `react-native-reanimated` v3 (`useSharedValue`, `withSpring`, `withTiming`)
- `FlatList` → `Animated.FlatList` only where stagger is needed — keep regular `FlatList` elsewhere (performance)
- Test on mid-range Android (Pixel 4a class) — `useNativeDriver: true` is not optional on Android

### UX details
- Skeleton loaders (`ui/Skeleton.jsx`) on all list screens during initial fetch — no blank states
- Pull-to-refresh on all list screens (Market, Garage, Sales)
- Toast notifications (`ui/Toast.jsx`) for mutations: `"Repair started"`, `"Skill unlocked"`, `"Car listed"`
- Bottom sheets use `@gorhom/bottom-sheet` — native-feel, gesture-dismissible
- Empty states: custom illustration + CTA for each tab (e.g., "No cars yet — head to Market")

### Key Risks
- `@gorhom/bottom-sheet` requires `react-native-gesture-handler` configured at the root — do this in Phase UI-0 even if not used yet
- Counting-up animation for profit: use `withTiming` on a `SharedValue`, display with `AnimatedText` — do not do this with `setInterval`

**Exit criterion:** All 7 animation moments implemented and tested on Android.

---

## Phase UI-8 — Ads + Push Notifications
**Goal:** Rewarded ads work at all trigger points. Push notifications fire on key events.

### Ad trigger points (GMS §15)

| Trigger | Location | Effect |
|---------|----------|--------|
| Energy refill | Profile tab | Full energy refill |
| Waive holding cost | Garage, when cost due | Skip one day's cost |
| Second chance inspection | Inspection result screen | Re-roll missed defects |
| Extend listing expiry | Sales, expiring listing | +3 in-game days |

### Implementation
- `react-native-google-mobile-ads` (Expo plugin)
- `useRewardedAd(adUnitId)` hook wrapping the SDK — exposes `load()`, `show()`, `onEarned`
- On `onEarned`: call `POST /ads/grant` with `{ adType }` — server validates and applies effect
- Never apply ad rewards client-side — wait for server `200` before updating UI
- Rate limit UI: grey out ad button if `lastGrantedAt` within 4 hours (hint from server response)

### Push notifications
- `expo-notifications` + Expo Push API
- Request permission after first successful sale (not on launch)
- `POST /notifications/register` on permission grant with `expoPushToken`
- Notification channels:
  - `repair_complete` → "Your [Car] is ready"
  - `buyer_inquiry` → "New offer on [Car]"
  - `listing_expiring` → "[Car] listing expires in 24 hours"
  - `energy_full` → "Energy full — time to deal"
- On notification tap: deep-link to relevant screen via Expo Router (`/garage`, `/sales`, etc.)

### Key Risks
- Test IDs (`ca-app-pub-3940256099942544/...`) in dev, real IDs in production — never mix
- Push permission must be requested after a positive game moment — first sale is ideal
- Expo push API has a 1000-token batch limit — irrelevant for v1 but document for future

**Exit criterion:** Rewarded ad for energy refill completes, server grants the refill, UI updates. Push notification for repair_complete fires and deep-links correctly.

---

## Component Library Reference (`components/ui/`)

| Component | Props | Notes |
|-----------|-------|-------|
| `Button` | `variant` (primary/secondary/ghost/danger), `loading`, `disabled`, `onPress` | Amber primary, dark secondary |
| `Screen` | `scroll`, `padding` | SafeAreaView + bg |
| `Card` | `onPress`, `style` | `surface` bg, `border` stroke, 8px radius |
| `Badge` | `label`, `color` | Pill shape |
| `Modal` | `visible`, `onClose`, `title` | Full-screen or bottom-aligned |
| `Skeleton` | `width`, `height`, `radius` | Pulsing dark placeholder |
| `Toast` | (imperative via `showToast()`) | Auto-dismiss 3s, amber accent |
| `EnergyBar` | (reads from `usePlayerStats`) | Amber fill, shows `current/max` |
| `CashDisplay` | `amount`, `size` | BYN formatted, amber text |
| `Divider` | — | Thin `border` line |
| `EmptyState` | `icon`, `message`, `cta` | Centered, muted text |

---

## API Service Layer (`services/api.js`)

All mutations follow the same pattern:
```js
// services/api.js
export async function apiFetch(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (json.error) throw new ApiError(json.error, res.status);
  return { data: json.data, meta: json.meta };
}
```

Typed wrappers in `services/` call `apiFetch` and return typed data. TanStack Query hooks call the service wrappers.

---

## Critical Files (Load-bearing)

| File | Why it matters |
|------|---------------|
| `app/_layout.jsx` | Auth gate and QueryClient — everything depends on this loading correctly |
| `services/api.js` | Every server call flows through here — error handling and token injection must be bulletproof |
| `stores/authStore.js` | Token persistence across restarts — use `expo-secure-store`, never `AsyncStorage` for tokens |
| `hooks/usePlayer.js` | Energy and cash are read everywhere — stale data here cascades into wrong UI across all tabs |
| `constants/theme.js` | Design tokens — never hardcode colors inline |

---

## Estimated Timeline

| Phase | What | Duration |
|-------|------|----------|
| UI-0 | Bootstrap | 2 days |
| UI-1 | Auth + Shell | 3 days |
| UI-2 | Market | 1 week |
| UI-3 | Garage + Inspection | 1 week |
| UI-4 | Repair | 4 days |
| UI-5 | Selling + Inquiries | 1 week |
| UI-6 | Profile + Progression | 1 week |
| UI-7 | Polish + Animations | 4 days |
| UI-8 | Ads + Push | 3 days |
| **Total** | | **~6–7 weeks** |
