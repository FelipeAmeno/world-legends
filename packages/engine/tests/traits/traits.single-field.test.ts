import {
  type Result,
  type ValidationError,
  isErr,
  isOk,
  unwrapResult,
} from '@world-legends/shared';
import { describe, expect, it } from 'vitest';
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

// Tipo deliberadamente mais amplo que qualquer fábrica específica: cada
// `createXMagnitude` retorna um Result<XMagnitude,...> bem mais preciso,
// mas iterar uma tupla heterogênea de funções com tipos de retorno
// diferentes e chamar uma função genérica (unwrapResult/isOk/isErr)
// dentro do laço faz o TypeScript travar a inferência no tipo do
// PRIMEIRO elemento da tupla — um limite real de inferência do
// compilador, não um erro de lógica. Tipar o array com esta assinatura
// mais ampla (mas ainda estruturalmente segura, por covariância de
// retorno) resolve isso sem perder nenhuma garantia de tipo relevante
// para este teste.
type SingleFieldFactory = (value: number) => Result<Readonly<{ trait: string }>, ValidationError>;

interface SingleFieldCase {
  name: string;
  factory: SingleFieldFactory;
  cap: number;
}

// Os 10 traits cujo efeito mecânico é UM único número (doc 11 §7) —
// Capitão, Iron Man (compostos) e Leader (sem teto absoluto) são
// testados separadamente em seus próprios arquivos.
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

describe('TraitMagnitude — traits de campo único (doc 11 §7)', () => {
  for (const { name, factory, cap } of SINGLE_FIELD_CASES) {
    describe(name, () => {
      it(`aceita o teto exato (${cap})`, () => {
        expect(isOk(factory(cap))).toBe(true);
      });

      it('aceita 0 (piso)', () => {
        expect(isOk(factory(0))).toBe(true);
      });

      it('aceita um valor intermediário', () => {
        expect(isOk(factory(cap / 2))).toBe(true);
      });

      it(`rejeita qualquer valor acima do teto de ${cap}`, () => {
        expect(isErr(factory(cap + 0.001))).toBe(true);
      });

      it('rejeita um valor negativo', () => {
        expect(isErr(factory(-0.001))).toBe(true);
      });

      it('rejeita NaN', () => {
        expect(isErr(factory(Number.NaN))).toBe(true);
      });

      it('rejeita Infinity', () => {
        expect(isErr(factory(Number.POSITIVE_INFINITY))).toBe(true);
      });

      it('o Value Object resultante é congelado (imutável)', () => {
        const value = unwrapResult(factory(cap / 2));
        expect(Object.isFrozen(value)).toBe(true);
      });

      it('o discriminante "trait" tem o nome correto', () => {
        const value = unwrapResult(factory(cap / 2)) as Readonly<{ trait: string }>;
        expect(value.trait).toBe(name);
      });
    });
  }
});
