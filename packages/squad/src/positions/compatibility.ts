/**
 * Compatibilidade de posições (doc 09 §1, doc 11 §4.2).
 *
 * Define se um jogador pode atuar em determinado slot de formação e com
 * qual penalidade de química. Dois níveis:
 *
 *   PRIMARY   → posição natural ou equivalente direta (sem penalidade)
 *   SECONDARY → posição adjacente/relacionada (penalidade de química)
 *
 * Regra fundamental: nenhum jogador de campo joga como GK e nenhum GK
 * joga como jogador de campo — exceção não existe nesta engine.
 */
import type { Position } from '@world-legends/types';

// ─── Enum de compatibilidade ──────────────────────────────────────────────────

export const PositionFit = {
  /** Posição natural — fit máximo. */
  NATURAL: 'natural',
  /** Posição relacionada — jogável com penalidade. */
  COMPATIBLE: 'compatible',
  /** Fora de posição — não permitido. */
  INCOMPATIBLE: 'incompatible',
} as const;

export type PositionFit = (typeof PositionFit)[keyof typeof PositionFit];

// ─── Matriz de compatibilidade ────────────────────────────────────────────────

/**
 * Mapa: posição do jogador → [posições naturais, posições compatíveis].
 *
 * Leitura: um ST pode jogar como CF (natural) ou LW/RW (compatível),
 * mas não como GK (incompatível).
 */
type CompatibilityEntry = {
  readonly natural: readonly Position[];
  readonly compatible: readonly Position[];
};

const COMPATIBILITY_MAP: Record<Position, CompatibilityEntry> = {
  GK: { natural: ['GK'], compatible: [] },
  CB: { natural: ['CB'], compatible: ['CDM'] },
  LB: { natural: ['LB'], compatible: ['LWB', 'LM'] },
  RB: { natural: ['RB'], compatible: ['RWB', 'RM'] },
  LWB: { natural: ['LWB', 'LB'], compatible: ['LM', 'RM'] },
  RWB: { natural: ['RWB', 'RB'], compatible: ['RM', 'LM'] },
  CDM: { natural: ['CDM'], compatible: ['CM', 'CB'] },
  CM: { natural: ['CM'], compatible: ['CDM', 'CAM', 'LM', 'RM'] },
  CAM: { natural: ['CAM'], compatible: ['CM', 'CF', 'LW', 'RW'] },
  LM: { natural: ['LM'], compatible: ['LW', 'CM', 'LB'] },
  RM: { natural: ['RM'], compatible: ['RW', 'CM', 'RB'] },
  LW: { natural: ['LW', 'LM'], compatible: ['CAM', 'ST', 'CF'] },
  RW: { natural: ['RW', 'RM'], compatible: ['CAM', 'ST', 'CF'] },
  CF: { natural: ['CF', 'ST'], compatible: ['CAM', 'LW', 'RW'] },
  ST: { natural: ['ST', 'CF'], compatible: ['LW', 'RW'] },
};

// ─── checkPositionFit ─────────────────────────────────────────────────────────

/**
 * Verifica se um jogador com `playerPosition` pode atuar no `slotPosition`.
 * Retorna o nível de compatibilidade.
 */
export function checkPositionFit(playerPosition: Position, slotPosition: Position): PositionFit {
  const entry = COMPATIBILITY_MAP[playerPosition];

  if (entry.natural.includes(slotPosition)) return PositionFit.NATURAL;
  if (entry.compatible.includes(slotPosition)) return PositionFit.COMPATIBLE;
  return PositionFit.INCOMPATIBLE;
}

/**
 * Retorna true se o jogador pode (natural ou compatível) atuar no slot.
 * Usado pela validação de addPlayer — apenas nega incompatíveis.
 */
export function canPlayInSlot(playerPosition: Position, slotPosition: Position): boolean {
  return checkPositionFit(playerPosition, slotPosition) !== PositionFit.INCOMPATIBLE;
}

/**
 * Pontuação de fit de posição para cálculo de química (0–4).
 *   NATURAL     → 4
 *   COMPATIBLE  → 2
 *   INCOMPATIBLE→ 0 (não deveria acontecer em squad válido)
 */
export function positionFitScore(playerPosition: Position, slotPosition: Position): number {
  switch (checkPositionFit(playerPosition, slotPosition)) {
    case PositionFit.NATURAL:
      return 4;
    case PositionFit.COMPATIBLE:
      return 2;
    case PositionFit.INCOMPATIBLE:
      return 0;
  }
}
