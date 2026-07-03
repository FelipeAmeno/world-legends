/**
 * Construção das ProgressUpdates (T029).
 *
 * Traduz o resultado da partida e os bônus detectados em atualizações
 * de progresso que o chamador pode persistir em álbuns, achievements
 * ou ranking.
 *
 * Cada entrada tem `increment` sempre ≥ 1. O chamador soma ao acumulador
 * existente do usuário — este módulo não lê nem escreve estado.
 */
import type { MatchResult, TeamSide } from '@world-legends/engine';
import type { BonusReward, Outcome, ProgressUpdate } from '../types/types';
import { opponentScore, userGoalsScored } from './outcome';

export function buildProgressUpdates(
  result: MatchResult,
  userSide: TeamSide,
  outcome: Outcome,
  bonuses: readonly BonusReward[],
): readonly ProgressUpdate[] {
  const updates: ProgressUpdate[] = [];

  const add = (category: ProgressUpdate['category'], increment: number) => {
    if (increment > 0) updates.push(Object.freeze({ category, increment }));
  };

  // ── Sempre ──────────────────────────────────────────────────────────────────
  add('matches_played', 1);

  // ── Resultado ───────────────────────────────────────────────────────────────
  add('wins', outcome === 'win' ? 1 : 0);
  add('draws', outcome === 'draw' ? 1 : 0);
  add('losses', outcome === 'loss' ? 1 : 0);

  // ── Gols ────────────────────────────────────────────────────────────────────
  const scored = userGoalsScored(result, userSide);
  const conceded = opponentScore(result, userSide);
  add('goals_scored', scored);
  add('goals_conceded', conceded);

  // ── Bônus de clean sheet ─────────────────────────────────────────────────
  const csCount = bonuses.filter((b) => b.type === 'clean_sheet').length;
  add('clean_sheets', csCount);

  // ── Hat tricks ───────────────────────────────────────────────────────────
  const htCount = bonuses.filter((b) => b.type === 'hat_trick').length;
  add('hat_tricks', htCount);

  // ── MVP ──────────────────────────────────────────────────────────────────
  const mvpCount = bonuses.filter((b) => b.type === 'mvp').length;
  add('mvp_awards', mvpCount);

  return Object.freeze(updates);
}
