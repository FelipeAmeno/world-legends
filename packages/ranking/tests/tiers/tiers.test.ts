import { describe, expect, it } from 'vitest';
import {
  PROMOTION_PERCENT,
  RELEGATION_PERCENT,
  TIERS,
  TIER_THRESHOLDS,
  calculateTierMovements,
  sameTier,
  tierFromName,
  tierFromRating,
} from '../../src/tiers/tier';

describe('TIERS — tabela de divisões', () => {
  it('tem exatamente 6 tiers', () => {
    expect(TIERS.length).toBe(6);
  });

  it('os 6 nomes estão presentes (T019)', () => {
    const names = TIERS.map((t) => t.name);
    expect(names).toContain('Bronze');
    expect(names).toContain('Prata');
    expect(names).toContain('Ouro');
    expect(names).toContain('Elite');
    expect(names).toContain('Lenda');
    expect(names).toContain('World Legend');
  });

  it('rankings são sequenciais 1..6 e crescentes', () => {
    const ranks = TIERS.map((t) => t.rank);
    expect(ranks).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('minRating cresce monotonicamente de tier em tier', () => {
    for (let i = 1; i < TIERS.length; i++) {
      expect(TIERS[i]?.minRating).toBeGreaterThan(TIERS[i - 1]?.minRating ?? 0);
    }
  });

  it('World Legend é o único sem maxRating (null)', () => {
    const wl = TIERS.find((t) => t.name === 'World Legend');
    expect(wl?.maxRating).toBeNull();
    const others = TIERS.filter((t) => t.name !== 'World Legend');
    others.forEach((t) => expect(t.maxRating).not.toBeNull());
  });
});

describe('tierFromRating — classificação correta', () => {
  it('Bronze: rating 0', () => {
    expect(tierFromRating(0).name).toBe('Bronze');
  });

  it('Bronze: rating 999', () => {
    expect(tierFromRating(999).name).toBe('Bronze');
  });

  it('Prata: rating 1000 (ELO_INITIAL)', () => {
    expect(tierFromRating(1000).name).toBe('Prata');
  });

  it('Prata: rating 1499', () => {
    expect(tierFromRating(1499).name).toBe('Prata');
  });

  it('Ouro: rating 1500', () => {
    expect(tierFromRating(1500).name).toBe('Ouro');
  });

  it('Elite: rating 2000', () => {
    expect(tierFromRating(2000).name).toBe('Elite');
  });

  it('Lenda: rating 2500', () => {
    expect(tierFromRating(2500).name).toBe('Lenda');
  });

  it('World Legend: rating 3000', () => {
    expect(tierFromRating(3000).name).toBe('World Legend');
  });

  it('World Legend: rating muito alto (sem teto)', () => {
    expect(tierFromRating(9999).name).toBe('World Legend');
  });

  it('limites inferiores batem com TIER_THRESHOLDS', () => {
    for (const [name, threshold] of Object.entries(TIER_THRESHOLDS)) {
      expect(tierFromRating(threshold).name).toBe(name);
    }
  });
});

describe('tierFromName', () => {
  it('retorna o tier correto por nome', () => {
    expect(tierFromName('Elite').minRating).toBe(2000);
    expect(tierFromName('World Legend').maxRating).toBeNull();
  });
});

describe('sameTier', () => {
  it('mesmo tier → true', () => {
    expect(sameTier(1000, 1400)).toBe(true); // ambos Prata
  });

  it('tiers diferentes → false', () => {
    expect(sameTier(1000, 1500)).toBe(false); // Prata vs Ouro
  });
});

describe('calculateTierMovements — promoção/rebaixamento (doc 06 §3.2)', () => {
  it('top 20% sobe de divisão', () => {
    const players = Array.from({ length: 10 }, (_, i) => ({
      profileId: `p${i}`,
      rating: 2000 - i * 10, // ordenados DESC
    }));
    const results = calculateTierMovements(players, 'Ouro');
    const promoted = results.filter((r) => r.direction === 'promoted');
    expect(promoted.length).toBe(2); // 20% de 10
    expect(promoted.every((r) => r.currentTier === 'Ouro')).toBe(true);
    expect(promoted.every((r) => r.newTier === 'Elite')).toBe(true);
  });

  it('bottom 20% desce de divisão', () => {
    const players = Array.from({ length: 10 }, (_, i) => ({
      profileId: `p${i}`,
      rating: 2000 - i * 10,
    }));
    const results = calculateTierMovements(players, 'Ouro');
    const relegated = results.filter((r) => r.direction === 'relegated');
    expect(relegated.length).toBe(2); // 20% de 10
    expect(relegated.every((r) => r.newTier === 'Prata')).toBe(true);
  });

  it('Bronze não pode ser rebaixado (sem tier abaixo)', () => {
    const players = Array.from({ length: 10 }, (_, i) => ({
      profileId: `p${i}`,
      rating: 900 - i * 10,
    }));
    const results = calculateTierMovements(players, 'Bronze');
    const relegated = results.filter((r) => r.direction === 'relegated');
    expect(relegated.length).toBe(0);
  });

  it('World Legend não pode ser promovido (sem tier acima)', () => {
    const players = Array.from({ length: 10 }, (_, i) => ({
      profileId: `p${i}`,
      rating: 4000 - i * 50,
    }));
    const results = calculateTierMovements(players, 'World Legend');
    const promoted = results.filter((r) => r.direction === 'promoted');
    expect(promoted.length).toBe(0);
  });

  it('lista vazia retorna array vazio', () => {
    expect(calculateTierMovements([], 'Ouro').length).toBe(0);
  });

  it('PROMOTION_PERCENT e RELEGATION_PERCENT = 20%', () => {
    expect(PROMOTION_PERCENT).toBe(0.2);
    expect(RELEGATION_PERCENT).toBe(0.2);
  });
});
