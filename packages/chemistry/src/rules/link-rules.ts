/**
 * Regras de cálculo de um ChemistryLink entre dois jogadores.
 *
 * Cada regra é pura e independente:
 *   nationalityBonus(a, b) → 0 | 2
 *   competitionBonus(a, b) → 0 | 1
 *   eraBonus(a, b)         → 0 | 1
 *   buildLink(a, b)        → ChemistryLink
 *
 * Comparações são case-insensitive para robustez (ex: 'BR' === 'br').
 */
import type { ChemistryLink, PlayerChemistryInput } from '../types/types';
import { COMPETITION_BONUS, ERA_BONUS, MAX_LINK_BONUS, NATIONALITY_BONUS } from '../types/types';

// ─── Comparações ──────────────────────────────────────────────────────────────

function same(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

// ─── Regras individuais ───────────────────────────────────────────────────────

/**
 * Retorna +2 se os dois jogadores têm a mesma nacionalidade, 0 caso contrário.
 */
export function nationalityBonus(a: PlayerChemistryInput, b: PlayerChemistryInput): 0 | 2 {
  return same(a.nationality, b.nationality) ? NATIONALITY_BONUS : 0;
}

/**
 * Retorna +1 se os dois jogadores vieram da mesma competição, 0 caso contrário.
 */
export function competitionBonus(a: PlayerChemistryInput, b: PlayerChemistryInput): 0 | 1 {
  return same(a.competition, b.competition) ? COMPETITION_BONUS : 0;
}

/**
 * Retorna +1 se os dois jogadores são da mesma era histórica, 0 caso contrário.
 */
export function eraBonus(a: PlayerChemistryInput, b: PlayerChemistryInput): 0 | 1 {
  return same(a.era, b.era) ? ERA_BONUS : 0;
}

// ─── buildLink ────────────────────────────────────────────────────────────────

/**
 * Constrói o ChemistryLink completo entre dois jogadores.
 * Ordem dos jogadores não importa (o link é simétrico).
 */
export function buildLink(a: PlayerChemistryInput, b: PlayerChemistryInput): ChemistryLink {
  const natBonus = nationalityBonus(a, b);
  const compBonus = competitionBonus(a, b);
  const eraBns = eraBonus(a, b);
  const total = natBonus + compBonus + eraBns;

  return Object.freeze({
    playerAId: a.userCardId,
    playerBId: b.userCardId,
    nationalityBonus: natBonus,
    competitionBonus: compBonus,
    eraBonus: eraBns,
    total,
    isPerfect: total === MAX_LINK_BONUS,
    shared: Object.freeze({
      nationality: natBonus > 0,
      competition: compBonus > 0,
      era: eraBns > 0,
    }),
  });
}
