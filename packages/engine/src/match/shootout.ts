/**
 * `simulatePenaltyShootout` — doc 09 §20 (`disputaDePenaltis`), fielmente
 * ao pseudocódigo, incluindo a particularidade de só checar parada
 * antecipada a partir da rodada 5 (rounds 1-4 sempre completam os dois
 * lados, mesmo se matematicamente decidido antes — é o que o
 * pseudocódigo literalmente diz, não uma regra real de pênaltis).
 *
 * "selecionarCincoMelhoresCobradores"/"proximoCobradorDisponivel": doc 09
 * não dá o critério de ranking nem a regra exata de rotação em morte
 * súbita. Decisão própria: ranqueio os 10 jogadores de linha (exclui o
 * goleiro, mesmo padrão de `goal.ts`) por `calculatePenaltyKickQuality`
 * (a mesma fórmula de doc 09 §18, a métrica mais direta disponível) e
 * ciclo por essa lista ordenada também na morte súbita, voltando ao
 * início se as 20 rodadas de teto exigirem mais cobranças que jogadores
 * disponíveis (caso extremo, nunca documentado explicitamente).
 */
import type { RNGInstance } from '../rng/rng';
import { calculatePenaltyKickQuality, resolvePenaltyKick } from './penalty-kick';
import type { MatchPlayer, PenaltyShootoutResult, StartingSlot } from './types';

/** doc 09 §20: teto absoluto de rodadas de morte súbita, além das 5 regulares [DD-02]. */
export const MAX_SUDDEN_DEATH_ROUNDS = 20;

function rankPenaltyTakers(starters: readonly StartingSlot[]): readonly MatchPlayer[] {
  const outfield = starters
    .filter((slot) => slot.formationPosition !== 'GK')
    .map((slot) => slot.player);
  return [...outfield].sort(
    (a, b) =>
      calculatePenaltyKickQuality(b.attributes.penalty_kicks, b.attributes.composure) -
      calculatePenaltyKickQuality(a.attributes.penalty_kicks, a.attributes.composure),
  );
}

/**
 * Mesma decisão de `match.ts`: doc 09 §13 — vermelho nunca gera
 * substituição — pode deixar um time sem goleiro algum na disputa de
 * pênaltis. Sem fórmula documentada para "jogador de linha de luvas",
 * uso a mesma qualidade de circunstância fixa e baixa.
 */
const MAKESHIFT_GOALKEEPER_QUALITY = 20;

function findGoalkeeperAttributes(starters: readonly StartingSlot[]): {
  gk_reflexes: number;
  gk_penalty_save: number;
} {
  const gkSlot = starters.find((slot) => slot.formationPosition === 'GK');
  if (gkSlot === undefined) {
    return {
      gk_reflexes: MAKESHIFT_GOALKEEPER_QUALITY,
      gk_penalty_save: MAKESHIFT_GOALKEEPER_QUALITY,
    };
  }
  return {
    gk_reflexes: gkSlot.player.attributes.gk_reflexes,
    gk_penalty_save: gkSlot.player.attributes.gk_penalty_save,
  };
}

function takeKick(
  taker: MatchPlayer,
  goalkeeper: { gk_reflexes: number; gk_penalty_save: number },
  rng: RNGInstance,
): boolean {
  const geloNasVeias = taker.traits.find((t) => t.trait === 'Gelo nas Veias');
  const outcome = resolvePenaltyKick({
    takerPenaltyKicks: taker.attributes.penalty_kicks,
    takerComposure: taker.attributes.composure,
    goalkeeperGkPenaltySave: goalkeeper.gk_penalty_save,
    goalkeeperGkReflexes: goalkeeper.gk_reflexes,
    rng,
    ...(geloNasVeias !== undefined
      ? { geloNasVeiasBonusPercent: geloNasVeias.penaltyConversionBonusPercent }
      : {}),
  });
  return outcome === 'scored';
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: shootout simulation requires tracking home/away state across rounds
export function simulatePenaltyShootout(input: {
  home: { starters: readonly StartingSlot[] };
  away: { starters: readonly StartingSlot[] };
  eventsRng: RNGInstance;
  penaltyTiebreakRng: RNGInstance;
}): PenaltyShootoutResult & { resolvedWinner: 'home' | 'away' } {
  const takersHome = rankPenaltyTakers(input.home.starters);
  const takersAway = rankPenaltyTakers(input.away.starters);
  const goalkeeperHome = findGoalkeeperAttributes(input.home.starters);
  const goalkeeperAway = findGoalkeeperAttributes(input.away.starters);

  let homeScore = 0;
  let awayScore = 0;
  let round = 1;
  let suddenDeathRounds = 0;

  while (round <= 5 || homeScore === awayScore) {
    if (round > 5) {
      suddenDeathRounds += 1;
      if (suddenDeathRounds > MAX_SUDDEN_DEATH_ROUNDS) {
        const resolvedWinner: 'home' | 'away' =
          input.penaltyTiebreakRng.nextFloat() < 0.5 ? 'home' : 'away';
        return {
          homeScore,
          awayScore,
          totalRounds: MAX_SUDDEN_DEATH_ROUNDS,
          resolvedBySeedTiebreak: true,
          resolvedWinner,
        };
      }
    }

    // biome-ignore lint/style/noNonNullAssertion: modulo guarantees valid index in non-empty arrays
    const takerHome = takersHome[(round - 1) % takersHome.length]!;
    // biome-ignore lint/style/noNonNullAssertion: modulo guarantees valid index in non-empty arrays
    const takerAway = takersAway[(round - 1) % takersAway.length]!;

    if (takeKick(takerHome, goalkeeperAway, input.eventsRng)) homeScore += 1;
    if (takeKick(takerAway, goalkeeperHome, input.eventsRng)) awayScore += 1;

    if (round >= 5 && homeScore !== awayScore) {
      break;
    }
    round += 1;
  }

  return {
    homeScore,
    awayScore,
    totalRounds: suddenDeathRounds,
    resolvedBySeedTiebreak: false,
    resolvedWinner: homeScore > awayScore ? 'home' : 'away',
  };
}
