import {
  type Result,
  type ValidationError,
  createSeed,
  isErr,
  isOk,
  unwrapResult,
} from '@world-legends/shared';
import { describe, expect, it } from 'vitest';
import { RNG } from '../../src/rng/rng';
import {
  createBigGamePlayerMagnitude,
  createClutchPlayerMagnitude,
  createDeadBallSpecialistMagnitude,
  createFastRecoveryMagnitude,
  createGeloNasVeiasMagnitude,
  createHeroMomentMagnitude,
  createMaestroMagnitude,
  createMatadorMagnitude,
  createMuralhaMagnitude,
  createSuperSubMagnitude,
} from '../../src/traits/traits';

function seed(value: string) {
  return unwrapResult(createSeed(value));
}

// Ver nota equivalente em traits.single-field.test.ts sobre por que este
// tipo precisa ser mais amplo que qualquer fábrica específica.
type SingleFieldFactory = (value: number) => Result<Readonly<{ trait: string }>, ValidationError>;

interface SingleFieldCase {
  name: string;
  factory: SingleFieldFactory;
  cap: number;
}

const SINGLE_FIELD_CASES: readonly SingleFieldCase[] = [
  { name: 'Matador', factory: createMatadorMagnitude, cap: 12 },
  { name: 'Maestro', factory: createMaestroMagnitude, cap: 10 },
  { name: 'Muralha', factory: createMuralhaMagnitude, cap: 10 },
  { name: 'Clutch Player', factory: createClutchPlayerMagnitude, cap: 8 },
  { name: 'Big Game Player', factory: createBigGamePlayerMagnitude, cap: 8 },
  { name: 'Fast Recovery', factory: createFastRecoveryMagnitude, cap: 30 },
  { name: 'Super Sub', factory: createSuperSubMagnitude, cap: 10 },
  { name: 'Dead Ball Specialist', factory: createDeadBallSpecialistMagnitude, cap: 15 },
  { name: 'Hero Moment', factory: createHeroMomentMagnitude, cap: 0.5 },
  { name: 'Gelo nas Veias', factory: createGeloNasVeiasMagnitude, cap: 10 },
];

/**
 * "Garantir limites máximos estruturais" — esta é a confirmação empírica
 * de que a garantia se sustenta: sobre milhares de valores amostrados
 * aleatoriamente (seedado, portanto reprodutível) em uma faixa bem mais
 * ampla que o teto de cada trait, NENHUMA instância acima do teto jamais
 * escapa da fábrica como sucesso — e nenhum valor legitimamente dentro
 * do teto é injustamente rejeitado.
 */
describe('TraitMagnitude — Monte Carlo: nenhum teto é violado em milhares de amostras', () => {
  for (const { name, factory, cap } of SINGLE_FIELD_CASES) {
    it(`${name}: amostragem ampla nunca produz um Ok acima do teto de ${cap}`, () => {
      const rng = RNG(seed(`monte-carlo-trait-${name}`));
      const N = 2000;
      for (let i = 0; i < N; i += 1) {
        // amostra uniformemente entre -10% do teto e +50% do teto, para
        // garantir cobertura real de ambos os lados da fronteira.
        const sample = (rng.nextFloat() * 1.6 - 0.1) * cap;
        const result = factory(sample);
        if (sample < 0 || sample > cap) {
          expect(isErr(result)).toBe(true);
        } else {
          expect(isOk(result)).toBe(true);
          expect(unwrapResult(result).trait).toBe(name);
        }
      }
    });
  }
});
