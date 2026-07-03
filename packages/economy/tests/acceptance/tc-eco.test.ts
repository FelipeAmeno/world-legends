import { createCollectorPublisher, noopPublisher } from '@world-legends/shared';
/**
 * Testes de aceitação de Economia — doc 13 §12.
 * TC-ECO-01 a TC-ECO-07, identificados por nome.
 */
import { describe, expect, it } from 'vitest';
import { createInMemoryLedger } from '../../src/ledger/in-memory-ledger';
import {
  FRAGMENT_SINK_REASONS,
  FRAGMENT_SOURCE_REASONS,
  PREMIUM_SINK_REASONS,
  PREMIUM_SOURCE_REASONS,
} from '../../src/ledger/types';
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

const pid = profileId('tc-eco-profile');

function freshEnv() {
  return { wallet: createWallet(pid), ledger: createInMemoryLedger() };
}

describe('TC-ECO-01 — Sources registrados: toda fonte gera evento economy_*_earned', () => {
  it('depositCredits com match_reward emite economy_credits_earned', () => {
    const { wallet, ledger } = freshEnv();
    const { publisher, events } = createCollectorPublisher();
    depositCredits({ wallet, amount: 300, reason: 'match_reward', publisher, ledger });
    expect(events.length).toBe(1);
    expect(events[0]?.eventType).toBe('economy_credits_earned');
    if (events[0]?.eventType === 'economy_credits_earned') {
      expect((events[0].payload as any).amount).toBe(300);
      expect((events[0].payload as any).reason).toBe('match_reward');
      expect((events[0].payload as any).newBalance).toBe(300);
    }
  });

  it('depositFragments com duplicate_conversion emite economy_fragments_earned', () => {
    const { wallet, ledger } = freshEnv();
    const { publisher, events } = createCollectorPublisher();
    depositFragments({ wallet, amount: 150, reason: 'duplicate_conversion', publisher, ledger });
    expect(events[0]?.eventType).toBe('economy_fragments_earned');
  });

  it('depositPremium com premium_top_up emite economy_premium_purchased', () => {
    const { wallet, ledger } = freshEnv();
    const { publisher, events } = createCollectorPublisher();
    depositPremium({ wallet, amount: 50, reason: 'premium_top_up', publisher, ledger });
    expect(events[0]?.eventType).toBe('economy_premium_purchased');
  });

  it('exatamente 1 evento por operação de depósito', () => {
    const { wallet, ledger } = freshEnv();
    const { publisher, events } = createCollectorPublisher();
    depositCredits({ wallet, amount: 100, reason: 'daily_objective', publisher, ledger });
    expect(events.length).toBe(1);
  });
});

describe('TC-ECO-02 — Sinks registrados: toda remoção gera evento economy_*_spent', () => {
  it('spendCredits com pack_purchase emite economy_credits_spent com payload correto', () => {
    const { ledger } = freshEnv();
    const { publisher, events } = createCollectorPublisher();
    const wallet = withCreditBalance(createWallet(pid), 1000);
    spendCredits({ wallet, amount: 400, reason: 'pack_purchase', publisher, ledger });
    expect(events[0]?.eventType).toBe('economy_credits_spent');
    if (events[0]?.eventType === 'economy_credits_spent') {
      expect((events[0].payload as any).amount).toBe(400);
      expect((events[0].payload as any).newBalance).toBe(600);
    }
  });

  it('spendFragments com craft_cost emite economy_fragments_spent', () => {
    const { ledger } = freshEnv();
    const { publisher, events } = createCollectorPublisher();
    const wallet = withFragmentBalance(createWallet(pid), 1500);
    spendFragments({ wallet, amount: 1500, reason: 'craft_cost', publisher, ledger });
    expect(events[0]?.eventType).toBe('economy_fragments_spent');
  });

  it('spendPremium com premium_pack_purchase emite economy_premium_spent', () => {
    const { ledger } = freshEnv();
    const { publisher, events } = createCollectorPublisher();
    const wallet = withPremiumBalance(createWallet(pid), 100);
    spendPremium({ wallet, amount: 50, reason: 'premium_pack_purchase', publisher, ledger });
    expect(events[0]?.eventType).toBe('economy_premium_spent');
  });

  it('operações que falham (saldo insuficiente) NÃO emitem evento', () => {
    const { wallet, ledger } = freshEnv();
    const { publisher, events } = createCollectorPublisher();
    spendCredits({ wallet, amount: 1000, reason: 'pack_purchase', publisher, ledger }); // saldo 0
    expect(events.length).toBe(0);
  });
});

describe('TC-ECO-03 — Índice de Inflação: saldo reconstruível a partir do ledger bruto', () => {
  it('Σ(entry.amount) por currency = saldo atual após 5 operações mistas', () => {
    const ledger = createInMemoryLedger();
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
    const r4 = depositCredits({
      wallet: w,
      amount: 200,
      reason: 'weekly_objective',
      publisher: noopPublisher,
      ledger,
    });
    if (r4.ok) w = r4.value.wallet;
    const r5 = spendCredits({
      wallet: w,
      amount: 100,
      reason: 'market_listing_fee',
      publisher: noopPublisher,
      ledger,
    });
    if (r5.ok) w = r5.value.wallet;

    const reconstructed = ledger.reconstructBalance(pid, 'credits');
    expect(reconstructed).toBe(w.credits.amount); // 1300
    expect(reconstructed).toBe(1300);
  });

  it('saldo reconstruído de fragmentos também bate com o saldo da wallet', () => {
    const ledger = createInMemoryLedger();
    let w = createWallet(pid);
    const r1 = depositFragments({
      wallet: w,
      amount: 500,
      reason: 'duplicate_conversion',
      publisher: noopPublisher,
      ledger,
    });
    if (r1.ok) w = r1.value.wallet;
    const r2 = spendFragments({
      wallet: w,
      amount: 200,
      reason: 'craft_cost',
      publisher: noopPublisher,
      ledger,
    });
    if (r2.ok) w = r2.value.wallet;
    expect(ledger.reconstructBalance(pid, 'fragments')).toBe(w.fragments.amount);
  });
});

