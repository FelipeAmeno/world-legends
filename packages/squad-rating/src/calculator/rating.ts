import { sectorOf } from '../sectors/sectors';
import { aggregateTraitBonuses } from '../traits/trait-bonuses';
/**
 * `calculateSquadRating` — T034 Squad Overall Rating.
 *
 * Pipeline:
 *   1. Separar titulares por setor (defense / midfield / attack).
 *   2. Calcular OVR médio de cada setor.
 *   3. Agregar bônus de traits por setor.
 *   4. Aplicar multiplicador de química (0.95–1.05).
 *   5. Calcular overall ponderado (def×35% + mid×30% + att×35%).
 *   6. Arredondar e limitar a 0–99.
 *
 * Fórmula do multiplicador de química:
 *   chemMult = 0.95 + (chemistry / 100) × 0.10
 *   • chemistry=0   → ×0.950 (−5%)
 *   • chemistry=50  → ×1.000 (neutro)
 *   • chemistry=100 → ×1.050 (+5%)
 *
 * Squad vazio ou sem jogadores em um setor:
 *   O setor ausente contribui com 0 para o overall ponderado.
 *   Isso incentiva o usuário a ter jogadores em todos os setores.
 */
import type { SquadRating, SquadRatingInput, TacticalSector } from '../types/types';
import { MAX_RATING, MAX_TRAIT_BONUS_PER_SECTOR, MIN_RATING, SECTOR_WEIGHTS } from '../types/types';

// ─── Utilitários internos ─────────────────────────────────────────────────────

function avg(values: number[]): number {
  return values.length > 0 ? values.reduce((s, v) => s + v, 0) / values.length : 0;
}

function clamp(value: number): number {
  return Math.min(MAX_RATING, Math.max(MIN_RATING, Math.round(value)));
}

/** chemistry (0–100) → multiplicador (0.95–1.05). */
export function chemistryMultiplier(chemistry: number): number {
  const chem = Math.max(0, Math.min(100, chemistry));
  return 0.95 + (chem / 100) * 0.1;
}

// ─── calculateSquadRating ─────────────────────────────────────────────────────

/**
 * Calcula o SquadRating a partir dos titulares e da química.
 *
 * @param input.starters  1–11 jogadores titulares com posição, OVR e traits.
 * @param input.chemistry Score de química 0–100 (ex: de packages/squad ou /chemistry).
 */
export function calculateSquadRating(input: SquadRatingInput): SquadRating {
  const { starters, chemistry } = input;

  // ── Caso vazio ───────────────────────────────────────────────────────────────
  if (starters.length === 0) {
    return Object.freeze({
      overall: 0,
      attack: 0,
      midfield: 0,
      defense: 0,
      breakdown: Object.freeze({
        chemistryMultiplier: chemistryMultiplier(chemistry),
        totalTraitBonus: 0,
        traitBonus: Object.freeze({ attack: 0, midfield: 0, defense: 0 }),
        sectorCounts: Object.freeze({ attack: 0, midfield: 0, defense: 0 }),
        baseAverage: Object.freeze({ attack: 0, midfield: 0, defense: 0 }),
      }),
    });
  }

  // ── 1. Separar por setor ──────────────────────────────────────────────────
  const sectors: Record<TacticalSector, number[]> = {
    defense: [],
    midfield: [],
    attack: [],
  };

  for (const player of starters) {
    const sector = sectorOf(player.position);
    sectors[sector].push(Math.max(0, Math.min(99, player.overall)));
  }

  // ── 2. OVR médio por setor (base) ─────────────────────────────────────────
  const baseDefense = avg(sectors.defense);
  const baseMidfield = avg(sectors.midfield);
  const baseAttack = avg(sectors.attack);

  // ── 3. Bônus de traits ────────────────────────────────────────────────────
  const traitBonus = aggregateTraitBonuses(
    starters.map((p) => p.traits),
    MAX_TRAIT_BONUS_PER_SECTOR,
  );

  // ── 4. Multiplicador de química ────────────────────────────────────────────
  const chemMult = chemistryMultiplier(chemistry);

  // ── 5. Rating por setor = (base + traitBonus) × chemMult ─────────────────
  const ratingDefense = (baseDefense + traitBonus.defense) * chemMult;
  const ratingMidfield = (baseMidfield + traitBonus.midfield) * chemMult;
  const ratingAttack = (baseAttack + traitBonus.attack) * chemMult;

  // ── 6. Overall ponderado ──────────────────────────────────────────────────
  const rawOverall =
    ratingDefense * SECTOR_WEIGHTS.defense +
    ratingMidfield * SECTOR_WEIGHTS.midfield +
    ratingAttack * SECTOR_WEIGHTS.attack;

  return Object.freeze({
    overall: clamp(rawOverall),
    attack: clamp(ratingAttack),
    midfield: clamp(ratingMidfield),
    defense: clamp(ratingDefense),
    breakdown: Object.freeze({
      chemistryMultiplier: Math.round(chemMult * 1000) / 1000,
      totalTraitBonus: traitBonus.attack + traitBonus.midfield + traitBonus.defense,
      traitBonus: traitBonus,
      sectorCounts: Object.freeze({
        attack: sectors.attack.length,
        midfield: sectors.midfield.length,
        defense: sectors.defense.length,
      }),
      baseAverage: Object.freeze({
        attack: Math.round(baseAttack * 10) / 10,
        midfield: Math.round(baseMidfield * 10) / 10,
        defense: Math.round(baseDefense * 10) / 10,
      }),
    }),
  });
}
