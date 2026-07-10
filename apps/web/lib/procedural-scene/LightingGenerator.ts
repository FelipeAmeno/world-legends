/**
 * lib/procedural-scene/LightingGenerator.ts — Sprint 27 (Procedural
 * Scene Engine)
 *
 * Luz procedural — raios/spot atrás do jogador. Reaproveita a MESMA
 * técnica de `VolumetricLight` (Sprint 22, `components/packs/`):
 * `repeating-conic-gradient` gerando N feixes igualmente espaçados —
 * comprovadamente performática (100% CSS, sem canvas) e já usada em
 * produção; a Scene procedural só parametriza cor/intensidade/contagem
 * por raridade e o ângulo/velocidade por seed.
 */
import type { RarityCode } from '@world-legends/types';
import { RARITY_ACCENT } from '@/components/cards/card-tokens';
import { type Rng, rngInt, rngRange } from './seed';

export type ProceduralLighting = Readonly<{
  color: string;
  rayCount: number;
  opacity: number;
  rotationStartDeg: number;
  spinDurationS: number;
}>;

const RARITY_RAY_COUNT: Record<RarityCode, number> = {
  common: 6,
  rare: 7,
  elite: 8,
  legendary: 9,
  ultra: 10,
  world_cup_hero: 12,
};

const RARITY_OPACITY: Record<RarityCode, number> = {
  common: 0.06,
  rare: 0.09,
  elite: 0.12,
  legendary: 0.16,
  ultra: 0.2,
  world_cup_hero: 0.26,
};

export function generateLighting(rarityCode: RarityCode, rng: Rng): ProceduralLighting {
  return {
    color: RARITY_ACCENT[rarityCode],
    rayCount: RARITY_RAY_COUNT[rarityCode],
    opacity: RARITY_OPACITY[rarityCode],
    rotationStartDeg: rngInt(rng, 0, 359),
    spinDurationS: rngRange(rng, 16, 26),
  };
}
