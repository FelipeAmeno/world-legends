import type { RarityCode } from '@world-legends/types';
/**
 * Sprint 20.5 (Foundation Stabilization) — item 3/4/5 do brief.
 *
 * Estende o Monte Carlo já existente (`monte-carlo.test.ts`, só Classic) pra
 * TODOS os 7 packs expostos no app. Usa o MESMO `openPack` de produção, pity
 * zerado a cada abertura (odds puras).
 *
 * Duas verificações por pack:
 * 1. Por SLOT (cada `SlotDefinition` distinto do dropTable): frequência
 *    observada dentro de ±0.5pp da distribuição TEÓRICA declarada — pra
 *    slots com `guaranteedMinRarity`, a distribuição teórica não é o peso
 *    bruto, é o peso normalizado só entre as raridades que satisfazem a
 *    garantia (é matematicamente o que o resample de `rollRarityWithGuarantee`
 *    converge, com correção desprezível do cap de 20 resamples — a chance de
 *    20 rejeições seguidas é < 1e-9 em todo pack aqui, não afeta o resultado
 *    em 100k amostras).
 * 2. Invariantes de garantia: nenhum slot com `guaranteedMinRarity` jamais
 *    produz algo abaixo do mínimo; Starter Pack especificamente NUNCA produz
 *    Legendary/Ultra/World Cup Hero (requisito explícito Sprint 20.5 item 5).
 *
 * A tabela agregada por pack (Common/Rare/Elite/Legendary/Ultra/WCH, todos os
 * slots somados) é impressa via `console.table` — é o "relatório de 100k
 * packs por tipo" pedido no brief; vira insumo direto de SPRINT_20_5_FOUNDATION.md.
 */
import { describe, expect, it } from 'vitest';
import { rarityMeetsMinimum } from '../../src/drop-table/drop-table';
import type { SlotDefinition } from '../../src/drop-table/drop-table';
import { openPack } from '../../src/opening/open-pack';
import {
  CLASSIC_PACK,
  ELITE_PACK,
  GOAT_PACK,
  HERO_PACK,
  LEGEND_PACK,
  NATIONAL_PACK,
  type Pack,
  STARTER_PACK,
} from '../../src/pack/pack-definitions';
import { createUserPityState } from '../../src/pity/pity-counter';

const RARITIES: RarityCode[] = ['common', 'rare', 'elite', 'legendary', 'ultra', 'world_cup_hero'];
const N = 100_000;
const TOLERANCE_PP = 0.5;

const resolver = (r: RarityCode, e: string) => `card:${r}:${e}`;

/** Distribuição teórica de um slot — normaliza os pesos, respeitando garantia (se houver). */
function theoreticalDistribution(slotDef: SlotDefinition): Partial<Record<RarityCode, number>> {
  const effectiveMin = slotDef.guaranteedMinRarity
    ? slotDef.guaranteedMinRarity === 'world_cup_hero'
      ? 'ultra'
      : slotDef.guaranteedMinRarity
    : undefined;

  const eligible = (Object.entries(slotDef.rarityWeights) as [RarityCode, number][]).filter(
    ([code, w]) => w > 0 && (!effectiveMin || rarityMeetsMinimum(code, effectiveMin)),
  );
  const total = eligible.reduce((sum, [, w]) => sum + w, 0);
  if (total <= 0) return {};
  return Object.fromEntries(eligible.map(([code, w]) => [code, (w / total) * 100]));
}

type SimResult = {
  aggregate: Record<RarityCode, number>;
  totalSlots: number;
  perSlotCounts: Array<Map<RarityCode, number>>;
  guaranteedViolations: string[];
};

