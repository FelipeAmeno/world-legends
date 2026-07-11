import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/card-v3/manifest.generated', () => ({
  CARD_V3_ASSET_MANIFEST: {
    backgrounds: {
      'bg-common-validation-01': {
        src: '/assets/cards/v3/backgrounds/bg-common-validation-01.webp',
      },
    },
    players: {
      'player-common-validation-01': {
        src: '/assets/cards/v3/players/player-common-validation-01.png',
      },
    },
    patterns: {},
    lights: {},
    particles: {},
    frames: { 'frame-common-v3': { src: '/assets/cards/v3/frames/frame-common-v3.png' } },
  },
  // Sprint 35 — o mesmo mapa serve composições (por compositionId) E
  // metadata por asset (por assetId) — cada entrada com `*Id` é uma
  // composição, cada entrada sem `*Id` é o transform de UM asset.
  CARD_V3_COMPOSITIONS: {
    'common-validation-01': {
      backgroundId: 'bg-common-validation-01',
      playerId: 'player-common-validation-01',
      frameId: 'frame-common-v3',
    },
    // Metadata própria do asset de background — scale/opacity diferentes
    // do asset de player, provando que cada canal tem seu próprio transform.
    'bg-common-validation-01': { scale: 1.05, opacity: 0.9, parallaxDepth: 0.15 },
    'player-common-validation-01': { parallaxDepth: 0.65 },
    'broken-refs': { backgroundId: 'does-not-exist' },
  },
}));

import { listCardV3Compositions, resolveCardV3 } from '@/lib/card-v3/resolver';

describe('lib/card-v3/resolver', () => {
  it('resolves every referenced channel to its manifest src', () => {
    const composition = resolveCardV3('common-validation-01');
    expect(composition).not.toBeNull();
    expect(composition?.background?.src).toBe(
      '/assets/cards/v3/backgrounds/bg-common-validation-01.webp',
    );
    expect(composition?.player?.src).toBe(
      '/assets/cards/v3/players/player-common-validation-01.png',
    );
    expect(composition?.frame?.src).toBe('/assets/cards/v3/frames/frame-common-v3.png');
    expect(composition?.pattern).toBeNull();
    expect(composition?.light).toBeNull();
    expect(composition?.particles).toBeNull();
  });

  it('resolves each channel with its OWN metadata, not a shared blob', () => {
    const composition = resolveCardV3('common-validation-01');
    expect(composition?.background?.meta.scale).toBe(1.05);
    expect(composition?.background?.meta.opacity).toBe(0.9);
    expect(composition?.background?.meta.parallaxDepth).toBe(0.15);
    // player tem seu PRÓPRIO parallaxDepth, diferente do background
    expect(composition?.player?.meta.parallaxDepth).toBe(0.65);
    expect(composition?.player?.meta.scale).toBe(1); // default, não vaza do background
  });

  it('falls back to default metadata for an asset without its own sidecar', () => {
    const composition = resolveCardV3('common-validation-01');
    expect(composition?.frame?.meta.rotation).toBe(0);
    expect(composition?.frame?.meta.blendMode).toBe('normal');
  });

  it('returns null for an unknown composition id', () => {
    expect(resolveCardV3('nope')).toBeNull();
  });

  it('returns null for a channel referencing a missing manifest entry', () => {
    const composition = resolveCardV3('broken-refs');
    expect(composition?.background).toBeNull();
  });

  it('lists known composition ids', () => {
    expect(listCardV3Compositions()).toContain('common-validation-01');
  });
});
