/**
 * Tipos compartilhados do módulo rewards.
 *
 * Separados aqui para evitar dependência circular entre
 * match-rewards.ts e daily-rewards.ts.
 */
import type { LedgerReason } from '../ledger/types';

// ─── Match Rewards ─────────────────────────────────────────────────────────────

export type MatchOutcome = 'win' | 'draw' | 'loss';

export type MatchRewardInput = Readonly<{
  readonly outcome: MatchOutcome;
  /** Diferença absoluta de gols. 0 em empate ou para ignorar o bônus. */
  readonly goalDiff?: number;
  /** Partida ranqueada dá bônus adicional (doc 10 §18). */
  readonly isRanked: boolean;
}>;

export type MatchRewardResult = Readonly<{
  readonly outcome: MatchOutcome;
  readonly isRanked: boolean;
  readonly base: number;
  readonly goalDiffBonus: number;
  readonly rankedBonus: number;
  readonly total: number;
  readonly reason: 'match_reward';
}>;

// ─── Daily/Weekly Rewards ─────────────────────────────────────────────────────

export type ObjectiveType =
  | 'daily_login' // login diário
  | 'daily_first_match' // primeira partida do dia
  | 'daily_win' // primeira vitória do dia
  | 'weekly_three_wins' // 3 vitórias na semana
  | 'weekly_ten_matches'; // 10 partidas na semana

export type ObjectiveRewardInput = Readonly<{
  readonly objectiveType: ObjectiveType;
  /** Progresso atual — usado para verificar se o objetivo foi completado. */
  readonly currentProgress: number;
  /** Progresso necessário para completar (sempre 1 para objetivos binários). */
  readonly requiredProgress: number;
}>;

export type ObjectiveRewardResult = Readonly<{
  readonly objectiveType: ObjectiveType;
  readonly credits: number;
  readonly fragments: number;
  readonly completed: boolean;
  readonly reason: LedgerReason;
}>;
