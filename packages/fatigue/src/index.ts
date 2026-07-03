/**
 * @world-legends/fatigue — T037 Fatigue System.
 *
 * API pública:
 *   createFreshState(id)          Cria estado fresco (0 consecutivas).
 *   getPerformanceRatio(state)    Multiplicador atual (0.85–1.00).
 *   fatigueLevel(consecutive)     'fresh'|'light'|'moderate'|'heavy'.
 *   afterMatch(state)             Registra participação em partida.
 *   afterRest(state, matches?)    Descanso (reduz consecutiveMatches).
 *   resetFatigue(state)           Reset total → fresh.
 *   applyFatigue(attrs, state)    Aplica fadiga nos atributos.
 *   applyFatigueToSquad(players)  Aplica a múltiplos jogadores.
 *   effectiveMultiplier(mult,attr) Multiplicador efetivo por atributo.
 *   impactFactorFor(attr)         Fator de impacto (physical=1.0, etc.).
 */

// ── Calculador ─────────────────────────────────────────────────────────────────
export {
  createFreshState,
  getPerformanceRatio,
  fatigueLevel,
  afterMatch,
  afterRest,
  resetFatigue,
  applyFatigue,
  applyFatigueToSquad,
} from './calculator/fatigue-calculator';
export type { SquadFatigueInput, SquadFatigueResult } from './calculator/fatigue-calculator';

// ── Atributos ─────────────────────────────────────────────────────────────────
export {
  effectiveMultiplier,
  impactFactorFor,
  CATEGORY_IMPACT,
  ATTRIBUTE_CATEGORY,
} from './attributes/attribute-impact';
export type { AttributeCategory } from './attributes/attribute-impact';

// ── Tipos ─────────────────────────────────────────────────────────────────────
export type {
  FatigueState,
  FatigueLevel,
  PlayerAttributes,
  FatiguedAttributes,
} from './types/types';
export {
  PERFORMANCE_STEPS,
  MIN_PERFORMANCE,
  MAX_PERFORMANCE,
  MAX_CONSECUTIVE_MATCHES,
} from './types/types';
