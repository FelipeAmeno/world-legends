/**
 * components/cards/card-animation-presets.ts — Sprint 18.9 (Premium Card
 * Engine — Final Assembly)
 *
 * Formaliza a "personalidade de movimento" de cada raridade como dado, não
 * como `if (rarityCode === 'ultra')` espalhado pelas camadas. Cada raridade
 * tem um `speedMultiplier` que escala a duração-base de qualquer animação
 * CSS em loop das camadas asset-capable que animam (Reflection, Partículas)
 * — quanto MENOR o multiplicador, mais rápida/enérgica a animação.
 *
 * Precedência final de velocidade (ver CardReflectionLayer/CardParticleLayer):
 * 1. `asset.animationSpeed` do sidecar, se existir um asset real pra aquela
 *    camada+raridade (arte vence sempre que existir).
 * 2. `ctx.debugOverride.animationSpeedMultiplier`, só setado pelo Dev Tool.
 * 3. Este preset — o padrão de produção.
 */
import type { RarityCode } from '@world-legends/types';

export type AnimationPresetId =
  | 'static'
  | 'breathing-light'
  | 'energy'
  | 'gold-rays'
  | 'rainbow-pulse'
  | 'confetti-sparkle';

export type AnimationPresetDef = {
  id: AnimationPresetId;
  label: string;
  /** Escala a duração-base das animações em loop da carta. <1 = mais rápido/enérgico, >1 = mais lento/calmo. */
  speedMultiplier: number;
  description: string;
};

export const RARITY_ANIMATION_PRESET: Record<RarityCode, AnimationPresetDef> = {
  common: {
    id: 'static',
    label: 'Quase Estático',
    speedMultiplier: 2.2,
    description:
      'Praticamente parado — reforça o contraste com raridades altas (princípio 2 do design system).',
  },
  rare: {
    id: 'breathing-light',
    label: 'Respiração Leve',
    speedMultiplier: 1.4,
    description: 'Movimento suave e lento, mal perceptível.',
  },
  elite: {
    id: 'energy',
    label: 'Energia',
    speedMultiplier: 1,
    description: 'Ritmo de referência — nem calmo nem frenético.',
  },
  legendary: {
    id: 'gold-rays',
    label: 'Gold Rays',
    speedMultiplier: 0.85,
    description: 'Feixes de reflexo dourado mais rápidos, partículas mais presentes.',
  },
  ultra: {
    id: 'rainbow-pulse',
    label: 'Rainbow Pulse',
    speedMultiplier: 0.7,
    description: 'Pulso rápido, acompanha o véu arco-íris já existente (.ultra-rainbow-overlay).',
  },
  world_cup_hero: {
    id: 'confetti-sparkle',
    label: 'Confetti Sparkle',
    speedMultiplier: 0.6,
    description:
      'O mais rápido/festivo — partículas multicoloridas (confete) em vez da cor única de raridade.',
  },
};
