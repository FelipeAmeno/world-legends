/**
 * Bônus de traits por setor tático (T034).
 *
 * Cada trait fornece um bônus fixo de OVR a um ou mais setores do squad.
 * Os bônus se acumulam: se 3 jogadores têm `pace_monster`, o bônus é ×3.
 * O total por setor é limitado a MAX_TRAIT_BONUS_PER_SECTOR (10 pontos).
 *
 * Filosofia:
 *   - Traits ofensivos (clinical_finisher, dribble_master) → bônus em attack
 *   - Traits de meio (playmaker, stamina_boost) → bônus em midfield
 *   - Traits defensivos (sweeper, aerial_threat, reflexes) → bônus em defense
 *   - Traits físicos (pace_monster, physical_beast) → multi-setor
 *
 * Traits não listados → sem bônus (ignorados silenciosamente).
 */
import type { MAX_TRAIT_BONUS_PER_SECTOR } from '../types/types';

// ─── TraitSectorBonus ─────────────────────────────────────────────────────────

export type TraitSectorBonus = Readonly<{
  readonly attack?: number;
  readonly midfield?: number;
  readonly defense?: number;
}>;

// ─── Tabela de bônus por trait ────────────────────────────────────────────────

/**
 * Fonte de verdade: bônus de cada trait por setor.
 * Valores inteiros. Ausência de chave = 0 para aquele setor.
 */
export const TRAIT_BONUS_TABLE: Readonly<Record<string, TraitSectorBonus>> = {
  // ── Ataque ──────────────────────────────────────────────────────────────────
  clinical_finisher: { attack: 3 },
  rocket_shot: { attack: 2 },
  dribble_master: { attack: 2 },
  clutch_performer: { attack: 2 },
  set_piece_specialist: { attack: 1 },
  poacher: { attack: 3 },
  acrobatic: { attack: 1 },

  // ── Meio-campo ──────────────────────────────────────────────────────────────
  playmaker: { midfield: 3 },
  vision: { midfield: 2 },
  long_passer: { midfield: 2 },
  engine: { midfield: 2 },
  box_to_box: { midfield: 1, attack: 1 },

  // ── Defesa ──────────────────────────────────────────────────────────────────
  sweeper: { defense: 3 },
  aerial_threat: { defense: 2 },
  physical_beast: { defense: 2 },
  reflexes: { defense: 3 }, // GK trait
  penalty_stopper: { defense: 2 }, // GK trait
  aggressive_tackler: { defense: 2 },
  brick_wall: { defense: 3 },

  // ── Multi-setor ─────────────────────────────────────────────────────────────
  pace_monster: { attack: 1, midfield: 1 },
  stamina_boost: { midfield: 1, defense: 1 },
  leadership: { midfield: 1, defense: 1 },
  versatile: { attack: 1, midfield: 1, defense: 1 },
};

// ─── aggregateTraitBonuses ────────────────────────────────────────────────────

export type AggregatedTraitBonus = Readonly<{
  readonly attack: number;
  readonly midfield: number;
  readonly defense: number;
}>;

/**
 * Agrega os bônus de todos os traits de todos os jogadores.
 * Acumula por setor; aplica o cap MAX_TRAIT_BONUS_PER_SECTOR.
 *
 * @param allTraits  Lista de arrays de traits (um por jogador).
 * @param maxPerSector  Cap máximo por setor (default: 10).
 */
export function aggregateTraitBonuses(
  allTraits: readonly (readonly string[])[],
  maxPerSector = 10,
): AggregatedTraitBonus {
  let attack = 0;
  let midfield = 0;
  let defense = 0;

  for (const playerTraits of allTraits) {
    for (const traitId of playerTraits) {
      const bonus = TRAIT_BONUS_TABLE[traitId];
      if (!bonus) continue;
      attack += bonus.attack ?? 0;
      midfield += bonus.midfield ?? 0;
      defense += bonus.defense ?? 0;
    }
  }

  return Object.freeze({
    attack: Math.min(maxPerSector, attack),
    midfield: Math.min(maxPerSector, midfield),
    defense: Math.min(maxPerSector, defense),
  });
}

/** Retorna o bônus de um único trait (ou zeros se não reconhecido). */
export function getBonusForTrait(traitId: string): TraitSectorBonus {
  return TRAIT_BONUS_TABLE[traitId] ?? Object.freeze({});
}
