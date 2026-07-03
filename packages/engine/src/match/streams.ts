/**
 * `initializeMatchRngStreams` — doc 09 §21: deriva, a partir do seed
 * principal, um RNG independente por subsistema, via `deriveStream`
 * (já implementado em `@world-legends/shared` desde a T002) + `RNG`
 * (T003). Mudanças na ordem de consumo de um stream nunca desincronizam
 * os outros — é exatamente o que `deriveStream`/`RNG` já garantem juntos,
 * sem nenhum código novo de hashing aqui.
 */
import { type Seed, deriveStream } from '@world-legends/shared';
import { RNG } from '../rng/rng';
import type { MatchRngStreams } from './types';

export function initializeMatchRngStreams(seed: Seed): MatchRngStreams {
  return {
    events: RNG(deriveStream(seed, 'events')),
    weather: RNG(deriveStream(seed, 'weather')),
    cards: RNG(deriveStream(seed, 'cards')),
    injuries: RNG(deriveStream(seed, 'injuries')),
    narrative: RNG(deriveStream(seed, 'narrative')),
    // doc 09 §21: stream só tocado no caso extremo de doc 09 §20.1 (DD-02).
    penaltyTiebreak: RNG(deriveStream(seed, 'penalty_tiebreak')),
  };
}
