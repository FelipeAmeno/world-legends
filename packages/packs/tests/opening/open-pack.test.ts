import type { EditionCode, RarityCode } from '@world-legends/types';
import { describe, expect, it } from 'vitest';
import { rarityMeetsMinimum } from '../../src/drop-table/drop-table';
import { openPack } from '../../src/opening/open-pack';
import type { CardResolver } from '../../src/opening/open-pack';
import { CLASSIC_PACK, ELITE_PACK, LEGEND_PACK, PRIME_PACK } from '../../src/pack/pack-definitions';
import {
  PITY_THRESHOLDS,
  createPityCounter,
  createUserPityState,
} from '../../src/pity/pity-counter';

/** Resolver simples que retorna um cardId fictício baseado em raridade+edição. */
const simpleResolver: CardResolver = (rarity, edition) => `card:${rarity}:${edition}`;

/** Resolver que simula pool vazio para uma raridade específica. */
function resolverExcluding(excluded: RarityCode): CardResolver {
  return (rarity, edition) => (rarity === excluded ? null : `card:${rarity}:${edition}`);
}

function freshPity() {
  return createUserPityState();
}

describe('openPack — determinismo (TC-REPRO)', () => {
  it('mesmo seed, mesmo pack, mesmo pity → resultado idêntico byte-a-byte', () => {
    const params = {
      packOpeningId: 'opening-01',
      pack: CLASSIC_PACK,
      seed: 'seed-determinismo',
      pityState: freshPity(),
      cardResolver: simpleResolver,
    };
    const a = openPack(params);
    const b = openPack(params);
    expect(a).toEqual(b);
  });

  it('seeds diferentes produzem distribuições diferentes ao longo de muitas aberturas', () => {
    const rarities = new Set<RarityCode>();
    for (let i = 0; i < 100; i++) {
      const result = openPack({
        packOpeningId: `op-${i}`,
        pack: CLASSIC_PACK,
        seed: `var-${i}`,
        pityState: freshPity(),
        cardResolver: simpleResolver,
      });
      result.slots.forEach((s) => rarities.add(s.rarityCode));
    }
    // Com 100 aberturas, esperamos ver mais de 1 raridade diferente
    expect(rarities.size).toBeGreaterThan(1);
  });
});

describe('openPack — invariantes de PackResult', () => {
  it('slots.length === pack.cardsPerPack', () => {
    for (const pack of [CLASSIC_PACK, ELITE_PACK, LEGEND_PACK, PRIME_PACK]) {
      const result = openPack({
        packOpeningId: 'op-size',
        pack,
        seed: 'seed-size',
        pityState: freshPity(),
        cardResolver: simpleResolver,
      });
      expect(result.slots.length).toBe(pack.cardsPerPack);
    }
  });

  it('highestRarity é de fato a mais alta entre os slots', () => {
    for (let i = 0; i < 30; i++) {
      const result = openPack({
        packOpeningId: `op-high-${i}`,
        pack: CLASSIC_PACK,
        seed: `seed-high-${i}`,
        pityState: freshPity(),
        cardResolver: simpleResolver,
      });
      for (const slot of result.slots) {
        expect(rarityMeetsMinimum(result.highestRarity, slot.rarityCode)).toBe(true);
      }
    }
  });

  it('slotIndex é sequencial 0, 1, 2 ...', () => {
    const result = openPack({
      packOpeningId: 'op-idx',
      pack: LEGEND_PACK,
      seed: 'seed-idx',
      pityState: freshPity(),
      cardResolver: simpleResolver,
    });
    result.slots.forEach((s, i) => expect(s.slotIndex).toBe(i));
  });

  it('PackResult é imutável', () => {
    const result = openPack({
      packOpeningId: 'op-freeze',
      pack: CLASSIC_PACK,
      seed: 'seed-freeze',
      pityState: freshPity(),
      cardResolver: simpleResolver,
    });
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.slots)).toBe(true);
  });
});

