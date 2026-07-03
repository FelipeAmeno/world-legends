/**
 * Testes de compatibilidade de posições
 */
import { describe, expect, it } from 'vitest';
import { PositionFit, canPlayInSlot, checkPositionFit } from '../src/positions/compatibility';

describe('checkPositionFit', () => {
  describe('Posições naturais', () => {
    const naturalCases: Array<
      [import('@world-legends/types').Position, import('@world-legends/types').Position]
    > = [
      ['GK', 'GK'],
      ['CB', 'CB'],
      ['LB', 'LB'],
      ['RB', 'RB'],
      ['LWB', 'LWB'],
      ['LWB', 'LB'],
      ['RWB', 'RWB'],
      ['RWB', 'RB'],
      ['CDM', 'CDM'],
      ['CM', 'CM'],
      ['CAM', 'CAM'],
      ['LM', 'LM'],
      ['RM', 'RM'],
      ['LW', 'LW'],
      ['LW', 'LM'],
      ['RW', 'RW'],
      ['RW', 'RM'],
      ['CF', 'CF'],
      ['CF', 'ST'],
      ['ST', 'ST'],
      ['ST', 'CF'],
    ];
    for (const [player, slot] of naturalCases) {
      it(`${player} em ${slot} = NATURAL`, () => {
        expect(checkPositionFit(player, slot)).toBe(PositionFit.NATURAL);
      });
    }
  });

  describe('Posições compatíveis', () => {
    const compatCases: Array<
      [import('@world-legends/types').Position, import('@world-legends/types').Position]
    > = [
      ['CB', 'CDM'],
      ['LB', 'LWB'],
      ['LB', 'LM'],
      ['RB', 'RWB'],
      ['RB', 'RM'],
      ['CDM', 'CM'],
      ['CDM', 'CB'],
      ['CM', 'CDM'],
      ['CM', 'CAM'],
      ['CM', 'LM'],
      ['CM', 'RM'],
      ['CAM', 'CM'],
      ['CAM', 'CF'],
      ['CAM', 'LW'],
      ['CAM', 'RW'],
      ['LM', 'LW'],
      ['LM', 'CM'],
      ['LM', 'LB'],
      ['RM', 'RW'],
      ['RM', 'CM'],
      ['RM', 'RB'],
      ['LW', 'CAM'],
      ['LW', 'ST'],
      ['LW', 'CF'],
      ['RW', 'CAM'],
      ['RW', 'ST'],
      ['RW', 'CF'],
      ['CF', 'CAM'],
      ['CF', 'LW'],
      ['CF', 'RW'],
      ['ST', 'LW'],
      ['ST', 'RW'],
    ];
    for (const [player, slot] of compatCases) {
      it(`${player} em ${slot} = COMPATIBLE`, () => {
        expect(checkPositionFit(player, slot)).toBe(PositionFit.COMPATIBLE);
      });
    }
  });

  describe('Posições incompatíveis', () => {
    const incompatCases: Array<
      [import('@world-legends/types').Position, import('@world-legends/types').Position]
    > = [
      ['GK', 'ST'],
      ['GK', 'CB'],
      ['GK', 'CM'],
      ['ST', 'GK'],
      ['CB', 'ST'],
      ['CB', 'LW'],
      ['CB', 'RW'],
      ['CB', 'CM'],
      ['LB', 'ST'],
      ['LB', 'CB'],
      ['CM', 'GK'],
      ['CM', 'CB'],
    ];
    for (const [player, slot] of incompatCases) {
      it(`${player} em ${slot} = INCOMPATIBLE`, () => {
        expect(checkPositionFit(player, slot)).toBe(PositionFit.INCOMPATIBLE);
      });
    }
  });

  describe('canPlayInSlot', () => {
    it('GK pode jogar em GK', () => {
      expect(canPlayInSlot('GK', 'GK')).toBe(true);
    });
    it('GK não pode jogar em nenhuma posição de campo', () => {
      expect(canPlayInSlot('GK', 'CB')).toBe(false);
      expect(canPlayInSlot('GK', 'ST')).toBe(false);
      expect(canPlayInSlot('GK', 'CM')).toBe(false);
    });
    it('CM pode jogar em CDM (compatível)', () => {
      expect(canPlayInSlot('CM', 'CDM')).toBe(true);
    });
    it('ST não pode jogar como GK', () => {
      expect(canPlayInSlot('ST', 'GK')).toBe(false);
    });
    it('CF pode jogar como ST (natural)', () => {
      expect(canPlayInSlot('CF', 'ST')).toBe(true);
    });
  });
});
