import type { RarityCode } from '@world-legends/types';
/**
 * Testes do PackService — T030 Pack Opening Engine
 *
 * TC-PS-01..15: openPackWithService
 *   - Cartas novas vs duplicatas
 *   - Fragmentos corretos por raridade
 *   - Pity atualizado após abertura
 *   - Todos os tipos de pack
 *
 * TC-PS-FRAG: taxas de conversão de fragmentos
 */
import { describe, expect, it } from 'vitest';
import {
  FRAGMENT_RATES,
  fragmentsForDuplicate,
  openPackWithService,
  totalFragments,
} from '../../src/index';
import { CLASSIC_PACK, ELITE_PACK, LEGEND_PACK } from '../../src/pack/pack-definitions';
import { PITY_THRESHOLDS, createUserPityState } from '../../src/pity/pity-counter';

// ─── Helpers ──────────────────────────────────────────────────────────────────

let idxCounter = 0;
function makeOpeningId() {
  return `tc-ps-${++idxCounter}`;
}

/** Resolver que sempre retorna um CardId único baseado em rarity+edition. */
const freshResolver = (r: RarityCode, e: string) => `card:${r}:${e}`;

/** Resolver que retorna sempre o mesmo cardId (para simular duplicatas fáceis). */
const singleCardResolver = (r: RarityCode, _e: string) => `card:fixed:${r}`;

/** Checker que considera tudo como novo (sem duplicatas). */
const noOwnership = (_: string) => false;

/** Checker que considera tudo como duplicata. */
const allOwned = (_: string) => true;

// ─── TC-PS-FRAG: Taxas de fragmentos ─────────────────────────────────────────

describe('TC-PS-FRAG: Taxas de fragmento', () => {
  it('FRAG-01: Common → 10 fragmentos', () => {
    expect(fragmentsForDuplicate('common')).toBe(FRAGMENT_RATES.common);
    expect(fragmentsForDuplicate('common')).toBe(10);
  });

  it('FRAG-02: Rare → 25 fragmentos', () => {
    expect(fragmentsForDuplicate('rare')).toBe(25);
  });

  it('FRAG-03: Elite → 75 fragmentos', () => {
    expect(fragmentsForDuplicate('elite')).toBe(75);
  });

  it('FRAG-04: Legendary → 200 fragmentos', () => {
    expect(fragmentsForDuplicate('legendary')).toBe(200);
  });

  it('FRAG-05: Ultra → 500 fragmentos', () => {
    expect(fragmentsForDuplicate('ultra')).toBe(500);
  });

  it('FRAG-06: World Cup Hero → 1000 fragmentos', () => {
    expect(fragmentsForDuplicate('world_cup_hero')).toBe(1000);
  });

  it('FRAG-07: totalFragments soma corretamente', () => {
    expect(totalFragments(['common', 'rare', 'elite'])).toBe(10 + 25 + 75);
    expect(totalFragments([])).toBe(0);
    expect(totalFragments(['legendary', 'legendary'])).toBe(400);
  });

  it('FRAG-08: escala crescente (common < rare < elite < legendary < ultra < wch)', () => {
    const order: RarityCode[] = ['common', 'rare', 'elite', 'legendary', 'ultra', 'world_cup_hero'];
    for (let i = 1; i < order.length; i++) {
      expect(fragmentsForDuplicate(order[i]!)).toBeGreaterThan(
        fragmentsForDuplicate(order[i - 1]!),
      );
    }
  });
});

// ─── TC-PS-01..05: Cartas novas ───────────────────────────────────────────────