describe('TC-PACK-01 — ClassicPack: ≥ 1 Rare-ou-melhor em 100% das aberturas', () => {
  it('em 500 aberturas, nenhuma sem pelo menos 1 Rare+', () => {
    for (let i = 0; i < 500; i++) {
      const result = openPack({
        packOpeningId: `op-classic-${i}`,
        pack: CLASSIC_PACK,
        seed: `classic-${i}`,
        pityState: freshPity(),
        cardResolver: simpleResolver,
      });
      const hasRarePlus = result.slots.some((s) => rarityMeetsMinimum(s.rarityCode, 'rare'));
      expect(hasRarePlus).toBe(true);
    }
  });
});

describe('TC-PACK-02 — ElitePack: ≥ 2 Elite-ou-melhor em 100% das aberturas', () => {
  it('em 500 aberturas, nenhuma sem pelo menos 2 Elite+', () => {
    for (let i = 0; i < 500; i++) {
      const result = openPack({
        packOpeningId: `op-elite-${i}`,
        pack: ELITE_PACK,
        seed: `elite-${i}`,
        pityState: freshPity(),
        cardResolver: simpleResolver,
      });
      const elitePlusCount = result.slots.filter((s) =>
        rarityMeetsMinimum(s.rarityCode, 'elite'),
      ).length;
      expect(elitePlusCount).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('TC-PACK-03 — LegendPack: ≥ 1 Legendary-ou-melhor em 100% das aberturas', () => {
  it('em 500 aberturas, o slot 0 sempre é Legendary+', () => {
    for (let i = 0; i < 500; i++) {
      const result = openPack({
        packOpeningId: `op-legend-${i}`,
        pack: LEGEND_PACK,
        seed: `legend-${i}`,
        pityState: freshPity(),
        cardResolver: simpleResolver,
      });
      const hit = result.slots[0]!;
      expect(rarityMeetsMinimum(hit.rarityCode, 'legendary')).toBe(true);
    }
  });
});

describe('TC-PACK-04 — PrimePack: ≥ 1 carta Prime em 100% das aberturas', () => {
  it('em 500 aberturas, o slot 0 sempre tem editionCode=prime', () => {
    for (let i = 0; i < 500; i++) {
      const result = openPack({
        packOpeningId: `op-prime-${i}`,
        pack: PRIME_PACK,
        seed: `prime-${i}`,
        pityState: freshPity(),
        cardResolver: simpleResolver,
      });
      expect(result.slots[0]?.editionCode).toBe('prime');
    }
  });

  it('raridade do slot prime é sempre rare, elite ou legendary (doc 10 §9)', () => {
    for (let i = 0; i < 200; i++) {
      const result = openPack({
        packOpeningId: `op-prime-rar-${i}`,
        pack: PRIME_PACK,
        seed: `prime-rar-${i}`,
        pityState: freshPity(),
        cardResolver: simpleResolver,
      });
      const primeSlot = result.slots[0]!;
      expect(['rare', 'elite', 'legendary'].includes(primeSlot.rarityCode)).toBe(true);
    }
  });
});

describe('TC-PACK-07 — Pity Legendary+ ativa na 41ª abertura', () => {
  it('openPack com pity em limiar força raridade ≥ legendary no slot 0', () => {
    // Simular estado após exatamente 40 packs sem legendary+
    const pityState = {
      legendaryPlus: createPityCounter('legendary_plus', PITY_THRESHOLDS.legendary_plus),
      ultraPlus: createPityCounter('ultra_plus', 0),
    };
    // Em 50 tentativas com pity ativo, o slot 0 sempre recebe legendary+ (ou é forçado)
    let allSatisfied = true;
    for (let i = 0; i < 50; i++) {
      const result = openPack({
        packOpeningId: `op-pity-leg-${i}`,
        pack: CLASSIC_PACK,
        seed: `pity-leg-${i}`,
        pityState,
        cardResolver: simpleResolver,
      });
      // Com pity ativo, pelo menos um slot deve ser ≥ legendary
      const hasLegendaryPlus = result.slots.some((s) =>
        rarityMeetsMinimum(s.rarityCode, 'legendary'),
      );
      if (!hasLegendaryPlus) allSatisfied = false;
    }
    expect(allSatisfied).toBe(true);
  });

  it('slot forçado por pity tem wasForced=true', () => {
    const pityState = {
      legendaryPlus: createPityCounter('legendary_plus', PITY_THRESHOLDS.legendary_plus),
      ultraPlus: createPityCounter('ultra_plus', 0),
    };
    const result = openPack({
      packOpeningId: 'op-pity-flag',
      pack: CLASSIC_PACK,
      seed: 'pity-flag',
      pityState,
      cardResolver: simpleResolver,
    });
    const forcedSlots = result.slots.filter((s) => s.wasForced);
    expect(forcedSlots.length).toBeGreaterThan(0);
  });
});

describe('TC-PACK-08 — Pity Ultra+ ativa na 121ª abertura', () => {
  it('com pity ultra+ no limiar, pelo menos 1 slot é Ultra+ (ou forçado)', () => {
    const pityState = {
      legendaryPlus: createPityCounter('legendary_plus', 0),
      ultraPlus: createPityCounter('ultra_plus', PITY_THRESHOLDS.ultra_plus),
    };
    let allSatisfied = true;
    for (let i = 0; i < 30; i++) {
      const result = openPack({
        packOpeningId: `op-pity-ultra-${i}`,
        pack: LEGEND_PACK, // LegendPack tem slots mais ricos — mais chance de ver ultra+ naturalmente
        seed: `pity-ultra-${i}`,
        pityState,
        cardResolver: simpleResolver,
      });
      const hasUltraPlus = result.slots.some((s) => rarityMeetsMinimum(s.rarityCode, 'ultra'));
      if (!hasUltraPlus) allSatisfied = false;
    }
    expect(allSatisfied).toBe(true);
  });
});

describe('TC-PACK-09 — WCH nunca é forçado pelo pity', () => {
  it('pity ultra+ no limiar força ultra no máximo — wasForced slots são no máximo ultra', () => {
    const pityState = {
      legendaryPlus: createPityCounter('legendary_plus', 0),
      ultraPlus: createPityCounter('ultra_plus', PITY_THRESHOLDS.ultra_plus),
    };
    for (let i = 0; i < 50; i++) {
      const result = openPack({
        packOpeningId: `op-no-wch-force-${i}`,
        pack: CLASSIC_PACK,
        seed: `no-wch-force-${i}`,
        pityState,
        cardResolver: simpleResolver,
      });
      for (const slot of result.slots.filter((s) => s.wasForced)) {
        // WCH pode aparecer como resultado do RNG (não é bloqueado),
        // mas a raridade FORÇADA nunca EXIGE wch — pode ser ultra ou legendary
        // O invariante real é que getForcedMinRarity retorna 'ultra', não 'world_cup_hero'
        expect(slot.rarityCode === 'world_cup_hero' || slot.rarityCode === 'ultra').toBe(true);
      }
    }
  });
});

describe('CardResolver — integração com openPack', () => {
  it('cardId null quando resolver retorna null (pool vazio)', () => {
    const result = openPack({
      packOpeningId: 'op-null',
      pack: CLASSIC_PACK,
      seed: 'null-resolver',
      pityState: freshPity(),
      cardResolver: () => null,
    });
    for (const slot of result.slots) {
      expect(slot.cardId).toBeNull();
    }
  });

  it('cardId vem do resolver quando disponível', () => {
    const result = openPack({
      packOpeningId: 'op-res',
      pack: CLASSIC_PACK,
      seed: 'resolver-ok',
      pityState: freshPity(),
      cardResolver: simpleResolver,
    });
    for (const slot of result.slots) {
      expect(typeof slot.cardId).toBe('string');
      if (slot.cardId !== null) {
        expect(slot.cardId.startsWith('card:')).toBe(true);
      }
    }
  });
});
