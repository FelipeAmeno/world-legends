import type { CollectionCard } from '@/lib/collection-data';
import { applyFilters } from '@/lib/collection-data';
import type { FilterState } from '@/lib/collection-data';
import { describe, expect, it } from 'vitest';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeCard(overrides: Partial<CollectionCard> = {}): CollectionCard {
  return Object.freeze({
    cardId: 'test-elite',
    playerId: 'test',
    displayName: 'Test',
    fullName: 'Test Player',
    position: 'ST',
    overall: 80,
    rarityCode: 'elite',
    rarityLabel: 'Elite',
    editionCode: 'base',
    nationality: 'BRA',
    flagEmoji: '🇧🇷',
    era: '90s',
    bioShort: 'Bio.',
    attributes: { pace: 80, shooting: 80, passing: 75, dribbling: 78, defending: 40, physical: 70 },
    traits: [],
    contracts: 10,
    evolution: 0,
    ...overrides,
  });
}

const defaultFilter: FilterState = {
  search: '',
  rarity: 'all',
  position: 'all',
  sortKey: 'overall',
};

// ─── Filtro de busca ──────────────────────────────────────────────────────────

describe('applyFilters — search', () => {
  it('retorna todos quando search está vazia', () => {
    const cards = [makeCard({ displayName: 'Ronaldo' }), makeCard({ displayName: 'Zico' })];
    expect(applyFilters(cards, defaultFilter)).toHaveLength(2);
  });

  it('filtra por displayName (case-insensitive)', () => {
    const cards = [
      makeCard({ displayName: 'Ronaldo', cardId: 'ronaldo-ultra' }),
      makeCard({ displayName: 'Zico', cardId: 'zico-legendary' }),
    ];
    const result = applyFilters(cards, { ...defaultFilter, search: 'ron' });
    expect(result).toHaveLength(1);
    expect(result[0]?.displayName).toBe('Ronaldo');
  });

  it('filtra por fullName', () => {
    const cards = [
      makeCard({ displayName: 'Ronaldo', fullName: 'Ronaldo Fenômeno', cardId: 'r1' }),
      makeCard({ displayName: 'R9', fullName: 'Ronaldo Nazário', cardId: 'r2' }),
      makeCard({ displayName: 'Zico', fullName: 'Arthur Antunes Coimbra', cardId: 'r3' }),
    ];
    const result = applyFilters(cards, { ...defaultFilter, search: 'ronaldo' });
    expect(result).toHaveLength(2);
  });

  it('filtra por position em search', () => {
    const cards = [
      makeCard({ position: 'GK', cardId: 'gk1' }),
      makeCard({ position: 'ST', cardId: 'st1' }),
    ];
    const result = applyFilters(cards, { ...defaultFilter, search: 'gk' });
    expect(result).toHaveLength(1);
    expect(result[0]?.position).toBe('GK');
  });

  it('retorna vazio quando nada bate', () => {
    const cards = [makeCard({ displayName: 'Ronaldo' })];
    expect(applyFilters(cards, { ...defaultFilter, search: 'xyzxyz' })).toHaveLength(0);
  });
});

// ─── Filtro de raridade ───────────────────────────────────────────────────────

describe('applyFilters — rarity', () => {
  it('retorna todos quando rarity=all', () => {
    const cards = [makeCard({ rarityCode: 'elite' }), makeCard({ rarityCode: 'legendary' })];
    expect(applyFilters(cards, { ...defaultFilter, rarity: 'all' })).toHaveLength(2);
  });

  it('filtra pela raridade correta', () => {
    const cards = [
      makeCard({ rarityCode: 'elite', cardId: 'e1' }),
      makeCard({ rarityCode: 'legendary', cardId: 'l1' }),
      makeCard({ rarityCode: 'rare', cardId: 'r1' }),
    ];
    const result = applyFilters(cards, { ...defaultFilter, rarity: 'legendary' });
    expect(result).toHaveLength(1);
    expect(result[0]?.rarityCode).toBe('legendary');
  });
});

