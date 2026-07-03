/**
 * `craftCard` — Serviço de Domínio do bounded context Craft.
 *
 * Implementa o fluxo completo do doc 18 §18.3:
 *   1. Validar elegibilidade da carta (não WCH/GOAT) — TC-CRAFT-06/07
 *   2. Validar que o usuário ainda não possui a carta  — TC-CRAFT-10
 *   3. Verificar saldo de fragmentos                  — TC-CRAFT-08
 *   4. Verificar idempotência                         — TC-SEC-01
 *   5. Debitar fragmentos via economy                 — TC-CRAFT-09
 *   6. Criar UserCard via collection                  — TC-CRAFT-01..05
 *   7. Publicar CraftCompletedEvent                   — TC-ECO-02
 *   8. Retornar CraftRequest (resultado completo)
 *
 * Atomicidade (doc 17 §10): "débito de FragmentBalance e criação de
 * UserCard são atômicos — ambos ocorrem ou nenhum ocorre." Em memória
 * pura, a atomicidade é garantida pela ordem: o débito acontece DEPOIS
 * de todas as validações passarem, e a criação do UserCard acontece
 * imediatamente após. Se a criação falhar, o chamador pode desfazer o
 * débito; em produção, uma transação de banco envolveria ambos.
 *
 * Parâmetros injetados (Ports & Adapters, doc 18 §3.2):
 * - `cardResolver`    — dado de uma carta pelo cardId (do catálogo de cards)
 * - `ownershipChecker`— verifica se o usuário já possui a carta (collection)
 * - `fragmentSpender` — debita fragmentos (economy.spendFragments)
 * - `userCardCreator` — cria um novo UserCard (collection.addCard)
 * - `publisher`       — publica CraftCompletedEvent (shared.EventPublisher)
 * - `idempotencyStore`— verifica/registra chaves de idempotência
 *
 * Tudo puro: sem imports de implementações concretas de outros packages.
 */
import {
  Err,
  type EventPublisher,
  Ok,
  type Result,
  createDomainEvent,
} from '@world-legends/shared';
import type { EditionCode, RarityCode } from '@world-legends/types';
import { resolveCraftCost } from '../costs/craft-cost';
import { craftRequestId } from '../types/types';
import type { CraftCardInput, CraftError, CraftRequest } from '../types/types';

// ─── Portas (interfaces injetadas) ───────────────────────────────────────────

/** Retorna rarity e edition de uma carta do catálogo. null = não encontrada. */
export type CardResolver = (cardId: string) => {
  rarityCode: RarityCode;
  editionCode: EditionCode;
} | null;

/** Retorna true se o usuário já possui a carta (collection). */
export type OwnershipChecker = (profileId: string, cardId: string) => boolean;

/**
 * Debita fragmentos da wallet do usuário.
 * Retorna o novo saldo de fragmentos, ou null se saldo insuficiente.
 */
export type FragmentSpender = (
  profileId: string,
  amount: number,
  idempotencyKey?: string,
) =>
  | {
      success: true;
      newFragmentBalance: number;
    }
  | { success: false; have: number; need: number };

/**
 * Cria um UserCard na coleção. Retorna true em sucesso, false se já existe
 * (invariante de collection: exatamente 1 UserCard por (profileId, cardId)).
 */
export type UserCardCreator = (input: {
  profileId: string;
  cardId: string;
  rarityCode: RarityCode;
  editionCode: EditionCode;
}) => { success: true } | { success: false; reason: string };

/** Verifica e registra chaves de idempotência. */
export type IdempotencyStore = {
  has(profileId: string, key: string): boolean;
  register(profileId: string, key: string): void;
};

// ─── Evento de domínio ────────────────────────────────────────────────────────

export type CraftCompletedEvent = ReturnType<typeof createCraftCompletedEvent>;

function createCraftCompletedEvent(payload: {
  profileId: string;
  targetCardId: string;
  rarityCode: RarityCode;
  fragmentCost: number;
  fragmentBalanceAfter: number;
}) {
  return createDomainEvent('craft_completed', payload);
}

// ─── craftCard ────────────────────────────────────────────────────────────────

