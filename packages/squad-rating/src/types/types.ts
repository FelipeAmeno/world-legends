/**
 * Tipos do bounded context Squad Rating (T034).
 *
 * Calcula o OVR oficial de um squad considerando:
 *   - Overall individual dos 11 titulares
 *   - Química total (0–100) como multiplicador
 *   - Bônus de traits por setor (ataque / meio / defesa)
 *
 * Retorna: overall, attack, midfield, defense (todos 0–99).
 * Nenhum package existente é modificado.
 */
import type { Position } from '@world-legends/types';

// ─── Setores táticos ──────────────────────────────────────────────────────────

export type TacticalSector = 'defense' | 'midfield' | 'attack';

// ─── Jogador para cálculo de rating ──────────────────────────────────────────

/**
 * Dados mínimos de um titular para o cálculo de rating.
 * Injetado pelo chamador (apps/* ou packages de coordenação).
 */
export type RatedPlayer = Readonly<{
  readonly userCardId: string;
  /** Posição tática (GK, CB, CM, ST…). */
  readonly position: Position;
  /** Overall 40–99. */
  readonly overall: number;
  /** IDs dos traits ativos (pode ser []) */
  readonly traits: readonly string[];
}>;

// ─── Input do calculador ──────────────────────────────────────────────────────

export type SquadRatingInput = Readonly<{
  /** Exatamente os titulares (1–11 jogadores). */
  readonly starters: readonly RatedPlayer[];
  /** Score de química total do squad (0–100). */
  readonly chemistry: number;
}>;

// ─── SquadRating — resultado ─────────────────────────────────────────────────

export type SquadRating = Readonly<{
  /** OVR geral ponderado (def×35% + mid×30% + att×35%), 0–99. */
  readonly overall: number;
  /** OVR de ataque (0–99). */
  readonly attack: number;
  /** OVR de meio-campo (0–99). */
  readonly midfield: number;
  /** OVR de defesa (0–99). */
  readonly defense: number;
  readonly breakdown: Readonly<{
    /** Multiplicador da química (0.95–1.05). */
    readonly chemistryMultiplier: number;
    /** Soma total de bônus de traits aplicados. */
    readonly totalTraitBonus: number;
    /** Bônus de trait por setor. */
    readonly traitBonus: Readonly<{
      readonly attack: number;
      readonly midfield: number;
      readonly defense: number;
    }>;
    /** Quantos titulares foram mapeados para cada setor. */
    readonly sectorCounts: Readonly<{
      readonly attack: number;
      readonly midfield: number;
      readonly defense: number;
    }>;
    /** OVR médio por setor, antes de aplicar traits e química. */
    readonly baseAverage: Readonly<{
      readonly attack: number;
      readonly midfield: number;
      readonly defense: number;
    }>;
  }>;
}>;

// ─── Constantes ───────────────────────────────────────────────────────────────

/** OVR máximo retornável (nunca passa de 99). */
export const MAX_RATING = 99;
/** OVR mínimo retornável. */
export const MIN_RATING = 0;
/** Bônus máximo de traits POR SETOR (cap para evitar valores absurdos). */
export const MAX_TRAIT_BONUS_PER_SECTOR = 10;
/** Peso de cada setor no cálculo do overall (deve somar 1.0). */
export const SECTOR_WEIGHTS: Record<TacticalSector, number> = {
  defense: 0.35,
  midfield: 0.3,
  attack: 0.35,
};