// ─── Filtro de posição ────────────────────────────────────────────────────────

describe('applyFilters — position', () => {
  it('retorna todos quando position=all', () => {
    const cards = [makeCard({ position: 'ST' }), makeCard({ position: 'GK' })];
    expect(applyFilters(cards, { ...defaultFilter, position: 'all' })).toHaveLength(2);
  });

  it('filtra pela posição correta', () => {
    const cards = [
      makeCard({ position: 'GK', cardId: 'gk1' }),
      makeCard({ position: 'ST', cardId: 'st1' }),
      makeCard({ position: 'CB', cardId: 'cb1' }),
    ];
    const result = applyFilters(cards, { ...defaultFilter, position: 'GK' });
    expect(result).toHaveLength(1);
    expect(result[0]?.position).toBe('GK');
  });
});

// ─── Ordenação ────────────────────────────────────────────────────────────────

describe('applyFilters — sortKey', () => {
  it('ordena por overall decrescente', () => {
    const cards = [
      makeCard({ overall: 70, cardId: 'a' }),
      makeCard({ overall: 95, cardId: 'b' }),
      makeCard({ overall: 85, cardId: 'c' }),
    ];
    const result = applyFilters(cards, { ...defaultFilter, sortKey: 'overall' });
    expect(result.map((c) => c.overall)).toEqual([95, 85, 70]);
  });

  it('ordena por raridade decrescente (ultra > legendary > elite > rare > common)', () => {
    const cards = [
      makeCard({ rarityCode: 'rare', cardId: 'r' }),
      makeCard({ rarityCode: 'ultra', cardId: 'u' }),
      makeCard({ rarityCode: 'legendary', cardId: 'l' }),
    ];
    const result = applyFilters(cards, { ...defaultFilter, sortKey: 'rarity' });
    expect(result.map((c) => c.rarityCode)).toEqual(['ultra', 'legendary', 'rare']);
  });

  it('ordena por nome alfabético crescente', () => {
    const cards = [
      makeCard({ displayName: 'Zico', cardId: 'z' }),
      makeCard({ displayName: 'Bebeto', cardId: 'b' }),
      makeCard({ displayName: 'Ronaldo', cardId: 'r' }),
    ];
    const result = applyFilters(cards, { ...defaultFilter, sortKey: 'name' });
    expect(result.map((c) => c.displayName)).toEqual(['Bebeto', 'Ronaldo', 'Zico']);
  });

  it('ordena por posição alfabética crescente', () => {
    const cards = [
      makeCard({ position: 'ST', cardId: 's' }),
      makeCard({ position: 'CB', cardId: 'c' }),
      makeCard({ position: 'GK', cardId: 'g' }),
    ];
    const result = applyFilters(cards, { ...defaultFilter, sortKey: 'position' });
    expect(result.map((c) => c.position)).toEqual(['CB', 'GK', 'ST']);
  });
});

// ─── Combinação de filtros ────────────────────────────────────────────────────

describe('applyFilters — combinações', () => {
  it('search + rarity combinados', () => {
    const cards = [
      makeCard({ displayName: 'Ronaldo', rarityCode: 'ultra', cardId: 'r-ultra' }),
      makeCard({ displayName: 'Ronaldo', rarityCode: 'legendary', cardId: 'r-leg' }),
      makeCard({ displayName: 'Zico', rarityCode: 'ultra', cardId: 'z-ultra' }),
    ];
    const result = applyFilters(cards, { ...defaultFilter, search: 'ron', rarity: 'ultra' });
    expect(result).toHaveLength(1);
    expect(result[0]?.cardId).toBe('r-ultra');
  });

  it('não muta o array original', () => {
    const cards = [makeCard({ overall: 90, cardId: 'a' }), makeCard({ overall: 80, cardId: 'b' })];
    const copy = [...cards];
    applyFilters(cards, { ...defaultFilter, sortKey: 'overall' });
    expect(cards).toEqual(copy);
  });
});
