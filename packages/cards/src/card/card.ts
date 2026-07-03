/**
 * `createCard` — fábrica que valida TODOS os invariantes do agregado Card
 * (doc 17 §5, doc 18 §6) e aplica a fórmula de atributos (doc 10 §6).
 *
 * Invariantes verificados antes de criar:
 * 1. World Cup Hero exige TournamentContext não-nulo.
 * 2. World Cup Hero não pode ser edição 'prime' ou 'goat' (doc 10 §3/§11).
 * 3. Edição 'prime' só em raridades Rare/Elite/Legendary (doc 10 §9).
 * 4. Edição 'goat' só para cartas Ultra (doc 10 §11 — Ultra é o teto
 *    estatístico; GOAT é o teto de prestígio sobre essa raridade).
 * 5. Bônus de edição Prime em [2, 4] (doc 10 §9).
 * 6. Overall resultante dentro de floor/ceiling da Rarity.
 * 7. Traits: 1–3, sem duplicatas.
 *
 * O que NÃO é verificado aqui (garantido pelo Catalog, card-catalog.ts):
 * - Unicidade de (playerId, rarityCode) — requer conhecimento global do catálogo.
 */
import { Err, Ok, type Result, type ValidationError, validationError } from '@world-legends/shared';
import type { EditionCode, RarityCode } from '@world-legends/types';
import type { Position } from '@world-legends/types';
import type { BaseAttributeSet } from '../player/types';
import type { PlayerId } from '../player/types';
import { getRarity, isOverallInRange } from '../rarity/rarity';
import { type TraitAssignment, createTraitAssignments } from '../traits/traits';
import { applyAttributeFormula, calculateOverall } from './formula';
import {
  type BaseEdition,
  type Card,
  type CardId,
  type EditionMetadata,
  type EventEdition,
  type FinalAttributeSet,
  type PrimeEdition,
  type TournamentContext,
  cardId,
} from './types';

// ─── Validação de EditionMetadata ─────────────────────────────────────────────

function validateEditionVsRarity(
  edition: EditionCode,
  metadata: EditionMetadata,
  rarity: RarityCode,
): ValidationError | null {
  if (edition === 'prime') {
    if (!['rare', 'elite', 'legendary'].includes(rarity)) {
      return validationError(
        `Edição 'prime' só é permitida em raridades Rare/Elite/Legendary, recebida: ${rarity}`,
        'edition',
      );
    }
    if (rarity === 'world_cup_hero') {
      return validationError('World Cup Hero não pode ser edição prime', 'edition');
    }
    if (metadata.kind !== 'prime') {
      return validationError('EditionCode prime requer EditionMetadata de kind prime', 'edition');
    }
    const prime = metadata as PrimeEdition;
    if (prime.attributeBonus < 2 || prime.attributeBonus > 4) {
      return validationError(
        `Prime attributeBonus deve ser [2, 4], recebido: ${prime.attributeBonus}`,
        'edition.attributeBonus',
      );
    }
  }

  if (edition === 'goat') {
    if (rarity !== 'ultra') {
      return validationError(
        `Edição 'goat' só é permitida em cartas Ultra, recebida: ${rarity}`,
        'edition',
      );
    }
  }

  if (rarity === 'world_cup_hero' && (edition === 'prime' || edition === 'goat')) {
    return validationError('Uma carta World Cup Hero não pode ter edição prime ou goat', 'edition');
  }

  return null;
}

// ─── CreateCardInput ──────────────────────────────────────────────────────────

export type CreateCardInput = {
  readonly id: string;
  readonly playerId: PlayerId;
  readonly playerPosition: Position;
  readonly rarityCode: RarityCode;
  readonly editionCode: EditionCode;
  readonly editionMetadata: EditionMetadata;
  readonly tournamentContext?: TournamentContext;
  readonly baseAttributes: BaseAttributeSet;
  readonly traits: readonly { trait: import('@world-legends/types').TraitName; tier: number }[];
};

// ─── createCard ───────────────────────────────────────────────────────────────

export function createCard(input: CreateCardInput): Result<Card, ValidationError> {
  const rarity = getRarity(input.rarityCode);

  // Invariante 1: World Cup Hero exige TournamentContext
  if (input.rarityCode === 'world_cup_hero' && input.tournamentContext === undefined) {
    return Err(
      validationError(
        'Carta World Cup Hero exige tournamentContext não-nulo (doc 17 §5)',
        'tournamentContext',
      ),
    );
  }

  // Invariante 2 + 3 + 4 + 5: validações de edição vs raridade
  const editionError = validateEditionVsRarity(
    input.editionCode,
    input.editionMetadata,
    input.rarityCode,
  );
  if (editionError !== null) return Err(editionError);

  // Resolver bônus de edição
  let editionBonus = 0;
  if (input.editionMetadata.kind === 'prime') {
    editionBonus = (input.editionMetadata as PrimeEdition).attributeBonus;
  } else if (input.editionMetadata.kind === 'event') {
    // Bônus casual de Event não entra nos atributos permanentes da carta
    editionBonus = 0;
  }

  // Aplicar fórmula de atributos (doc 10 §6)
  const ctx = input.tournamentContext ?? null;
  const finalAttributes: FinalAttributeSet = applyAttributeFormula(
    input.baseAttributes,
    rarity.attributeMultiplier,
    editionBonus,
    ctx,
  );

  // Calcular Overall
  const overall = calculateOverall(finalAttributes, input.playerPosition);

  // Invariante 6: Overall dentro da faixa da raridade
  if (!isOverallInRange(overall, rarity)) {
    return Err(
      validationError(
        `Overall calculado (${overall}) fora da faixa de ${rarity.label}: [${rarity.overallFloor}, ${rarity.overallCeiling}]. Ajuste os atributos-base ou a raridade da carta.`,
        'overall',
      ),
    );
  }

  // Invariante 7: Traits
  const traitsResult = createTraitAssignments(input.traits);
  if (!traitsResult.ok) return Err(traitsResult.error);

  const card: Card = Object.freeze({
    id: cardId(input.id),
    playerId: input.playerId,
    rarityCode: input.rarityCode,
    editionCode: input.editionCode,
    editionMetadata: input.editionMetadata,
    tournamentContext: ctx,
    finalAttributes,
    overall,
    traits: traitsResult.value,
    isActive: true,
  });

  return Ok(card);
}

/** Retorna um novo Card com isActive = false (doc 17 §5: nunca deletado, só inativado). */
export function deactivateCard(card: Card): Card {
  return Object.freeze({ ...card, isActive: false });
}

export type {
  Card,
  CardId,
  EditionMetadata,
  EventEdition,
  FinalAttributeSet,
  PrimeEdition,
  TournamentContext,
  TraitAssignment,
  BaseEdition,
};
