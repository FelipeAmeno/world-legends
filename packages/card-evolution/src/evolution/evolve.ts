/**
 * Lógica de evolução de cartas (T039).
 *
 *   createCardEvolution()  Cria estado inicial (evolutionLevel = 0).
 *   evolveCard()           Aplica 1 nível de evolução. Pura — não debita recursos.
 *   getEvolutionTag()      String de tag: '', '+1', '+2', …
 *   getDisplayName()       Nome completo com tag.
 *
 * Responsabilidade do chamador (apps/*):
 *   1. Chamar getCostForNextLevel() para saber o custo.
 *   2. Debitar créditos e fragmentos via @world-legends/economy.
 *   3. Chamar evolveCard() para aplicar a evolução.
 *
 * evolveCard() não valida pagamento por design — segue o princípio
 * de separação de responsabilidades do monorepo (doc 18 §3).
 */
import { Err, Ok, type Result, validationError } from '@world-legends/shared';
import type { CardEvolution, EvolutionError, EvolvableRarity } from '../types/types';
import { MAX_CARD_OVERALL, MAX_EVOLUTION_LEVEL, OVR_BOOST_PER_LEVEL } from '../types/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getEvolutionTag(level: number): string {
  return level === 0 ? '' : `+${level}`;
}

export function getDisplayName(cardName: string, level: number): string {
  const tag = getEvolutionTag(level);
  return tag ? `${cardName} ${tag}` : cardName;
}

function computeCurrentOverall(base: number, level: number): number {
  return Math.min(MAX_CARD_OVERALL, base + level * OVR_BOOST_PER_LEVEL);
}

function isValidRarity(rarity: string): rarity is EvolvableRarity {
  return rarity in MAX_EVOLUTION_LEVEL;
}

// ─── createCardEvolution ─────────────────────────────────────────────────────

/**
 * Cria o estado de evolução inicial de uma carta (evolutionLevel = 0).
 */
export function createCardEvolution(
  userCardId: string,
  cardName: string,
  rarityCode: string,
  baseOverall: number,
): Result<CardEvolution, EvolutionError> {
  if (!userCardId.trim()) {
    return Err(validationError('userCardId não pode ser vazio', 'userCardId'));
  }
  if (!cardName.trim()) {
    return Err(validationError('cardName não pode ser vazio', 'cardName'));
  }
  if (!isValidRarity(rarityCode)) {
    return Err({ kind: 'InvalidRarity', rarityCode } as const);
  }
  if (!Number.isFinite(baseOverall) || baseOverall < 1 || baseOverall > 99) {
    return Err({ kind: 'InvalidOverall', overall: baseOverall } as const);
  }

  const rarity = rarityCode as EvolvableRarity;
  const maxLevel = MAX_EVOLUTION_LEVEL[rarity];

  return Ok(
    Object.freeze({
      userCardId,
      cardName: cardName.trim(),
      rarityCode: rarity,
      baseOverall,
      evolutionLevel: 0,
      maxLevel,
      currentOverall: computeCurrentOverall(baseOverall, 0),
      isMaxEvolution: maxLevel === 0,
      tag: '',
      displayName: cardName.trim(),
    }),
  );
}

// ─── evolveCard ──────────────────────────────────────────────────────────────

/**
 * Aplica 1 nível de evolução à carta.
 *
 * PRÉ-CONDIÇÃO: o chamador JÁ debitou os recursos necessários.
 * Esta função apenas avança o estado.
 *
 * Erros:
 *   - AlreadyMaxEvolution: carta já está no nível máximo.
 *   - CannotEvolve: raridade 'common' (max=0) não evolui.
 */
export function evolveCard(evolution: CardEvolution): Result<CardEvolution, EvolutionError> {
  if (evolution.maxLevel === 0) {
    return Err({
      kind: 'CannotEvolve',
      userCardId: evolution.userCardId,
      rarityCode: evolution.rarityCode,
      reason: `Cartas ${evolution.rarityCode} não podem ser evoluídas.`,
    } as const);
  }

  if (evolution.isMaxEvolution) {
    return Err({
      kind: 'AlreadyMaxEvolution',
      userCardId: evolution.userCardId,
      maxLevel: evolution.maxLevel,
    } as const);
  }

  const newLevel = evolution.evolutionLevel + 1;
  const newOverall = computeCurrentOverall(evolution.baseOverall, newLevel);
  const isMax = newLevel >= evolution.maxLevel;
  const tag = getEvolutionTag(newLevel);

  return Ok(
    Object.freeze({
      ...evolution,
      evolutionLevel: newLevel,
      currentOverall: newOverall,
      isMaxEvolution: isMax,
      tag,
      displayName: getDisplayName(evolution.cardName, newLevel),
    }),
  );
}

/**
 * Evolui a carta N vezes de uma só vez (shortcut para múltiplos níveis).
 * Para na primeira falha.
 */
export function evolveCardN(
  evolution: CardEvolution,
  levels: number,
): Result<CardEvolution, EvolutionError> {
  if (!Number.isFinite(levels) || levels < 1) {
    return Err(validationError('levels deve ser ≥ 1', 'levels'));
  }

  let current = evolution;
  for (let i = 0; i < levels; i++) {
    const r = evolveCard(current);
    if (!r.ok) return r;
    current = r.value;
  }
  return Ok(current);
}
