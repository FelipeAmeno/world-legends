/**
 * Mapeamento de posição tática → setor (defesa / meio / ataque).
 *
 * Critério (doc T034):
 *   Defesa  → GK, CB, LB, RB, LWB, RWB
 *   Meio    → CDM, CM, CAM, LM, RM
 *   Ataque  → LW, RW, CF, ST
 *
 * CDM está em MEIO porque o package usa o nome da posição, não
 * a função tática. Quem define a tática é o usuário ao escolher
 * a formação — o rating reflete onde os jogadores são escalados.
 */
import type { Position } from '@world-legends/types';
import type { TacticalSector } from '../types/types';

// ─── Mapa de posição → setor ──────────────────────────────────────────────────

const POSITION_SECTOR: Readonly<Record<Position, TacticalSector>> = {
  GK: 'defense',
  CB: 'defense',
  LB: 'defense',
  RB: 'defense',
  LWB: 'defense',
  RWB: 'defense',
  CDM: 'midfield',
  CM: 'midfield',
  CAM: 'midfield',
  LM: 'midfield',
  RM: 'midfield',
  LW: 'attack',
  RW: 'attack',
  CF: 'attack',
  ST: 'attack',
};

/**
 * Retorna o setor tático de uma posição.
 * Retorna 'midfield' como fallback para posições desconhecidas.
 */
export function sectorOf(position: Position | string): TacticalSector {
  return (POSITION_SECTOR as Record<string, TacticalSector>)[position] ?? 'midfield';
}

/** true se a posição é do setor de defesa. */
export function isDefense(position: Position | string): boolean {
  return sectorOf(position) === 'defense';
}

/** true se a posição é do setor de meio-campo. */
export function isMidfield(position: Position | string): boolean {
  return sectorOf(position) === 'midfield';
}

/** true se a posição é do setor de ataque. */
export function isAttack(position: Position | string): boolean {
  return sectorOf(position) === 'attack';
}
