/**
 * T039 — Card Evolution · 30 testes
 *
 * TC-EVL-01..05  Limites por raridade (MAX_EVOLUTION_LEVEL)
 * TC-EVL-06..10  createCardEvolution (estado inicial, erros)
 * TC-EVL-11..15  evolveCard (happy path, tag, OVR boost)
 * TC-EVL-16..20  Erros (max level, common, inválidos)
 * TC-EVL-21..25  EvolutionCost (escalonamento por nível e raridade)
 * TC-EVL-26..30  Integração (sequência completa, OVR cap, displayName)
 */
import { describe, expect, it } from 'vitest';
import {
  BASE_CREDIT_COST,
  BASE_FRAGMENT_COST,
  LEVEL_MULTIPLIER,
  MAX_CARD_OVERALL,
  MAX_EVOLUTION_LEVEL,
  OVR_BOOST_PER_LEVEL,
  createCardEvolution,
  evolveCard,
  evolveCardN,
  getCostForNextLevel,
  getCumulativeCost,
  getDisplayName,
  getEvolutionTag,
} from '../src/index';
import type { CardEvolution } from '../src/index';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeEvolution(rarity: string, ovr = 85, name = 'Pelé'): CardEvolution {
  const r = createCardEvolution('uc-1', name, rarity, ovr);
  if (!r.ok) throw new Error(`createCardEvolution falhou: ${JSON.stringify(r.error)}`);
  return r.value;
}

function evolveN(ev: CardEvolution, n: number): CardEvolution {
  const r = evolveCardN(ev, n);
  if (!r.ok) throw new Error(`evolveCardN(${n}) falhou: ${JSON.stringify(r.error)}`);
  return r.value;
}

// ─── TC-EVL-01..05: Limites por raridade ────────────────────────────────────

describe('TC-EVL-01..05: MAX_EVOLUTION_LEVEL por raridade', () => {
  it('TC-EVL-01: common → maxLevel = 0 (não evolui)', () => {
    expect(MAX_EVOLUTION_LEVEL.common).toBe(0);
    const ev = makeEvolution('common');
    expect(ev.maxLevel).toBe(0);
    expect(ev.isMaxEvolution).toBe(true); // já no max (= base)
  });

  it('TC-EVL-02: rare → maxLevel = 1', () => {
    expect(MAX_EVOLUTION_LEVEL.rare).toBe(1);
    const ev = makeEvolution('rare');
    expect(ev.maxLevel).toBe(1);
    expect(ev.isMaxEvolution).toBe(false);
  });

  it('TC-EVL-03: elite → maxLevel = 2', () => {
    expect(MAX_EVOLUTION_LEVEL.elite).toBe(2);
  });

  it('TC-EVL-04: legendary → maxLevel = 3', () => {
    expect(MAX_EVOLUTION_LEVEL.legendary).toBe(3);
    const ev = makeEvolution('legendary');
    expect(ev.maxLevel).toBe(3);
  });

  it('TC-EVL-05: ultra e world_cup_hero → maxLevel = 4', () => {
    expect(MAX_EVOLUTION_LEVEL.ultra).toBe(4);
    expect(MAX_EVOLUTION_LEVEL.world_cup_hero).toBe(4);
  });
});

// ─── TC-EVL-06..10: createCardEvolution ─────────────────────────────────────

describe('TC-EVL-06..10: createCardEvolution', () => {
  it('TC-EVL-06: cria carta legendary no nível 0', () => {
    const r = createCardEvolution('uc-1', 'Pelé', 'legendary', 95);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.evolutionLevel).toBe(0);
    expect(r.value.currentOverall).toBe(95);
    expect(r.value.tag).toBe('');
    expect(r.value.displayName).toBe('Pelé');
    expect(r.value.isMaxEvolution).toBe(false);
  });

  it('TC-EVL-07: userCardId vazio → erro', () => {
    expect(createCardEvolution('', 'Pelé', 'legendary', 95).ok).toBe(false);
  });

  it('TC-EVL-08: raridade inválida → InvalidRarity', () => {
    const r = createCardEvolution('uc-1', 'Pelé', 'diamond', 95);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toMatchObject({ kind: 'InvalidRarity', rarityCode: 'diamond' });
  });

  it('TC-EVL-09: overall fora de [1,99] → InvalidOverall', () => {
    expect(createCardEvolution('uc-1', 'X', 'legendary', 0).ok).toBe(false);
    expect(createCardEvolution('uc-1', 'X', 'legendary', 100).ok).toBe(false);
    expect(createCardEvolution('uc-1', 'X', 'legendary', -5).ok).toBe(false);
  });

  it('TC-EVL-10: common → isMaxEvolution = true desde o início', () => {
    const r = createCardEvolution('uc-1', 'Zé', 'common', 65);
    if (!r.ok) return;
    expect(r.value.isMaxEvolution).toBe(true);
    expect(r.value.maxLevel).toBe(0);
    expect(r.value.evolutionLevel).toBe(0);
  });
});

