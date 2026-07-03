/**
 * Ledger auditável imutável (doc 18 §9).
 *
 * "Todo movimento é registrado como um evento de ledger imutável —
 * saldo é sempre a soma de movimentos, nunca um campo editável
 * diretamente." (doc 18 §9)
 *
 * `LedgerEntry.amount` pode ser positivo (crédito) ou negativo (débito).
 * `Σ(entries.amount)` para um profileId+currency = saldo atual — isso
 * torna o TC-ECO-03 verificável: reconstruir saldo a partir do ledger bruto.
 *
 * `LedgerReason` é um union de string literals (D-ECO-04): extensível,
 * legível em logs de auditoria, sem magic numbers. Cada reason é mapeada
 * para uma fonte ou destino documentado (doc 10 §18, doc 12 §2.7).
 */
import type { CurrencyCode } from '@world-legends/shared';
import type { ProfileId } from '../wallet/types';

// ─── LedgerEntryId ────────────────────────────────────────────────────────────
export type LedgerEntryId = string & { readonly _brand: 'LedgerEntryId' };

export function ledgerEntryId(value: string): LedgerEntryId {
  if (!value.trim()) throw new Error('LedgerEntryId não pode ser vazio');
  return value as LedgerEntryId;
}

// ─── LedgerReason ─────────────────────────────────────────────────────────────
/**
 * Mapeamento completo de fontes e destinos (doc 10 §18, doc 12 §2.7).
 * Cada reason pertence a exatamente uma currency (validado nos use-cases).
 */
export type LedgerReason =
  // ── Créditos (soft currency) — sources (doc 10 §18) ──
  | 'match_reward' // recompensa de partida (vitória/empate/derrota)
  | 'daily_objective' // objetivo diário ou semanal
  | 'weekly_objective'
  | 'market_sale' // venda no mercado (valor líquido recebido pelo vendedor)
  // ── Créditos — sinks (doc 10 §18) ──
  | 'pack_purchase' // compra de pack com créditos
  | 'market_listing_fee' // taxa de 5% de transação queimada (doc 10 §20)
  | 'market_purchase' // compra no mercado (valor pago pelo comprador)
  // ── Fragmentos — source único (doc 10 §16) ──
  | 'duplicate_conversion' // duplicata → fragmentos
  // ── Fragmentos — sink único (doc 10 §17) ──
  | 'craft_cost' // custo de craft
  // ── Premium — source (doc 10 §18) ──
  | 'premium_top_up' // crédito de moeda premium (compra real)
  // ── Premium — sinks elegíveis (doc 10 §18, doc 17 §11, TC-ECO-05) ──
  | 'premium_pack_purchase' // compra de pack com moeda premium
  | 'premium_cosmetic'; // item cosmético elegível — nunca uma Card específica

// Conjunto de reasons que são sources (crédito) por currency
export const CREDIT_SOURCE_REASONS = new Set<LedgerReason>([
  'match_reward',
  'daily_objective',
  'weekly_objective',
  'market_sale',
]);
export const CREDIT_SINK_REASONS = new Set<LedgerReason>([
  'pack_purchase',
  'market_listing_fee',
  'market_purchase',
]);
export const FRAGMENT_SOURCE_REASONS = new Set<LedgerReason>(['duplicate_conversion']);
export const FRAGMENT_SINK_REASONS = new Set<LedgerReason>(['craft_cost']);
export const PREMIUM_SOURCE_REASONS = new Set<LedgerReason>(['premium_top_up']);
export const PREMIUM_SINK_REASONS = new Set<LedgerReason>([
  'premium_pack_purchase',
  'premium_cosmetic',
]);

// ─── LedgerEntry ──────────────────────────────────────────────────────────────
export type LedgerEntry = Readonly<{
  readonly id: LedgerEntryId;
  readonly profileId: ProfileId;
  readonly currency: CurrencyCode;
  /** Positivo = crédito, negativo = débito. Nunca zero. */
  readonly amount: number;
  readonly reason: LedgerReason;
  readonly occurredAt: Date;
  /**
   * Chave de idempotência opcional (doc 13 TC-SEC-01).
   * Segundo envio da mesma chave nunca executa uma segunda operação.
   */
  readonly idempotencyKey?: string;
}>;

// ─── LedgerRepository — porta (doc 18 §3.2) ──────────────────────────────────
/**
 * Porta de repositório do ledger — nunca implementada aqui.
 * `InMemoryLedger` é a implementação em memória fornecida por este package.
 * Em produção, `packages/db` fornecerá um adapter real.
 */
export type LedgerRepository = {
  /** Adiciona uma entrada. Lança se a mesma idempotencyKey já existir. */
  append(entry: LedgerEntry): void;
  /** Todas as entradas de um perfil, em ordem de ocorrência. */
  findByProfile(profileId: ProfileId): readonly LedgerEntry[];
  /** Entradas de um perfil filtradas por moeda. */
  findByProfileAndCurrency(profileId: ProfileId, currency: CurrencyCode): readonly LedgerEntry[];
  /** Verifica se uma idempotencyKey já foi processada para este perfil. */
  hasIdempotencyKey(profileId: ProfileId, key: string): boolean;
  /**
   * Reconstrói o saldo de uma moeda a partir do ledger bruto.
   * Σ(entry.amount) para profileId+currency. Verifica TC-ECO-03.
   */
  reconstructBalance(profileId: ProfileId, currency: CurrencyCode): number;
};
