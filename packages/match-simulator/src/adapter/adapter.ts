/**
 * Adaptador Squad → TeamSnapshot (T028).
 *
 * Converte um `Squad` do packages/squad no `TeamSnapshot` que o
 * packages/engine espera para `simulateMatch`.
 *
 * Pipeline:
 *   1. Resolve PlayerMatchData para cada slot preenchido via porta injetada.
 *   2. Sintetiza AttributeSet a partir de (position, overall).
 *   3. Constrói StartingSlot[] e MatchPlayer[] de banco.
 *   4. Gera adjacentPairs via buildAdjacentPairs.
 *   5. Mapeia química (0–100) → TacticalIntensity.
 *
 * Slots vazios (userCardId === null) são silenciosamente ignorados —
 * validateSquad deve ser chamado antes para garantir 11 titulares.
 */
import type { MatchPlayer, StartingSlot, TeamSnapshot } from '@world-legends/engine';
import type { TacticalIntensity } from '@world-legends/engine';
import type { Squad } from '@world-legends/squad';
import { buildAdjacentPairs } from '../adjacency/adjacency';
import { makeAttributesFromOverall } from '../attributes/attributes';
import type { PlayerMatchResolver } from '../types/types';

// ─── Química → tática ─────────────────────────────────────────────────────────

/**
 * Mapeia score de química (0–100 do packages/squad) para TacticalIntensity.
 *
 * Lógica: time com alta química pode jogar mais intensamente sem perder
 * rendimento físico — doc 09 §14 + doc 11 §4.2.
 *
 *   ≥ 75 → 'ofensivo'       (química excelente: risco calculado)
 *   ≥ 60 → 'equilibrado'    (química boa: balanço)
 *   ≥ 45 → 'defensivo'      (química razoável: cautela)
 *   < 45 → 'ultra_defensivo' (química ruim: conservar)
 */
export function chemistryToTacticalIntensity(chemistry: number): TacticalIntensity {
  if (chemistry >= 75) return 'ofensivo';
  if (chemistry >= 60) return 'equilibrado';
  if (chemistry >= 45) return 'defensivo';
  return 'ultra_defensivo';
}

// ─── squadToTeamSnapshot ──────────────────────────────────────────────────────

export function squadToTeamSnapshot(
  squad: Squad,
  chemistry: number,
  isHomeTeam: boolean,
  resolvePlayer: PlayerMatchResolver,
): TeamSnapshot {
  const starters: StartingSlot[] = [];
  const bench: MatchPlayer[] = [];

  // ── Titulares ──────────────────────────────────────────────────────────────
  for (const slot of squad.starters) {
    if (!slot.userCardId) continue;

    const data = resolvePlayer(slot.userCardId);
    if (!data) continue; // slot inválido: ignorar

    const player: MatchPlayer = {
      userCardId: data.userCardId,
      primaryPosition: data.naturalPosition,
      attributes: makeAttributesFromOverall(data.naturalPosition, data.overall),
      traits: data.traits,
    };

    starters.push({
      slotId: slot.slotId,
      formationPosition: slot.requiredPosition,
      player,
    });
  }

  // ── Banco ──────────────────────────────────────────────────────────────────
  for (const ucId of squad.bench) {
    const data = resolvePlayer(ucId);
    if (!data) continue;

    bench.push({
      userCardId: data.userCardId,
      primaryPosition: data.naturalPosition,
      attributes: makeAttributesFromOverall(data.naturalPosition, data.overall),
      traits: data.traits,
    });
  }

  // ── Adjacência ─────────────────────────────────────────────────────────────
  const adjacentPairs = buildAdjacentPairs(starters);

  return {
    starters,
    bench,
    adjacentPairs,
    tacticalIntensity: chemistryToTacticalIntensity(chemistry),
    isHomeTeam,
  };
}
