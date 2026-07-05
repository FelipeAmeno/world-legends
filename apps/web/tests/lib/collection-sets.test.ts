import {
  COLLECTION_SETS,
  detectNewlyCompletedSets,
  getSetByCode,
  setCompletionPct,
} from '@/lib/collection-sets';
import { describe, expect, it } from 'vitest';

// ─── COLLECTION_SETS ──────────────────────────────────────────────────────────

describe('COLLECTION_SETS', () => {
  it('contém 6 conjuntos', () => {
    expect(COLLECTION_SETS.length).toBe(6);
  });

  it('codes são únicos', () => {
    const codes = COLLECTION_SETS.map((s) => s.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('sortOrder são sequenciais a partir de 1', () => {
    const orders = COLLECTION_SETS.map((s) => s.sortOrder).sort((a, b) => a - b);
    expect(orders).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('cada conjunto tem pelo menos 1 card', () => {
    for (const set of COLLECTION_SETS) {
      expect(set.requiredCardIds.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('cada conjunto tem recompensa positiva', () => {
    for (const set of COLLECTION_SETS) {
      expect(set.rewardSoftCurrency).toBeGreaterThan(0);
    }
  });

  it('album_completo contém todos os 16 cards', () => {
    const full = COLLECTION_SETS.find((s) => s.code === 'album_completo');
    expect(full?.requiredCardIds.length).toBe(16);
  });

  it('lendas_do_brasil contém 15 cards brasileiros', () => {
    const br = COLLECTION_SETS.find((s) => s.code === 'lendas_do_brasil');
    expect(br?.requiredCardIds.length).toBe(15);
    expect(br?.requiredCardIds).not.toContain('maradona-world_cup_hero');
  });

  it('album_completo inclui maradona', () => {
    const full = COLLECTION_SETS.find((s) => s.code === 'album_completo');
    expect(full?.requiredCardIds).toContain('maradona-world_cup_hero');
  });

  it('todos os card IDs têm formato {playerId}-{rarity}', () => {
    const allIds = COLLECTION_SETS.flatMap((s) => s.requiredCardIds);
    for (const id of allIds) {
      expect(id).toMatch(/^[a-záéíóúàâêôãõü\-]+-[a-z_]+$/i);
    }
  });
});

// ─── getSetByCode ─────────────────────────────────────────────────────────────

describe('getSetByCode', () => {
  it('retorna o conjunto correto', () => {
    const set = getSetByCode('copa_2002');
    expect(set?.name).toBe('Copa 2002 — O Pentacampeonato');
  });

  it('retorna undefined para código inexistente', () => {
    expect(getSetByCode('xyz_nao_existe')).toBeUndefined();
  });
});

// ─── setCompletionPct ─────────────────────────────────────────────────────────

describe('setCompletionPct', () => {
  const defesa = COLLECTION_SETS.find((s) => s.code === 'muralha_verde_amarela')!;
  // Requer: cafu-legendary, roberto-carlos-legendary, lucio-elite, taffarel-elite (4 cards)

  it('0% quando não possui nenhum card', () => {
    expect(setCompletionPct(defesa, new Set())).toBe(0);
  });

  it('50% quando possui metade', () => {
    const owned = new Set(['cafu-legendary', 'roberto-carlos-legendary']);
    expect(setCompletionPct(defesa, owned)).toBe(50);
  });

  it('100% quando possui todos', () => {
    const owned = new Set(defesa.requiredCardIds);
    expect(setCompletionPct(defesa, owned)).toBe(100);
  });

  it('ignora cards de outros sets', () => {
    const owned = new Set(['cafu-legendary', 'ronaldo-ultra', 'pelé-world_cup_hero']);
    expect(setCompletionPct(defesa, owned)).toBe(25);
  });
});

// ─── detectNewlyCompletedSets ─────────────────────────────────────────────────

describe('detectNewlyCompletedSets', () => {
  const defesaCards = new Set([
    'cafu-legendary',
    'roberto-carlos-legendary',
    'lucio-elite',
    'taffarel-elite',
  ]);

  it('detecta set recém-completado', () => {
    const newly = detectNewlyCompletedSets(defesaCards, new Set());
    const codes = newly.map((s) => s.code);
    expect(codes).toContain('muralha_verde_amarela');
  });

  it('ignora sets já completos anteriormente', () => {
    const newly = detectNewlyCompletedSets(defesaCards, new Set(['muralha_verde_amarela']));
    const codes = newly.map((s) => s.code);
    expect(codes).not.toContain('muralha_verde_amarela');
  });

  it('não detecta set parcialmente completo', () => {
    const partial = new Set(['cafu-legendary']); // só 1 de 4
    const newly = detectNewlyCompletedSets(partial, new Set());
    const codes = newly.map((s) => s.code);
    expect(codes).not.toContain('muralha_verde_amarela');
  });

  it('detecta múltiplos sets simultaneamente', () => {
    // Copa 2002 cards: ronaldo-ultra, ronaldinho-ultra, cafu-legendary, roberto-carlos-legendary, rivaldo-legendary
    // Defesa cards: cafu-legendary, roberto-carlos-legendary, lucio-elite, taffarel-elite
    const massiveOwned = new Set([
      'ronaldo-ultra',
      'ronaldinho-ultra',
      'cafu-legendary',
      'roberto-carlos-legendary',
      'rivaldo-legendary',
      'lucio-elite',
      'taffarel-elite',
    ]);
    const newly = detectNewlyCompletedSets(massiveOwned, new Set());
    const codes = newly.map((s) => s.code);
    expect(codes).toContain('copa_2002');
    expect(codes).toContain('muralha_verde_amarela');
  });

  it('retorna array vazio se nenhum set completado', () => {
    const owned = new Set(['ronaldo-ultra']); // apenas 1 card
    const newly = detectNewlyCompletedSets(owned, new Set());
    expect(newly.length).toBe(0);
  });
});
