import { describe, expect, it } from 'vitest';
import {
  CRITICAL_FATIGUE_THRESHOLD_POINTS,
  isCriticallyFatigued,
  selectForcedReplacement,
} from '../../src/match/substitutions';
import { makePlayer } from './fixtures';

describe('selectForcedReplacement (doc 09 §13)', () => {
  it('prioriza um reserva na mesma posição do jogador que sai', () => {
    const bench = [
      makePlayer({ primaryPosition: 'ST', attributes: { finishing: 50 } }),
      makePlayer({ primaryPosition: 'CB', attributes: { defending: 90 } }),
      makePlayer({ primaryPosition: 'CB', attributes: { defending: 40 } }),
    ];
    const replacement = selectForcedReplacement(bench, 'CB');
    expect(replacement?.primaryPosition).toBe('CB');
    expect(replacement?.attributes.defending).toBe(90); // o melhor Overall NA posição, entre os dois CBs
  });

  it('cai para qualquer reserva disponível quando ninguém joga na posição exata', () => {
    const bench = [makePlayer({ primaryPosition: 'ST' })];
    const replacement = selectForcedReplacement(bench, 'CB');
    expect(replacement?.primaryPosition).toBe('ST');
  });

  it('retorna null quando o banco está vazio', () => {
    expect(selectForcedReplacement([], 'CB')).toBeNull();
  });
});

describe('isCriticallyFatigued', () => {
  it('usa o limiar documentado (constante própria, não-documentada — ver comentário em substitutions.ts)', () => {
    expect(isCriticallyFatigued(CRITICAL_FATIGUE_THRESHOLD_POINTS - 0.01)).toBe(false);
    expect(isCriticallyFatigued(CRITICAL_FATIGUE_THRESHOLD_POINTS)).toBe(true);
    expect(isCriticallyFatigued(CRITICAL_FATIGUE_THRESHOLD_POINTS + 5)).toBe(true);
  });
});