function simulate(pack: Pack, label: string): SimResult {
  const aggregate: Record<RarityCode, number> = {
    common: 0,
    rare: 0,
    elite: 0,
    legendary: 0,
    ultra: 0,
    world_cup_hero: 0,
  };
  const perSlotCounts: Array<Map<RarityCode, number>> = pack.dropTable.slots.map(
    () => new Map<RarityCode, number>(RARITIES.map((r) => [r, 0])),
  );
  const guaranteedViolations: string[] = [];
  let totalSlots = 0;

  for (let i = 0; i < N; i++) {
    const result = openPack({
      packOpeningId: `sim-${label}-${i}`,
      pack,
      seed: `sim-${label}-${i}`,
      pityState: createUserPityState(),
      cardResolver: resolver,
    });

    result.slots.forEach((slot, idx) => {
      aggregate[slot.rarityCode]++;
      totalSlots++;
      perSlotCounts[idx]?.set(slot.rarityCode, (perSlotCounts[idx]?.get(slot.rarityCode) ?? 0) + 1);

      const slotDef = pack.dropTable.slots[idx];
      if (slotDef?.guaranteedMinRarity) {
        const effectiveMin =
          slotDef.guaranteedMinRarity === 'world_cup_hero' ? 'ultra' : slotDef.guaranteedMinRarity;
        if (!rarityMeetsMinimum(slot.rarityCode, effectiveMin)) {
          guaranteedViolations.push(
            `slot ${idx}: esperava >= ${effectiveMin}, saiu ${slot.rarityCode} (i=${i})`,
          );
        }
      }
    });
  }

  return { aggregate, totalSlots, perSlotCounts, guaranteedViolations };
}

const PACKS: Array<{ id: string; pack: Pack }> = [
  { id: 'starter', pack: STARTER_PACK },
  { id: 'classic', pack: CLASSIC_PACK },
  { id: 'national', pack: NATIONAL_PACK },
  { id: 'elite', pack: ELITE_PACK },
  { id: 'hero', pack: HERO_PACK },
  { id: 'legend', pack: LEGEND_PACK },
  { id: 'goat', pack: GOAT_PACK },
];

describe(`Sprint 20.5 — Simulação de economia (${N.toLocaleString('pt-BR')} packs × 7 tipos)`, () => {
  for (const { id, pack } of PACKS) {
    const result = simulate(pack, id);

    describe(`pack "${id}" (${pack.cardsPerPack} cartas/pack)`, () => {
      it('tabela agregada observada (Common/Rare/Elite/Legendary/Ultra/WCH)', () => {
        const table = Object.fromEntries(
          RARITIES.map((r) => [
            r,
            `${((result.aggregate[r] / result.totalSlots) * 100).toFixed(3)}%`,
          ]),
        );
        // biome-ignore lint/suspicious/noConsoleLog: relatório de simulação é o próprio deliverable (SPRINT_20_5_FOUNDATION.md)
        console.log(
          `\n=== ${id} — ${result.totalSlots.toLocaleString('pt-BR')} slots amostrados ===`,
        );
        console.table(table);
        expect(result.totalSlots).toBe(N * pack.cardsPerPack);
      });

      it('nenhuma violação de garantia em nenhum slot', () => {
        if (result.guaranteedViolations.length > 0) {
          // biome-ignore lint/suspicious/noConsoleLog: mostra as primeiras violações pro relatório
          console.log(result.guaranteedViolations.slice(0, 10));
        }
        expect(result.guaranteedViolations).toHaveLength(0);
      });

      pack.dropTable.slots.forEach((slotDef, idx) => {
        const expected = theoreticalDistribution(slotDef);
        for (const [rarity, expectedPct] of Object.entries(expected) as [RarityCode, number][]) {
          it(`slot ${idx}: ${rarity} observado dentro de ±${TOLERANCE_PP}pp do esperado (~${expectedPct.toFixed(2)}%)`, () => {
            const counts = result.perSlotCounts[idx];
            const observedPct = ((counts?.get(rarity) ?? 0) / N) * 100;
            expect(Math.abs(observedPct - expectedPct)).toBeLessThan(TOLERANCE_PP);
          });
        }
        // Raridades com peso declarado 0 (ou abaixo da garantia) devem ter frequência observada exatamente 0.
        const zeroRarities = RARITIES.filter((r) => !(r in expected));
        for (const rarity of zeroRarities) {
          it(`slot ${idx}: ${rarity} nunca ocorre (peso 0 ou abaixo da garantia)`, () => {
            const counts = result.perSlotCounts[idx];
            expect(counts?.get(rarity) ?? 0).toBe(0);
          });
        }
      });
    });
  }

  // Requisito explícito (item 5): Starter Pack nunca entrega Legendary+.
  // Já coberto, de forma mais rigorosa, pelos testes "slot N: legendary/ultra/
  // world_cup_hero nunca ocorre" gerados acima para CADA um dos 5 slots do
  // Starter (peso 0 em todos — checagem estrutural, não estatística) — não
  // precisa de uma verificação agregada separada.
});
