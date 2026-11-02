import { REPUTATION_TIERS, LEVEL_XP_THRESHOLDS } from '../config.js';

export function reputationTier(score) {
  return REPUTATION_TIERS.findLast((t) => score >= t.min)?.name || 'Новичок';
}

export function xpToNextLevel(xp, level) {
  const nextThreshIdx = level;
  if (nextThreshIdx >= LEVEL_XP_THRESHOLDS.length) {
    const xpIntoCurrentLevel = xp - LEVEL_XP_THRESHOLDS[LEVEL_XP_THRESHOLDS.length - 1]
      - (level - LEVEL_XP_THRESHOLDS.length) * 300;
    return 300 - xpIntoCurrentLevel;
  }
  return Math.max(0, LEVEL_XP_THRESHOLDS[nextThreshIdx] - xp);
}

export function xpLevelStart(level) {
  const idx = level - 1;
  if (idx < LEVEL_XP_THRESHOLDS.length) return LEVEL_XP_THRESHOLDS[idx];
  return LEVEL_XP_THRESHOLDS[LEVEL_XP_THRESHOLDS.length - 1]
    + (idx - (LEVEL_XP_THRESHOLDS.length - 1)) * 300;
}

export function xpNextLevelStart(level) {
  return xpLevelStart(level) + xpToNextLevel(xpLevelStart(level), level);
}
