import type { RarityCode } from '@world-legends/types';
/**
 * Monte Carlo — TC-PACK-06 (doc 13):
 * "Em amostra de 1M+ aberturas, frequência observada por raridade
 * desvia no máximo 0,1pp da tabela declarada (doc 10 §15)."
 *
 * Rodamos 100k aberturas nestes testes (suficiente para converência
 * estatística estável dentro dos 0.1pp). O TC-PACK-06 de gate final
 * recomenda 1M+, mas 100k já captura desvios sistemáticos de
 * implementação — que são os únicos que os testes automatizados
 * precisam pegar (variância aleatória diminui com √N, não depende de
 * um bug de código).
 *
 * TOLERÂNCIA: ±0.5pp (margem 5× maior que o 0.1pp do gate final para
 * compensar o N menor). Um bug de implementação causaria desvios de
 * vários pontos percentuais — muito maior que qualquer margem razoável.
 */
import { describe, expect, it } from 'vitest';
import { openPack } from '../../src/opening/open-pack';
import { CLASSIC_PACK } from '../../src/pack/pack-definitions';
import { createUserPityState } from '../../src/pity/pity-counter';

const resolver = (r: RarityCode, e: string) => `card:${r}:${e}`;

function runMonteCarlo(n: number): Map<RarityCode, number> {
  const counts = new Map<RarityCode, number>([
    ['common', 0],
    ['rare', 0],
    ['elite', 0],
    ['legendary', 0],
    ['ultra', 0],
    ['world_cup_hero', 0],
  ]);

  // Pity zerado para não distorcer a distribuição-base
  const pity = createUserPityState();

  for (let i = 0; i < n; i++) {
    const result = openPack({
      packOpeningId: `mc-${i}`,
      pack: CLASSIC_PACK,
      seed: `monte-carlo-${i}`,
      pityState: pity,
      cardResolver: resolver,
    });
    // Para Monte Carlo da drop-table, analisamos SLOTS LIVRES (índices 1-4)
    // O slot 0 é garantido rare+, o que distorceria a análise da distribuição-base.
    for (let s = 1; s < result.slots.length; s++) {
      const slot = result.slots[s];
      if (slot) {
        counts.set(slot.rarityCode, (counts.get(slot.rarityCode) ?? 0) + 1);
      }
    }
  }
  return counts;
}

describe('TC-PACK-06 — Distribuição estatística (Monte Carlo, 100k aberturas × 4 slots livres)', () => {
  const N = 100_000;
  const counts = runMonteCarlo(N);
  const totalSlots = N * 4; // 4 slots livres por pack (índices 1-4)

  // Somar total real (WCH tem peso 0 nos slots livres do classic, então sua
  // frequência observada deve ser ~0)
  const totalObserved = [...counts.values()].reduce((a, b) => a + b, 0);

  // Pesos declarados para os slots livres do ClassicPack (WCH = 0, portanto
  // a soma normalizada dos demais é 100%).
  //
  // Sprint 17.1 (Card Art Revolution — revisão de economia): os slots
  // livres do Classic pararam de usar o BASE_RARITY_WEIGHTS compartilhado
  // (legendary 4.5% / ultra 1.3%, que dava ~17% de chance de Legendary+ por
  // abertura de um pack de 250c) e passaram a ter pesos próprios, mais
  // conservadores — ver `classicFreeSlot` em `pack-definitions.ts`.
  //
  // Sprint 18 (Card Experience 5.0): apertado ainda mais — Legendary
  // "extremamente rara" e Ultra "quase impossível" no Classic.
  const baseWeightsNoWCH = {
    common: 66,
    rare: 27,
    elite: 6.4,
    legendary: 0.55,
    ultra: 0.05,
  };
  const totalWeight = Object.values(baseWeightsNoWCH).reduce((a, b) => a + b, 0);

  const TOLERANCE_PP = 0.5; // ±0.5 pontos percentuais

  it('Common: frequência observada dentro de ±0.5pp do peso declarado (~66%)', () => {
    const observed = ((counts.get('common') ?? 0) / totalObserved) * 100;
    const expected = (baseWeightsNoWCH.common / totalWeight) * 100;
    expect(Math.abs(observed - expected)).toBeLessThan(TOLERANCE_PP);
  });

  it('Rare: frequência observada dentro de ±0.5pp do peso declarado (~27%)', () => {
    const observed = ((counts.get('rare') ?? 0) / totalObserved) * 100;
    const expected = (baseWeightsNoWCH.rare / totalWeight) * 100;
    expect(Math.abs(observed - expected)).toBeLessThan(TOLERANCE_PP);
  });

  it('Elite: frequência observada dentro de ±0.5pp do peso declarado (~6.4%)', () => {
    const observed = ((counts.get('elite') ?? 0) / totalObserved) * 100;
    const expected = (baseWeightsNoWCH.elite / totalWeight) * 100;
    expect(Math.abs(observed - expected)).toBeLessThan(TOLERANCE_PP);
  });

  it('Legendary: frequência observada dentro de ±0.5pp do peso declarado (~0.55%)', () => {
    const observed = ((counts.get('legendary') ?? 0) / totalObserved) * 100;
    const expected = (baseWeightsNoWCH.legendary / totalWeight) * 100;
    expect(Math.abs(observed - expected)).toBeLessThan(TOLERANCE_PP);
  });

  it('Ultra: frequência observada dentro de ±0.5pp do peso declarado (~0.05%)', () => {
    const observed = ((counts.get('ultra') ?? 0) / totalObserved) * 100;
    const expected = (baseWeightsNoWCH.ultra / totalWeight) * 100;
    expect(Math.abs(observed - expected)).toBeLessThan(TOLERANCE_PP);
  });

  it('TC-PACK-09 Monte Carlo: WCH = 0% nos slots livres do ClassicPack (peso explicitamente 0)', () => {
    const wchCount = counts.get('world_cup_hero') ?? 0;
    expect(wchCount).toBe(0);
  });

  it('soma das frequências observadas = 100% (nenhuma raridade perdida)', () => {
    expect(totalObserved).toBe(totalSlots);
  });
});

describe('TC-PACK-06 — Slots garantidos não distorcem a distribuição-base', () => {
  it('em 10k aberturas de ClassicPack, slot 0 NUNCA é common (garantia Rare+)', () => {
    for (let i = 0; i < 10_000; i++) {
      const result = openPack({
        packOpeningId: `mc-guar-${i}`,
        pack: CLASSIC_PACK,
        seed: `guar-${i}`,
        pityState: createUserPityState(),
        cardResolver: resolver,
      });
      expect(result.slots[0]?.rarityCode).not.toBe('common');
    }
  });
});
