/**
 * `event-rewards.ts` — funções puras de recompensa de Live-Ops.
 *
 * Calcula quais recompensas um perfil recebe dado o estado de um evento.
 * Sem efeito colateral — a entrega real (créditar fragmentos, criar carta)
 * é responsabilidade da camada de aplicação.
 */
import type { CommunityGoal, CommunityReward } from '../community/community-goal';
import type { SeasonEvent, SeasonEventReward } from '../schedule/season-event';
import type { WeekendBoost, DoubleDrop } from '../boost/weekend-boost';
import { isWindowActive } from '../catalog/types';

// ─── Recompensa calculada ─────────────────────────────────────────────────────

export type CalculatedReward = Readonly<{
  readonly source: 'community_goal' | 'season_mission' | 'season_general' | 'boost';
  readonly sourceId: string;
  readonly reward: CommunityReward | SeasonEventReward;
}>;

// ─── Community Goal rewards ───────────────────────────────────────────────────

/**
 * Retorna as recompensas do CommunityGoal se a meta foi atingida.
 * `[]` se a meta não foi atingida.
 */
export function calculateCommunityRewards(goal: CommunityGoal): readonly CalculatedReward[] {
  if (goal.reachedAt === null) return [];
  return goal.rewards.map((r) =>
    Object.freeze({ source: 'community_goal' as const, sourceId: goal.id, reward: r }),
  );
}

// ─── Season Event rewards ─────────────────────────────────────────────────────

/**
 * Calcula as recompensas de um SeasonEvent para um perfil.
 * Inclui recompensas de missões concluídas e recompensas gerais do evento.
 * `playerRank` é opcional — filtra recompensas com minRank.
 */
export function calculateSeasonRewards(
  event: SeasonEvent,
  playerRank?: number,
): readonly CalculatedReward[] {
  const rewards: CalculatedReward[] = [];

  // Recompensas de missões concluídas
  for (const mission of event.missions) {
    if (mission.completedAt === null) continue;
    for (const reward of mission.rewards) {
      if (reward.minRank !== undefined && playerRank !== undefined && playerRank > reward.minRank) continue;
      rewards.push(Object.freeze({
        source: 'season_mission' as const,
        sourceId: mission.missionId,
        reward,
      }));
    }
  }

  // Recompensas gerais do evento
  for (const reward of event.generalRewards) {
    if (reward.minRank !== undefined && playerRank !== undefined && playerRank > reward.minRank) continue;
    rewards.push(Object.freeze({ source: 'season_general' as const, sourceId: event.id, reward }));
  }

  return Object.freeze(rewards);
}

// ─── Boost rewards ────────────────────────────────────────────────────────────

/** Retorna quais boosts estão ativos no momento. */
export function getActiveBoosts(
  boosts: readonly (WeekendBoost | DoubleDrop)[],
  now: Date,
): readonly (WeekendBoost | DoubleDrop)[] {
  return boosts.filter((b) => isWindowActive(b.window, now));
}

/**
 * Agrega os multiplicadores de boosts ativos para um alvo.
 * Se múltiplos boosts afetam o mesmo alvo, o maior prevalece
 * (não se empilham — decisão anti-abuso).
 */
export function aggregateBoostMultiplier(
  boosts: readonly (WeekendBoost | DoubleDrop)[],
  target: 'fragments' | 'credits' | 'drop_rate' | 'xp',
  now: Date,
): number {
  const active = getActiveBoosts(boosts, now);
  let max = 1.0;

  for (const boost of active) {
    if (boost.kind === 'weekend_boost' && boost.target === target) {
      max = Math.max(max, boost.multiplier);
    }
    if (boost.kind === 'double_drop' && target === 'drop_rate') {
      max = Math.max(max, boost.dropMultiplier);
    }
  }

  return max;
}
