/**
 * Casos de uso de Fragmentos — moeda de propósito único.
 *
 * Source único (doc 10 §16): duplicate_conversion.
 * Sink único (doc 10 §17): craft_cost.
 *
 * TC-ECO-04: fragmentos NUNCA convertem para moeda premium, direta ou
 * indiretamente. Garantido estruturalmente: as únicas razões de débito
 * disponíveis são `craft_cost` — sem nenhuma rota para premium.
 */
import { Err, Ok, type Result, type ValidationError, validationError } from '@world-legends/shared';
import type { EventPublisher } from '@world-legends/shared';
import { makeFragmentsEarnedEvent, makeFragmentsSpentEvent } from '../events/economy-events';
import { FRAGMENT_SINK_REASONS, FRAGMENT_SOURCE_REASONS, ledgerEntryId } from '../ledger/types';
import type { LedgerEntry, LedgerReason, LedgerRepository } from '../ledger/types';
import { withFragmentBalance } from '../wallet/types';
import type { Wallet } from '../wallet/types';
import type { OperationResult } from './deposit-spend-credits';
import { makeEntryId, validateAmount } from './helpers';

export function depositFragments(input: {
  wallet: Wallet;
  amount: number;
  reason: LedgerReason;
  idempotencyKey?: string;
  publisher: EventPublisher;
  ledger: LedgerRepository;
}): Result<OperationResult, ValidationError> {
  const amtErr = validateAmount(input.amount);
  if (amtErr !== null) return Err(amtErr);

  if (!FRAGMENT_SOURCE_REASONS.has(input.reason)) {
    return Err(
      validationError(`reason "${input.reason}" não é uma fonte válida de Fragmentos`, 'reason'),
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

  const newAmount = input.wallet.fragments.amount + input.amount;
  const newWallet = withFragmentBalance(input.wallet, newAmount);

  const entry: LedgerEntry = Object.freeze({
    id: ledgerEntryId(makeEntryId('ledger-frg-')),
    profileId: input.wallet.profileId,
    currency: 'fragments' as const,
    amount: input.amount,
    reason: input.reason,
    occurredAt: new Date(),
    ...(input.idempotencyKey !== undefined ? { idempotencyKey: input.idempotencyKey } : {}),
  });

  input.ledger.append(entry);
  input.publisher(
    makeFragmentsEarnedEvent({
      profileId: input.wallet.profileId,
      amount: input.amount,
      reason: input.reason,
      newBalance: newAmount,
    }),
  );

  return Ok({ wallet: newWallet, entry });
}

export function spendFragments(input: {
  wallet: Wallet;
  amount: number;
  reason: LedgerReason;
  idempotencyKey?: string;
  publisher: EventPublisher;
  ledger: LedgerRepository;
}): Result<OperationResult, ValidationError> {
  const amtErr = validateAmount(input.amount);
  if (amtErr !== null) return Err(amtErr);

  if (!FRAGMENT_SINK_REASONS.has(input.reason)) {
    return Err(
      validationError(`reason "${input.reason}" não é um destino válido de Fragmentos`, 'reason'),
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

  // TC-ECO-07
  if (input.wallet.fragments.amount < input.amount) {
    return Err(
      validationError(
        `Saldo insuficiente: tem ${input.wallet.fragments.amount} fragmentos, precisa ${input.amount}`,
        'amount',
      ),
    );
  }

  const newAmount = input.wallet.fragments.amount - input.amount;
  const newWallet = withFragmentBalance(input.wallet, newAmount);

  const entry: LedgerEntry = Object.freeze({
    id: ledgerEntryId(makeEntryId('ledger-frg-')),
    profileId: input.wallet.profileId,
    currency: 'fragments' as const,
    amount: -input.amount,
    reason: input.reason,
    occurredAt: new Date(),
    ...(input.idempotencyKey !== undefined ? { idempotencyKey: input.idempotencyKey } : {}),
  });

  input.ledger.append(entry);
  input.publisher(
    makeFragmentsSpentEvent({
      profileId: input.wallet.profileId,
      amount: input.amount,
      reason: input.reason,
      newBalance: newAmount,
    }),
  );

  return Ok({ wallet: newWallet, entry });
}
