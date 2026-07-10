/**
 * lib/pose-engine/poseResolver.ts — Sprint 28 (Pose System)
 *
 * Resolve UMA pose determinística por carta: filtra o catálogo pela
 * categoria certa (a partir da posição real do jogador) e pela raridade
 * mínima exigida, depois escolhe entre os candidatos usando o mesmo
 * seed procedural da Scene (Sprint 27) — nenhuma aleatoriedade real,
 * mesma carta sempre resolve a mesma pose.
 */
import type { Position, RarityCode } from '@world-legends/types';
import { ALL_POSES } from './poseCatalog';
import type { Rng } from '../procedural-scene/seed';
import { rngChoice } from '../procedural-scene/seed';
import type { PoseCategory, PoseDef } from './types';

const RARITY_RANK: Record<RarityCode, number> = {
  common: 0,
  rare: 1,
  elite: 2,
  legendary: 3,
  ultra: 4,
  world_cup_hero: 4,
};

/**
 * Mapeamento posição → categoria de pose. Times de campo cobrem os 4
 * grupos do brief; posições híbridas (ex: CDM, CAM) caem no grupo mais
 * próximo pelo papel tático real (CDM protege a defesa → defender;
 * CAM cria jogadas → midfielder).
 */
const POSITION_TO_CATEGORY: Record<Position, PoseCategory> = {
  GK: 'goalkeeper',
  CB: 'defender',
  LB: 'defender',
  RB: 'defender',
  LWB: 'defender',
  RWB: 'defender',
  CDM: 'defender',
  CM: 'midfielder',
  CAM: 'midfielder',
  LM: 'midfielder',
  RM: 'midfielder',
  LW: 'attacker',
  RW: 'attacker',
  CF: 'attacker',
  ST: 'attacker',
};

export function positionToPoseCategory(position: Position): PoseCategory {
  return POSITION_TO_CATEGORY[position] ?? 'midfielder';
}

/** Poses candidatas pra uma posição+raridade — sempre ao menos 1 (as poses base não têm `minRarityRank`). */
export function candidatePoses(position: Position, rarityCode: RarityCode): readonly PoseDef[] {
  const category = positionToPoseCategory(position);
  const rank = RARITY_RANK[rarityCode];
  const inCategory = ALL_POSES.filter((p) => p.category === category);
  const eligible = inCategory.filter((p) => (p.minRarityRank ?? 0) <= rank);
  return eligible.length > 0 ? eligible : inCategory;
}

/** Resolve a pose determinística final, usando um Rng já derivado do seed procedural da carta. */
export function resolvePose(position: Position, rarityCode: RarityCode, rng: Rng): PoseDef {
  const candidates = candidatePoses(position, rarityCode);
  return rngChoice(rng, candidates);
}
