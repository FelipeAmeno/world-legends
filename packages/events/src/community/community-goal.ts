/**
 * `CommunityGoal` — meta comunitária agregada (doc 10 §23).
 *
 * "Metas comunitárias: objetivos agregados do servidor inteiro
 * (ex: 'se a comunidade abrir X pacotes coletivamente, todos recebem
 * um bônus') — gera senso de evento compartilhado sem depender só
 * do gasto individual."
 *
 * Invariantes:
 * - Progresso só avança durante a janela ativa (não retroativo).
 * - Meta alcançada → `reachedAt` preenchido exatamente uma vez
 *   (mesma idempotência de TC-HOF-01, mas para metas comunitárias).
 * - Recompensa é distribuída para todos os perfis ativos quando a
 *   meta é alcançada — a distribuição em si é responsabilidade da
 *   camada de aplicação (este package só rastreia progresso).
 */
import { Err, Ok, type Result } from '@world-legends/shared';
import {
  liveOpsEventId, resolveEventStatus, isWindowActive,
  type LiveOpsEventBase, type EventWindow, type LiveOpsError,
} from '../catalog/types';

// ─── Tipos de contribuição ────────────────────────────────────────────────────
export type CommunityContributionKind =
  | 'packs_opened'     // "se a comunidade abrir X pacotes" (doc 10 §23)
  | 'matches_played'
  | 'cards_crafted'
  | 'wins_scored';

export type CommunityReward = Readonly<{
  readonly kind: 'fragments' | 'credits' | 'event_pack' | 'cosmetic';
  readonly amount?: number;
  readonly itemId?: string;
}>;

// ─── CommunityGoal ────────────────────────────────────────────────────────────

export type CommunityGoal = LiveOpsEventBase & Readonly<{
  readonly kind: 'community_goal';
  readonly contributionKind: CommunityContributionKind;
  /** Meta total da comunidade para esta janela. */
  readonly targetContribution: number;
  /** Progresso atual (soma de todos os jogadores). */
  readonly currentContribution: number;
  /** Recompensas entregues a todos quando a meta é atingida. */
  readonly rewards: readonly CommunityReward[];
  /** Quando a meta foi atingida. null = ainda não atingida. */
  readonly reachedAt: Date | null;
}>;

// ─── createCommunityGoal ──────────────────────────────────────────────────────

export function createCommunityGoal(input: {
  id: string;
  name: string;
  description: string;
  window: EventWindow;
  contributionKind: CommunityContributionKind;
  targetContribution: number;
  rewards: readonly CommunityReward[];
}, now = new Date()): Result<CommunityGoal, LiveOpsError> {
  if (input.window.endsAt <= input.window.startsAt) {
    return Err(Object.freeze({ kind: 'InvalidWindow' as const, reason: 'endsAt deve ser posterior a startsAt' }));
  }
  if (input.targetContribution <= 0) {
    return Err(Object.freeze({ kind: 'InvalidWindow' as const, reason: 'targetContribution deve ser positivo' }));
  }

  return Ok(Object.freeze({
    id: liveOpsEventId(input.id),
    kind: 'community_goal' as const,
    name: input.name,
    description: input.description,
    window: Object.freeze(input.window),
    status: resolveEventStatus(input.window, now),
    createdAt: now,
    contributionKind: input.contributionKind,
    targetContribution: input.targetContribution,
    currentContribution: 0,
    rewards: Object.freeze(input.rewards),
    reachedAt: null,
  }));
}

// ─── contributeToGoal ─────────────────────────────────────────────────────────

/**
 * Registra a contribuição de um jogador para a meta comunitária.
 *
 * Invariantes:
 * - Rejeita contribuição fora da janela ativa.
 * - Rejeita delta ≤ 0.
 * - Se a meta já foi atingida, retorna o estado atual sem modificar (idempotente).
 * - `reachedAt` é preenchido exatamente na primeira vez que o progresso
 *   atinge ou supera `targetContribution`.
 */
export function contributeToGoal(
  goal: CommunityGoal,
  delta: number,
  now = new Date(),
): Result<CommunityGoal, LiveOpsError> {
  if (!isWindowActive(goal.window, now)) {
    return Err(Object.freeze({ kind: 'EventNotActive' as const, eventId: goal.id, status: goal.status }));
  }
  if (delta <= 0) {
    return Err(Object.freeze({ kind: 'InvalidDelta' as const, delta }));
  }
  // Idempotência: meta já atingida → retorna sem alterar
  if (goal.reachedAt !== null) {
    return Ok(goal);
  }

  const newContribution = goal.currentContribution + delta;
  const justReached = newContribution >= goal.targetContribution;

  return Ok(Object.freeze({
    ...goal,
    currentContribution: Math.min(newContribution, goal.targetContribution),
    reachedAt: justReached ? now : null,
    status: justReached ? 'ended' as const : goal.status,
  }));
}

/** Percentual de conclusão da meta [0, 1]. */
export function goalCompletionPercent(goal: CommunityGoal): number {
  if (goal.targetContribution === 0) return 1;
  return Math.min(1, goal.currentContribution / goal.targetContribution);
}
