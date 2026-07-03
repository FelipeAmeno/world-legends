/**
 * `stats` — doc 09 §24: "todas as estatísticas são subprodutos naturais
 * da simulação event-by-event". `calculateMvp` é uma EXCEÇÃO a essa
 * regra de "tudo vem de doc": `calcularMVP` é CHAMADA no pseudocódigo
 * integrado (doc 09 §25) mas nunca DEFINIDA em doc nenhum. Doc 05 §5 (o
 * rascunho anterior) dá uma fórmula concreta — "gols×3 + assistências×2
 * + desarmes×0.5 − cartões" — mas "desarmes" (tackles) não tem nenhum
 * MatchEvent correspondente no modelo de `events` (T007 não modelou um
 * evento de desarme), então o termo é descartado aqui. Os pesos de
 * cartão amarelo/vermelho ("−cartões", sem números exatos em doc
 * nenhum) também são escolha minha.
 */
import type { MatchEvent } from '../events/types';

const GOAL_WEIGHT = 3;
const ASSIST_WEIGHT = 2;
const YELLOW_CARD_WEIGHT = -1;
const RED_CARD_WEIGHT = -3;

export function calculateMvp(events: readonly MatchEvent[]): string | null {
  const scoreByPlayer = new Map<string, number>();

  function addScore(userCardId: string, delta: number): void {
    scoreByPlayer.set(userCardId, (scoreByPlayer.get(userCardId) ?? 0) + delta);
  }

  for (const event of events) {
    if (event.type === 'goal' && !event.isOwnGoal) {
      addScore(event.scorerUserCardId, GOAL_WEIGHT);
    } else if (event.type === 'assist') {
      addScore(event.assisterUserCardId, ASSIST_WEIGHT);
    } else if (event.type === 'card') {
      addScore(
        event.playerUserCardId,
        event.cardType === 'yellow' ? YELLOW_CARD_WEIGHT : RED_CARD_WEIGHT,
      );
    }
  }

  if (scoreByPlayer.size === 0) {
    return null;
  }

  let mvp: string | null = null;
  let mvpScore = Number.NEGATIVE_INFINITY;
  for (const [userCardId, score] of scoreByPlayer) {
    if (score > mvpScore) {
      mvpScore = score;
      mvp = userCardId;
    }
  }
  return mvp;
}
