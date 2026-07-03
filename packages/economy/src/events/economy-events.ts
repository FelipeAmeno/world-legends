/**
 * Eventos de domínio publicados por `economy` (doc 12 §2.7).
 *
 * TC-ECO-01: toda fonte gera evento `economy_*_earned`.
 * TC-ECO-02: toda remoção gera evento `economy_*_spent` (ou `sink_applied`).
 *
 * Todos usam `createDomainEvent` de `@world-legends/shared` — nenhuma
 * lógica de roteamento ou assinatura aqui (doc 18 §3.1).
 */
import { type DomainEvent, createDomainEvent } from '@world-legends/shared';
import type { LedgerReason } from '../ledger/types';
import type { ProfileId } from '../wallet/types';

// ─── Payloads ─────────────────────────────────────────────────────────────────

type EarnedPayload = Readonly<{
  profileId: ProfileId;
  amount: number;
  reason: LedgerReason;
  newBalance: number;
}>;

type SpentPayload = Readonly<{
  profileId: ProfileId;
  amount: number;
  reason: LedgerReason;
  newBalance: number;
}>;

// ─── Tipos de evento ──────────────────────────────────────────────────────────

export type CreditsEarnedEvent = DomainEvent<'economy_credits_earned', EarnedPayload>;
export type CreditsSpentEvent = DomainEvent<'economy_credits_spent', SpentPayload>;
export type FragmentsEarnedEvent = DomainEvent<'economy_fragments_earned', EarnedPayload>;
export type FragmentsSpentEvent = DomainEvent<'economy_fragments_spent', SpentPayload>;
export type PremiumTopUpEvent = DomainEvent<'economy_premium_purchased', EarnedPayload>;
export type PremiumSpentEvent = DomainEvent<'economy_premium_spent', SpentPayload>;

export type EconomyDomainEvent =
  | CreditsEarnedEvent
  | CreditsSpentEvent
  | FragmentsEarnedEvent
  | FragmentsSpentEvent
  | PremiumTopUpEvent
  | PremiumSpentEvent;

// ─── Fábricas ─────────────────────────────────────────────────────────────────

export function makeCreditsEarnedEvent(payload: EarnedPayload): CreditsEarnedEvent {
  return createDomainEvent('economy_credits_earned', payload);
}
export function makeCreditsSpentEvent(payload: SpentPayload): CreditsSpentEvent {
  return createDomainEvent('economy_credits_spent', payload);
}
export function makeFragmentsEarnedEvent(payload: EarnedPayload): FragmentsEarnedEvent {
  return createDomainEvent('economy_fragments_earned', payload);
}
export function makeFragmentsSpentEvent(payload: SpentPayload): FragmentsSpentEvent {
  return createDomainEvent('economy_fragments_spent', payload);
}
export function makePremiumTopUpEvent(payload: EarnedPayload): PremiumTopUpEvent {
  return createDomainEvent('economy_premium_purchased', payload);
}
export function makePremiumSpentEvent(payload: SpentPayload): PremiumSpentEvent {
  return createDomainEvent('economy_premium_spent', payload);
}
