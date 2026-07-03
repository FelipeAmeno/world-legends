/**
 * `PityCounter` — proteção de sorte por tipo de raridade-alvo.
 *
 * Doc 10 §15 / doc 17 §8:
 * - Legendary+: limiar 40 pacotes → próximo pack garante Legendary-ou-melhor.
 * - Ultra+:     limiar 120 pacotes → próximo pack garante Ultra-ou-melhor.
 * - WCH NUNCA é forçado por pity (TC-PACK-09) — está excluído da proteção.
 *
 * INVARIANTES:
 * - `packsSinceLastHit ≥ 0` sempre.
 * - Zera exatamente quando a raridade-alvo é obtida (doc 17 §8).
 * - Dois contadores independentes por usuário: `legendary_plus` e `ultra_plus`.
 *
 * Ao atingir o limiar, `isForced()` retorna `true`. O chamador é
 * responsável por forçar a garantia na abertura e então resetar o contador
 * chamando `recordHit()`.
 *
 * Implementação pura — sem efeitos colaterais. Todos os métodos produzem
 * novos `PityCounter` sem mutar o original.
 */
import type { RarityCode } from '@world-legends/types';
import { RARITY_ORDER } from '../drop-table/drop-table';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type PityType = 'legendary_plus' | 'ultra_plus';

/** Limiares documentados (doc 10 §15). */
export const PITY_THRESHOLDS: Readonly<Record<PityType, number>> = {
  legendary_plus: 40,
  ultra_plus: 120,
};

/** Raridade mínima que satisfaz cada tipo de pity. */
const PITY_TARGET_RARITY: Readonly<Record<PityType, RarityCode>> = {
  legendary_plus: 'legendary',
  ultra_plus: 'ultra',
};

export type PityCounter = Readonly<{
  readonly type: PityType;
  readonly packsSinceLastHit: number;
}>;

// ─── Fábrica ──────────────────────────────────────────────────────────────────

export function createPityCounter(type: PityType, packsSinceLastHit = 0): PityCounter {
  return Object.freeze({ type, packsSinceLastHit: Math.max(0, packsSinceLastHit) });
}

// ─── Operações puras ──────────────────────────────────────────────────────────

/**
 * Retorna true quando este contador atingiu o limiar e a PRÓXIMA abertura
 * deve ser forçada (TC-PACK-07/08).
 * "Ao atingir o limiar, a PRÓXIMA abertura é forçada" (doc 17 §8) significa
 * que a garantia se aplica quando `packsSinceLastHit >= threshold`,
 * ANTES de incrementar para este pack.
 */
export function isForced(counter: PityCounter): boolean {
  return counter.packsSinceLastHit >= PITY_THRESHOLDS[counter.type];
}

/**
 * Retorna a raridade mínima que o pity deve forçar.
 * WCH é explicitamente excluído — se o sistema forçar Ultra+, sorteia
 * entre legendary/ultra mas nunca world_cup_hero (doc 10 §15).
 */
export function getForcedMinRarity(counter: PityCounter): RarityCode {
  return PITY_TARGET_RARITY[counter.type];
}

/** Incrementa o contador (+1 pack aberto, sem hit). Novo objeto imutável. */
export function increment(counter: PityCounter): PityCounter {
  return Object.freeze({ ...counter, packsSinceLastHit: counter.packsSinceLastHit + 1 });
}

/**
 * Registra um "hit" (raridade-alvo ou melhor obtida). Zera o contador.
 * WCH satisfaz ambos os contadores (é ≥ ultra ≥ legendary), mas não é
 * forçado pelo pity — essa é uma questão de SORTEIO, não de RESET.
 * O reset ocorre sempre que a carta obtida satisfaz a raridade-alvo.
 */
export function recordHit(counter: PityCounter): PityCounter {
  return Object.freeze({ ...counter, packsSinceLastHit: 0 });
}

/**
 * Verifica se uma raridade sorteada satisfaz (e portanto reseta) este contador.
 * WCH satisfaz legendary+ e ultra+ para fins de reset, mas o pity nunca
 * FORÇA WCH — apenas reconhece que obtê-la conta como "hit".
 */
export function isSatisfiedBy(counter: PityCounter, rarity: RarityCode): boolean {
  const rarityOrder = RARITY_ORDER[rarity] ?? 0;
  const targetOrder = RARITY_ORDER[PITY_TARGET_RARITY[counter.type]] ?? 0;
  return rarityOrder >= targetOrder;
}

// ─── Estado combinado de pity por usuário ─────────────────────────────────────

export type UserPityState = Readonly<{
  readonly legendaryPlus: PityCounter;
  readonly ultraPlus: PityCounter;
}>;

export function createUserPityState(): UserPityState {
  return Object.freeze({
    legendaryPlus: createPityCounter('legendary_plus'),
    ultraPlus: createPityCounter('ultra_plus'),
  });
}

/**
 * Retorna o pity modificado após uma abertura de pack.
 * Incrementa o contador correto; se a raridade satisfaz, reseta.
 *
 * AMBOS os contadores são verificados/atualizados:
 * - Legendary+ satisfaz legendary_plus (reseta) mas não ultra_plus.
 * - Ultra satisfaz AMBOS (reseta ambos).
 */
export function updatePityAfterOpening(
  state: UserPityState,
  highestRarityObtained: RarityCode,
): UserPityState {
  // WCH: doc 10 §15 — não está na proteção de sorte.
  // WCH ainda reseta contadores (obtê-la é "melhor que um hit"), mas nunca
  // é forçada. Aqui só atualizamos os contadores.
  const satisfiesLegendaryPlus = isSatisfiedBy(state.legendaryPlus, highestRarityObtained);
  const satisfiesUltraPlus = isSatisfiedBy(state.ultraPlus, highestRarityObtained);

  return Object.freeze({
    legendaryPlus: satisfiesLegendaryPlus
      ? recordHit(state.legendaryPlus)
      : increment(state.legendaryPlus),
    ultraPlus: satisfiesUltraPlus ? recordHit(state.ultraPlus) : increment(state.ultraPlus),
  });
}
