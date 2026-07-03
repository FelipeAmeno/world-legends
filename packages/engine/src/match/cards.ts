/**
 * `cards` — árbitro (doc 09 §10.1) e resolução de faltas (doc 09 §10.2),
 * algoritmo `resolverFalta` implementado ao pé da letra.
 */
import type { WeightedItem } from '../rng/rng';
import type { RNGInstance } from '../rng/rng';
import type { RefereeProfile } from './types';

const REFEREE_PROFILE_WEIGHTS: readonly WeightedItem<RefereeProfile>[] = [
  { value: 'permissivo', weight: 25 },
  { value: 'normal', weight: 50 },
  { value: 'rigoroso', weight: 25 },
];

const REFEREE_CARD_MULTIPLIER: Readonly<Record<RefereeProfile, number>> = {
  permissivo: 0.7,
  normal: 1.0,
  rigoroso: 1.4,
};

export function rollRefereeProfile(rng: RNGInstance): RefereeProfile {
  return rng.weightedChoice(REFEREE_PROFILE_WEIGHTS);
}

export function getRefereeCardMultiplier(profile: RefereeProfile): number {
  return REFEREE_CARD_MULTIPLIER[profile];
}

export type FoulCardOutcome = 'red_direct' | 'red_second_yellow' | 'yellow' | 'none';

/**
 * doc 09 §10.2, `resolverFalta`, sem desvios. `cardLeniencyMultiplier`
 * é o gancho de doc 09 §9 (HOME_ADVANTAGE_CARD_LENIENCY = -10% para
 * faltas do mandante) — passado pelo chamador (`match.ts`), 1.0 quando
 * não aplicável (visitante, ou campo neutro).
 */
export function resolveFoulCardOutcome(input: {
  aggressionAttribute: number;
  refereeProfile: RefereeProfile;
  alreadyHasYellowThisMatch: boolean;
  foulsAccumulatedThisMatch: number;
  cardLeniencyMultiplier: number;
  rng: RNGInstance;
}): FoulCardOutcome {
  const refereeMultiplier =
    getRefereeCardMultiplier(input.refereeProfile) * input.cardLeniencyMultiplier;
  const aggressionFactor = input.aggressionAttribute / 99;

  const redDirectChance = 0.015 * refereeMultiplier * (1 + aggressionFactor);
  if (input.rng.nextFloat() < redDirectChance) {
    return 'red_direct';
  }

  if (input.alreadyHasYellowThisMatch) {
    return 'red_second_yellow';
  }

  const yellowChance =
    0.28 *
    refereeMultiplier *
    (1 + aggressionFactor * 0.5) *
    (1 + input.foulsAccumulatedThisMatch * 0.05);
  if (input.rng.nextFloat() < yellowChance) {
    return 'yellow';
  }

  return 'none';
}
