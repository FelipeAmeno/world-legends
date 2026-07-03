import { ALL_SET_CODES, ACHIEVEMENT_CATALOG } from './definitions.js';
import type {
  AchievementCategory,
  AchievementCheckInput,
  AchievementCondition,
  AchievementDef,
  AchievementView,
} from './types.js';

// Card rarity lookup — maps cardId → rarity string
const CARD_RARITIES: Readonly<Record<string, string>> = {
  'pelé-world_cup_hero': 'world_cup_hero',
  'ronaldo-ultra': 'ultra',
  'ronaldinho-ultra': 'ultra',
  'maradona-world_cup_hero': 'world_cup_hero',
  'zico-legendary': 'legendary',
  'romario-legendary': 'legendary',
  'roberto-carlos-legendary': 'legendary',
  'kaka-legendary': 'legendary',
  'cafu-legendary': 'legendary',
  'rivaldo-legendary': 'legendary',
  'taffarel-elite': 'elite',
  'lucio-elite': 'elite',
  'falcao-elite': 'elite',
  'socrates-rare': 'rare',
  'bebeto-rare': 'rare',
  'adriano-elite': 'elite',
};

// Rarity values that count as "high_rarity" (legendary-tier and above)
const HIGH_RARITY_VALUES: ReadonlySet<string> = new Set([
  'legendary',
  'ultra',
  'world_cup_hero',
]);

function countByRarity(cardsOwnedIds: readonly string[], rarity: string): number {
  return cardsOwnedIds.filter((id) => {
    const cardRarity = CARD_RARITIES[id];
    if (cardRarity === undefined) return false;
    if (rarity === 'high_rarity') {
      return HIGH_RARITY_VALUES.has(cardRarity);
    }
    return cardRarity === rarity;
  }).length;
}

export class AchievementService {
  // Evaluate a single achievement condition against current game state
  checkCondition(condition: AchievementCondition, input: AchievementCheckInput): boolean {
    switch (condition.type) {
      case 'cards_owned_count':
        return input.cardsOwnedIds.length >= condition.min;

      case 'specific_cards_owned':
        return condition.cardIds.every((id) => input.cardsOwnedIds.includes(id));

      case 'rarity_owned_count':
        return countByRarity(input.cardsOwnedIds, condition.rarity) >= condition.min;

      case 'sets_completed':
        return condition.setCodes.every((code) => input.completedSetCodes.includes(code));

      case 'all_sets_completed':
        return ALL_SET_CODES.every((code) => input.completedSetCodes.includes(code));

      case 'matches_played':
        return input.matchesPlayed >= condition.min;

      case 'wins':
        return input.wins >= condition.min;

      case 'goals':
        return input.goals >= condition.min;

      case 'win_streak':
        return input.currentWinStreak >= condition.min;

      case 'packs_opened':
        return input.packsOpened >= condition.min;

      case 'streak_days':
        return input.streakDays >= condition.min;

      case 'daily_missions_completed':
        return input.dailyMissionsCompleted >= condition.min;

      case 'starter_claimed':
        return input.starterClaimed;
    }
  }

  // Return all achievement defs that should now be unlocked
  // (filters out already-unlocked ones)
  computeNewlyUnlocked(
    input: AchievementCheckInput,
    alreadyUnlockedIds: ReadonlySet<string>,
  ): readonly AchievementDef[] {
    return ACHIEVEMENT_CATALOG.filter(
      (def) => !alreadyUnlockedIds.has(def.id) && this.checkCondition(def.condition, input),
    );
  }

  // Build view for UI
  buildViews(
    defs: readonly AchievementDef[],
    unlocked: ReadonlyMap<string, { unlockedAt: Date; rewardClaimed: boolean }>,
  ): readonly AchievementView[] {
    return defs.map((def) => {
      const u = unlocked.get(def.id);
      return {
        def,
        unlocked: u !== undefined,
        unlockedAt: u !== undefined ? u.unlockedAt : null,
        rewardClaimed: u !== undefined ? u.rewardClaimed : false,
      };
    });
  }

  // Group by category
  groupByCategory(
    views: readonly AchievementView[],
  ): Map<AchievementCategory, readonly AchievementView[]> {
    const map = new Map<AchievementCategory, AchievementView[]>();
    for (const view of views) {
      const cat = view.def.category;
      const existing = map.get(cat);
      if (existing !== undefined) {
        existing.push(view);
      } else {
        map.set(cat, [view]);
      }
    }
    return map as Map<AchievementCategory, readonly AchievementView[]>;
  }
}
