/**
 * Detecção de resultado (vitória/empate/derrota) para o side do usuário.
 *
 * Considera três cenários:
 *   1. Resultado normal (90'/120') — compara homeScore vs awayScore.
 *   2. Disputas de pênaltis — usa o placar de pênaltis quando houver.
 *   3. W.O. técnico — o lado afetado perde; o outro vence.
 */
import type { MatchResult, TeamSide } from '@world-legends/engine';
import type { Outcome } from '../types/types';

export function detectOutcome(result: MatchResult, userSide: TeamSide): Outcome {
  // Cenário W.O.: o lado afetado perde.
  if (result.walkover) {
    return result.walkover.affectedTeamSide === userSide ? 'loss' : 'win';
  }

  // Com disputa de pênaltis: o placar regular define o empate,
  // mas o desempate de pênaltis define o vencedor real.
  if (result.penaltyShootout) {
    const ps = result.penaltyShootout;
    const userWonPenalties =
      userSide === 'home' ? ps.homeScore > ps.awayScore : ps.awayScore > ps.homeScore;
    return userWonPenalties ? 'win' : 'loss';
  }

  // Resultado normal.
  const userScore = userSide === 'home' ? result.homeScore : result.awayScore;
  const opponentScore = userSide === 'home' ? result.awayScore : result.homeScore;

  if (userScore > opponentScore) return 'win';
  if (userScore < opponentScore) return 'loss';
  return 'draw';
}

/** Placar do adversário — usado para detectar clean sheet. */
export function opponentScore(result: MatchResult, userSide: TeamSide): number {
  return userSide === 'home' ? result.awayScore : result.homeScore;
}

/** Gols marcados pelo squad do usuário na partida. */
export function userGoalsScored(result: MatchResult, userSide: TeamSide): number {
  return userSide === 'home' ? result.homeScore : result.awayScore;
}
