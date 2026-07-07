import { MASTERY_LEVELS, getLevelConfig, getLevelForXp } from './levels.js';
import type {
  CardMasteryState,
  MasteryLevel,
  XpGainEntry,
  XpGainResult,
  XpGainSource,
} from './types.js';

// XP awarded per event source — tuned for 30-40 matches per level transition
const XP_TABLE: Record<XpGainSource, number> = {
  match_played: 10,
  match_win: 15,
  goal: 3,
  clean_sheet: 8,
  mvp: 20,
};

export class CardMasteryService {
  computeState(cardId: string, xp: number): CardMasteryState {
    const level = getLevelForXp(xp);
    const nextLevelCfg = level < 5 ? MASTERY_LEVELS[level + 1] : null;
    const currentLevelCfg = getLevelConfig(level);

    let xpToNextLevel: number | null = null;
    let progressPct = 100;

    if (nextLevelCfg) {
      xpToNextLevel = nextLevelCfg.xpRequired - xp;
      const span = nextLevelCfg.xpRequired - currentLevelCfg.xpRequired;
      const earned = xp - currentLevelCfg.xpRequired;
      progressPct = Math.min(100, Math.round((earned / span) * 100));
    }

    return Object.freeze({
      cardId,
      xp,
      level,
      xpToNextLevel,
      progressPct,
    });
  }

  computeXpGain(sources: readonly XpGainSource[]): XpGainResult {
    const entries: XpGainEntry[] = sources.map((source) => ({
      source,
      amount: XP_TABLE[source],
    }));
    const totalXp = entries.reduce((sum, e) => sum + e.amount, 0);
    return Object.freeze({ totalXp, entries });
  }

  applyXpGain(
    currentXp: number,
    gain: XpGainResult,
  ): Readonly<{
    newXp: number;
    oldLevel: MasteryLevel;
    newLevel: MasteryLevel;
    leveledUp: boolean;
  }> {
    const oldLevel = getLevelForXp(currentXp);
    const newXp = currentXp + gain.totalXp;
    const newLevel = getLevelForXp(newXp);
    return Object.freeze({
      newXp,
      oldLevel,
      newLevel,
      leveledUp: newLevel > oldLevel,
    });
  }
}