describe('TC-PS-01..05: Cartas novas (sem duplicatas)', () => {
  it('TC-PS-01: 5 cartas novas → totalFragmentsEarned=0', () => {
    const r = openPackWithService({
      packOpeningId: makeOpeningId(),
      pack: CLASSIC_PACK,
      seed: 'tc-ps-01',
      pityState: createUserPityState(),
      cardResolver: freshResolver,
      ownershipChecker: noOwnership,
    });
    expect(r.totalFragmentsEarned).toBe(0);
    expect(r.duplicatesCount).toBe(0);
    expect(r.newCardsCount).toBe(5);
    r.slots.forEach((s) => {
      expect(s.isDuplicate).toBe(false);
      expect(s.fragmentsAwarded).toBe(0);
    });
  });

  it('TC-PS-02: slots têm 5 itens (ClassicPack = 5 cartas)', () => {
    const r = openPackWithService({
      packOpeningId: makeOpeningId(),
      pack: CLASSIC_PACK,
      seed: 'tc-ps-02',
      pityState: createUserPityState(),
      cardResolver: freshResolver,
      ownershipChecker: noOwnership,
    });
    expect(r.slots).toHaveLength(5);
  });

  it('TC-PS-03: LegendPack tem 3 slots', () => {
    const r = openPackWithService({
      packOpeningId: makeOpeningId(),
      pack: LEGEND_PACK,
      seed: 'tc-ps-03',
      pityState: createUserPityState(),
      cardResolver: freshResolver,
      ownershipChecker: noOwnership,
    });
    expect(r.slots).toHaveLength(3);
    // Slot 0 deve ser Legendary+ garantido
    expect(['legendary', 'ultra', 'world_cup_hero']).toContain(r.slots[0]!.rarityCode);
  });

  it('TC-PS-04: ElitePack tem 2 slots Elite+ nos primeiros dois', () => {
    // Rodar várias vezes para verificar a garantia
    for (let s = 0; s < 20; s++) {
      const r = openPackWithService({
        packOpeningId: makeOpeningId(),
        pack: ELITE_PACK,
        seed: `elite-seed-${s}`,
        pityState: createUserPityState(),
        cardResolver: freshResolver,
        ownershipChecker: noOwnership,
      });
      expect(['elite', 'legendary', 'ultra', 'world_cup_hero']).toContain(r.slots[0]!.rarityCode);
      expect(['elite', 'legendary', 'ultra', 'world_cup_hero']).toContain(r.slots[1]!.rarityCode);
    }
  });

  it('TC-PS-05: packResult existe e tem openingId', () => {
    const r = openPackWithService({
      packOpeningId: makeOpeningId(),
      pack: CLASSIC_PACK,
      seed: 'tc-ps-05',
      pityState: createUserPityState(),
      cardResolver: freshResolver,
      ownershipChecker: noOwnership,
    });
    expect(r.packResult.openingId).toBeDefined();
    expect(r.packResult.slots).toHaveLength(5);
  });
});

// ─── TC-PS-06..10: Duplicatas ─────────────────────────────────────────────────

describe('TC-PS-06..10: Duplicatas → fragmentos', () => {
  it('TC-PS-06: todas duplicatas → totalFragmentsEarned > 0', () => {
    const r = openPackWithService({
      packOpeningId: makeOpeningId(),
      pack: CLASSIC_PACK,
      seed: 'tc-ps-06',
      pityState: createUserPityState(),
      cardResolver: singleCardResolver,
      ownershipChecker: allOwned,
    });
    expect(r.totalFragmentsEarned).toBeGreaterThan(0);
    expect(r.duplicatesCount).toBe(5);
    expect(r.newCardsCount).toBe(0);
    r.slots.forEach((s) => {
      expect(s.isDuplicate).toBe(true);
      expect(s.fragmentsAwarded).toBeGreaterThan(0);
      expect(s.fragmentsAwarded).toBe(FRAGMENT_RATES[s.rarityCode]);
    });
  });

  it('TC-PS-07: fragmentsAwarded = FRAGMENT_RATES[rarityCode] por slot', () => {
    const r = openPackWithService({
      packOpeningId: makeOpeningId(),
      pack: CLASSIC_PACK,
      seed: 'tc-ps-07',
      pityState: createUserPityState(),
      cardResolver: singleCardResolver,
      ownershipChecker: allOwned,
    });
    r.slots.forEach((s) => {
      expect(s.fragmentsAwarded).toBe(FRAGMENT_RATES[s.rarityCode]);
    });
  });

  it('TC-PS-08: totalFragmentsEarned = soma dos fragmentsAwarded dos slots', () => {
    const r = openPackWithService({
      packOpeningId: makeOpeningId(),
      pack: CLASSIC_PACK,
      seed: 'tc-ps-08',
      pityState: createUserPityState(),
      cardResolver: singleCardResolver,
      ownershipChecker: allOwned,
    });
    const sum = r.slots.reduce((s, sl) => s + sl.fragmentsAwarded, 0);
    expect(r.totalFragmentsEarned).toBe(sum);
  });

  it('TC-PS-09: checker seletivo → mix de novo e duplicata', () => {
    const ownedSet = new Set(['card:fixed:rare', 'card:fixed:elite']);
    const r = openPackWithService({
      packOpeningId: makeOpeningId(),
      pack: CLASSIC_PACK,
      seed: 'tc-ps-09',
      pityState: createUserPityState(),
      cardResolver: singleCardResolver,
      ownershipChecker: (id) => ownedSet.has(id),
    });
    expect(r.duplicatesCount).toBeGreaterThanOrEqual(0);
    expect(r.newCardsCount + r.duplicatesCount).toBe(5);
  });

  it('TC-PS-10: cardId null → não é duplicata', () => {
    // Resolver que retorna null
    const nullResolver = () => null;
    const r = openPackWithService({
      packOpeningId: makeOpeningId(),
      pack: CLASSIC_PACK,
      seed: 'tc-ps-10',
      pityState: createUserPityState(),
      cardResolver: nullResolver,
      ownershipChecker: allOwned,
    });
    // cardId null nunca é duplicata
    r.slots.forEach((s) => {
      expect(s.isDuplicate).toBe(false);
      expect(s.fragmentsAwarded).toBe(0);
    });
    expect(r.totalFragmentsEarned).toBe(0);
  });
});

