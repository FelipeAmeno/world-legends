/**
 * lib/procedural-scene/SceneGenerator.ts — Sprint 27 (Procedural Scene
 * Engine)
 *
 * Orquestrador único: recebe os 4 campos do seed (playerId, country,
 * rarity, position) e devolve TODOS os ingredientes da Scene procedural
 * — Background, Light, Particles, Country Pattern e Pose (Sprint 28) —
 * já prontos pra `ProceduralSceneLayer.tsx` desenhar. Nenhum componente
 * de UI chama os geradores individuais diretamente; todos passam por
 * aqui, então o seed nunca diverge entre eles.
 *
 * Cada gerador recebe um SUB-seed derivado (`deriveChannelSeed`) do
 * seed principal, não o mesmo `Rng` compartilhado em sequência — assim
 * mudar quantos números o BackgroundGenerator consome nunca desalinha
 * o que o LightingGenerator sorteia (mesmo princípio dos streams
 * nomeados do RNG de partida, `packages/engine`).
 */
import type { Position, RarityCode } from '@world-legends/types';
import {
  type ProceduralCountryPattern,
  generateCountryPattern,
} from './CountryPatternGenerator';
import { type ProceduralBackground, generateBackground } from './BackgroundGenerator';
import { type ProceduralLighting, generateLighting } from './LightingGenerator';
import { type ProceduralParticles, generateParticles } from './ParticleGenerator';
import {
  type ProceduralSeedInput,
  computeProceduralSeed,
  createRng,
  deriveChannelSeed,
} from './seed';
import type { PoseDef } from '../pose-engine/types';
import { resolvePose } from '../pose-engine/poseResolver';

export type ProceduralScene = Readonly<{
  seed: number;
  background: ProceduralBackground;
  lighting: ProceduralLighting;
  particles: ProceduralParticles;
  countryPattern: ProceduralCountryPattern;
  pose: PoseDef;
}>;

export type GenerateSceneInput = Readonly<{
  playerId: string;
  nationality: string;
  rarityCode: RarityCode;
  position: Position;
}>;

export function generateProceduralScene(input: GenerateSceneInput): ProceduralScene {
  const seedInput: ProceduralSeedInput = {
    playerId: input.playerId,
    nationality: input.nationality,
    rarityCode: input.rarityCode,
    position: input.position,
  };
  const seed = computeProceduralSeed(seedInput);

  const backgroundRng = createRng(deriveChannelSeed(seed, 'background'));
  const lightingRng = createRng(deriveChannelSeed(seed, 'lighting'));
  const particlesRng = createRng(deriveChannelSeed(seed, 'particles'));
  const patternRng = createRng(deriveChannelSeed(seed, 'countryPattern'));
  const poseRng = createRng(deriveChannelSeed(seed, 'pose'));

  return {
    seed,
    background: generateBackground(input.nationality, input.rarityCode, backgroundRng),
    lighting: generateLighting(input.rarityCode, lightingRng),
    particles: generateParticles(input.rarityCode, particlesRng),
    countryPattern: generateCountryPattern(input.nationality, patternRng),
    pose: resolvePose(input.position, input.rarityCode, poseRng),
  };
}
