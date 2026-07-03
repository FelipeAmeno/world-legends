/**
 * Impacto diferenciado da fadiga por categoria de atributo (T037).
 *
 * Nem todos os atributos degradam igualmente com a fadiga:
 *   - Atributos físicos sofrem impacto total (fator 1.0)
 *   - Atributos técnicos sofrem 70% do impacto (fator 0.7)
 *   - Atributos mentais sofrem apenas 30% do impacto (fator 0.3)
 *   - Atributos de goleiro sofrem 60% do impacto (fator 0.6)
 *
 * Fórmula por atributo:
 *   reduction   = (1 - performanceMultiplier)
 *   effectiveMult = 1 - reduction × impactFactor
 *   newValue    = max(1, round(baseValue × effectiveMult))
 *
 * Exemplo — performanceMult = 0.85 (reduction = 0.15):
 *   pace (physical)  → 1 - 0.15 × 1.0 = 0.850  → -15%
 *   passing (tech)   → 1 - 0.15 × 0.7 = 0.895  → -10.5%
 *   composure (ment) → 1 - 0.15 × 0.3 = 0.955  → -4.5%
 */

// ─── Categorias e fatores de impacto ─────────────────────────────────────────

export type AttributeCategory = 'physical' | 'technical' | 'mental' | 'gk';

/** Fator de impacto (0–1) por categoria. */
export const CATEGORY_IMPACT: Readonly<Record<AttributeCategory, number>> = {
  physical: 1.0,
  gk: 0.8, // GK precisa de reflexos afiados — mais sensível que técnico
  technical: 0.7,
  mental: 0.3,
};

/** Mapeamento de nome de atributo → categoria. */
export const ATTRIBUTE_CATEGORY: Readonly<Record<string, AttributeCategory>> = {
  // Físicos
  pace: 'physical',
  stamina: 'physical',
  physical: 'physical',
  heading: 'physical',
  shot_power: 'physical',
  aggression: 'physical',
  // Técnicos
  finishing: 'technical',
  dribbling: 'technical',
  passing: 'technical',
  defending: 'technical',
  penalty_kicks: 'technical',
  // Mentais
  vision: 'mental',
  composure: 'mental',
  leadership: 'mental',
  // Goleiro
  gk_reflexes: 'gk',
  gk_positioning: 'gk',
  gk_handling: 'gk',
  gk_kicking: 'gk',
  gk_penalty_save: 'gk',
};

// ─── impactFactorFor ──────────────────────────────────────────────────────────

/** Retorna o fator de impacto para um atributo (padrão: 'technical' = 0.7). */
export function impactFactorFor(attribute: string): number {
  const cat = ATTRIBUTE_CATEGORY[attribute] ?? 'technical';
  return CATEGORY_IMPACT[cat];
}

// ─── effectiveMultiplier ──────────────────────────────────────────────────────

/**
 * Calcula o multiplicador efetivo para um atributo específico.
 *
 * @param performanceMult  Multiplicador global (0.85–1.00)
 * @param attribute        Nome do atributo
 */
export function effectiveMultiplier(performanceMult: number, attribute: string): number {
  const reduction = 1 - performanceMult;
  const impactFactor = impactFactorFor(attribute);
  return 1 - reduction * impactFactor;
}
