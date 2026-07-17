import type { CollectionCard } from '@/lib/collection-data';
import { selectTopCards } from '@/lib/home-v2/select-top-cards';
import type { EditionCode } from '@world-legends/types';
import { describe, expect, it } from 'vitest';

function card(overrides: Partial<CollectionCard> & { cardId: string }): CollectionCard {
  return {
    playerId: overrides.cardId,
    displayName: overrides.cardId,
    fullName: overrides.cardId,
    nationality: 'BRA',
    flagEmoji: '🇧🇷',
    position: 'ST',
    overall: 80,
    rarityCode: 'rare',
    rarityLabel: 'Rare',
    editionCode: 'base',
    attributes: {},
    traits: [],
    bioShort: '',
    era: '2020s',
    ...overrides,
  } as CollectionCard;
}

describe('Sprint 43E — home-v2/select-top-cards (seletor puro, determinístico, nunca dados mock)', () => {
  it('132. cartas favoritadas sempre vêm antes de não-favoritadas, mesmo com overall menor', () => {
    const collection = [
      card({ cardId: 'a', overall: 99, rarityCode: 'ultra' }),
      card({ cardId: 'b', overall: 60, rarityCode: 'common' }),
    ];
    const result = selectTopCards({ collection, favoriteCardIds: ['b'] });
    expect(result[0]?.cardId).toBe('b');
    expect(result[1]?.cardId).toBe('a');
  });

  it('133. dentro do mesmo grupo (favorito ou não), overall descendente decide', () => {
    const collection = [
      card({ cardId: 'low', overall: 70 }),
      card({ cardId: 'high', overall: 95 }),
      card({ cardId: 'mid', overall: 82 }),
    ];
    const result = selectTopCards({ collection });
    expect(result.map((c) => c.cardId)).toEqual(['high', 'mid', 'low']);
  });

  it('134. empate de overall é resolvido por raridade descendente', () => {
    const collection = [
      card({ cardId: 'common', overall: 85, rarityCode: 'common' }),
      card({ cardId: 'legendary', overall: 85, rarityCode: 'legendary' }),
    ];
    const result = selectTopCards({ collection });
    expect(result[0]?.cardId).toBe('legendary');
  });

  it('135. empate de overall e raridade é resolvido por prioridade de edição (goat > prime > event > base)', () => {
    const collection = [
      card({
        cardId: 'base',
        overall: 90,
        rarityCode: 'ultra',
        editionCode: 'base' as EditionCode,
      }),
      card({
        cardId: 'goat',
        overall: 90,
        rarityCode: 'ultra',
        editionCode: 'goat' as EditionCode,
      }),
      card({
        cardId: 'prime',
        overall: 90,
        rarityCode: 'ultra',
        editionCode: 'prime' as EditionCode,
      }),
    ];
    const result = selectTopCards({ collection });
    expect(result.map((c) => c.cardId)).toEqual(['goat', 'prime', 'base']);
  });

  it('136. empate total é resolvido por um desempate estável (userCardId, senão cardId) — determinístico entre chamadas', () => {
    const collection = [
      card({ cardId: 'z-card', overall: 80, rarityCode: 'rare' }),
      card({ cardId: 'a-card', overall: 80, rarityCode: 'rare' }),
    ];
    const result1 = selectTopCards({ collection });
    const result2 = selectTopCards({ collection });
    expect(result1.map((c) => c.cardId)).toEqual(result2.map((c) => c.cardId));
    expect(result1[0]?.cardId).toBe('a-card');
  });

  it('137. usa userCardId (instância possuída) como desempate quando presente, nunca cardId nesse caso', () => {
    const collection = [
      card({ cardId: 'same-def', userCardId: 'user-card-zzz', overall: 80, rarityCode: 'rare' }),
      card({ cardId: 'same-def', userCardId: 'user-card-aaa', overall: 80, rarityCode: 'rare' }),
    ];
    const result = selectTopCards({ collection });
    expect(result[0]?.userCardId).toBe('user-card-aaa');
  });

  it('138. respeita o limite (padrão 3), nunca retorna mais que o pedido', () => {
    const collection = Array.from({ length: 10 }, (_, i) =>
      card({ cardId: `c${i}`, overall: 70 + i }),
    );
    expect(selectTopCards({ collection })).toHaveLength(3);
    expect(selectTopCards({ collection, limit: 5 })).toHaveLength(5);
  });

  it('139. coleção vazia retorna array vazio, nunca lança — estado vazio fica a cargo do caller (Sprint 43F)', () => {
    expect(selectTopCards({ collection: [] })).toEqual([]);
  });

  it('140. nunca muta o array de coleção recebido', () => {
    const collection = [card({ cardId: 'a', overall: 60 }), card({ cardId: 'b', overall: 90 })];
    const original = [...collection];
    selectTopCards({ collection });
    expect(collection).toEqual(original);
  });

  it('141. sem favoriteCardIds (undefined) funciona igual a lista vazia — nunca lança', () => {
    const collection = [card({ cardId: 'a', overall: 90 })];
    expect(() => selectTopCards({ collection })).not.toThrow();
  });
});
