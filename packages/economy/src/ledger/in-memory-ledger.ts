/**
 * `InMemoryLedger` — implementação em memória da porta `LedgerRepository`.
 *
 * Append-only por design (doc 12 §3): entradas nunca são editadas nem
 * removidas. Idempotência garantida por chave (TC-SEC-01).
 *
 * Em produção, substituída por um adapter `db` via injeção em `apps/*`.
 */
import type { CurrencyCode } from '@world-legends/shared';
import type { ProfileId } from '../wallet/types';
import type { LedgerEntry, LedgerRepository } from './types';

export function createInMemoryLedger(): LedgerRepository {
  // Chave: `${profileId}:${currency}` → entries
  const entries: LedgerEntry[] = [];
  // Índice de idempotência: `${profileId}:${key}` → true
  const idempotencyIndex = new Set<string>();

  return {
    append(entry: LedgerEntry): void {
      if (entry.idempotencyKey !== undefined) {
        const iKey = `${entry.profileId}:${entry.idempotencyKey}`;
        if (idempotencyIndex.has(iKey)) {
          throw new Error(
            `Idempotência violada: key "${entry.idempotencyKey}" já foi processada para o perfil "${entry.profileId}"`,
          );
        }
        idempotencyIndex.add(iKey);
      }
      entries.push(entry);
    },

    findByProfile(pid: ProfileId): readonly LedgerEntry[] {
      return entries.filter((e) => e.profileId === pid);
    },

    findByProfileAndCurrency(pid: ProfileId, currency: CurrencyCode): readonly LedgerEntry[] {
      return entries.filter((e) => e.profileId === pid && e.currency === currency);
    },

    hasIdempotencyKey(pid: ProfileId, key: string): boolean {
      return idempotencyIndex.has(`${pid}:${key}`);
    },

    reconstructBalance(pid: ProfileId, currency: CurrencyCode): number {
      return entries
        .filter((e) => e.profileId === pid && e.currency === currency)
        .reduce((sum, e) => sum + e.amount, 0);
    },
  };
}
