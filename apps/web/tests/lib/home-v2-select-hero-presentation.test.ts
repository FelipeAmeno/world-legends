import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { CollectionCard } from '@/lib/collection-data';
import { selectHeroPresentation } from '@/lib/home-v2/select-hero-presentation';
import { describe, expect, it } from 'vitest';

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), 'utf-8');
}

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

describe('Sprint 43F.1 — home-v2/select-hero-presentation (apresentação, nunca o ranking de domínio)', () => {
  it('170. sem nenhuma carta full-artwork elegível, o centro é o rank[0] de domínio (comportamento idêntico ao Sprint 43F)', () => {
    const ranked = [card({ cardId: 'a' }), card({ cardId: 'b' }), card({ cardId: 'c' })];
    const result = selectHeroPresentation(ranked, { isFullArtworkEligible: () => false });
    expect(result?.center.cardId).toBe('a');
    expect(result?.flankLeft?.cardId).toBe('b');
    expect(result?.flankRight?.cardId).toBe('c');
  });

  it('171. a primeira carta (na ordem de domínio) elegível pra full-artwork vira o centro, mesmo não sendo o rank[0]', () => {
    const ranked = [card({ cardId: 'a' }), card({ cardId: 'b' }), card({ cardId: 'c' })];
    const result = selectHeroPresentation(ranked, {
      isFullArtworkEligible: (c) => c.cardId === 'b',
    });
    expect(result?.center.cardId).toBe('b');
  });

  it('172. as duas cartas restantes preservam a ordem relativa de domínio nas laterais (a melhor das duas fica à esquerda)', () => {
    const ranked = [card({ cardId: 'a' }), card({ cardId: 'b' }), card({ cardId: 'c' })];
    const result = selectHeroPresentation(ranked, {
      isFullArtworkEligible: (c) => c.cardId === 'c',
    });
    expect(result?.center.cardId).toBe('c');
    expect(result?.flankLeft?.cardId).toBe('a');
    expect(result?.flankRight?.cardId).toBe('b');
  });

  it('173. nunca adiciona nem remove uma carta — o conjunto de 3 permanece idêntico ao ranking de domínio recebido', () => {
    const ranked = [card({ cardId: 'a' }), card({ cardId: 'b' }), card({ cardId: 'c' })];
    const result = selectHeroPresentation(ranked, { isFullArtworkEligible: () => true });
    const resultCardIds = [
      result?.center.cardId,
      result?.flankLeft?.cardId,
      result?.flankRight?.cardId,
    ].sort();
    expect(resultCardIds).toEqual(['a', 'b', 'c']);
  });

  it('174. array vazio retorna null, nunca lança', () => {
    expect(selectHeroPresentation([])).toBeNull();
  });

  it('175. com 1 carta, ela é sempre o centro, ambas as laterais ficam null', () => {
    const result = selectHeroPresentation([card({ cardId: 'a' })], {
      isFullArtworkEligible: () => false,
    });
    expect(result?.center.cardId).toBe('a');
    expect(result?.flankLeft).toBeNull();
    expect(result?.flankRight).toBeNull();
  });

  it('176. com 2 cartas, uma flanqueia e a outra fica null — nunca inventa uma terceira carta', () => {
    const result = selectHeroPresentation([card({ cardId: 'a' }), card({ cardId: 'b' })], {
      isFullArtworkEligible: () => false,
    });
    expect(result?.center.cardId).toBe('a');
    expect(result?.flankLeft?.cardId).toBe('b');
    expect(result?.flankRight).toBeNull();
  });

  it('177. determinístico — mesma entrada produz sempre a mesma saída', () => {
    const ranked = [card({ cardId: 'a' }), card({ cardId: 'b' }), card({ cardId: 'c' })];
    const options = { isFullArtworkEligible: (c: CollectionCard) => c.cardId === 'b' };
    const r1 = selectHeroPresentation(ranked, options);
    const r2 = selectHeroPresentation(ranked, options);
    expect(r1).toEqual(r2);
  });

  it('178. o critério real (padrão, sem override) usa resolvePlayerCardRendererForDensity — nunca reimplementa a decisão full-artwork', () => {
    const src = readSource('lib/home-v2/select-hero-presentation.ts');
    expect(src).toContain('resolvePlayerCardRendererForDensity');
    expect(src).not.toContain('productionEligible !==');
  });
});
