/**
 * Tipos do agregado `Card` (doc 17 §5, doc 10 §2/§6/§9/§10/§11).
 *
 * Uma carta é uma versão jogável e colecionável de um jogador,
 * possivelmente ancorada a um momento específico de sua carreira.
 *
 * VALUE OBJECTS internos:
 * - TournamentContext: contexto de Copa/torneio ao qual a carta está
 *   ancorada (obrigatório para World Cup Hero e cartas Event; opcional
 *   para Legendary/Ultra; ausente para Common/Rare/Elite).
 * - FinalAttributeSet: os atributos finais calculados e congelados.
 *   Nunca alterados após criação (doc 11 §11, doc 17 §5).
 * - EditionMetadata: dados adicionais por tipo de edição (Prime/Event/GOAT).
 *
 * INVARIANTES:
 * 1. (playerId, rarityCode) único no catálogo — garantido pelo Catalog (card.ts).
 * 2. Overall dentro de floor/ceiling da Rarity.
 * 3. FinalAttributeSet derivado pela fórmula (nunca arbitrário).
 * 4. World Cup Hero exige TournamentContext não-nulo.
 * 5. Uma carta World Cup Hero NÃO pode ser edição 'prime' ou 'goat' —
 *    ela JÁ é o topo de sua categoria narrativa (doc 10 §3/§11).
 */
import type { EditionCode, RarityCode } from '@world-legends/types';
import type { PlayerId } from '../player/types';
import type { TraitAssignment } from '../traits/traits';

// ─── CardId ───────────────────────────────────────────────────────────────────
export type CardId = string & { readonly _brand: 'CardId' };

export function cardId(value: string): CardId {
  if (value.trim().length === 0) throw new Error('CardId não pode ser vazio');
  return value as CardId;
}

// ─── TournamentContext ────────────────────────────────────────────────────────
/**
 * Contexto de torneio ao qual a carta está ancorada (doc 10 §2, doc 17 §5).
 * Ex: { tournament: 'FIFA World Cup', year: 1970, description: 'Pelé marca 4 gols...' }
 *
 * Quando presente, alimenta:
 * 1. A fórmula de "Atributo de Momento" (doc 10 §6) — 70% do recorte + 30% da base.
 * 2. A arte e o texto narrativo da carta.
 * 3. A mecânica de Química Histórica (doc 10 §7 — "mesma edição de Copa").
 */
export type TournamentContext = Readonly<{
  readonly tournament: string; // ex: "FIFA World Cup"
  readonly year: number; // ex: 1970
  readonly hostCountry: string; // ex: "Mexico"
  readonly narrativeDescription: string; // texto curto exibido na carta
  /**
   * Indicador de desempenho do recorte: valor 1–99 derivado manualmente
   * de dados factuais daquele período (doc 10 §6 + doc 08 §2.1).
   * Alimenta a fórmula: MomentAttribute = (performanceIndicator × 0.7) + (baseAttr × 0.3).
   * Diferentes por atributo — aqui um multiplicador único por simplicidade de v1;
   * refinamento futuro pode usar um vetor por grupo de atributos.
   */
  readonly performanceIndicator: number; // [1, 99]
}>;

// ─── EditionMetadata ──────────────────────────────────────────────────────────

/**
 * PrimeEdition (doc 10 §9): representa a janela de auge real e verificável.
 * Não é uma 7ª raridade — é um eixo de edição sobre Rare/Elite/Legendary.
 */
export type PrimeEdition = Readonly<{
  readonly kind: 'prime';
  /**
   * Bônus de atributo sobre a versão-base da mesma raridade (doc 10 §9: +2 a +4),
   * concentrado nos atributos centrais da posição.
   * Ex: +3 para finishing/pace em um atacante Prime.
   */
  readonly attributeBonus: number; // [2, 4]
  /** Período de auge (ex: "1995-1999") — exibido na arte da carta. */
  readonly primePeriod: string;
}>;

/**
 * EventEdition (doc 10 §10): carta sazonal ligada a live-op.
 * Disponibilidade estritamente limitada no tempo.
 */
export type EventEdition = Readonly<{
  readonly kind: 'event';
  readonly eventName: string; // ex: "Aniversário Copa 1970"
  readonly eventYear: number; // ano do live-op
  /**
   * Bônus temporário de atributo válido apenas durante a janela do evento
   * em modos casuais (a normalização competitiva de doc 10 §18 sempre se
   * aplica em ranqueada — este campo nunca afeta o competitivo).
   */
  readonly casualModeBonus: number; // [0, 5]
  /** Se esta edição pode retornar em rotação futura (transparência doc 10 §10). */
  readonly mayReturn: boolean;
}>;

/**
 * BaseEdition: sem metadados de edição especial (cartas 'base' e 'goat').
 * GOAT não tem edição elaborada — seu prestígio é o próprio desbloqueio.
 */
export type BaseEdition = Readonly<{ readonly kind: 'base' | 'goat' }>;

export type EditionMetadata = PrimeEdition | EventEdition | BaseEdition;

// ─── FinalAttributeSet ────────────────────────────────────────────────────────
/**
 * Atributos finais calculados e CONGELADOS na criação da carta.
 * Nunca alterados após publicação (doc 11 §11, doc 17 §5).
 * Mesmas chaves de BaseAttributeSet, mas valores já multiplicados/ajustados.
 */
export type FinalAttributeSet = Readonly<{
  readonly pace: number;
  readonly stamina: number;
  readonly physical: number;
  readonly heading: number;
  readonly finishing: number;
  readonly shot_power: number;
  readonly passing: number;
  readonly vision: number;
  readonly dribbling: number;
  readonly penalty_kicks: number;
  readonly defending: number;
  readonly composure: number;
  readonly aggression: number;
  readonly leadership: number;
  readonly gk_reflexes: number;
  readonly gk_positioning: number;
  readonly gk_handling: number;
  readonly gk_kicking: number;
  readonly gk_penalty_save: number;
}>;

// ─── Card ─────────────────────────────────────────────────────────────────────
/**
 * Aggregate Root `Card` (doc 17 §5).
 *
 * WorldCupHero NÃO é um tipo separado de Card — é uma raridade
 * ('world_cup_hero') que EXIGE tournamentContext não-nulo. Essa decisão
 * modela o doc fielmente: "World Cup Hero é uma categoria narrativa, não
 * só estatística" (doc 10 §4).
 */
export type Card = Readonly<{
  readonly id: CardId;
  readonly playerId: PlayerId;
  readonly rarityCode: RarityCode;
  readonly editionCode: EditionCode;
  readonly editionMetadata: EditionMetadata;
  /**
   * Presente para: Legendary, Ultra, World Cup Hero (obrigatório), Event.
   * Ausente para: Common, Rare, Elite (base de carreira geral).
   */
  readonly tournamentContext: TournamentContext | null;
  readonly finalAttributes: FinalAttributeSet;
  /** Overall calculado e congelado (doc 17 §5 — derivado, nunca manual). */
  readonly overall: number;
  readonly traits: readonly TraitAssignment[];
  /** Doc 17 §5: nunca editado para balanceamento — alterações vão em CompetitiveModifier. */
  readonly isActive: boolean;
}>;
