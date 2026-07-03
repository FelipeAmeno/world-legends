/**
 * @world-legends/injuries — T036 Injury System.
 *
 * API pública:
 *   calculateInjuryProbability(profile)          → number (0.01–0.15)
 *   injuryRiskLevel(probability)                 → 'low'|'medium'|'high'|'very_high'
 *   rollForInjury(profile, seed, minute?)        → Injury | null
 *   generateMatchInjuries(players, seed)         → InjuryEvent[]
 *   progressRecovery(injury)                     → Injury
 *   progressRecoveryN(injury, matches)           → Injury
 *   isFullyRecovered(injury)                     → boolean
 *   matchesUntilReturn(injury)                   → number
 *   staminaModifier / physicalModifier / eraModifier → number (para testes)
 */

// ── Tipos ─────────────────────────────────────────────────────────────────────
export type {
  InjuryType,
  Injury,
  InjuryEvent,
  InjuryProfile,
} from './types/types';
export type { InjuryRiskLevel, InjuryRiskLevel as RiskLevel } from './probability/probability';
export {
  INJURY_TYPE_WEIGHTS,
  MATCHES_OUT_RANGE,
  BASE_INJURY_PROBABILITY,
  MIN_INJURY_PROBABILITY,
  MAX_INJURY_PROBABILITY,
} from './types/types';

// ── Probabilidade ─────────────────────────────────────────────────────────────
export {
  calculateInjuryProbability,
  staminaModifier,
  physicalModifier,
  eraModifier,
  injuryRiskLevel,
} from './probability/probability';

// ── Gerador ───────────────────────────────────────────────────────────────────
export { rollForInjury, generateMatchInjuries } from './generator/generator';

// ── Recuperação ───────────────────────────────────────────────────────────────
export {
  progressRecovery,
  progressRecoveryN,
  isFullyRecovered,
  matchesUntilReturn,
} from './recovery/recovery';
