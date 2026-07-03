import { describe, expect, it } from 'vitest';
import { calculateLeaderStackedBonus } from '../../src/traits/traits';

describe('calculateLeaderStackedBonus — empilhamento geométrico (doc 11 §7)', () => {
  it('com 0 cartas, o bônus total é 0', () => {
    expect(calculateLeaderStackedBonus(10, 0)).toBe(0);
  });

  it('com 1 carta, o bônus total é exatamente o base', () => {
    expect(calculateLeaderStackedBonus(10, 1)).toBe(10);
  });

  it('com 2 cartas, a segunda soma exatamente a metade do base (base × 1.5)', () => {
    // base×(0.5)^0 + base×(0.5)^1 = base + base/2 = 1.5×base
    expect(calculateLeaderStackedBonus(10, 2)).toBe(15);
  });

  it('com 3 cartas, a terceira soma um quarto do base (base × 1.75)', () => {
    // base + base/2 + base/4 = 1.75×base
    expect(calculateLeaderStackedBonus(10, 3)).toBe(17.5);
  });

  it('com 4 cartas, o total é base × 1.875', () => {
    expect(calculateLeaderStackedBonus(10, 4)).toBe(18.75);
  });

  it('para qualquer quantidade de cartas, o total nunca atinge ou ultrapassa 2×base', () => {
    const base = 10;
    for (let n = 1; n <= 50; n += 1) {
      const total = calculateLeaderStackedBonus(base, n);
      expect(total < 2 * base).toBe(true);
    }
  });

  it('o total converge para 2×base à medida que o número de cartas cresce', () => {
    const base = 10;
    const totalWith20 = calculateLeaderStackedBonus(base, 20);
    const totalWith50 = calculateLeaderStackedBonus(base, 50);
    expect(Math.abs(totalWith50 - totalWith20) < 0.0001).toBe(true);
    expect(Math.abs(totalWith50 - 2 * base) < 0.0001).toBe(true);
  });

  it('é proporcional ao valor de base (escala linearmente)', () => {
    const totalBase10 = calculateLeaderStackedBonus(10, 3);
    const totalBase20 = calculateLeaderStackedBonus(20, 3);
    expect(totalBase20).toBe(totalBase10 * 2);
  });

  it('com base 0, o total é sempre 0, qualquer que seja a quantidade de cartas', () => {
    expect(calculateLeaderStackedBonus(0, 5)).toBe(0);
  });

  it('com quantidade de cartas negativa, o total é 0 (entrada inválida tratada com segurança)', () => {
    expect(calculateLeaderStackedBonus(10, -3)).toBe(0);
  });
});
