/**
 * Casos de uso de Premium (hard currency).
 *
 * Source: premium_top_up (crédito de moeda premium via compra real).
 * Sinks elegíveis (doc 10 §18, doc 17 §11): premium_pack_purchase,
 *   premium_cosmetic.
 *
 * TC-ECO-05: PremiumBalance NUNCA é debitado em troca direta de uma
 * Card/UserCard específica. Garantia estrutural: não existe nenhum
 * `LedgerReason` que conecte premium a uma carta diretamente. O
 * runtime guard em `spendPremium` rejeita qualquer reason não-elegível.
 *
 * "Esta é a regra de domínio que torna o princípio 'gastar dinheiro
 * acelera coleção, mas não compra ranking' estruturalmente impossível
 * de violar." (doc 17 §11)
 */
import { Err, Ok, type Result, type ValidationError, validationError } from '@world-legends/shared';
import type { EventPublisher } from '@world-legends/shared';
import { makePremiumSpentEvent, makePremiumTopUpEvent } from '../events/economy-events';
import { PREMIUM_SINK_REASONS, PREMIUM_SOURCE_REASONS, ledgerEntryId } from '../ledger/types';
import type { LedgerEntry, LedgerReason, LedgerRepository } from '../ledger/types';
import { withPremiumBalance } from '../wallet/types';
import type { Wallet } from '../wallet/types';
import type { OperationResult } from './deposit-spend-credits';
import { makeEntryId, validateAmount } from './helpers';

export function depositPremium(input: {
  wallet: Wallet;
  amount: number;
  reason: LedgerReason;
  idempotencyKey?: string;
  publisher: EventPublisher;
  ledger: LedgerRepository;
}): Result<OperationResult, ValidationError> {
  const amtErr = validateAmount(input.amount);
  if (amtErr !== null) return Err(amtErr);

  if (!PREMIUM_SOURCE_REASONS.has(input.reason)) {
    return Err(
      validationError(`reason "${input.reason}" não é uma fonte válida de moeda Premium`, 'reason'),
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

  const newAmount = input.wallet.premium.amount + input.amount;
  const newWallet = withPremiumBalance(input.wallet, newAmount);

  const entry: LedgerEntry = Object.freeze({
    id: ledgerEntryId(makeEntryId('ledger-prem-')),
    profileId: input.wallet.profileId,
    currency: 'premium' as const,
    amount: input.amount,
    reason: input.reason,
    occurredAt: new Date(),
    ...(input.idempotencyKey !== undefined ? { idempotencyKey: input.idempotencyKey } : {}),
  });

  input.ledger.append(entry);
  input.publisher(
    makePremiumTopUpEvent({
      profileId: input.wallet.profileId,
      amount: input.amount,
      reason: input.reason,
      newBalance: newAmount,
    }),
  );

  return Ok({ wallet: newWallet, entry });
}

export function spendPremium(input: {
  wallet: Wallet;
  amount: number;
  reason: LedgerReason;
  idempotencyKey?: string;
  publisher: EventPublisher;
  ledger: LedgerRepository;
}): Result<OperationResult, ValidationError> {
  const amtErr = validateAmount(input.amount);
  if (amtErr !== null) return Err(amtErr);

  // TC-ECO-05: guard estrutural — reasons proibidas produzem Err
  if (!PREMIUM_SINK_REASONS.has(input.reason)) {
    return Err(
      validationError(
        `reason "${input.reason}" não é um destino válido de moeda Premium. Moeda premium só pode ser usada em: ${[...PREMIUM_SINK_REASONS].join(', ')}. Compra direta de carta (Card/UserCard) nunca é permitida (doc 17 §11, TC-ECO-05).`,
        'reason',
      ),
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
  if (input.wallet.premium.amount < input.amount) {
    return Err(
      validationError(
        `Saldo insuficiente: tem ${input.wallet.premium.amount} premium, precisa ${input.amount}`,
        'amount',
      ),
    );
  }

  const newAmount = input.wallet.premium.amount - input.amount;
  const newWallet = withPremiumBalance(input.wallet, newAmount);

  const entry: LedgerEntry = Object.freeze({
    id: ledgerEntryId(makeEntryId('ledger-prem-')),
    profileId: input.wallet.profileId,
    currency: 'premium' as const,
    amount: -input.amount,
    reason: input.reason,
    occurredAt: new Date(),
    ...(input.idempotencyKey !== undefined ? { idempotencyKey: input.idempotencyKey } : {}),
  });

  input.ledger.append(entry);
  input.publisher(
    makePremiumSpentEvent({
      profileId: input.wallet.profileId,
      amount: input.amount,
      reason: input.reason,
      newBalance: newAmount,
    }),
  );

  return Ok({ wallet: newWallet, entry });
}
