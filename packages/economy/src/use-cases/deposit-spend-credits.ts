/**
 * Casos de uso de Créditos (soft currency).
 *
 * Sources (doc 10 §18): match_reward, daily_objective, weekly_objective, market_sale.
 * Sinks: pack_purchase, market_listing_fee, market_purchase.
 *
 * Cada operação:
 * 1. Valida amount e reason.
 * 2. Verifica idempotência (TC-SEC-01).
 * 3. Atualiza saldo na Wallet (nova instância imutável).
 * 4. Registra no Ledger (append-only).
 * 5. Publica evento de domínio (TC-ECO-01/02).
 * 6. Retorna Result<{wallet, entry}, ValidationError>.
 */
import { Err, Ok, type Result, type ValidationError, validationError } from '@world-legends/shared';
import type { EventPublisher } from '@world-legends/shared';
import { makeCreditsEarnedEvent, makeCreditsSpentEvent } from '../events/economy-events';
import { CREDIT_SINK_REASONS, CREDIT_SOURCE_REASONS, ledgerEntryId } from '../ledger/types';
import type { LedgerEntry, LedgerReason, LedgerRepository } from '../ledger/types';
import { withCreditBalance } from '../wallet/types';
import type { Wallet } from '../wallet/types';
import { makeEntryId, validateAmount } from './helpers';

export type UseCase<TResult> = (input: {
  wallet: Wallet;
  amount: number;
  reason: LedgerReason;
  idempotencyKey?: string;
  publisher: EventPublisher;
  ledger: LedgerRepository;
}) => Result<TResult, ValidationError>;

export type OperationResult = {
  readonly wallet: Wallet;
  readonly entry: LedgerEntry;
};

// ─── depositCredits ───────────────────────────────────────────────────────────

export function depositCredits(input: {
  wallet: Wallet;
  amount: number;
  reason: LedgerReason;
  idempotencyKey?: string;
  publisher: EventPublisher;
  ledger: LedgerRepository;
}): Result<OperationResult, ValidationError> {
  const amtErr = validateAmount(input.amount);
  if (amtErr !== null) return Err(amtErr);

  if (!CREDIT_SOURCE_REASONS.has(input.reason)) {
    return Err(
      validationError(`reason "${input.reason}" não é uma fonte válida de Créditos`, 'reason'),
    );
  }

  if (
    input.idempotencyKey !== undefined &&
    input.ledger.hasIdempotencyKey(input.wallet.profileId, input.idempotencyKey)
  ) {
    return Err(
      validationError(
        `Operação já processada: idempotencyKey "${input.idempotencyKey}"`,
        'idempotencyKey',
      ),
    );
  }

  const newAmount = input.wallet.credits.amount + input.amount;
  const newWallet = withCreditBalance(input.wallet, newAmount);

  const entry: LedgerEntry = Object.freeze({
    id: ledgerEntryId(makeEntryId('ledger-')),
    profileId: input.wallet.profileId,
    currency: 'credits' as const,
    amount: input.amount,
    reason: input.reason,
    occurredAt: new Date(),
    ...(input.idempotencyKey !== undefined ? { idempotencyKey: input.idempotencyKey } : {}),
  });

  input.ledger.append(entry);
  input.publisher(
    makeCreditsEarnedEvent({
      profileId: input.wallet.profileId,
      amount: input.amount,
      reason: input.reason,
      newBalance: newAmount,
    }),
  );

  return Ok({ wallet: newWallet, entry });
}

// ─── spendCredits ─────────────────────────────────────────────────────────────

export function spendCredits(input: {
  wallet: Wallet;
  amount: number;
  reason: LedgerReason;
  idempotencyKey?: string;
  publisher: EventPublisher;
  ledger: LedgerRepository;
}): Result<OperationResult, ValidationError> {
  const amtErr = validateAmount(input.amount);
  if (amtErr !== null) return Err(amtErr);

  if (!CREDIT_SINK_REASONS.has(input.reason)) {
    return Err(
      validationError(`reason "${input.reason}" não é um destino válido de Créditos`, 'reason'),
    );
  }

  if (
    input.idempotencyKey !== undefined &&
    input.ledger.hasIdempotencyKey(input.wallet.profileId, input.idempotencyKey)
  ) {
    return Err(
      validationError(
        `Operação já processada: idempotencyKey "${input.idempotencyKey}"`,
        'idempotencyKey',
      ),
    );
  }

  // TC-ECO-07: saldo nunca negativo
  if (input.wallet.credits.amount < input.amount) {
    return Err(
      validationError(
        `Saldo insuficiente: tem ${input.wallet.credits.amount} créditos, precisa ${input.amount}`,
        'amount',
      ),
    );
  }

  const newAmount = input.wallet.credits.amount - input.amount;
  const newWallet = withCreditBalance(input.wallet, newAmount);

  const entry: LedgerEntry = Object.freeze({
    id: ledgerEntryId(makeEntryId('ledger-')),
    profileId: input.wallet.profileId,
    currency: 'credits' as const,
    amount: -input.amount, // negativo = débito (D-ECO-03)
    reason: input.reason,
    occurredAt: new Date(),
    ...(input.idempotencyKey !== undefined ? { idempotencyKey: input.idempotencyKey } : {}),
  });

  input.ledger.append(entry);
  input.publisher(
    makeCreditsSpentEvent({
      profileId: input.wallet.profileId,
      amount: input.amount,
      reason: input.reason,
      newBalance: newAmount,
    }),
  );

  return Ok({ wallet: newWallet, entry });
}
