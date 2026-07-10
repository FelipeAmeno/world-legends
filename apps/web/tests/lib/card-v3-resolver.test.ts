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
  CARD_V3_COMPOSITIONS: {
    'common-validation-01': {
      backgroundId: 'bg-common-validation-01',
      playerId: 'player-common-validation-01',
      frameId: 'frame-common-v3',
      scale: 1.05,
      opacity: 0.9,
    },
    'broken-refs': {
      backgroundId: 'does-not-exist',
    },
  },
}));

import { listCardV3Compositions, resolveCardV3 } from '@/lib/card-v3/resolver';

describe('lib/card-v3/resolver', () => {
  it('resolves every referenced channel to its manifest src', () => {
    const composition = resolveCardV3('common-validation-01');
    expect(composition).not.toBeNull();
    expect(composition?.background).toBe(
      '/assets/cards/v3/backgrounds/bg-common-validation-01.webp',
    );
    expect(composition?.player).toBe('/assets/cards/v3/players/player-common-validation-01.png');
    expect(composition?.frame).toBe('/assets/cards/v3/frames/frame-common-v3.png');
    expect(composition?.pattern).toBeNull();
    expect(composition?.light).toBeNull();
    expect(composition?.particles).toBeNull();
  });

  it('merges partial metadata with defaults', () => {
    const composition = resolveCardV3('common-validation-01');
    expect(composition?.meta.scale).toBe(1.05);
    expect(composition?.meta.opacity).toBe(0.9);
    // não especificado no JSON de teste — deve cair no default
    expect(composition?.meta.rotation).toBe(0);
    expect(composition?.meta.blendMode).toBe('normal');
    expect(composition?.meta.parallaxDepth).toBe(0);
  });

  it('returns null for an unknown composition id', () => {
    expect(resolveCardV3('nope')).toBeNull();
  });

  it('returns null for a channel referencing a missing manifest entry', () => {
    const composition = resolveCardV3('broken-refs');
    expect(composition?.background).toBeNull();
  });

  it('lists known composition ids', () => {
    expect(listCardV3Compositions()).toEqual(['common-validation-01', 'broken-refs']);
  });
});
