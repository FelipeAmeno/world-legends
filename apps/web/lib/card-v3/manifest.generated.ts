/**
 * lib/card-v3/manifest.generated.ts — Sprint 34 (Official Art Pack Integration)
 *
 * GERADO AUTOMATICAMENTE por scripts/generate-card-asset-manifest.mts — não
 * editar à mão. Reflete o que existe em public/assets/cards/v3/ no momento
 * em que `pnpm dev` ou `pnpm build` rodou por último (predev/prebuild).
 *
 * Total de assets v3 encontrados: 7
 * Total de composições v3 encontradas: 3
 */

export const CARD_V3_ASSET_MANIFEST = {
  backgrounds: {
    Gemini_Generated_Image_5c8dtx5c8dtx5c8d: {
      src: '/assets/cards/v3/backgrounds/Gemini_Generated_Image_5c8dtx5c8dtx5c8d.png',
      meta: {},
    },
    Gemini_Generated_Image_djdxc9djdxc9djdx: {
      src: '/assets/cards/v3/backgrounds/Gemini_Generated_Image_djdxc9djdxc9djdx.png',
      meta: {},
    },
    Gemini_Generated_Image_no9hgjno9hgjno9h: {
      src: '/assets/cards/v3/backgrounds/Gemini_Generated_Image_no9hgjno9hgjno9h.png',
      meta: {},
    },
    'nano-banana-card-direction-v1': {
      src: '/assets/cards/v3/backgrounds/nano-banana-card-direction-v1.png',
      meta: {},
    },
    'nano-banana-layer-architecture-v1': {
      src: '/assets/cards/v3/backgrounds/nano-banana-layer-architecture-v1.png',
      meta: {},
    },
    'wl-bg-goat-stadium-gold-001-v1': {
      src: '/assets/cards/v3/backgrounds/wl-bg-goat-stadium-gold-001-v1.png',
      meta: {},
    },
  },
  players: {
    'wl-player-goat-brazil-001-v1': {
      src: '/assets/cards/v3/players/wl-player-goat-brazil-001-v1.png',
      meta: {},
    },
  },
  patterns: {},
  lights: {},
  particles: {},
  frames: {},
} as const;

export const CARD_V3_COMPOSITIONS = {
  'ultra-validation-01': {
    backgroundId: 'wl-bg-goat-stadium-gold-001-v1',
    playerId: 'wl-player-goat-brazil-001-v1',
  },
  'wl-bg-goat-stadium-gold-001-v1': {
    id: 'wl-bg-goat-stadium-gold-001-v1',
    type: 'background',
    rarity: 'goat',
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    rotation: 0,
    opacity: 1,
    blendMode: 'normal',
    blur: 0,
    intensity: 1,
    parallaxDepth: 0.15,
    anchor: 'center',
    safeForCompact: true,
    safeForStandard: true,
    safeForShowcase: true,
    version: 1,
  },
  'wl-player-goat-brazil-001-v1': {
    id: 'wl-player-goat-brazil-001-v1',
    type: 'player',
    rarity: 'goat',
    country: 'brazil',
    era: '1970s',
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    rotation: 0,
    opacity: 1,
    blendMode: 'normal',
    blur: 0,
    intensity: 1,
    parallaxDepth: 0.65,
    anchor: 'center-bottom',
    safeForCompact: true,
    safeForStandard: true,
    safeForShowcase: true,
    version: 1,
  },
} as const;
