/**
 * `substitutions` — doc 09 §13. Implementa SÓ a via FORÇADA (lesão) +
 * o fallback de "fadiga crítica" — decisão de escopo explícita: as
 * regras CONFIGURÁVEIS pelo usuário (minuto fixo, "se perdendo", "se
 * jogador X com amarelo"...) são uma DSL inteira fora do alcance de uma
 * "primeira versão"; não implementadas aqui. Cartão vermelho NUNCA gera
 * substituição (regra real de futebol: o time joga com um a menos) — só
 * reduz a contagem de jogadores em campo, o que eventualmente alimenta
 * o gatilho de W.O. (doc 09 §12.1, já em `events`/`injuries`).
 */
import { calculateOverall } from '../overall/overall';
import type { Position } from '../position';
import type { MatchPlayer } from './types';

export const MAX_SUBSTITUTIONS = 5;
export const MAX_SUBSTITUTION_WINDOWS = 3;
export const EXTRA_TIME_SUBSTITUTION_WINDOWS = 1;

/**
 * doc 09 §13 menciona "fadiga crítica" como gatilho do fallback
 * automático, sem dar um número. Constante MINHA, não documentada.
 */
export const CRITICAL_FATIGUE_THRESHOLD_POINTS = 15;

/**
 * Escolhe o melhor reserva disponível para substituir um jogador
 * lesionado: prioriza quem joga na MESMA posição primária; na ausência,
 * cai para qualquer reserva disponível, escolhido pelo maior Overall
 * (T004) NA POSIÇÃO do jogador saindo (penaliza naturalmente um reserva
 * fora de posição, via o próprio peso de `calculateOverall`).
 */
export function selectForcedReplacement(
  bench: readonly MatchPlayer[],
  outgoingPlayerPosition: Position,
): MatchPlayer | null {
  if (bench.length === 0) {
    return null;
  }
  const samePosition = bench.filter((player) => player.primaryPosition === outgoingPlayerPosition);
  const candidates = samePosition.length > 0 ? samePosition : bench;

  return candidates.reduce((best, candidate) => {
    const candidateOverall = calculateOverall(candidate.attributes, outgoingPlayerPosition);
    const bestOverall = calculateOverall(best.attributes, outgoingPlayerPosition);
    return candidateOverall > bestOverall ? candidate : best;
  });
}

export function isCriticallyFatigued(totalFatiguePoints: number): boolean {
  return totalFatiguePoints >= CRITICAL_FATIGUE_THRESHOLD_POINTS;
}
