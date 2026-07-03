import { createCollectorPublisher, noopPublisher } from '@world-legends/shared';
import { describe, expect, it } from 'vitest';
import { createInMemoryLedger } from '../../src/ledger/in-memory-ledger';
import { depositCredits, spendCredits } from '../../src/use-cases/deposit-spend-credits';
import { depositFragments, spendFragments } from '../../src/use-cases/deposit-spend-fragments';
import { depositPremium, spendPremium } from '../../src/use-cases/deposit-spend-premium';
import {
  createWallet,
  profileId,
  withCreditBalance,
  withFragmentBalance,
  withPremiumBalance,
} from '../../src/wallet/types';

const pid = profileId('uc-test-01');

function freshEnv() {
  return {
    wallet: createWallet(pid),
    ledger: createInMemoryLedger(),
  };
}

// ─── CRÉDITOS ─────────────────────────────────────────────────────────────────

describe('depositCredits', () => {
  it('aumenta o saldo e registra no ledger', () => {
    const { wallet, ledger } = freshEnv();
    const result = depositCredits({
      wallet,
      amount: 300,
      reason: 'match_reward',
      publisher: noopPublisher,
      ledger,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.wallet.credits.amount).toBe(300);
      expect(result.value.entry.amount).toBe(300);
      expect(result.value.entry.currency).toBe('credits');
    }
  });

  it('rejeita reason inválida para créditos', () => {
    const { wallet, ledger } = freshEnv();
    const r = depositCredits({
      wallet,
      amount: 100,
      reason: 'craft_cost',
      publisher: noopPublisher,
      ledger,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.field).toBe('reason');
  });

  it('rejeita amount não-inteiro', () => {
    const { wallet, ledger } = freshEnv();
    const r = depositCredits({
      wallet,
      amount: 1.5,
      reason: 'match_reward',
      publisher: noopPublisher,
      ledger,
    });
    expect(r.ok).toBe(false);
  });

  it('rejeita amount zero', () => {
    const { wallet, ledger } = freshEnv();
    const r = depositCredits({
      wallet,
      amount: 0,
      reason: 'match_reward',
      publisher: noopPublisher,
      ledger,
    });
    expect(r.ok).toBe(false);
  });

  it('não muta a wallet original', () => {
    const { wallet, ledger } = freshEnv();
    depositCredits({
      wallet,
      amount: 500,
      reason: 'match_reward',
      publisher: noopPublisher,
      ledger,
    });
    expect(wallet.credits.amount).toBe(0);
  });
});

describe('spendCredits', () => {
  it('diminui o saldo e registra débito negativo no ledger', () => {
    const { ledger } = freshEnv();
    const wallet = withCreditBalance(createWallet(pid), 1000);
    const r = spendCredits({
      wallet,
      amount: 400,
      reason: 'pack_purchase',
      publisher: noopPublisher,
      ledger,
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.wallet.credits.amount).toBe(600);
      expect(r.value.entry.amount).toBe(-400); // D-ECO-03: débito negativo
    }
  });

  it('TC-ECO-07: rejeita quando amount > saldo', () => {
    const { wallet, ledger } = freshEnv(); // saldo 0
    const r = spendCredits({
      wallet,
      amount: 1,
      reason: 'pack_purchase',
      publisher: noopPublisher,
      ledger,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.field).toBe('amount');
  });

  it('TC-ECO-07: saldo exato (amount == saldo) resulta em 0, não falha', () => {
    const { ledger } = freshEnv();
    const wallet = withCreditBalance(createWallet(pid), 300);
    const r = spendCredits({
      wallet,
      amount: 300,
      reason: 'pack_purchase',
      publisher: noopPublisher,
      ledger,
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.wallet.credits.amount).toBe(0);
  });

  it('idempotência: segunda chamada com mesma key falha (TC-SEC-01)', () => {
    const { ledger } = freshEnv();
    const wallet = withCreditBalance(createWallet(pid), 1000);
    const r1 = spendCredits({
      wallet,
      amount: 300,
      reason: 'pack_purchase',
      idempotencyKey: 'buy-001',
      publisher: noopPublisher,
      ledger,
    });
    expect(r1.ok).toBe(true);
    const r2 = spendCredits({
      wallet,
      amount: 300,
      reason: 'pack_purchase',
      idempotencyKey: 'buy-001',
      publisher: noopPublisher,
      ledger,
    });
    expect(r2.ok).toBe(false);
    if (!r2.ok) expect(r2.error.field).toBe('idempotencyKey');
  });
});

// ─── FRAGMENTOS ───────────────────────────────────────────────────────────────

describe('depositFragments / spendFragments', () => {
  it('depositFragments com duplicate_conversion aumenta saldo', () => {
    const { wallet, ledger } = freshEnv();
    const r = depositFragments({
      wallet,
      amount: 150,
      reason: 'duplicate_conversion',
      publisher: noopPublisher,
      ledger,
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.wallet.fragments.amount).toBe(150);
  });

  it('depositFragments rejeita reason inválida', () => {
    const { wallet, ledger } = freshEnv();
    const r = depositFragments({
      wallet,
      amount: 150,
      reason: 'match_reward',
      publisher: noopPublisher,
      ledger,
    });
    expect(r.ok).toBe(false);
  });

  it('spendFragments com craft_cost diminui saldo', () => {
    const { ledger } = freshEnv();
    const wallet = withFragmentBalance(createWallet(pid), 1500);
    const r = spendFragments({
      wallet,
      amount: 1500,
      reason: 'craft_cost',
      publisher: noopPublisher,
      ledger,
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.wallet.fragments.amount).toBe(0);
  });

  it('TC-ECO-07 (fragmentos): rejeita saldo insuficiente', () => {
    const { wallet, ledger } = freshEnv();
    const r = spendFragments({
      wallet,
      amount: 1,
      reason: 'craft_cost',
      publisher: noopPublisher,
      ledger,
    });
    expect(r.ok).toBe(false);
  });

  it('spendFragments rejeita reason inválida (sem rota para premium — TC-ECO-04)', () => {
    const { ledger } = freshEnv();
    const wallet = withFragmentBalance(createWallet(pid), 9999);
    // Tentativa de usar fragmentos com reason que não é craft_cost
    const r = spendFragments({
      wallet,
      amount: 100,
      reason: 'premium_pack_purchase',
      publisher: noopPublisher,
      ledger,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.field).toBe('reason');
  });
});

// ─── PREMIUM ──────────────────────────────────────────────────────────────────

describe('depositPremium / spendPremium', () => {
  it('depositPremium com premium_top_up aumenta saldo', () => {
    const { wallet, ledger } = freshEnv();
    const r = depositPremium({
      wallet,
      amount: 100,
      reason: 'premium_top_up',
      publisher: noopPublisher,
      ledger,
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.wallet.premium.amount).toBe(100);
  });

  it('spendPremium com premium_pack_purchase diminui saldo', () => {
    const { ledger } = freshEnv();
    const wallet = withPremiumBalance(createWallet(pid), 50);
    const r = spendPremium({
      wallet,
      amount: 25,
      reason: 'premium_pack_purchase',
      publisher: noopPublisher,
      ledger,
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.wallet.premium.amount).toBe(25);
  });

  it('TC-ECO-07 (premium): rejeita saldo insuficiente', () => {
    const { wallet, ledger } = freshEnv();
    const r = spendPremium({
      wallet,
      amount: 1,
      reason: 'premium_pack_purchase',
      publisher: noopPublisher,
      ledger,
    });
    expect(r.ok).toBe(false);
  });

  it('TC-ECO-05: spendPremium rejeita qualquer reason de compra direta de carta', () => {
    const { ledger } = freshEnv();
    const wallet = withPremiumBalance(createWallet(pid), 9999);
    // Tentar gastar premium com reason que implica carta direta
    const r = spendPremium({
      wallet,
      amount: 100,
      reason: 'market_purchase',
      publisher: noopPublisher,
      ledger,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.field).toBe('reason');
  });

  it('TC-ECO-05: spendPremium rejeita reasons de créditos e fragmentos', () => {
    const { ledger } = freshEnv();
    const wallet = withPremiumBalance(createWallet(pid), 9999);
    for (const reason of ['pack_purchase', 'craft_cost', 'duplicate_conversion'] as const) {
      const r = spendPremium({ wallet, amount: 10, reason, publisher: noopPublisher, ledger });
      expect(r.ok).toBe(false);
    }
  });
});

// ─── Invariantes combinados ───────────────────────────────────────────────────

describe('Invariantes transversais', () => {
  it('múltiplas operações são acumulativas: saldo final = soma líquida', () => {
    const { ledger } = freshEnv();
    let w = createWallet(pid);

    const r1 = depositCredits({
      wallet: w,
      amount: 1000,
      reason: 'match_reward',
      publisher: noopPublisher,
      ledger,
    });
    if (r1.ok) w = r1.value.wallet;
    const r2 = depositCredits({
      wallet: w,
      amount: 500,
      reason: 'daily_objective',
      publisher: noopPublisher,
      ledger,
    });
    if (r2.ok) w = r2.value.wallet;
    const r3 = spendCredits({
      wallet: w,
      amount: 300,
      reason: 'pack_purchase',
      publisher: noopPublisher,
      ledger,
    });
    if (r3.ok) w = r3.value.wallet;

    expect(w.credits.amount).toBe(1200); // 1000+500-300
    expect(ledger.reconstructBalance(pid, 'credits')).toBe(1200); // TC-ECO-03
  });

  it('operações em moedas distintas são independentes', () => {
    const { ledger } = freshEnv();
    let w = createWallet(pid);

    const r1 = depositCredits({
      wallet: w,
      amount: 500,
      reason: 'match_reward',
      publisher: noopPublisher,
      ledger,
    });
    if (r1.ok) w = r1.value.wallet;
    const r2 = depositFragments({
      wallet: w,
      amount: 200,
      reason: 'duplicate_conversion',
      publisher: noopPublisher,
      ledger,
    });
    if (r2.ok) w = r2.value.wallet;
    const r3 = depositPremium({
      wallet: w,
      amount: 10,
      reason: 'premium_top_up',
      publisher: noopPublisher,
      ledger,
    });
    if (r3.ok) w = r3.value.wallet;

    expect(w.credits.amount).toBe(500);
    expect(w.fragments.amount).toBe(200);
    expect(w.premium.amount).toBe(10);
  });

  it('Wallet anterior é preservada após cada operação (imutabilidade total)', () => {
    const { ledger } = freshEnv();
    const w0 = createWallet(pid);
    const r = depositCredits({
      wallet: w0,
      amount: 999,
      reason: 'match_reward',
      publisher: noopPublisher,
      ledger,
    });
    expect(w0.credits.amount).toBe(0);
    if (r.ok) expect(r.value.wallet.credits.amount).toBe(999);
  });
});