// ─── TC-PS-11..13: Pity integrado ─────────────────────────────────────────────

describe('TC-PS-11..13: Pity atualizado após abertura', () => {
  it('TC-PS-11: updatedPityState é retornado e é diferente do input', () => {
    const pity = createUserPityState();
    const r = openPackWithService({
      packOpeningId: makeOpeningId(),
      pack: CLASSIC_PACK,
      seed: 'tc-ps-11',
      pityState: pity,
      cardResolver: freshResolver,
      ownershipChecker: noOwnership,
    });
    expect(r.updatedPityState).toBeDefined();
    // Não deve ser o mesmo objeto (foi atualizado)
    expect(r.updatedPityState).not.toBe(pity);
  });

  it('TC-PS-12: após N packs sem Legendary, pity legendaryPlus incrementou', () => {
    let pity = createUserPityState();
    // Abrir 5 packs com cartas comuns (forcando common via resolver)
    const commonResolver = () => 'card:common:base';
    for (let i = 0; i < 5; i++) {
      const r = openPackWithService({
        packOpeningId: makeOpeningId(),
        pack: CLASSIC_PACK,
        seed: `pity-test-${i}`,
        pityState: pity,
        cardResolver: commonResolver,
        ownershipChecker: noOwnership,
      });
      pity = r.updatedPityState;
    }
    // Após abrir packs sem hit, legendaryPlus deve ter incrementado
    expect(pity.legendaryPlus.packsSinceLastHit).toBeGreaterThan(0);
  });

  it('TC-PS-13: pity reseta ao obter Legendary (via LEGEND_PACK garantia)', () => {
    // LEGEND_PACK garante Legendary+ no slot 0
    // Começar com pity alto
    const startPity = {
      legendaryPlus: { type: 'legendary_plus' as const, packsSinceLastHit: 39 },
      ultraPlus: { type: 'ultra_plus' as const, packsSinceLastHit: 100 },
    };
    const r = openPackWithService({
      packOpeningId: makeOpeningId(),
      pack: LEGEND_PACK,
      seed: 'pity-reset-test',
      pityState: startPity,
      cardResolver: freshResolver,
      ownershipChecker: noOwnership,
    });
    // LegendPack garante Legendary+ → pity deve resetar
    expect(r.updatedPityState.legendaryPlus.packsSinceLastHit).toBe(0);
  });
});

// ─── TC-PS-14..15: Determinismo ───────────────────────────────────────────────

describe('TC-PS-14..15: Determinismo', () => {
  it('TC-PS-14: mesmo seed → mesmo resultado', () => {
    const input = {
      packOpeningId: 'det-test',
      pack: CLASSIC_PACK,
      seed: 'determinism-seed-42',
      pityState: createUserPityState(),
      cardResolver: freshResolver,
      ownershipChecker: noOwnership,
    };
    const r1 = openPackWithService(input);
    const r2 = openPackWithService(input);
    expect(r1.totalFragmentsEarned).toBe(r2.totalFragmentsEarned);
    expect(r1.duplicatesCount).toBe(r2.duplicatesCount);
    r1.slots.forEach((s, i) => {
      expect(s.rarityCode).toBe(r2.slots[i]!.rarityCode);
      expect(s.cardId).toBe(r2.slots[i]!.cardId);
    });
  });

  it('TC-PS-15: seeds diferentes → resultados diferentes (50 seeds)', () => {
    const results = new Set<string>();
    for (let s = 0; s < 50; s++) {
      const r = openPackWithService({
        packOpeningId: `vary-${s}`,
        pack: CLASSIC_PACK,
        seed: `vary-seed-${s}`,
        pityState: createUserPityState(),
        cardResolver: freshResolver,
        ownershipChecker: noOwnership,
      });
      results.add(r.slots.map((sl) => sl.rarityCode).join(','));
    }
    expect(results.size).toBeGreaterThan(5);
  });
});
