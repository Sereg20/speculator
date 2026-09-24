# Defect Severity: Removal of `moderate` Tier

## What Changed

The `moderate` severity level was removed from the defect system. All defects now use only `minor` or `major`.

## Why

Simplification of the UI and game logic — two tiers (minor/major) are easier to communicate to the player than three, and the middle tier added ambiguity without meaningful gameplay distinction.

## Files Modified

| File | Change |
|---|---|
| `packages/shared/src/types/defect.js` | `DefectSeverity` typedef: removed `'moderate'` |
| `packages/shared/src/constants/defectTable.js` | All `severity: 'moderate'` entries updated |
| `apps/server/src/services/defectEngine.js` | All defect definitions + `repairTimeMinutes` + `severityOrder` |
| `apps/server/src/services/repairQueue.js` | `BASE_DAYS_PROPER` / `BASE_DAYS_QUICK` lookup tables |
| `apps/server/src/services/buyerGenerator.js` | `severityFactor` ternary |
| `apps/server/src/db/migrations/001_initial.sql` | `defect_severity` ENUM definition |

## Defect-by-Defect Mapping

### → `major`
| defect_type | Reason |
|---|---|
| `dent_major` | Significant body damage, high repair cost (350–900 BYN) |
| `oil_leak_major` | Serious engine leak, detection tier 2 |
| `worn_timing_belt` | Engine-critical, no quick fix available |
| `overheating` | Engine risk, tier 2 detection |
| `slipping_gears_manual` | Transmission failure mode |
| `clutch_wear` | No quick fix, expensive (420–950 BYN) |
| `loose_ball_joints` | Safety-critical suspension |
| `faulty_ac_compressor` | Expensive repair (380–950 BYN) |
| `faulty_alternator` | Electrical system failure, tier 2 |
| `airbag_fault` | Safety system, significant resale impact |

### → `minor`
| defect_type | Reason |
|---|---|
| `worn_shocks` | Common wear item, cheap fix (200–500 BYN), low resale impact (-10%) |

## Repair Time Impact

The `repairTimeMinutes` function previously had a separate `moderate` bucket (1 in-game day proper, 0 quick fix). After the change:
- Former `moderate` defects mapped to `major` now use: proper = 3 days, quick fix = 1 day
- Former `moderate` defect mapped to `minor` (`worn_shocks`) now uses: proper = 0.5 days, quick fix = 0 days

## DB Migration Note

The `defect_severity` ENUM in `001_initial.sql` is updated for fresh installs. For a live database with existing `moderate` rows, run:

```sql
-- Step 1: update existing rows
UPDATE defects SET severity = 'major' WHERE severity = 'moderate';

-- Step 2: swap the ENUM type
ALTER TYPE defect_severity RENAME TO defect_severity_old;
CREATE TYPE defect_severity AS ENUM ('minor', 'major');
ALTER TABLE defects
  ALTER COLUMN severity TYPE defect_severity
  USING severity::text::defect_severity;
DROP TYPE defect_severity_old;
```

## How to Restore `moderate`

1. Revert the ENUM in `001_initial.sql` (add `'moderate'` back between `'minor'` and `'major'`)
2. Revert the typedef in `packages/shared/src/types/defect.js`
3. Restore the per-defect severity values from this table (see mapping above)
4. Restore `BASE_DAYS_PROPER` / `BASE_DAYS_QUICK` `moderate` entries in `repairQueue.js`:
   ```js
   const BASE_DAYS_PROPER = { minor: 0.5, moderate: 1, major: 3, severe: 4 };
   const BASE_DAYS_QUICK  = { minor: 0,   moderate: 0, major: 1, severe: 1.5 };
   ```
5. Restore `repairTimeMinutes` in `defectEngine.js`:
   ```js
   const baseDays = { minor: quickFix ? 0 : 0.5, moderate: quickFix ? 0 : 1, major: quickFix ? 1 : 3 };
   ```
6. Restore `severityOrder` in `defectEngine.js`:
   ```js
   const severityOrder = { major: 0, moderate: 1, minor: 2 };
   ```
7. Restore `severityFactor` in `buyerGenerator.js`:
   ```js
   const severityFactor = d.severity === 'major' ? 1.15 : d.severity === 'moderate' ? 0.85 : 0.65;
   ```
