/**
 * `goal` — doc 09 §17 (`calcularProbabilidadeGol`), mais a seleção de
 * quem finaliza e quem assiste, que doc nenhum especifica
 * algoritmicamente (gap real, ver decisões abaixo).
 *
 * DECISÕES DE SÍNTESE (sem fonte documentada exata):
 * - **Seleção do finalizador**: escolha ponderada (`weightedChoice`,
 *   T003) entre os jogadores de linha do time favorecido, com peso =
 *   atributo `finishing` de cada um — a habilidade mais diretamente
 *   relacionada a "ser o autor de uma finalização".
 * - **Ocorrência de assistência**: `ASSIST_PROBABILITY = 0.65`,
 *   constante MINHA, não documentada — nenhum doc dá essa
 *   probabilidade.
 * - **Seleção do assistente**: ponderada por `passing + vision` entre
 *   os companheiros (excluindo o autor do gol), com bônus de peso para
 *   quem tem o trait Maestro (doc 10 §5).
 *
 * `modificadorMomentum`/`modificadorMoral` da fórmula original de xG
 * NÃO são aplicados aqui (ficam implicitamente em 1.0) — nenhum dos
 * dois tem magnitude numérica documentada (doc 09 §16 só dá a magnitude
 * do momentum como bônus na CHANCE DE EVENTO, seção já aplicada antes
 * de chegar aqui; aplicá-lo de novo dentro do xG seria contar o mesmo
 * efeito duas vezes sem base para um segundo número).
 */
import type { AttributeSet } from '../overall/types';
import type { RNGInstance, WeightedItem } from '../rng/rng';
import type { MatchPlayer, StartingSlot, Weather } from './types';
import {
  applyColdWeatherToFinishingAttributes,
  calculateWeatherPrecisionModifier,
} from './weather';

const ASSIST_PROBABILITY = 0.65;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * doc 09 §17, fórmula completa. `attackingSectorStrength` é a Força de
 * Setor de ataque do time atacante (doc 09 §3, já calculada por
 * `calculateTeamPower`/`calculateSectorStrength` antes de chegar aqui).
 * `matadorBonusPercent` é o bônus do trait Matador (doc 10 §5, T006),
 * já lido de `MatadorMagnitude.areaConversionBonusPercent` pelo
 * chamador — aplicado como multiplicador final sobre o xG.
 */
export function calculateGoalProbability(input: {
  shooterAttributes: AttributeSet;
  goalkeeperGkReflexes: number;
  defendingSectorStrength: number;
  attackingSectorStrength: number;
  weather: Weather;
  matadorBonusPercent?: number;
}): number {
  const { shotPower, dribbling } = applyColdWeatherToFinishingAttributes(
    input.shooterAttributes.shot_power,
    input.shooterAttributes.dribbling,
    input.weather,
  );

  const finishingQuality =
    (input.shooterAttributes.finishing * 0.5 +
      shotPower * 0.2 +
      dribbling * 0.15 +
      input.attackingSectorStrength * 0.15) /
    99;
  const defensiveQuality =
    (input.defendingSectorStrength * 0.6 + input.goalkeeperGkReflexes * 0.4) / 99;

  const xgBase = finishingQuality * (1 - defensiveQuality * 0.7);
  const weatherPrecisionModifier = calculateWeatherPrecisionModifier(input.weather);
  let xg = xgBase * weatherPrecisionModifier;

  if (input.matadorBonusPercent !== undefined) {
    xg *= 1 + input.matadorBonusPercent / 100;
  }

  return clamp(xg, 0.03, 0.55);
}

/** Decisão própria — ver nota do módulo. Exclui o goleiro (slot `GK`). */
export function selectShooter(starters: readonly StartingSlot[], rng: RNGInstance): StartingSlot {
  const candidates = starters.filter((slot) => slot.formationPosition !== 'GK');
  const weighted: WeightedItem<StartingSlot>[] = candidates.map((slot) => ({
    value: slot,
    weight: Math.max(1, slot.player.attributes.finishing),
  }));
  return rng.weightedChoice(weighted);
}

/** Decisão própria — ver nota do módulo. `null` quando o gol não tem assistência. */
export function selectAssister(
  starters: readonly StartingSlot[],
  scorerUserCardId: string,
  rng: RNGInstance,
): MatchPlayer | null {
  if (rng.nextFloat() >= ASSIST_PROBABILITY) {
    return null;
  }
  const candidates = starters.filter(
    (slot) => slot.formationPosition !== 'GK' && slot.player.userCardId !== scorerUserCardId,
  );
  if (candidates.length === 0) {
    return null;
  }
  const weighted: WeightedItem<MatchPlayer>[] = candidates.map((slot) => {
    const maestro = slot.player.traits.find((trait) => trait.trait === 'Maestro');
    const maestroBoost = maestro ? 1 + maestro.assistChanceBonusPercent / 100 : 1;
    const baseWeight = slot.player.attributes.passing + slot.player.attributes.vision;
    return { value: slot.player, weight: Math.max(1, baseWeight) * maestroBoost };
  });
  return rng.weightedChoice(weighted);
}
