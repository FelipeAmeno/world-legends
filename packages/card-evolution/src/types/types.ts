/**
 * Tipos do bounded context Card Evolution (T039).
 *
 * Cada carta pode ser evoluída através de níveis dentro do seu tier:
 *
 *   Common          → sem evolução (max 0)
 *   Rare            → até +1
 *   Elite           → até +2
 *   Legendary       → até +3  (ex: Pelé Legendary → Legendary+1 → +2 → +3)
 *   Ultra           → até +4
 *   World Cup Hero  → até +4
 *
 * Regras:
 *   - Não pode ultrapassar o tier da raridade.
 *   - Cada nível acrescenta OVR_BOOST_PER_LEVEL (2) ao overall.
 *   - Overall final é limitado a MAX_CARD_OVERALL (99).
 *   - O custo aumenta exponencialmente por nível.
 *   - Economia (débito de créditos/fragmentos) é responsabilidade do chamador.
 *
 * Separação de responsabilidades:
 *   Calcular custo: getCostForNextLevel()
 *   Aplicar evolução: evolveCard() — pura, não valida pagamento
 *   Pagar: caller (apps/* via @world-legends/economy)
 */
import type { ValidationError } from '@world-legends/shared';

// ─── Raridades suportadas ─────────────────────────────────────────────────────

export type EvolvableRarity =
  | 'common'
  | 'rare'
  | 'elite'
  | 'legendary'
  | 'ultra'
  | 'world_cup_hero';

// ─── Limites de evolução por raridade ────────────────────────────────────────

export const MAX_EVOLUTION_LEVEL: Readonly<Record<EvolvableRarity, number>> = {
  common: 0, // não evolui
  rare: 1, // +1
  elite: 2, // +2
  legendary: 3, // +3
  ultra: 4, // +4
  world_cup_hero: 4, // +4
};

/** OVR ganho por nível de evolução. */
export const OVR_BOOST_PER_LEVEL = 2;

/** Overall máximo de qualquer carta (nunca ultrapassa). */
export const MAX_CARD_OVERALL = 99;

// ─── EvolutionCost ────────────────────────────────────────────────────────────

export type EvolutionCost = Readonly<{
  /** Créditos necessários. */
  readonly credits: number;
  /** Fragmentos necessários. */
  readonly fragments: number;
  /** Nível de destino (ex: 0→1 = targetLevel=1). */
  readonly targetLevel: number;
}>;

// ─── CardEvolution — estado de evolução de uma carta ─────────────────────────

export type CardEvolution = Readonly<{
  readonly userCardId: string;
  /** Nome da carta (para exibição com tag). */
  readonly cardName: string;
  readonly rarityCode: EvolvableRarity;
  /** OVR original da carta (nível 0). */
  readonly baseOverall: number;
  /** Nível de evolução atual (0 = base, 1 = +1, …). */
  readonly evolutionLevel: number;
  /** Limite máximo para esta raridade. */
  readonly maxLevel: number;
  /** Overall atual = min(99, baseOverall + evolutionLevel × 2). */
  readonly currentOverall: number;
  /** true quando evolutionLevel === maxLevel. */
  readonly isMaxEvolution: boolean;
  /**
   * Tag de exibição:
   *   nível 0 → ''      (base, sem tag)
   *   nível 1 → '+1'
   *   nível 2 → '+2'
   *   nível N → '+N'
   */
  readonly tag: string;
  /** Nome completo: `cardName + (tag ? ' ' + tag : '')`. */
  readonly displayName: string;
}>;

// ─── Erros ────────────────────────────────────────────────────────────────────

export type EvolutionError =
  | Readonly<{ kind: 'AlreadyMaxEvolution'; userCardId: string; maxLevel: number }>
  | Readonly<{
      kind: 'CannotEvolve';
      userCardId: string;
      rarityCode: EvolvableRarity;
      reason: string;
    }>
  | Readonly<{ kind: 'InvalidRarity'; rarityCode: string }>
  | Readonly<{ kind: 'InvalidOverall'; overall: number }>
  | ValidationError;
