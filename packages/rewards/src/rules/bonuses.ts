/**
 * Detecção de bônus de partida (T029).
 *
 * Cada função é pura — recebe os dados necessários e retorna
 * um `BonusReward` ou `null` se o bônus não se aplica.
 *
 * Hat trick: conta apenas gols LEGÍTIMOS do lado do usuário
 *   (exclui gols contra — `isOwnGoal === true` — que
 *    beneficiaram o adversário, não o squad do usuário).
 *
 * Clean sheet: adversário não marcou NENHUM gol (regulamento +
 *   prorrogação, antes de pênaltis). W.O. não conta como
 *   clean sheet para a equipe que ganhou por WO.
 */
import type { MatchResult, TeamSide } from '@world-legends/engine';
import type { BonusReward } from '../types/types';
import {
  BONUS_CLEAN_SHEET,
  BONUS_GOAL,
  BONUS_HAT_TRICK,
  BONUS_MVP,
  HAT_TRICK_THRESHOLD,
} from './constants';
import { opponentScore } from './outcome';

// ─── cleanSheetBonus ─────────────────────────────────────────────────────────

/**
 * Retorna o bônus de clean sheet se o adversário não marcou.
 * W.O. não gera clean sheet (a partida foi interrompida).
 */
export function cleanSheetBonus(result: MatchResult, userSide: TeamSide): BonusReward | null {
  if (result.walkover) return null; // partida interrompida
  if (opponentScore(result, userSide) !== 0) return null;

  return {
    type: 'clean_sheet',
    credits: BONUS_CLEAN_SHEET.credits,
    xp: BONUS_CLEAN_SHEET.xp,
    detail: 'Zero gols sofridos',
  };
}

// ─── hatTrickBonuses ─────────────────────────────────────────────────────────

/**
 * Retorna um bônus por cada hat trick detectado no squad do usuário.
 * Pode retornar 0, 1 ou mais (teórico: dois atacantes marcando 3+ cada).
 *
 * Regras:
 *   - Conta apenas gols com `teamSide === userSide` E `isOwnGoal === false`.
 *   - O `scorerUserCardId` deve estar em `userCardIds`.
 *   - Limiar: HAT_TRICK_THRESHOLD (3) gols pelo mesmo jogador.
 */
export function hatTrickBonuses(
  result: MatchResult,
  userSide: TeamSide,
  userCardIds: readonly string[],
): readonly BonusReward[] {
  // Contar gols por jogador
  const goalCount = new Map<string, number>();

  for (const event of result.events) {
    if (
      event.type === 'goal' &&
      event.teamSide === userSide &&
      !event.isOwnGoal &&
      userCardIds.includes(event.scorerUserCardId)
    ) {
      goalCount.set(event.scorerUserCardId, (goalCount.get(event.scorerUserCardId) ?? 0) + 1);
    }
  }

  const bonuses: BonusReward[] = [];
  for (const [cardId, count] of goalCount) {
    if (count >= HAT_TRICK_THRESHOLD) {
      bonuses.push({
        type: 'hat_trick',
        credits: BONUS_HAT_TRICK.credits,
        xp: BONUS_HAT_TRICK.xp,
        detail: `Hat trick: ${count} gols (${cardId})`,
      });
    }
  }

  return Object.freeze(bonuses);
}

// ─── mvpBonus ────────────────────────────────────────────────────────────────

/**
 * Retorna o bônus de MVP se o jogador MVP pertence ao squad do usuário.
 * null se não há MVP ou se ele não está no squad.
 */
export function mvpBonus(result: MatchResult, userCardIds: readonly string[]): BonusReward | null {
  if (!result.mvpUserCardId) return null;
  if (!userCardIds.includes(result.mvpUserCardId)) return null;

  return {
    type: 'mvp',
    credits: BONUS_MVP.credits,
    xp: BONUS_MVP.xp,
    detail: `MVP: ${result.mvpUserCardId}`,
  };
}

// ─── goalScoredBonuses ───────────────────────────────────────────────────────

/**
 * Gera bônus individuais por gol marcado pelo squad do usuário.
 * Retorna um BonusReward por gol legítimo (exclui gols contra próprios).
 *
 * Nota: na exibição ao usuário, estes bônus podem ser agrupados
 * em "N × bônus de gol" — aqui são retornados individualmente
 * para facilitar a contagem e testes.
 */
export function goalScoredBonuses(
  result: MatchResult,
  userSide: TeamSide,
  userCardIds: readonly string[],
): readonly BonusReward[] {
  const bonuses: BonusReward[] = [];

  for (const event of result.events) {
    if (
      event.type === 'goal' &&
      event.teamSide === userSide &&
      !event.isOwnGoal &&
      userCardIds.includes(event.scorerUserCardId)
    ) {
      bonuses.push({
        type: 'goal_scored',
        credits: BONUS_GOAL.credits,
        xp: BONUS_GOAL.xp,
        detail: `Gol (${event.minute}') — ${event.scorerUserCardId}`,
      });
    }
  }

  return Object.freeze(bonuses);
}
