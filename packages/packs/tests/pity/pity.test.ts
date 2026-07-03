import { describe, expect, it } from 'vitest';
import {
  PITY_THRESHOLDS,
  createPityCounter,
  createUserPityState,
  getForcedMinRarity,
  increment,
  isForced,
  isSatisfiedBy,
  recordHit,
  updatePityAfterOpening,
} from '../../src/pity/pity-counter';

describe('PityCounter — operações puras', () => {
  it('começa com packsSinceLastHit = 0', () => {
    const c = createPityCounter('legendary_plus');
    expect(c.packsSinceLastHit).toBe(0);
    expect(isForced(c)).toBe(false);
  });

  it('increment aumenta o contador', () => {
    let c = createPityCounter('legendary_plus');
    c = increment(c);
    expect(c.packsSinceLastHit).toBe(1);
  });

  it('recordHit zera o contador (doc 17 §8)', () => {
    let c = createPityCounter('legendary_plus', 35);
    c = recordHit(c);
    expect(c.packsSinceLastHit).toBe(0);
    expect(isForced(c)).toBe(false);
  });

  it('não muta o original (imutabilidade)', () => {
    const original = createPityCounter('legendary_plus', 10);
    increment(original);
    expect(original.packsSinceLastHit).toBe(10);
  });
});

describe('TC-PACK-07 — pity Legendary+ ao atingir limiar 40', () => {
  it('isForced = false antes de atingir o limiar', () => {
    const c = createPityCounter('legendary_plus', PITY_THRESHOLDS.legendary_plus - 1);
    expect(isForced(c)).toBe(false);
  });

  it('isForced = true exatamente ao atingir o limiar (packsSinceLastHit = 40)', () => {
    const c = createPityCounter('legendary_plus', PITY_THRESHOLDS.legendary_plus);
    expect(isForced(c)).toBe(true);
  });

  it('getForcedMinRarity retorna legendary para legendary_plus', () => {
    const c = createPityCounter('legendary_plus', 40);
    expect(getForcedMinRarity(c)).toBe('legendary');
  });
});

describe('TC-PACK-08 — pity Ultra+ ao atingir limiar 120', () => {
  it('isForced = false antes de 120', () => {
    const c = createPityCounter('ultra_plus', PITY_THRESHOLDS.ultra_plus - 1);
    expect(isForced(c)).toBe(false);
  });

  it('isForced = true exatamente ao atingir 120', () => {
    const c = createPityCounter('ultra_plus', PITY_THRESHOLDS.ultra_plus);
    expect(isForced(c)).toBe(true);
  });

  it('getForcedMinRarity retorna ultra para ultra_plus', () => {
    const c = createPityCounter('ultra_plus', 120);
    expect(getForcedMinRarity(c)).toBe('ultra');
  });
});

describe('TC-PACK-09 — WCH NUNCA é forçado pelo pity', () => {
  it('isSatisfiedBy: WCH satisfaz legendary_plus (para fins de reset)', () => {
    const c = createPityCounter('legendary_plus');
    expect(isSatisfiedBy(c, 'world_cup_hero')).toBe(true);
  });

  it('isSatisfiedBy: WCH satisfaz ultra_plus (para fins de reset)', () => {
    const c = createPityCounter('ultra_plus');
    expect(isSatisfiedBy(c, 'world_cup_hero')).toBe(true);
  });

  it('getForcedMinRarity NUNCA retorna world_cup_hero — máximo é ultra', () => {
    const c = createPityCounter('ultra_plus', 120);
    expect(getForcedMinRarity(c)).toBe('ultra');
    expect(getForcedMinRarity(c)).not.toBe('world_cup_hero');
  });
});

describe('isSatisfiedBy — quais raridades satisfazem cada contador', () => {
  it('legendary_plus: satisfeito por legendary, ultra, WCH; não por common/rare/elite', () => {
    const c = createPityCounter('legendary_plus');
    expect(isSatisfiedBy(c, 'legendary')).toBe(true);
    expect(isSatisfiedBy(c, 'ultra')).toBe(true);
    expect(isSatisfiedBy(c, 'world_cup_hero')).toBe(true);
    expect(isSatisfiedBy(c, 'elite')).toBe(false);
    expect(isSatisfiedBy(c, 'rare')).toBe(false);
    expect(isSatisfiedBy(c, 'common')).toBe(false);
  });

  it('ultra_plus: satisfeito por ultra e WCH; não por legendary-', () => {
    const c = createPityCounter('ultra_plus');
    expect(isSatisfiedBy(c, 'ultra')).toBe(true);
    expect(isSatisfiedBy(c, 'world_cup_hero')).toBe(true);
    expect(isSatisfiedBy(c, 'legendary')).toBe(false);
  });
});

describe('updatePityAfterOpening — ambos contadores gerenciados juntos', () => {
  it('common incrementa ambos', () => {
    const state = createUserPityState();
    const updated = updatePityAfterOpening(state, 'common');
    expect(updated.legendaryPlus.packsSinceLastHit).toBe(1);
    expect(updated.ultraPlus.packsSinceLastHit).toBe(1);
  });

  it('legendary reseta legendary_plus mas NÃO reseta ultra_plus', () => {
    const state = {
      legendaryPlus: createPityCounter('legendary_plus', 20),
      ultraPlus: createPityCounter('ultra_plus', 50),
    };
    const updated = updatePityAfterOpening(state, 'legendary');
    expect(updated.legendaryPlus.packsSinceLastHit).toBe(0); // resetou
    expect(updated.ultraPlus.packsSinceLastHit).toBe(51); // incrementou (legendary < ultra)
  });

  it('ultra reseta AMBOS (ultra ≥ legendary ≥ ...)', () => {
    const state = {
      legendaryPlus: createPityCounter('legendary_plus', 30),
      ultraPlus: createPityCounter('ultra_plus', 80),
    };
    const updated = updatePityAfterOpening(state, 'ultra');
    expect(updated.legendaryPlus.packsSinceLastHit).toBe(0);
    expect(updated.ultraPlus.packsSinceLastHit).toBe(0);
  });

  it('world_cup_hero reseta AMBOS (WCH é ≥ tudo — reset, mas nunca forçado)', () => {
    const state = {
      legendaryPlus: createPityCounter('legendary_plus', 39),
      ultraPlus: createPityCounter('ultra_plus', 119),
    };
    const updated = updatePityAfterOpening(state, 'world_cup_hero');
    expect(updated.legendaryPlus.packsSinceLastHit).toBe(0);
    expect(updated.ultraPlus.packsSinceLastHit).toBe(0);
  });
});
