import type { StartingSlot } from '@world-legends/engine';
/**
 * Geração de `adjacentPairs` para o engine de química (T005/T028).
 *
 * O engine de química usa `adjacentPairs` para aplicar bônus de química
 * entre jogadores "próximos" na formação (doc 09 §4). Os docs não definem
 * o mapa concreto por formação — isso foi deixado como lacuna intencional
 * (ver packages/engine/src/chemistry/types.ts, nota de escopo).
 *
 * T028 resolve isso com regras posicionais genéricas:
 *   1. GK ↔ todos os CB e LB/RB (linha defensiva imediata)
 *   2. Defensores ↔ médios defensivos da mesma lateral
 *   3. Médios ↔ entre si (todos pares de slots do setor médio)
 *   4. Médios ofensivos ↔ atacantes
 *   5. Atacantes ↔ entre si
 *
 * Esta heurística garante adjacência plausível para qualquer formação
 * suportada pelo packages/squad sem hardcodar geometria específica.
 */
import type { Position } from '@world-legends/types';

type Pair = { slotIdA: string; slotIdB: string };

// ─── Setores posicionais ──────────────────────────────────────────────────────

type Sector = 'gk' | 'def' | 'def_mid' | 'mid' | 'att_mid' | 'att';

const POSITION_SECTOR: Record<Position, Sector> = {
  GK: 'gk',
  CB: 'def',
  LB: 'def',
  RB: 'def',
  LWB: 'def',
  RWB: 'def',
  CDM: 'def_mid',
  CM: 'mid',
  LM: 'mid',
  RM: 'mid',
  CAM: 'att_mid',
  LW: 'att',
  RW: 'att',
  CF: 'att',
  ST: 'att',
};

// Setores que formam pares entre si (setores adjacentes)
const ADJACENT_SECTORS: ReadonlySet<string> = new Set([
  'gk:def',
  'def:def_mid',
  'def:mid',
  'def_mid:mid',
  'mid:att_mid',
  'mid:att',
  'att_mid:att',
]);

function sectorsAreAdjacent(a: Sector, b: Sector): boolean {
  return a === b || ADJACENT_SECTORS.has(`${a}:${b}`) || ADJACENT_SECTORS.has(`${b}:${a}`);
}

// ─── Lateralidade ─────────────────────────────────────────────────────────────

type Side = 'left' | 'center' | 'right';

const POSITION_SIDE: Partial<Record<Position, Side>> = {
  LB: 'left',
  LWB: 'left',
  LM: 'left',
  LW: 'left',
  RB: 'right',
  RWB: 'right',
  RM: 'right',
  RW: 'right',
};

function sidesAreCompatible(a: Side, b: Side): boolean {
  if (a === 'center' || b === 'center') return true;
  return a === b;
}

// ─── buildAdjacentPairs ───────────────────────────────────────────────────────

/**
 * Gera todos os pares de slots adjacentes para o engine de química.
 * Dois slots são adjacentes se:
 *   (a) Estão no mesmo setor posicional, OU
 *   (b) Estão em setores imediatamente adjacentes E na mesma lateral
 *       (ou pelo menos um é central)
 */
export function buildAdjacentPairs(starters: readonly StartingSlot[]): readonly Pair[] {
  const pairs: Pair[] = [];
  const n = starters.length;

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      // biome-ignore lint/style/noNonNullAssertion: i and j are within starters.length bounds
      const a = starters[i]!;
      // biome-ignore lint/style/noNonNullAssertion: i and j are within starters.length bounds
      const b = starters[j]!;

      const sectorA = POSITION_SECTOR[a.formationPosition];
      const sectorB = POSITION_SECTOR[b.formationPosition];
      const sideA = POSITION_SIDE[a.formationPosition] ?? 'center';
      const sideB = POSITION_SIDE[b.formationPosition] ?? 'center';

      if (!sectorA || !sectorB) continue;

      if (sectorsAreAdjacent(sectorA, sectorB) && sidesAreCompatible(sideA, sideB)) {
        pairs.push({ slotIdA: a.slotId, slotIdB: b.slotId });
      }
    }
  }

  return Object.freeze(pairs);
}
