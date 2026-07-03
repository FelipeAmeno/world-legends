/**
 * Wallet e os três Value Objects de saldo.
 *
 * Doc 17 §9/§11 define três Aggregate Roots separados: `CreditBalance`,
 * `PremiumBalance`, `FragmentBalance`. Em memória pura, os três vivem
 * numa `Wallet(profileId)` única (D-ECO-01 do design doc 19).
 *
 * Cada tipo de saldo é nominalmente distinto (branded) — o compilador
 * impede trocar um pelo outro silenciosamente.
 *
 * Invariante: todo amount é inteiro ≥ 0 (doc 13 TC-ECO-07). Garantido
 * pela fábrica; os VOs nunca são construídos diretamente.
 */
import type { Money } from '@world-legends/shared';

// ─── ProfileId ────────────────────────────────────────────────────────────────
export type ProfileId = string & { readonly _brand: 'ProfileId' };

export function profileId(value: string): ProfileId {
  if (!value.trim()) throw new Error('ProfileId não pode ser vazio');
  return value as ProfileId;
}

// ─── Value Objects de saldo (nominalmente distintos) ──────────────────────────

export type CreditBalance = Readonly<{
  readonly _type: 'CreditBalance';
  readonly amount: number;
}>;

export type FragmentBalance = Readonly<{
  readonly _type: 'FragmentBalance';
  readonly amount: number;
}>;

export type PremiumBalance = Readonly<{
  readonly _type: 'PremiumBalance';
  readonly amount: number;
}>;

// ─── Wallet — Aggregate Root ──────────────────────────────────────────────────
export type Wallet = Readonly<{
  readonly profileId: ProfileId;
  readonly credits: CreditBalance;
  readonly fragments: FragmentBalance;
  readonly premium: PremiumBalance;
}>;

// ─── Fábricas ─────────────────────────────────────────────────────────────────

export function createWallet(id: ProfileId): Wallet {
  return Object.freeze({
    profileId: id,
    credits: Object.freeze({ _type: 'CreditBalance' as const, amount: 0 }),
    fragments: Object.freeze({ _type: 'FragmentBalance' as const, amount: 0 }),
    premium: Object.freeze({ _type: 'PremiumBalance' as const, amount: 0 }),
  });
}

/** Retorna o saldo de uma moeda específica da wallet como um Money VO de shared. */
export function getBalance(wallet: Wallet, currency: Money['currency']): number {
  switch (currency) {
    case 'credits':
      return wallet.credits.amount;
    case 'fragments':
      return wallet.fragments.amount;
    case 'premium':
      return wallet.premium.amount;
  }
}

/** Produz uma nova Wallet com o saldo de créditos atualizado. */
export function withCreditBalance(wallet: Wallet, amount: number): Wallet {
  return Object.freeze({
    ...wallet,
    credits: Object.freeze({ _type: 'CreditBalance' as const, amount }),
  });
}

/** Produz uma nova Wallet com o saldo de fragmentos atualizado. */
export function withFragmentBalance(wallet: Wallet, amount: number): Wallet {
  return Object.freeze({
    ...wallet,
    fragments: Object.freeze({ _type: 'FragmentBalance' as const, amount }),
  });
}

/** Produz uma nova Wallet com o saldo de premium atualizado. */
export function withPremiumBalance(wallet: Wallet, amount: number): Wallet {
  return Object.freeze({
    ...wallet,
    premium: Object.freeze({ _type: 'PremiumBalance' as const, amount }),
  });
}
