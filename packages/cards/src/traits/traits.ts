import { Err, Ok, type Result, type ValidationError, validationError } from '@world-legends/shared';
/**
 * Traits de `cards` (doc 10 §5).
 *
 * RELAÇÃO COM `engine/traits` (T006): são os MESMOS 13 traits documentados,
 * mas em dois contextos diferentes por design (doc 18 §3):
 *
 * - `engine/traits` modela a MAGNITUDE jogável — os números que entram no
 *   loop de simulação (ex: MatadorMagnitude.areaConversionBonusPercent).
 *   O teto numérico de doc 11 §7 é validado lá.
 *
 * - `cards/traits` modela a ATRIBUIÇÃO — quais traits uma carta tem,
 *   mais o nível descritivo (doc 17 §3: "magnitude/teto numérico vive
 *   deliberadamente no contexto de Balanceamento, não aqui"). Aqui
 *   guardamos só o nome e um nível ordinal (1 = base, 2 = avançado,
 *   3 = elite) para exibição e curadoria — sem duplicar os números do
 *   engine.
 *
 * Invariantes desta camada (doc 17 §5):
 * - Uma carta tem entre 1 e 3 TraitAssignments.
 * - Sem traits duplicados na mesma carta.
 * - O nível (tier) é 1, 2 ou 3.
 */
import type { TraitName } from '@world-legends/types';

export type TraitTier = 1 | 2 | 3;

/**
 * Atribuição de um trait a uma carta — o que o curador define manualmente.
 * Não carrega magnitudes numéricas (essas vivem em `engine/traits`, T006).
 */
export type TraitAssignment = Readonly<{
  readonly trait: TraitName;
  /**
   * Nível ordinal de intensidade: 1 = base, 2 = avançado, 3 = elite.
   * Usado para exibição e para que o engine escolha a magnitude correta
   * de `engine/traits` quando montar um `MatchPlayer`.
   * Raridades menores tendem a ter tier 1; Ultra/World Cup Hero chegam a tier 3.
   */
  readonly tier: TraitTier;
}>;

/**
 * Cria e valida uma lista de TraitAssignments para uma carta (doc 17 §5):
 * - 1 a 3 traits por carta
 * - Sem duplicatas de nome
 * - Tier em {1, 2, 3}
 */
export function createTraitAssignments(
  assignments: readonly { trait: TraitName; tier: number }[],
): Result<readonly TraitAssignment[], ValidationError> {
  if (assignments.length < 1) {
    return Err(validationError('Uma carta deve ter ao menos 1 trait', 'traits'));
  }
  if (assignments.length > 3) {
    return Err(
      validationError(
        `Uma carta pode ter no máximo 3 traits, recebido: ${assignments.length}`,
        'traits',
      ),
    );
  }

  const seen = new Set<TraitName>();
  const validated: TraitAssignment[] = [];

  for (const a of assignments) {
    if (seen.has(a.trait)) {
      return Err(validationError(`Trait duplicado: "${a.trait}"`, 'traits'));
    }
    if (a.tier !== 1 && a.tier !== 2 && a.tier !== 3) {
      return Err(
        validationError(
          `Tier inválido para trait "${a.trait}": ${a.tier} (deve ser 1, 2 ou 3)`,
          'traits',
        ),
      );
    }
    seen.add(a.trait);
    validated.push(Object.freeze({ trait: a.trait, tier: a.tier as TraitTier }));
  }

  return Ok(Object.freeze(validated));
}

export type { TraitName };
