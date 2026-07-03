import { describe, expect, it } from 'vitest';
import {
  createWallet,
  getBalance,
  profileId,
  withCreditBalance,
  withFragmentBalance,
  withPremiumBalance,
} from '../../src/wallet/types';

const pid = profileId('profile-test-01');

describe('createWallet', () => {
  it('cria uma wallet com os três saldos zerados', () => {
    const w = createWallet(pid);
    expect(w.credits.amount).toBe(0);
    expect(w.fragments.amount).toBe(0);
    expect(w.premium.amount).toBe(0);
    expect(w.profileId).toBe(pid);
  });

  it('é imutável (Object.freeze)', () => {
    const w = createWallet(pid);
    expect(Object.isFrozen(w)).toBe(true);
    expect(Object.isFrozen(w.credits)).toBe(true);
    expect(Object.isFrozen(w.fragments)).toBe(true);
    expect(Object.isFrozen(w.premium)).toBe(true);
  });

  it('tipos nominais distintos (_type guards)', () => {
    const w = createWallet(pid);
    expect(w.credits._type).toBe('CreditBalance');
    expect(w.fragments._type).toBe('FragmentBalance');
    expect(w.premium._type).toBe('PremiumBalance');
  });
});

describe('getBalance', () => {
  it('retorna o amount correto por currency', () => {
    let w = createWallet(pid);
    w = withCreditBalance(w, 500);
    w = withFragmentBalance(w, 120);
    w = withPremiumBalance(w, 10);
    expect(getBalance(w, 'credits')).toBe(500);
    expect(getBalance(w, 'fragments')).toBe(120);
    expect(getBalance(w, 'premium')).toBe(10);
  });
});

describe('withCreditBalance / withFragmentBalance / withPremiumBalance', () => {
  it('retorna uma nova Wallet sem mutar a original', () => {
    const original = createWallet(pid);
    const updated = withCreditBalance(original, 999);
    expect(original.credits.amount).toBe(0);
    expect(updated.credits.amount).toBe(999);
    expect(Object.isFrozen(updated)).toBe(true);
  });

  it('não altera os outros saldos ao atualizar um', () => {
    let w = createWallet(pid);
    w = withFragmentBalance(w, 200);
    expect(w.credits.amount).toBe(0);
    expect(w.premium.amount).toBe(0);
    expect(w.fragments.amount).toBe(200);
  });

  it('profileId é preservado em todas as transformações', () => {
    const w = withPremiumBalance(withCreditBalance(createWallet(pid), 100), 5);
    expect(w.profileId).toBe(pid);
  });
});
