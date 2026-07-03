import { describe, expect, it } from 'vitest';
import {
  ELO_FLOOR,
  ELO_INITIAL,
  K_FACTOR,
  calculateNewRating,
  expectedScore,
  isMatchmakingCompatible,
} from '../../src/elo/calculate-rating';

describe('Constantes — doc 06 §3.1', () => {
  it('K_FACTOR = 24 (exato conforme doc 06 §3.1)', () => {
    expect(K_FACTOR).toBe(24);
  });

  it('ELO_INITIAL = 1000 (novos jogadores entram em Prata)', () => {
    expect(ELO_INITIAL).toBe(1000);
  });

  it('ELO_FLOOR = 100 (rating mínimo absoluto)', () => {
    expect(ELO_FLOOR).toBe(100);
  });
});

describe('calculateNewRating — fórmula exata doc 06 §3.1', () => {
  it('rejeita partida não-ranqueada: private_league', () => {
    const r = calculateNewRating(1000, 1000, 'win', 'private_league');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe('NotRankedMatch');
  });

  it('rejeita partida não-ranqueada: friendly', () => {
    const r = calculateNewRating(1000, 1000, 'win', 'friendly');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe('NotRankedMatch');
  });

  it('ratings iguais: vencedor ganha 12 pontos (K/2)', () => {
    // expectedA = 0.5 com ratings iguais → K × (1 - 0.5) = 12
    const r = calculateNewRating(1000, 1000, 'win', 'public_ranked');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.deltaA).toBe(12);
      expect(r.value.deltaB).toBe(-12);
    }
  });

  it('ratings iguais: empate não altera os ratings', () => {
    // expectedA = 0.5 → K × (0.5 - 0.5) = 0
    const r = calculateNewRating(1000, 1000, 'draw', 'public_ranked');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.deltaA).toBe(0);
      expect(r.value.deltaB).toBe(0);
    }
  });

  it('favorito perde: perde mais pontos que um outsider perderia', () => {
    // A (2000) vs B (1000): A é muito favorito
    const winA = calculateNewRating(2000, 1000, 'win', 'public_ranked');
    const loseA = calculateNewRating(2000, 1000, 'loss', 'public_ranked');
    if (!winA.ok || !loseA.ok) throw new Error();
    // Perda do favorito deve ser maior em magnitude que a vitória
    expect(Math.abs(loseA.value.deltaA)).toBeGreaterThan(Math.abs(winA.value.deltaA));
  });

  it('outsider vence: ganha mais pontos que o favorito ganharia', () => {
    const outsiderWins = calculateNewRating(1000, 2000, 'win', 'public_ranked');
    const favoriteWins = calculateNewRating(2000, 1000, 'win', 'public_ranked');
    if (!outsiderWins.ok || !favoriteWins.ok) throw new Error();
    expect(outsiderWins.value.deltaA).toBeGreaterThan(favoriteWins.value.deltaA);
  });

  it('soma de deltas é zero (sistema fechado: pontos não criados nem destruídos)', () => {
    const r = calculateNewRating(1500, 1200, 'win', 'public_ranked');
    if (!r.ok) throw new Error();
    expect(r.value.deltaA + r.value.deltaB).toBe(0);
  });

  it('resultado imutável', () => {
    const r = calculateNewRating(1000, 1000, 'win', 'public_ranked');
    if (!r.ok) throw new Error();
    expect(Object.isFrozen(r.value)).toBe(true);
  });

  it('rating nunca cai abaixo do ELO_FLOOR', () => {
    // Jogador com rating quase no floor perde contra favorito
    const r = calculateNewRating(105, 3000, 'loss', 'public_ranked');
    if (!r.ok) throw new Error();
    expect(r.value.newRatingA).toBeGreaterThanOrEqual(ELO_FLOOR);
  });

  it('fórmula matemática: vitória de A (1200) vs B (1000)', () => {
    // expectedA = 1 / (1 + 10^((1000-1200)/400)) = 1/(1+10^(-0.5)) = ~0.76
    // newA = 1200 + 24*(1 - 0.76) = 1200 + 5.7 ≈ 1206
    const r = calculateNewRating(1200, 1000, 'win', 'public_ranked');
    if (!r.ok) throw new Error();
    expect(r.value.newRatingA).toBeGreaterThan(1200);
    expect(r.value.newRatingA).toBeLessThan(1215);
    expect(r.value.newRatingB).toBeLessThan(1000);
  });

  it('rejeita rating negativo', () => {
    const r = calculateNewRating(-1, 1000, 'win', 'public_ranked');
    expect(r.ok).toBe(false);
  });
});

describe('expectedScore — probabilidade de vitória', () => {
  it('ratings iguais → expectedScore = 0.5', () => {
    expect(expectedScore(1000, 1000)).toBe(0.5);
  });

  it('A muito mais forte → expectedScore > 0.9', () => {
    expect(expectedScore(2000, 1000)).toBeGreaterThan(0.9);
  });

  it('A muito mais fraco → expectedScore < 0.1', () => {
    expect(expectedScore(1000, 2000)).toBeLessThan(0.1);
  });

  it('expectedScore(A,B) + expectedScore(B,A) = 1', () => {
    const a = expectedScore(1500, 1200);
    const b = expectedScore(1200, 1500);
    expect(Math.abs(a + b - 1)).toBeLessThan(0.0001);
  });
});

describe('isMatchmakingCompatible — janela de matchmaking (doc 06 §3.3)', () => {
  it('diferença ≤ 100 → compatíveis', () => {
    expect(isMatchmakingCompatible(1000, 1100)).toBe(true);
    expect(isMatchmakingCompatible(1000, 1000)).toBe(true);
  });

  it('diferença > 100 → incompatíveis sem expansão', () => {
    expect(isMatchmakingCompatible(1000, 1101)).toBe(false);
  });

  it('expansão de janela aumenta compatibilidade', () => {
    expect(isMatchmakingCompatible(1000, 1200, 100)).toBe(true);
  });
});
