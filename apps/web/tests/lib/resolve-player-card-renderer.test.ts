import { CARD_STATIC_MANIFEST } from '@/lib/card-static/manifest.generated';
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
  {
    id: 'wl-legendary-neymar-001',
    generated: {
      compact: { src: '/assets/cards/generated/compact/wl-legendary-neymar-001.webp', sizeKB: 66 },
      standard: {
        src: '/assets/cards/generated/standard/wl-legendary-neymar-001.webp',
        sizeKB: 183,
      },
      showcase: {
        src: '/assets/cards/generated/showcase/wl-legendary-neymar-001.webp',
        sizeKB: 287,
      },
    },
    productionEligible: true,
  },
  // Sprint 35D.4 — Mbappé no mesmo formato do Ronaldinho/Neymar. Usado
  // aqui pra provar que o resolver generaliza pra qualquer preset com
  // esse shape (genérico, não hardcoded pra 2 jogadores). O preset REAL
  // (`wl-elite-mbappe-001.json`) ainda não foi criado no repo porque o
  // artwork (`wl-artwork-elite-mbappe-001-v1.png`) ainda não foi
  // entregue — ver teste "estado real hoje" abaixo, que confirma que o
  // manifesto de PRODUÇÃO cai no fallback procedural até isso acontecer.
  {
    id: 'wl-elite-mbappe-001',
    generated: {
      compact: { src: '/assets/cards/generated/compact/wl-elite-mbappe-001.webp', sizeKB: 70 },
      standard: { src: '/assets/cards/generated/standard/wl-elite-mbappe-001.webp', sizeKB: 190 },
      showcase: { src: '/assets/cards/generated/showcase/wl-elite-mbappe-001.webp', sizeKB: 300 },
    },
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

describe('lib/card-static/resolve-player-card-renderer — Sprint 35D.4 (Neymar e Mbappé)', () => {
  it('Neymar (wl-legendary-neymar-001) resolve full-artwork quando preset+output existem e é elegível', () => {
    const result = resolvePlayerCardRenderer(
      {
        artworkPresetId: 'wl-legendary-neymar-001',
        cardId: 'c-neymar',
        playerId: 'p-neymar',
        rarity: 'legendary',
      },
      MANIFEST,
    );
    expect(result.renderer).toBe('full-artwork');
    if (result.renderer === 'full-artwork') {
      expect(result.preset.id).toBe('wl-legendary-neymar-001');
      expect(result.preset.productionEligible).toBe(true);
    }
  });

  it('Mbappé (wl-elite-mbappe-001) resolveria full-artwork pelo MESMO resolver, sem lógica dedicada — mesmo shape do Neymar/Ronaldinho', () => {
    // Prova a generalização do resolver: nenhum branch por jogador,
    // qualquer preset com o shape correto (generated + productionEligible)
    // resolve igual, seja Neymar, Mbappé ou qualquer futuro jogador.
    const result = resolvePlayerCardRenderer(
      {
        artworkPresetId: 'wl-elite-mbappe-001',
        cardId: 'c-mbappe',
        playerId: 'p-mbappe',
        rarity: 'elite',
      },
      MANIFEST,
    );
    expect(result.renderer).toBe('full-artwork');
    if (result.renderer === 'full-artwork') expect(result.preset.id).toBe('wl-elite-mbappe-001');
  });

  it('artwork de Neymar nunca é reutilizado pra Mbappé — resolvem pra arquivos .webp distintos', () => {
    const neymar = resolveGeneratedArtwork(MANIFEST, 'wl-legendary-neymar-001', 'showcase');
    const mbappe = resolveGeneratedArtwork(MANIFEST, 'wl-elite-mbappe-001', 'showcase');
    expect(neymar?.src).not.toBe(mbappe?.src);
    expect(neymar?.src).toContain('wl-legendary-neymar-001');
    expect(mbappe?.src).toContain('wl-elite-mbappe-001');
  });

  it('estado real hoje: manifesto de PRODUÇÃO já contém wl-legendary-neymar-001 (artwork entregue e integrado)', () => {
    const preset = CARD_STATIC_MANIFEST.find((p) => p.id === 'wl-legendary-neymar-001');
    expect(preset).toBeDefined();
    expect(preset?.productionEligible).toBe(true);
    const result = resolvePlayerCardRenderer(
      {
        artworkPresetId: 'wl-legendary-neymar-001',
        cardId: 'c-neymar',
        playerId: 'p-neymar',
        rarity: 'legendary',
      },
      CARD_STATIC_MANIFEST,
    );
    expect(result.renderer).toBe('full-artwork');
  });

  it('estado real hoje: manifesto de PRODUÇÃO já contém wl-elite-mbappe-001 (Sprint 35D.5 — artwork entregue e integrado)', () => {
    const preset = CARD_STATIC_MANIFEST.find((p) => p.id === 'wl-elite-mbappe-001');
    expect(preset).toBeDefined();
    expect(preset?.productionEligible).toBe(true);
    const result = resolvePlayerCardRenderer(
      {
        artworkPresetId: 'wl-elite-mbappe-001',
        cardId: 'c-mbappe',
        playerId: 'p-mbappe',
        rarity: 'elite',
      },
      CARD_STATIC_MANIFEST,
    );
    expect(result.renderer).toBe('full-artwork');
  });

  it('estado real hoje: artwork de Mbappé no manifesto de produção não é o mesmo arquivo do Neymar, Pelé ou Ronaldinho', () => {
    const mbappe = resolveGeneratedArtwork(CARD_STATIC_MANIFEST, 'wl-elite-mbappe-001', 'showcase');
    const neymar = resolveGeneratedArtwork(
      CARD_STATIC_MANIFEST,
      'wl-legendary-neymar-001',
      'showcase',
    );
    const pele = resolveGeneratedArtwork(CARD_STATIC_MANIFEST, 'wl-goat-brazil-001', 'showcase');
    const ronaldinho = resolveGeneratedArtwork(
      CARD_STATIC_MANIFEST,
      'wl-legendary-ronaldinho-001',
      'showcase',
    );
    expect(mbappe?.src).toContain('wl-elite-mbappe-001');
    for (const other of [neymar, pele, ronaldinho]) {
      expect(mbappe?.src).not.toBe(other?.src);
    }
  });
});
