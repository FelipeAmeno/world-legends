import { resolveGeneratedArtwork } from '@/lib/card-static/resolve-artwork';
import type { ManifestPreset } from '@/lib/card-static/resolve-artwork';
import { resolvePlayerCardRenderer } from '@/lib/card-static/resolve-player-card-renderer';
import { describe, expect, it } from 'vitest';

const GENERATED_OK = {
  compact: { src: '/x/compact.webp', sizeKB: 50 },
  standard: { src: '/x/standard.webp', sizeKB: 100 },
  showcase: { src: '/x/showcase.webp', sizeKB: 200 },
};

const MANIFEST: ManifestPreset[] = [
  {
    id: 'wl-goat-brazil-001',
    generated: {
      compact: { src: '/assets/cards/generated/compact/wl-goat-brazil-001.webp', sizeKB: 81 },
      standard: { src: '/assets/cards/generated/standard/wl-goat-brazil-001.webp', sizeKB: 265 },
      showcase: { src: '/assets/cards/generated/showcase/wl-goat-brazil-001.webp', sizeKB: 420 },
    },
    productionEligible: true,
  },
  {
    id: 'wl-legendary-ronaldinho-001',
    generated: {
      compact: {
        src: '/assets/cards/generated/compact/wl-legendary-ronaldinho-001.webp',
        sizeKB: 86,
      },
      standard: {
        src: '/assets/cards/generated/standard/wl-legendary-ronaldinho-001.webp',
        sizeKB: 254,
      },
      showcase: {
        src: '/assets/cards/generated/showcase/wl-legendary-ronaldinho-001.webp',
        sizeKB: 392,
      },
    },
    productionEligible: true,
  },
  {
    id: 'wl-draft-not-eligible-001',
    generated: GENERATED_OK,
    productionEligible: false,
  },
  {
    id: 'wl-no-output-yet-001',
    generated: { compact: null, standard: null, showcase: null },
    productionEligible: true,
  },
];

describe('lib/card-static/resolve-player-card-renderer — resolvePlayerCardRenderer', () => {
  it('preset válido + elegível usa full-artwork', () => {
    const result = resolvePlayerCardRenderer(
      { artworkPresetId: 'wl-goat-brazil-001', cardId: 'c1', playerId: 'p1', rarity: 'goat' },
      MANIFEST,
    );
    expect(result.renderer).toBe('full-artwork');
    if (result.renderer === 'full-artwork') expect(result.preset.id).toBe('wl-goat-brazil-001');
  });

  it('artworkPresetId ausente usa procedural (missing-artwork-preset-id)', () => {
    const result = resolvePlayerCardRenderer(
      { cardId: 'c1', playerId: 'p1', rarity: 'goat' },
      MANIFEST,
    );
    expect(result).toEqual({ renderer: 'procedural', fallbackReason: 'missing-artwork-preset-id' });
  });

  it('preset inválido (id não existe no manifesto) usa procedural (preset-not-found)', () => {
    const result = resolvePlayerCardRenderer(
      { artworkPresetId: 'wl-does-not-exist-001', cardId: 'c1', playerId: 'p1', rarity: 'elite' },
      MANIFEST,
    );
    expect(result).toEqual({ renderer: 'procedural', fallbackReason: 'preset-not-found' });
  });

  it('preset sem nenhum artwork gerado usa procedural (artwork-output-not-found)', () => {
    const result = resolvePlayerCardRenderer(
      { artworkPresetId: 'wl-no-output-yet-001', cardId: 'c1', playerId: 'p1', rarity: 'elite' },
      MANIFEST,
    );
    expect(result).toEqual({ renderer: 'procedural', fallbackReason: 'artwork-output-not-found' });
  });

  it('productionEligible false usa procedural (preset-not-production-eligible)', () => {
    const result = resolvePlayerCardRenderer(
      {
        artworkPresetId: 'wl-draft-not-eligible-001',
        cardId: 'c1',
        playerId: 'p1',
        rarity: 'elite',
      },
      MANIFEST,
    );
    expect(result).toEqual({
      renderer: 'procedural',
      fallbackReason: 'preset-not-production-eligible',
    });
  });

  it('artwork de um jogador nunca é reutilizado em outro — Pelé e Ronaldinho resolvem pra arquivos distintos', () => {
    const pele = resolveGeneratedArtwork(MANIFEST, 'wl-goat-brazil-001', 'showcase');
    const ronaldinho = resolveGeneratedArtwork(MANIFEST, 'wl-legendary-ronaldinho-001', 'showcase');
    expect(pele?.src).not.toBe(ronaldinho?.src);
    expect(pele?.src).toContain('wl-goat-brazil-001');
    expect(ronaldinho?.src).toContain('wl-legendary-ronaldinho-001');
  });

  it('goalkeeper (sem artworkPresetId) continua caindo no procedural normalmente — o resolver não discrimina por posição', () => {
    const result = resolvePlayerCardRenderer(
      { cardId: 'gk-card', playerId: 'gk-player', rarity: 'elite' },
      MANIFEST,
    );
    expect(result.renderer).toBe('procedural');
  });

  it('Pack Reveal usaria o MESMO resolver — input no formato de uma carta sorteada (DrawnCard.card-like) funciona sem adaptação', () => {
    // Simula o shape de uma CollectionCard real (o que `DrawnCard.card` carrega
    // no Pack Reveal de produção) — mesmo sem `artworkPresetId` migrado pro
    // catálogo ainda, o resolver responde de forma consistente, provando que
    // dá pra plugar no Pack Reveal sem mudar a assinatura da função.
    const drawnCardLike = {
      cardId: 'lucio-elite',
      playerId: 'lucio',
      rarityCode: 'elite',
      artworkPresetId: undefined as string | undefined,
    };
    const result = resolvePlayerCardRenderer(
      {
        artworkPresetId: drawnCardLike.artworkPresetId,
        cardId: drawnCardLike.cardId,
        playerId: drawnCardLike.playerId,
        rarity: drawnCardLike.rarityCode,
      },
      MANIFEST,
    );
    expect(result.renderer).toBe('procedural');

    // E se a mesma carta JÁ tivesse um artworkPresetId migrado (futuro),
    // o resolver reagiria igual a qualquer outro call site.
    const migrated = resolvePlayerCardRenderer(
      {
        artworkPresetId: 'wl-goat-brazil-001',
        cardId: drawnCardLike.cardId,
        playerId: drawnCardLike.playerId,
        rarity: drawnCardLike.rarityCode,
      },
      MANIFEST,
    );
    expect(migrated.renderer).toBe('full-artwork');
  });
});