export function craftCard(
  input: CraftCardInput,
  ports: {
    cardResolver: CardResolver;
    ownershipChecker: OwnershipChecker;
    fragmentSpender: FragmentSpender;
    userCardCreator: UserCardCreator;
    publisher: EventPublisher;
    idempotencyStore: IdempotencyStore;
  },
): Result<CraftRequest, CraftError> {
  // ── Passo 0: validação de input ────────────────────────────────────────────
  if (!input.targetCardId.trim()) {
    return Err(
      Object.freeze({
        kind: 'CardNotFound' as const,
        targetCardId: input.targetCardId,
      }),
    );
  }

  // ── Passo 1: elegibilidade da carta no catálogo ───────────────────────────
  const cardData = ports.cardResolver(input.targetCardId);
  if (cardData === null) {
    return Err(
      Object.freeze({
        kind: 'CardNotFound' as const,
        targetCardId: input.targetCardId,
      }),
    );
  }

  // ── Passo 2: verificar WCH/GOAT (TC-CRAFT-06/07) ─────────────────────────
  const costResult = resolveCraftCost(cardData.rarityCode, cardData.editionCode);
  if (!costResult.ok) {
    return Err(costResult.error);
  }
  const fragmentCost = costResult.value;

  // ── Passo 3: verificar posse (TC-CRAFT-10) ────────────────────────────────
  if (ports.ownershipChecker(input.profileId, input.targetCardId)) {
    return Err(
      Object.freeze({
        kind: 'AlreadyOwned' as const,
        targetCardId: input.targetCardId,
      }),
    );
  }

  // ── Passo 4: idempotência (TC-SEC-01) ─────────────────────────────────────
  if (input.idempotencyKey !== undefined) {
    if (ports.idempotencyStore.has(input.profileId, input.idempotencyKey)) {
      return Err(
        Object.freeze({
          kind: 'DuplicateRequest' as const,
          idempotencyKey: input.idempotencyKey,
        }),
      );
    }
  }

  // ── Passo 5: debitar fragmentos (TC-CRAFT-08/09) ──────────────────────────
  const spendResult = ports.fragmentSpender(input.profileId, fragmentCost, input.idempotencyKey);
  if (!spendResult.success) {
    return Err(
      Object.freeze({
        kind: 'InsufficientFragments' as const,
        have: spendResult.have,
        need: spendResult.need,
      }),
    );
  }

  // ── Passo 6: criar UserCard (collection) ──────────────────────────────────
  const createResult = ports.userCardCreator({
    profileId: input.profileId,
    cardId: input.targetCardId,
    rarityCode: cardData.rarityCode,
    editionCode: cardData.editionCode,
  });

  // Se a criação falhar após o débito (raro em memória, possível em prod),
  // retornamos erro. Em produção, a atomicidade seria garantida por transação
  // de banco (doc 17 §10). Em memória pura, o chamador detecta isso via Err
  // e pode recriar o débito ou registrar para compensação manual.
  if (!createResult.success) {
    return Err(
      Object.freeze({
        kind: 'AlreadyOwned' as const,
        targetCardId: input.targetCardId,
      }),
    );
  }

  // ── Passo 7: registrar idempotência e publicar evento ─────────────────────
  if (input.idempotencyKey !== undefined) {
    ports.idempotencyStore.register(input.profileId, input.idempotencyKey);
  }

  ports.publisher(
    createCraftCompletedEvent({
      profileId: input.profileId,
      targetCardId: input.targetCardId,
      rarityCode: cardData.rarityCode,
      fragmentCost,
      fragmentBalanceAfter: spendResult.newFragmentBalance,
    }),
  );

  // ── Passo 8: retornar CraftRequest ────────────────────────────────────────
  const craftRequest: CraftRequest = Object.freeze({
    id: craftRequestId(input.craftRequestId),
    profileId: input.profileId,
    targetCardId: input.targetCardId,
    targetRarityCode: cardData.rarityCode,
    targetEditionCode: cardData.editionCode,
    fragmentCost,
    fragmentBalanceAfter: spendResult.newFragmentBalance,
    craftedAt: new Date(),
    ...(input.idempotencyKey !== undefined ? { idempotencyKey: input.idempotencyKey } : {}),
  });

  return Ok(craftRequest);
}