describe('TC-ECO-04 — Fragmentos: nenhuma rota para moeda premium', () => {
  it('nenhum LedgerReason de fragmentos está presente nos sinks de premium', () => {
    for (const reason of FRAGMENT_SOURCE_REASONS) {
      expect(PREMIUM_SINK_REASONS.has(reason)).toBe(false);
    }
    for (const reason of FRAGMENT_SINK_REASONS) {
      expect(PREMIUM_SINK_REASONS.has(reason)).toBe(false);
      expect(PREMIUM_SOURCE_REASONS.has(reason)).toBe(false);
    }
  });

  it('tentativa de gastar fragmentos com reason de premium falha (sem rota)', () => {
    const { ledger } = freshEnv();
    const wallet = withFragmentBalance(createWallet(pid), 9999);
    const r = spendFragments({
      wallet,
      amount: 100,
      reason: 'premium_top_up',
      publisher: noopPublisher,
      ledger,
    });
    expect(r.ok).toBe(false);
  });

  it('o sistema inteiro não tem função que converta fragments → premium', () => {
    // TC-ECO-04 como verificação estrutural: os únicos use-cases que
    // modificam premium são depositPremium e spendPremium — nenhum recebe
    // input de fragmentos. Verificado pela ausência de parâmetro relacionado.
    // Este teste documenta a garantia estrutural, não verifica em runtime.
    expect(FRAGMENT_SINK_REASONS.has('premium_top_up')).toBe(false);
    expect(FRAGMENT_SINK_REASONS.has('premium_pack_purchase')).toBe(false);
    expect(FRAGMENT_SINK_REASONS.has('premium_cosmetic')).toBe(false);
  });
});

describe('TC-ECO-05 — Moeda premium: nunca compra carta diretamente', () => {
  it('PREMIUM_SINK_REASONS só contém pack_purchase e cosmetic — sem card_direct', () => {
    expect(PREMIUM_SINK_REASONS.has('premium_pack_purchase')).toBe(true);
    expect(PREMIUM_SINK_REASONS.has('premium_cosmetic')).toBe(true);
    expect(PREMIUM_SINK_REASONS.size).toBe(2); // exatamente 2 — sem mais nada
  });

  it('spendPremium rejeita qualquer reason não-elegível com erro em field=reason', () => {
    const { ledger } = freshEnv();
    const wallet = withPremiumBalance(createWallet(pid), 9999);
    const ineligible = [
      'match_reward',
      'pack_purchase',
      'duplicate_conversion',
      'craft_cost',
      'market_purchase',
      'market_listing_fee',
    ] as const;
    for (const reason of ineligible) {
      const r = spendPremium({ wallet, amount: 10, reason, publisher: noopPublisher, ledger });
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.field).toBe('reason');
    }
  });

  it('nenhum evento é emitido quando spendPremium falha por reason proibida', () => {
    const { ledger } = freshEnv();
    const wallet = withPremiumBalance(createWallet(pid), 9999);
    const { publisher, events } = createCollectorPublisher();
    spendPremium({ wallet, amount: 10, reason: 'market_purchase', publisher, ledger });
    expect(events.length).toBe(0);
  });
});

describe('TC-ECO-07 — Saldo nunca negativo em nenhuma moeda', () => {
  it('créditos: spendCredits com amount > saldo retorna Err, saldo inalterado', () => {
    const { wallet, ledger } = freshEnv();
    const { publisher, events } = createCollectorPublisher();
    const r = spendCredits({ wallet, amount: 1, reason: 'pack_purchase', publisher, ledger });
    expect(r.ok).toBe(false);
    expect(wallet.credits.amount).toBe(0); // original inalterado
    expect(events.length).toBe(0); // nenhum evento publicado
    expect(ledger.findByProfile(pid).length).toBe(0); // nada no ledger
  });

  it('fragmentos: spendFragments com amount > saldo retorna Err', () => {
    const { wallet, ledger } = freshEnv();
    const r = spendFragments({
      wallet,
      amount: 1,
      reason: 'craft_cost',
      publisher: noopPublisher,
      ledger,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.field).toBe('amount');
  });

  it('premium: spendPremium com amount > saldo retorna Err', () => {
    const { wallet, ledger } = freshEnv();
    const r = spendPremium({
      wallet,
      amount: 1,
      reason: 'premium_pack_purchase',
      publisher: noopPublisher,
      ledger,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.field).toBe('amount');
  });

  it('TC-ECO-07: saldo zero é válido (exatamente zerar a conta)', () => {
    const { ledger } = freshEnv();
    const wallet = withCreditBalance(createWallet(pid), 100);
    const r = spendCredits({
      wallet,
      amount: 100,
      reason: 'pack_purchase',
      publisher: noopPublisher,
      ledger,
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.wallet.credits.amount).toBe(0);
  });
});