// ─── TC-EVL-11..15: evolveCard ───────────────────────────────────────────────

describe('TC-EVL-11..15: evolveCard', () => {
  it('TC-EVL-11: legendary 0 → 1: tag="+1", OVR+2', () => {
    const base = makeEvolution('legendary', 90);
    const r = evolveCard(base);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.evolutionLevel).toBe(1);
    expect(r.value.tag).toBe('+1');
    expect(r.value.currentOverall).toBe(90 + OVR_BOOST_PER_LEVEL); // 92
    expect(r.value.displayName).toBe('Pelé +1');
    expect(r.value.isMaxEvolution).toBe(false);
  });

  it('TC-EVL-12: legendary 1 → 2: tag="+2", acumula OVR', () => {
    const lvl1 = evolveN(makeEvolution('legendary', 90), 1);
    const r = evolveCard(lvl1);
    if (!r.ok) return;
    expect(r.value.tag).toBe('+2');
    expect(r.value.currentOverall).toBe(90 + 2 * OVR_BOOST_PER_LEVEL); // 94
    expect(r.value.displayName).toBe('Pelé +2');
  });

  it('TC-EVL-13: legendary chega ao +3 (maxLevel=3) → isMaxEvolution=true', () => {
    const max = evolveN(makeEvolution('legendary', 85), 3);
    expect(max.evolutionLevel).toBe(3);
    expect(max.isMaxEvolution).toBe(true);
    expect(max.tag).toBe('+3');
  });

  it('TC-EVL-14: rare sobe até +1 corretamente', () => {
    const base = makeEvolution('rare', 70);
    const r = evolveCard(base);
    if (!r.ok) return;
    expect(r.value.evolutionLevel).toBe(1);
    expect(r.value.isMaxEvolution).toBe(true); // rare max=1
    expect(r.value.tag).toBe('+1');
  });

  it('TC-EVL-15: ultra sobe até +4', () => {
    const max = evolveN(makeEvolution('ultra', 90), 4);
    expect(max.evolutionLevel).toBe(4);
    expect(max.isMaxEvolution).toBe(true);
    expect(max.tag).toBe('+4');
    expect(max.currentOverall).toBe(Math.min(99, 90 + 4 * 2)); // 98
  });
});

// ─── TC-EVL-16..20: Erros ────────────────────────────────────────────────────

describe('TC-EVL-16..20: Erros de evolução', () => {
  it('TC-EVL-16: common não pode evoluir → CannotEvolve', () => {
    const ev = makeEvolution('common');
    const r = evolveCard(ev);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toMatchObject({ kind: 'CannotEvolve', rarityCode: 'common' });
  });

  it('TC-EVL-17: rare já no +1 → AlreadyMaxEvolution', () => {
    const max = evolveN(makeEvolution('rare', 70), 1);
    const r = evolveCard(max);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toMatchObject({ kind: 'AlreadyMaxEvolution', maxLevel: 1 });
  });

  it('TC-EVL-18: legendary já no +3 → AlreadyMaxEvolution', () => {
    const max = evolveN(makeEvolution('legendary'), 3);
    const r = evolveCard(max);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toMatchObject({ kind: 'AlreadyMaxEvolution', maxLevel: 3 });
  });

  it('TC-EVL-19: evolveCardN com n=0 → erro', () => {
    expect(evolveCardN(makeEvolution('legendary'), 0).ok).toBe(false);
  });

  it('TC-EVL-20: evolveCardN além do max para no AlreadyMaxEvolution', () => {
    const r = evolveCardN(makeEvolution('rare', 70), 5); // rare max=1
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toMatchObject({ kind: 'AlreadyMaxEvolution' });
  });
});

// ─── TC-EVL-21..25: EvolutionCost ────────────────────────────────────────────

