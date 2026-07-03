/**
 * Definição das formações e seus 11 slots (doc 09 §1, doc 17 §11).
 *
 * Cada formação mapeia para um array ordenado de 11 `PositionSlot`.
 * A ordem segue a leitura tática: GK → defensores → médios → atacantes.
 *
 * `slotId` é único dentro do squad. Quando há múltiplas instâncias da
 * mesma posição (ex: dois CBs), o sufixo numérico diferencia (CB-1, CB-2).
 *
 * Esta tabela é a fonte de verdade para createSquad() e addPlayer().
 */
import type { Position } from '@world-legends/types';
import type { Formation, SquadSlot } from '../types/types';

// ─── Layout de cada formação ──────────────────────────────────────────────────

/** Posições na ordem tática (GK → DEF → MID → ATK). */
const FORMATION_POSITIONS: Record<Formation, readonly Position[]> = {
  '4-3-3': ['GK', 'RB', 'CB', 'CB', 'LB', 'CM', 'CM', 'CM', 'RW', 'ST', 'LW'],
  '4-4-2': ['GK', 'RB', 'CB', 'CB', 'LB', 'RM', 'CM', 'CM', 'LM', 'ST', 'ST'],
  '4-2-3-1': ['GK', 'RB', 'CB', 'CB', 'LB', 'CDM', 'CDM', 'CAM', 'CAM', 'CAM', 'ST'],
  '3-5-2': ['GK', 'CB', 'CB', 'CB', 'RWB', 'CM', 'CDM', 'CM', 'LWB', 'ST', 'ST'],
  '5-3-2': ['GK', 'RWB', 'CB', 'CB', 'CB', 'LWB', 'CM', 'CM', 'CM', 'ST', 'ST'],
  '4-5-1': ['GK', 'RB', 'CB', 'CB', 'LB', 'RM', 'CM', 'CDM', 'CM', 'LM', 'ST'],
  '4-1-4-1': ['GK', 'RB', 'CB', 'CB', 'LB', 'CDM', 'RM', 'CM', 'CAM', 'LM', 'ST'],
  '3-4-3': ['GK', 'CB', 'CB', 'CB', 'RM', 'CM', 'CM', 'LM', 'RW', 'ST', 'LW'],
};

// ─── buildSquadSlots ──────────────────────────────────────────────────────────

/**
 * Gera os 11 SquadSlots vazios para uma formação.
 * Posições repetidas recebem sufixo numérico sequencial (CB-1, CB-2...).
 */
export function buildSquadSlots(formation: Formation): readonly SquadSlot[] {
  const positions = FORMATION_POSITIONS[formation];
  const counts: Partial<Record<Position, number>> = {};

  return positions.map((pos) => {
    const n = (counts[pos] ?? 0) + 1;
    counts[pos] = n;
    return Object.freeze({
      slotId: `${pos}-${n}`,
      requiredPosition: pos,
      userCardId: null,
    });
  });
}

/**
 * Retorna todas as posições requeridas por uma formação,
 * sem duplicatas — útil para validações de compatibilidade.
 */
export function formationPositions(formation: Formation): readonly Position[] {
  return FORMATION_POSITIONS[formation];
}

/** Verifica se uma string é uma formação válida. */
export function isValidFormation(f: string): f is Formation {
  return f in FORMATION_POSITIONS;
}
