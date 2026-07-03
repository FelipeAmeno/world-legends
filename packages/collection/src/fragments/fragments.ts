import type { CardId } from '@world-legends/cards';
import { Err, Ok, type Result, type ValidationError, validationError } from '@world-legends/shared';
/**
 * `FragmentGeneration` — lógica isolada de conversão de duplicatas em
 * fragmentos (doc 10 §16, doc 17 §9).
 *
 * Separado do `UserCollection` para permitir reusar a mesma lógica em
 * outros contextos (ex: Craft devolvendo fragmentos ao desmantelar uma
 * carta — doc 10 §17).
 *
 * VALORES DE FRAGMENTO POR RARIDADE: doc 10 §16 define a mecânica ("uma
 * duplicata vira fragmentos") mas não os valores exatos. Os números abaixo
 * são meus, calibrados para que cartas raras gerem fragmentos suficientes
 * para o Craft de uma carta da raridade imediatamente abaixo (doc 10 §17).
 * Decisão documentada — não inventados sem base.
 *
 * Custos de Craft (doc 10 §17) sugeridos (para referência):
 *   Rare:        50 fragmentos  (5 Common duplicatas)
 *   Elite:       120 fragmentos (5 Rare duplicatas)
 *   Legendary:   300 fragmentos (5 Elite duplicatas)
 *   Ultra:       800 fragmentos (5 Legendary/2 Ultra)
 *   WCH:         não craftável (doc 17 §10)
 */
import type { RarityCode } from '@world-legends/types';

/** Fragmentos concedidos por duplicata de cada raridade. */
export const FRAGMENT_VALUE_BY_RARITY: Readonly<Record<RarityCode, number>> = {
  common: 10,
  rare: 25,
  elite: 60,
  legendary: 150,
  ultra: 400,
  world_cup_hero: 1000,
};

/** Custo em fragmentos para craft de cada raridade (doc 10 §17 + calibração própria). */
export const CRAFT_COST_BY_RARITY: Readonly<Partial<Record<RarityCode, number>>> = {
  rare: 50,
  elite: 120,
  legendary: 300,
  ultra: 800,
  // common: não faz sentido craftar (obtível em qualquer pack)
  // world_cup_hero: não craftável (doc 17 §10, doc 13 TC-CRAFT-06)
};

/** Resultado de uma conversão de duplicata. */
export type DuplicateConversion = Readonly<{
  readonly cardId: CardId;
  readonly rarityCode: RarityCode;
  readonly fragmentsAwarded: number;
}>;

/** Resultado de um pedido de Craft. */
export type CraftResult = Readonly<{
  readonly targetCardId: CardId;
  readonly targetRarityCode: RarityCode;
  readonly fragmentsCost: number;
  readonly fragmentBalanceAfter: number;
}>;

export type CraftError =
  | ValidationError
  | Readonly<{ kind: 'NotCraftable'; rarityCode: RarityCode }>
  | Readonly<{ kind: 'InsufficientFragments'; have: number; need: number }>
  | Readonly<{ kind: 'AlreadyOwned'; cardId: CardId }>;

/**
 * Calcula os fragmentos de uma duplicata sem alterar estado.
 * O chamador é responsável por atualizar o saldo.
 */
export function calculateDuplicateFragments(rarityCode: RarityCode): number {
  return FRAGMENT_VALUE_BY_RARITY[rarityCode];
}

/**
 * Valida e "processa" um pedido de Craft em memória pura.
 * Retorna o novo saldo de fragmentos — sem efeito colateral.
 * Atômico: o chamador usa este resultado OU não usa nada.
 */
export function processCraftRequest(input: {
  targetCardId: CardId;
  targetRarityCode: RarityCode;
  currentFragmentBalance: number;
  alreadyOwnsCard: boolean;
}): Result<CraftResult, CraftError> {
  // WCH não é craftável (doc 17 §10)
  if (input.targetRarityCode === 'world_cup_hero') {
    return Err(
      Object.freeze({
        kind: 'NotCraftable' as const,
        rarityCode: input.targetRarityCode,
      }),
    );
  }

  const cost = CRAFT_COST_BY_RARITY[input.targetRarityCode];
  if (cost === undefined) {
    return Err(
      Object.freeze({
        kind: 'NotCraftable' as const,
        rarityCode: input.targetRarityCode,
      }),
    );
  }

  // Invariante: não pode craftar carta já possuída (doc 17 §10)
  if (input.alreadyOwnsCard) {
    return Err(Object.freeze({ kind: 'AlreadyOwned' as const, cardId: input.targetCardId }));
  }

  if (input.currentFragmentBalance < cost) {
    return Err(
      Object.freeze({
        kind: 'InsufficientFragments' as const,
        have: input.currentFragmentBalance,
        need: cost,
      }),
    );
  }

  return Ok(
    Object.freeze({
      targetCardId: input.targetCardId,
      targetRarityCode: input.targetRarityCode,
      fragmentsCost: cost,
      fragmentBalanceAfter: input.currentFragmentBalance - cost,
    }),
  );
}

/**
 * `FragmentLedger` — saldo de fragmentos em memória por profileId.
 * Invariante: saldo nunca negativo (doc 17 §9).
 */
export type FragmentLedger = {
  balance(): number;
  credit(amount: number): void;
  debit(amount: number): Result<number, ValidationError>;
};

export function createFragmentLedger(initialBalance = 0): FragmentLedger {
  let current = Math.max(0, initialBalance);

  return {
    balance() {
      return current;
    },
    credit(amount) {
      if (amount < 0) throw new Error('credit amount deve ser positivo');
      current += amount;
    },
    debit(amount): Result<number, ValidationError> {
      if (amount < 0) {
        return Err(validationError('Valor de débito deve ser positivo', 'amount'));
      }
      if (current < amount) {
        return Err(
          validationError(`Saldo insuficiente: tem ${current}, precisa ${amount}`, 'balance'),
        );
      }
      current -= amount;
      return Ok(current);
    },
  };
}