describe('TC-EVL-21..25: EvolutionCost', () => {
  it('TC-EVL-21: common → custo = null (não evolui)', () => {
    const cost = getCostForNextLevel('common', 0, 0);
    expect(cost).toBeNull();
  });

  it('TC-EVL-22: legendary +0→+1 = 1000c + 300 frags', () => {
    const cost = getCostForNextLevel('legendary', 0, 3);
    expect(cost).not.toBeNull();
    expect(cost!.credits).toBe(BASE_CREDIT_COST.legendary * LEVEL_MULTIPLIER[1]!); // 1000×1=1000
    expect(cost!.fragments).toBe(BASE_FRAGMENT_COST.legendary * LEVEL_MULTIPLIER[1]!); // 300×1=300
    expect(cost!.targetLevel).toBe(1);
  });

  it('TC-EVL-23: legendary +2→+3 custa ×4 mais que +0→+1', () => {
    const cost0to1 = getCostForNextLevel('legendary', 0, 3)!;
    const cost2to3 = getCostForNextLevel('legendary', 2, 3)!;
    expect(cost2to3.credits).toBe(cost0to1.credits * 4); // LEVEL_MULTIPLIER[3]=4
    expect(cost2to3.fragments).toBe(cost0to1.fragments * 4);
  });

  it('TC-EVL-24: ultra custa mais que legendary no mesmo nível', () => {
    const legCost = getCostForNextLevel('legendary', 0, 3)!;
    const ultraCost = getCostForNextLevel('ultra', 0, 4)!;
    expect(ultraCost.credits).toBeGreaterThan(legCost.credits);
    expect(ultraCost.fragments).toBeGreaterThan(legCost.fragments);
  });

  it('TC-EVL-25: getCumulativeCost legendary 0→3 = soma dos 3 níveis', () => {
    const c01 = getCostForNextLevel('legendary', 0, 3)!;
    const c12 = getCostForNextLevel('legendary', 1, 3)!;
    const c23 = getCostForNextLevel('legendary', 2, 3)!;
    const cum = getCumulativeCost('legendary', 0, 3, 3);
    expect(cum.credits).toBe(c01.credits + c12.credits + c23.credits);
    expect(cum.fragments).toBe(c01.fragments + c12.fragments + c23.fragments);
  });
});

// ─── TC-EVL-26..30: Integração e invariantes ─────────────────────────────────

describe('TC-EVL-26..30: Integração e invariantes', () => {
  it('TC-EVL-26: sequência completa Pelé Legendary 0→1→2→3', () => {
    let ev = makeEvolution('legendary', 95, 'Pelé');
    expect(ev.displayName).toBe('Pelé');
    ev = evolveN(ev, 1);
    expect(ev.displayName).toBe('Pelé +1');
    ev = evolveN(ev, 1);
    expect(ev.displayName).toBe('Pelé +2');
    ev = evolveN(ev, 1);
    expect(ev.displayName).toBe('Pelé +3');
    expect(ev.isMaxEvolution).toBe(true);
    expect(ev.currentOverall).toBe(99); // capped at MAX_CARD_OVERALL (95 + 3*2 = 101 → 99)
  });

  it('TC-EVL-27: OVR nunca ultrapassa MAX_CARD_OVERALL (99)', () => {
    // Carta com OVR=98: 98+4×2=106 → deve ser limitado a 99
    const ev = evolveN(makeEvolution('ultra', 98), 4);
    expect(ev.currentOverall).toBe(MAX_CARD_OVERALL);
    expect(ev.currentOverall).toBe(99);
  });

  it('TC-EVL-28: CardEvolution é imutável (frozen)', () => {
    const ev = makeEvolution('legendary');
    expect(Object.isFrozen(ev)).toBe(true);
    const r = evolveCard(ev);
    if (!r.ok) return;
    expect(Object.isFrozen(r.value)).toBe(true);
  });

  it('TC-EVL-29: getEvolutionTag correto', () => {
    expect(getEvolutionTag(0)).toBe('');
    expect(getEvolutionTag(1)).toBe('+1');
    expect(getEvolutionTag(3)).toBe('+3');
    expect(getEvolutionTag(4)).toBe('+4');
  });

  it('TC-EVL-30: OVR_BOOST_PER_LEVEL = 2, MAX_CARD_OVERALL = 99', () => {
    expect(OVR_BOOST_PER_LEVEL).toBe(2);
    expect(MAX_CARD_OVERALL).toBe(99);
    // Verificar que cada nível adiciona exatamente 2 OVR
    const base = makeEvolution('legendary', 80);
    const lvl1 = evolveN(base, 1);
    const lvl2 = evolveN(base, 2);
    expect(lvl1.currentOverall - base.currentOverall).toBe(OVR_BOOST_PER_LEVEL);
    expect(lvl2.currentOverall - lvl1.currentOverall).toBe(OVR_BOOST_PER_LEVEL);
  });
});
