/**
 * Cálculo de probabilidade de lesão por partida (T036).
 *
 * Fórmula:
 *   prob = BASE (3%)
 *        + staminaModifier(stamina)
 *        + physicalModifier(physical)
 *        + eraModifier(era)
 *   prob = clamp(prob, MIN 1%, MAX 15%)
 *
 * Modificadores:
 *
 *   Stamina (resistência aeróbica):
 *     ≥ 90  → −1.5%  (muito resistente)
 *     ≥ 70  → −0.5%  (resistente)
 *     ≥ 50  → +0.5%  (mediano)
 *     < 50  → +1.5%  (frágil)
 *
 *   Physical (força física):
 *     ≥ 80  → −1.0%  (forte)
 *     ≥ 60  →  0.0%  (mediano)
 *     < 60  → +1.0%  (fraco fisicamente)
 *
 *   Era histórica (qualidade dos cuidados médicos):
 *     2010s / 2020s → −0.5%  (medicina moderna)
 *     1990s / 2000s →  0.0%  (referência)
 *     1970s / 1980s → +0.5%  (medicina limitada)
 *     1950s / 1960s → +1.0%  (era precária)
 */
import type { InjuryProfile } from '../types/types';
import {
  BASE_INJURY_PROBABILITY,
  MAX_INJURY_PROBABILITY,
  MIN_INJURY_PROBABILITY,
} from '../types/types';

// ─── Modificadores individuais ────────────────────────────────────────────────

export function staminaModifier(stamina: number): number {
  if (stamina >= 90) return -0.015;
  if (stamina >= 70) return -0.005;
  if (stamina >= 50) return +0.005;
  return +0.015;
}

export function physicalModifier(physical: number): number {
  if (physical >= 80) return -0.01;
  if (physical >= 60) return 0.0;
  return +0.01;
}

export function eraModifier(era: string): number {
  switch (era) {
    case '2020s':
    case '2010s':
      return -0.005;
    case '2000s':
    case '1990s':
      return 0.0;
    case '1980s':
    case '1970s':
      return +0.005;
    case '1960s':
    case '1950s':
      return +0.01;
    default:
      return 0.0;
  }
}

// ─── calculateInjuryProbability ───────────────────────────────────────────────

/**
 * Retorna a probabilidade de lesão por partida para um jogador (0.01–0.15).
 */
export function calculateInjuryProbability(profile: InjuryProfile): number {
  const raw =
    BASE_INJURY_PROBABILITY +
    staminaModifier(profile.stamina) +
    physicalModifier(profile.physical) +
    eraModifier(profile.era);

  return Number.parseFloat(
    Math.max(MIN_INJURY_PROBABILITY, Math.min(MAX_INJURY_PROBABILITY, raw)).toFixed(4),
  );
}

// ─── InjuryRiskLevel (qualitativo) ────────────────────────────────────────────

export type InjuryRiskLevel = 'low' | 'medium' | 'high' | 'very_high';

export function injuryRiskLevel(probability: number): InjuryRiskLevel {
  if (probability >= 0.08) return 'very_high';
  if (probability >= 0.05) return 'high';
  if (probability >= 0.03) return 'medium';
  return 'low';
}
