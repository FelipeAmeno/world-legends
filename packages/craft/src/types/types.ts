import type { ValidationError } from '@world-legends/shared';
/**
 * Tipos centrais do bounded context Craft (doc 17 §10).
 *
 * `CraftRequest` — Aggregate Root. Representa a intenção e o resultado
 * de craftar uma carta específica. Imutável após criação.
 *
 * `CraftError` — union discriminada de todos os motivos de falha.
 * Doc 13: TC-CRAFT-06 (WCH bloqueado), TC-CRAFT-07 (GOAT bloqueado),
 * TC-CRAFT-08 (saldo insuficiente), TC-CRAFT-10 (alvo já possuído).
 *
 * Distinção important: `CraftRequest` é o agregado de domínio;
 * `craftCard()` é o serviço de domínio que o produz.
 */
import type { EditionCode, RarityCode } from '@world-legends/types';

// ─── Identidade ───────────────────────────────────────────────────────────────
export type CraftRequestId = string & { readonly _brand: 'CraftRequestId' };

export function craftRequestId(v: string): CraftRequestId {
  if (!v.trim()) throw new Error('CraftRequestId não pode ser vazio');
  return v as CraftRequestId;
}

// ─── CraftRequest — Aggregate Root ────────────────────────────────────────────
/** Resultado bem-sucedido de uma operação de Craft. */
export type CraftRequest = Readonly<{
  readonly id: CraftRequestId;
  readonly profileId: string;
  readonly targetCardId: string;
  readonly targetRarityCode: RarityCode;
  readonly targetEditionCode: EditionCode;
  readonly fragmentCost: number;
  readonly fragmentBalanceAfter: number;
  readonly craftedAt: Date;
  /** Idempotência: chave usada, se fornecida (TC-SEC-01). */
  readonly idempotencyKey?: string;
}>;

// ─── CraftError — falhas documentadas ────────────────────────────────────────
export type CraftError =
  /** TC-CRAFT-06: World Cup Hero nunca craftável (doc 10 §17). */
  | Readonly<{ kind: 'NotCraftable'; rarityCode: RarityCode; reason: 'exclusive_event_drop' }>
  /** TC-CRAFT-07: GOAT nunca craftável (doc 10 §11/§17). */
  | Readonly<{ kind: 'NotCraftable'; rarityCode: RarityCode; reason: 'exclusive_achievement' }>
  /** TC-CRAFT-08: fragmentos insuficientes. */
  | Readonly<{ kind: 'InsufficientFragments'; have: number; need: number }>
  /** TC-CRAFT-10: usuário já possui a carta. */
  | Readonly<{ kind: 'AlreadyOwned'; targetCardId: string }>
  /** Idempotência: mesma key já foi processada (TC-SEC-01). */
  | Readonly<{ kind: 'DuplicateRequest'; idempotencyKey: string }>
  /** Card não encontrada no catálogo. */
  | Readonly<{ kind: 'CardNotFound'; targetCardId: string }>
  /** ValidationError de inputs básicos (amount, id vazio etc.). */
  | ValidationError;

// ─── Input do serviço de Craft ────────────────────────────────────────────────
export type CraftCardInput = Readonly<{
  /** UUID da requisição — garante idempotência de infra. */
  readonly craftRequestId: string;
  readonly profileId: string;
  /** CardId da carta alvo (do catálogo cards). */
  readonly targetCardId: string;
  /** Chave de idempotência do cliente (opcional, TC-SEC-01). */
  readonly idempotencyKey?: string;
}>;
