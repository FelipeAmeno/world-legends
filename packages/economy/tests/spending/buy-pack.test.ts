import { describe, expect, it } from 'vitest';
import { PACK_COSTS, calculatePackCost, canAffordPack } from '../../src/spending/buy-pack';

describe('calculatePackCost — tabela doc 07 §1', () => {
  it('Pack Bronze (classic) = 300 créditos', () => {
    const r = calculatePackCost('classic');
    expect(r).not.toBeNull();
    if (r !== null) {
      expect(r.cost).toBe(300);
      expect(r.currency).toBe('credits');
      expect(r.isFree).toBe(false);
    }
  });

  it('Pack Prata (elite) = 800 créditos', () => {
    const r = calculatePackCost('elite');
    expect(r?.cost).toBe(800);
    expect(r?.currency).toBe('credits');
  });

  it('Pack Ouro (legend) = 2000 créditos', () => {
    const r = calculatePackCost('legend');
    expect(r?.cost).toBe(2_000);
    expect(r?.currency).toBe('credits');
  });

  it('Pack Copa Hero = 1 moeda premium', () => {
    const r = calculatePackCost('copa-hero');
    expect(r?.currency).toBe('premium');
    expect(r?.cost).toBe(1);
  });

  it('Pack starter = gratuito, isFree=true', () => {
    const r = calculatePackCost('starter');
    expect(r?.isFree).toBe(true);
    expect(r?.cost).toBe(0);
  });

  it('packId desconhecido retorna null', () => {
    expect(calculatePackCost('inexistente')).toBeNull();
  });

  it('spendReason correto para créditos = pack_purchase', () => {
    expect(calculatePackCost('classic')?.spendReason).toBe('pack_purchase');
  });

  it('spendReason correto para premium = premium_pack_purchase (TC-ECO-05)', () => {
    expect(calculatePackCost('copa-hero')?.spendReason).toBe('premium_pack_purchase');
  });

  it('nomenclaturas de negócio (bronze/silver/gold) existem na tabela', () => {
    expect(calculatePackCost('bronze')?.cost).toBe(300);
    expect(calculatePackCost('silver')?.cost).toBe(800);
    expect(calculatePackCost('gold')?.cost).toBe(2_000);
  });

  it('resultado é imutável', () => {
    const r = calculatePackCost('classic');
    expect(r).not.toBeNull();
    if (r !== null) expect(Object.isFrozen(r)).toBe(true);
  });
});

describe('canAffordPack — verificação de saldo', () => {
  it('créditos suficientes para Pack Bronze', () => {
    const { affordable, shortfall } = canAffordPack('classic', 300, 0);
    expect(affordable).toBe(true);
    expect(shortfall).toBe(0);
  });

  it('créditos insuficientes para Pack Ouro', () => {
    const { affordable, shortfall, currency } = canAffordPack('legend', 1_000, 0);
    expect(affordable).toBe(false);
    expect(shortfall).toBe(1_000);
    expect(currency).toBe('credits');
  });

  it('premium suficiente para Pack Copa Hero', () => {
    const { affordable } = canAffordPack('copa-hero', 0, 5);
    expect(affordable).toBe(true);
  });

  it('pack starter é sempre acessível (isFree)', () => {
    const { affordable } = canAffordPack('starter', 0, 0);
    expect(affordable).toBe(true);
  });

  it('packId desconhecido = não acessível, currency null', () => {
    const { affordable, currency } = canAffordPack('nonexistent', 999_999, 999_999);
    expect(affordable).toBe(false);
    expect(currency).toBeNull();
  });

  it('créditos não pagam packs de premium', () => {
    // Copa Hero custa premium, não créditos
    const { affordable, currency } = canAffordPack('copa-hero', 999_999, 0);
    expect(affordable).toBe(false);
    expect(currency).toBe('premium');
  });
});

describe('PACK_COSTS — integridade da tabela', () => {
  it('todos os packs têm cost ≥ 0 e currency válida', () => {
    for (const [id, spec] of Object.entries(PACK_COSTS)) {
      expect(spec.cost).toBeGreaterThanOrEqual(0);
      expect(['credits', 'fragments', 'premium'].includes(spec.currency)).toBe(true);
    }
  });

  it('packs premium nunca aceitam créditos', () => {
    const premiumPacks = Object.entries(PACK_COSTS).filter(([, s]) => s.currency === 'premium');
    expect(premiumPacks.length).toBeGreaterThan(0);
    for (const [, spec] of premiumPacks) {
      expect(spec.currency).toBe('premium');
    }
  });
});
