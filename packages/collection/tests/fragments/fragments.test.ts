import type { CardId } from '@world-legends/cards';
import { describe, expect, it } from 'vitest';
import {
  CRAFT_COST_BY_RARITY,
  FRAGMENT_VALUE_BY_RARITY,
  calculateDuplicateFragments,
  createFragmentLedger,
  processCraftRequest,
} from '../../src/fragments/fragments';

const cid = (s: string) => s as CardId;

describe('calculateDuplicateFragments — escala por raridade (doc 10 §16)', () => {
  it('cresce estritamente com a raridade', () => {
    expect(FRAGMENT_VALUE_BY_RARITY.common).toBeLessThan(FRAGMENT_VALUE_BY_RARITY.rare);
    expect(FRAGMENT_VALUE_BY_RARITY.rare).toBeLessThan(FRAGMENT_VALUE_BY_RARITY.elite);
    expect(FRAGMENT_VALUE_BY_RARITY.elite).toBeLessThan(FRAGMENT_VALUE_BY_RARITY.legendary);
    expect(FRAGMENT_VALUE_BY_RARITY.legendary).toBeLessThan(FRAGMENT_VALUE_BY_RARITY.ultra);
    expect(FRAGMENT_VALUE_BY_RARITY.ultra).toBeLessThan(FRAGMENT_VALUE_BY_RARITY.world_cup_hero);
  });

  it('retorna valor correto para cada raridade', () => {
    expect(calculateDuplicateFragments('common')).toBe(10);
    expect(calculateDuplicateFragments('legendary')).toBe(150);
    expect(calculateDuplicateFragments('world_cup_hero')).toBe(1000);
  });
});

describe('processCraftRequest — Craft de cartas (doc 10 §17, doc 17 §10)', () => {
  it('WCH não é craftável (doc 17 §10, TC-CRAFT-06)', () => {
    const result = processCraftRequest({
      targetCardId: cid('card-pele-wch'),
      targetRarityCode: 'world_cup_hero',
      currentFragmentBalance: 99999,
      alreadyOwnsCard: false,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('NotCraftable');
  });

  it('Common não é craftável (sem custo definido)', () => {
    const result = processCraftRequest({
      targetCardId: cid('card-common'),
      targetRarityCode: 'common',
      currentFragmentBalance: 99999,
      alreadyOwnsCard: false,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('NotCraftable');
  });

  it('carta já possuída não pode ser craftada (TC-CRAFT-10)', () => {
    const result = processCraftRequest({
      targetCardId: cid('card-pele-legendary'),
      targetRarityCode: 'legendary',
      currentFragmentBalance: 99999,
      alreadyOwnsCard: true,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('AlreadyOwned');
  });

  it('saldo insuficiente falha com InsufficientFragments', () => {
    const result = processCraftRequest({
      targetCardId: cid('card-pele-legendary'),
      targetRarityCode: 'legendary',
      currentFragmentBalance: 100, // custa 300
      alreadyOwnsCard: false,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe('InsufficientFragments');
      if (result.error.kind === 'InsufficientFragments') {
        expect(result.error.need).toBe(CRAFT_COST_BY_RARITY.legendary);
        expect(result.error.have).toBe(100);
      }
    }
  });

  it('craft bem-sucedido retorna saldo correto após débito', () => {
    const result = processCraftRequest({
      targetCardId: cid('card-pele-legendary'),
      targetRarityCode: 'legendary',
      currentFragmentBalance: 500,
      alreadyOwnsCard: false,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      const cost = CRAFT_COST_BY_RARITY.legendary ?? 0;
      expect(result.value.fragmentBalanceAfter).toBe(500 - cost);
      expect(result.value.fragmentsCost).toBe(cost);
    }
  });

  it('custo de craft escala com raridade (elite < legendary < ultra)', () => {
    const costElite = CRAFT_COST_BY_RARITY.elite ?? 0;
    const costLegendary = CRAFT_COST_BY_RARITY.legendary ?? 0;
    const costUltra = CRAFT_COST_BY_RARITY.ultra ?? 0;
    expect(costElite).toBeLessThan(costLegendary);
    expect(costLegendary).toBeLessThan(costUltra);
  });
});

describe('FragmentLedger — saldo nunca negativo (doc 17 §9, TC-CRAFT-09)', () => {
  it('começa com saldo 0', () => {
    const ledger = createFragmentLedger();
    expect(ledger.balance()).toBe(0);
  });

  it('credit aumenta o saldo', () => {
    const ledger = createFragmentLedger();
    ledger.credit(150);
    expect(ledger.balance()).toBe(150);
  });

  it('debit diminui o saldo', () => {
    const ledger = createFragmentLedger(500);
    const result = ledger.debit(150);
    expect(result.ok).toBe(true);
    expect(ledger.balance()).toBe(350);
  });

  it('debit falha se saldo insuficiente (saldo nunca negativo)', () => {
    const ledger = createFragmentLedger(100);
    const result = ledger.debit(200);
    expect(result.ok).toBe(false);
    // Saldo não foi alterado
    expect(ledger.balance()).toBe(100);
  });

  it('múltiplos credits acumulam corretamente', () => {
    const ledger = createFragmentLedger();
    ledger.credit(10); // common dup
    ledger.credit(150); // legendary dup
    ledger.credit(25); // rare dup
    expect(ledger.balance()).toBe(185);
  });

  it('saldo nunca cai abaixo de zero mesmo com initialBalance negativo', () => {
    const ledger = createFragmentLedger(-100); // guard
    expect(ledger.balance()).toBe(0);
  });
});
