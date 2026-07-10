import { RARITY_ACCENT } from '@/components/cards/card-tokens';
/**
 * lib/procedural-scene/ParticleGenerator.ts — Sprint 27 (Procedural
 * Scene Engine)
 *
 * Campo de partículas determinístico — posições/tamanhos/atrasos vêm
 * todos do mesmo seed procedural, nunca de `Math.random()` (mesma
 * disciplina de `CardParticles.tsx`/`SmokeLayer.tsx` já usada em outras
 * partes do produto). A contagem e a cor escalam com raridade — cartas
 * mais raras "brilham mais forte".
 */
import type { RarityCode } from '@world-legends/types';
import { type Rng, rngRange } from './seed';

export type ProceduralParticle = Readonly<{
  id: number;
  xPercent: number;
  yPercent: number;
  size: number;
  delay: number;
  duration: number;
}>;

export type ProceduralParticles = Readonly<{
  color: string;
  particles: readonly ProceduralParticle[];
}>;

// Sprint 33: piso levantado pra Common/Rare (mesma razão do
// BackgroundGenerator/LightingGenerator).
const RARITY_PARTICLE_COUNT: Record<RarityCode, number> = {
  common: 7,
  rare: 9,
  elite: 10,
  legendary: 12,
  ultra: 14,
  world_cup_hero: 16,
};

export function generateParticles(rarityCode: RarityCode, rng: Rng): ProceduralParticles {
  const count = RARITY_PARTICLE_COUNT[rarityCode];
  const particles: ProceduralParticle[] = Array.from({ length: count }, (_, i) => ({
    id: i,
    xPercent: rngRange(rng, 8, 92),
    yPercent: rngRange(rng, 10, 90),
    size: rngRange(rng, 2, 5),
    delay: rngRange(rng, 0, 4),
    duration: rngRange(rng, 3, 6),
  }));

  return { color: RARITY_ACCENT[rarityCode], particles };
}
