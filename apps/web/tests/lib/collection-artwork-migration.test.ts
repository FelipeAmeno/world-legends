import { CARD_STATIC_MANIFEST } from '@/lib/card-static/manifest.generated';
import { resolvePlayerCardRenderer } from '@/lib/card-static/resolve-player-card-renderer';
import { getCollection } from '@/lib/collection-data';
import { describe, expect, it } from 'vitest';

const EXPECTED = [
  { playerId: 'pelé', artworkPresetId: 'wl-goat-brazil-001', nickname: 'O REI' },
  {
    playerId: 'ronaldinho',
    artworkPresetId: 'wl-legendary-ronaldinho-001',
    nickname: 'O BRUXO',
  },
  { playerId: 'ronaldo', artworkPresetId: 'wl-goat-ronaldo-001', nickname: 'O FENÔMENO' },
  {
    playerId: 'maradona',
    artworkPresetId: 'wl-goat-maradona-001',
    nickname: 'ESCOBAR CHEIRADOR',
  },
  { playerId: 'lionel-messi', artworkPresetId: 'wl-goat-messi-001', nickname: 'GOAT' },
  {
    playerId: 'cristiano-ronaldo',
    artworkPresetId: 'wl-goat-cristiano-001',
    nickname: 'PAPAI CRIS SIIIIU',
  },
  { playerId: 'neymar', artworkPresetId: 'wl-legendary-neymar-001', nickname: 'O PRÍNCIPE' },
  {
    playerId: 'kylian-mbappe',
    artworkPresetId: 'wl-elite-mbappe-001',
    nickname: 'O DITADOR',
  },
  {
    playerId: 'zinedine-zidane',
    artworkPresetId: 'wl-legendary-zidane-001',
    nickname: 'O MAESTRO',
  },
  {
    playerId: 'franz-beckenbauer',
    artworkPresetId: 'wl-legendary-beckenbauer-001',
    nickname: 'O KAISER',
  },
] as const;

describe('lib/collection-data — migração de catálogo (10 cartas GOAT/lendárias com artwork exclusivo)', () => {
  const collection = getCollection();

  it.each(EXPECTED)(
    '$playerId carrega artworkPresetId=$artworkPresetId e nickname="$nickname" na CollectionCard real',
    ({ playerId, artworkPresetId, nickname }) => {
      const card = collection.find((c) => c.playerId === playerId);
      expect(card).toBeDefined();
      expect(card?.artworkPresetId).toBe(artworkPresetId);
      expect(card?.nickname).toBe(nickname);
      expect(card?.stats).toBeDefined();
    },
  );

  it.each(EXPECTED)(
    '$playerId resolve full-artwork pelo resolvePlayerCardRenderer contra o manifesto de produção',
    ({ playerId, artworkPresetId }) => {
      const card = collection.find((c) => c.playerId === playerId);
      expect(card).toBeDefined();
      const result = resolvePlayerCardRenderer(
        {
          artworkPresetId: card?.artworkPresetId,
          cardId: card?.cardId ?? '',
          playerId,
          rarity: card?.rarityCode ?? '',
        },
        CARD_STATIC_MANIFEST,
      );
      expect(result.renderer).toBe('full-artwork');
      if (result.renderer === 'full-artwork') expect(result.preset.id).toBe(artworkPresetId);
    },
  );

  it('nenhuma outra carta da coleção real ganhou artworkPresetId de propósito — migração é restrita aos 10', () => {
    const migratedIds = new Set(EXPECTED.map((e) => e.playerId));
    const unexpected = collection.filter(
      (c) => c.artworkPresetId !== undefined && !migratedIds.has(c.playerId as never),
    );
    expect(unexpected).toEqual([]);
  });

  it('cartas fora dos 10 continuam sem artworkPresetId/nickname/stats — resolver cai no procedural pra elas', () => {
    const untouched = collection.find((c) => c.playerId === 'zico');
    expect(untouched).toBeDefined();
    expect(untouched?.artworkPresetId).toBeUndefined();
    expect(untouched?.nickname).toBeUndefined();
    expect(untouched?.stats).toBeUndefined();
    const result = resolvePlayerCardRenderer(
      {
        artworkPresetId: untouched?.artworkPresetId,
        cardId: untouched?.cardId ?? '',
        playerId: 'zico',
        rarity: untouched?.rarityCode ?? '',
      },
      CARD_STATIC_MANIFEST,
    );
    expect(result.renderer).toBe('procedural');
  });
});
