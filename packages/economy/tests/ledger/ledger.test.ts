import { ZERO_CREDITS, addMoney, createMoney, subtractMoney } from '@world-legends/shared';
import { describe, expect, it } from 'vitest';
import { createInMemoryLedger } from '../../src/ledger/in-memory-ledger';
import { ledgerEntryId } from '../../src/ledger/types';
import type { LedgerEntry } from '../../src/ledger/types';
import { profileId } from '../../src/wallet/types';

const pid = profileId('ledger-test-01');

describe('createMoney (shared)', () => {
  it('cria com amount inteiro positivo', () => {
    const r = createMoney(100, 'credits');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.amount).toBe(100);
  });

  it('rejeita amount negativo', () => {
    const r = createMoney(-1, 'credits');
    expect(r.ok).toBe(false);
  });

  it('rejeita amount não-inteiro', () => {
    const r = createMoney(1.5, 'fragments');
    expect(r.ok).toBe(false);
  });

  it('rejeita amount zero implicitamente (é ≥ 0, mas 0 é válido para zero-balance)', () => {
    const r = createMoney(0, 'credits');
    expect(r.ok).toBe(true); // 0 é válido como VO de saldo zerado
  });

  it('ZERO_CREDITS é amount=0', () => {
    expect(ZERO_CREDITS.amount).toBe(0);
    expect(ZERO_CREDITS.currency).toBe('credits');
  });

  it('addMoney soma dois valores da mesma moeda', () => {
    const a = createMoney(300, 'credits');
    const b = createMoney(200, 'credits');
    if (!a.ok || !b.ok) throw new Error('fixture');
    const r = addMoney(a.value, b.value);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.amount).toBe(500);
  });

  it('subtractMoney falha quando resultado seria negativo', () => {
    const a = createMoney(100, 'credits');
    const b = createMoney(200, 'credits');
    if (!a.ok || !b.ok) throw new Error('fixture');
    const r = subtractMoney(a.value, b.value);
    expect(r.ok).toBe(false);
  });

  it('addMoney/subtractMoney rejeitam moedas diferentes', () => {
    const credits = createMoney(100, 'credits');
    const frags = createMoney(100, 'fragments');
    if (!credits.ok || !frags.ok) throw new Error('fixture');
    expect(addMoney(credits.value, frags.value).ok).toBe(false);
    expect(subtractMoney(credits.value, frags.value).ok).toBe(false);
  });
});

describe('InMemoryLedger', () => {
  function makeEntry(overrides: Partial<LedgerEntry> = {}): LedgerEntry {
    return Object.freeze({
      id: ledgerEntryId('e-001'),
      profileId: pid,
      currency: 'credits' as const,
      amount: 100,
      reason: 'match_reward' as const,
      occurredAt: new Date(),
      ...overrides,
    });
  }

  it('append e findByProfile', () => {
    const ledger = createInMemoryLedger();
    ledger.append(makeEntry());
    expect(ledger.findByProfile(pid).length).toBe(1);
  });

  it('findByProfileAndCurrency filtra por moeda', () => {
    const ledger = createInMemoryLedger();
    ledger.append(makeEntry({ currency: 'credits', amount: 100 }));
    ledger.append(
      makeEntry({
        id: ledgerEntryId('e-002'),
        currency: 'fragments',
        amount: 50,
        reason: 'duplicate_conversion',
      }),
    );
    expect(ledger.findByProfileAndCurrency(pid, 'credits').length).toBe(1);
    expect(ledger.findByProfileAndCurrency(pid, 'fragments').length).toBe(1);
    expect(ledger.findByProfileAndCurrency(pid, 'premium').length).toBe(0);
  });

  it('reconstructBalance = Σ(amounts) — verifica TC-ECO-03', () => {
    const ledger = createInMemoryLedger();
    ledger.append(makeEntry({ id: ledgerEntryId('e-a'), amount: 500 }));
    ledger.append(makeEntry({ id: ledgerEntryId('e-b'), amount: -200, reason: 'pack_purchase' }));
    ledger.append(makeEntry({ id: ledgerEntryId('e-c'), amount: 100 }));
    expect(ledger.reconstructBalance(pid, 'credits')).toBe(400); // 500-200+100
  });

  it('hasIdempotencyKey retorna false antes e true depois do append', () => {
    const ledger = createInMemoryLedger();
    expect(ledger.hasIdempotencyKey(pid, 'key-1')).toBe(false);
    ledger.append(makeEntry({ idempotencyKey: 'key-1' }));
    expect(ledger.hasIdempotencyKey(pid, 'key-1')).toBe(true);
  });

  it('append com mesma idempotencyKey lança erro (imutabilidade da operação)', () => {
    const ledger = createInMemoryLedger();
    ledger.append(makeEntry({ idempotencyKey: 'key-dup' }));
    let threw = false;
    try {
      ledger.append(makeEntry({ id: ledgerEntryId('e-dup'), idempotencyKey: 'key-dup' }));
    } catch {
      threw = true;
    }
    expect(threw).toBe(true);
  });

  it('append é append-only: findByProfile retorna em ordem de inserção', () => {
    const ledger = createInMemoryLedger();
    ledger.append(makeEntry({ id: ledgerEntryId('first'), amount: 100 }));
    ledger.append(makeEntry({ id: ledgerEntryId('second'), amount: 200 }));
    const entries = ledger.findByProfile(pid);
    expect(entries[0]?.id).toBe('first' as any);
    expect(entries[1]?.id).toBe('second' as any);
  });
});
