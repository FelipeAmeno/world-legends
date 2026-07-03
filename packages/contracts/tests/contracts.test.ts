/**
 * T038 — Contracts · 25 testes
 *
 * TC-CON-01..05  createContract (defaults, custom, erros)
 * TC-CON-06..10  useContract / useContractN (consumo, floor, erro)
 * TC-CON-11..15  isExpired, canField, status
 * TC-CON-16..20  renewContract (renovação, cap, erros)
 * TC-CON-21..25  applyMatchContracts, report, validateSquad
 */
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CONTRACTS,
  LOW_CONTRACT_THRESHOLD,
  MAX_CONTRACTS,
  applyMatchContracts,
  canField,
  contractStatus,
  createContract,
  generateContractReport,
  isExpired,
  renewBatch,
  renewContract,
  useContract,
  useContractN,
  validateSquadContracts,
} from '../src/index';
import type { Contract } from '../src/index';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeContract(remaining: number, max = MAX_CONTRACTS): Contract {
  return Object.freeze({
    userCardId: `uc-${remaining}`,
    contractsRemaining: remaining,
    maxContracts: max,
    status: contractStatus(remaining),
  });
}

// ─── TC-CON-01..05: createContract ────────────────────────────────────────────

describe('TC-CON-01..05: createContract', () => {
  it('TC-CON-01: cria contrato com DEFAULT_CONTRACTS = 7', () => {
    const r = createContract('uc-1');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.contractsRemaining).toBe(DEFAULT_CONTRACTS);
    expect(r.value.userCardId).toBe('uc-1');
    expect(r.value.maxContracts).toBe(MAX_CONTRACTS);
    expect(r.value.status).toBe('active');
  });

  it('TC-CON-02: cria contrato com valor customizado', () => {
    const r = createContract('uc-2', 3);
    if (!r.ok) return;
    expect(r.value.contractsRemaining).toBe(3);
    expect(r.value.status).toBe('active');
  });

  it('TC-CON-03: cria com 0 contratos → status expired', () => {
    const r = createContract('uc-3', 0);
    if (!r.ok) return;
    expect(r.value.contractsRemaining).toBe(0);
    expect(r.value.status).toBe('expired');
  });

  it('TC-CON-04: userCardId vazio → erro', () => {
    expect(createContract('').ok).toBe(false);
    expect(createContract('   ').ok).toBe(false);
  });

  it('TC-CON-05: contratos excedendo maxContracts → erro ExceedsMax', () => {
    const r = createContract('uc-5', 50, 30); // 50 > max(30)
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toMatchObject({ kind: 'ExceedsMax', max: 30 });
  });
});

// ─── TC-CON-06..10: useContract / useContractN ────────────────────────────────

describe('TC-CON-06..10: useContract e useContractN', () => {
  it('TC-CON-06: useContract decrementa em 1', () => {
    const c = makeContract(5);
    const r = useContract(c);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.contractsRemaining).toBe(4);
  });

  it('TC-CON-07: useContract em carta expirada → ContractExpired', () => {
    const c = makeContract(0);
    const r = useContract(c);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toMatchObject({ kind: 'ContractExpired' });
  });

  it('TC-CON-08: useContract sequencial 3→2→1→0, depois erro', () => {
    let c = makeContract(3);
    c = (useContract(c) as any).value;
    expect(c.contractsRemaining).toBe(2);
    c = (useContract(c) as any).value;
    expect(c.contractsRemaining).toBe(1);
    c = (useContract(c) as any).value;
    expect(c.contractsRemaining).toBe(0);
    expect(c.status).toBe('expired');
    // Próxima tentativa → erro
    const r = useContract(c);
    expect(r.ok).toBe(false);
  });

  it('TC-CON-09: useContractN consome N de uma vez', () => {
    const c = makeContract(7);
    const r = useContractN(c, 3);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.contractsRemaining).toBe(4);
  });

  it('TC-CON-10: useContractN com n inválido (0 ou negativo) → InvalidAmount', () => {
    const c = makeContract(5);
    expect(useContractN(c, 0).ok).toBe(false);
    expect(useContractN(c, -1).ok).toBe(false);
    if (useContractN(c, 0).ok) return;
    expect((useContractN(c, 0) as any).error.kind).toBe('InvalidAmount');
  });
});

// ─── TC-CON-11..15: isExpired, canField, status ───────────────────────────────

describe('TC-CON-11..15: isExpired, canField, contractStatus', () => {
  it('TC-CON-11: isExpired = true quando 0 contratos', () => {
    expect(isExpired(makeContract(0))).toBe(true);
    expect(isExpired(makeContract(1))).toBe(false);
  });

  it('TC-CON-12: canField = false quando expirado', () => {
    expect(canField(makeContract(0))).toBe(false);
    expect(canField(makeContract(5))).toBe(true);
  });

  it('TC-CON-13: status "low" quando ≤ LOW_CONTRACT_THRESHOLD', () => {
    expect(contractStatus(0)).toBe('expired');
    expect(contractStatus(1)).toBe('low');
    expect(contractStatus(LOW_CONTRACT_THRESHOLD)).toBe('low');
    expect(contractStatus(LOW_CONTRACT_THRESHOLD + 1)).toBe('active');
  });

  it('TC-CON-14: status reflete contractsRemaining após useContract', () => {
    let c = makeContract(3);
    expect(c.status).toBe('active'); // 3 > LOW(2)
    c = (useContract(c) as any).value; // 2 → low
    expect(c.status).toBe('low');
    c = (useContract(c) as any).value; // 1 → low
    expect(c.status).toBe('low');
    c = (useContract(c) as any).value; // 0 → expired
    expect(c.status).toBe('expired');
  });

  it('TC-CON-15: DEFAULT_CONTRACTS = 7, LOW_CONTRACT_THRESHOLD = 2', () => {
    expect(DEFAULT_CONTRACTS).toBe(7);
    expect(LOW_CONTRACT_THRESHOLD).toBe(2);
  });
});

// ─── TC-CON-16..20: renewContract ────────────────────────────────────────────

describe('TC-CON-16..20: renewContract', () => {
  it('TC-CON-16: renova contrato expirado', () => {
    const expired = makeContract(0);
    const r = renewContract(expired, 5);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.contractsRemaining).toBe(5);
    expect(r.value.status).toBe('active');
  });

  it('TC-CON-17: renova contrato baixo → status sobe para active', () => {
    const low = makeContract(1);
    const r = renewContract(low, 6);
    if (!r.ok) return;
    expect(r.value.contractsRemaining).toBe(7);
    expect(r.value.status).toBe('active');
  });

  it('TC-CON-18: renovar além do maxContracts → ExceedsMax', () => {
    const c = makeContract(90, 99); // 90/99 restantes
    const r = renewContract(c, 15); // 90+15=105 > 99
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toMatchObject({ kind: 'ExceedsMax', max: 99 });
  });

  it('TC-CON-19: renovar com amount ≤ 0 → InvalidAmount', () => {
    const c = makeContract(3);
    expect(renewContract(c, 0).ok).toBe(false);
    expect(renewContract(c, -1).ok).toBe(false);
  });

  it('TC-CON-20: renewBatch renova múltiplas cartas', () => {
    const contracts = [makeContract(0), makeContract(1), makeContract(5)];
    const results = renewBatch(contracts, 3);
    expect(results).toHaveLength(3);
    expect(results[0]!.ok).toBe(true); // 0+3 = 3
    expect(results[1]!.ok).toBe(true); // 1+3 = 4
    expect(results[2]!.ok).toBe(true); // 5+3 = 8
    if (!results[0]!.ok || !results[1]!.ok || !results[2]!.ok) return;
    expect(results[0]!.value.contractsRemaining).toBe(3);
    expect(results[1]!.value.contractsRemaining).toBe(4);
    expect(results[2]!.value.contractsRemaining).toBe(8);
  });
});

// ─── TC-CON-21..25: applyMatchContracts, report, validateSquad ───────────────

describe('TC-CON-21..25: applyMatchContracts e relatório', () => {
  it('TC-CON-21: applyMatchContracts −1 para jogadores que jogaram', () => {
    const contracts = [makeContract(5, 99), makeContract(3, 99), makeContract(7, 99)];
    const contracts2 = [
      { ...contracts[0]!, userCardId: 'uc-a' },
      { ...contracts[1]!, userCardId: 'uc-b' },
      { ...contracts[2]!, userCardId: 'uc-c' },
    ];
    const results = applyMatchContracts(contracts2, ['uc-a', 'uc-c']); // b não jogou
    expect(results).toHaveLength(3);

    const resA = results.find((r) => r.userCardId === 'uc-a');
    const resB = results.find((r) => r.userCardId === 'uc-b');
    const resC = results.find((r) => r.userCardId === 'uc-c');

    expect(resA!.contract.contractsRemaining).toBe(4); // 5-1
    expect(resB!.contract.contractsRemaining).toBe(3); // intacto
    expect(resC!.contract.contractsRemaining).toBe(6); // 7-1
  });

  it('TC-CON-22: applyMatchContracts detecta justExpired', () => {
    const c = {
      userCardId: 'uc-last',
      contractsRemaining: 1,
      maxContracts: 99,
      status: 'low' as const,
    };
    const results = applyMatchContracts([c], ['uc-last']);
    expect(results[0]!.justExpired).toBe(true);
    expect(results[0]!.contract.contractsRemaining).toBe(0);
    expect(results[0]!.contract.status).toBe('expired');
  });

  it('TC-CON-23: applyMatchContracts ignora cartas já expiradas', () => {
    const c = makeContract(0); // já expirado
    const contracts = [{ ...c, userCardId: 'uc-exp' }];
    const results = applyMatchContracts(contracts, ['uc-exp']);
    expect(results[0]!.contract.contractsRemaining).toBe(0); // permanece 0
    expect(results[0]!.justExpired).toBe(false);
  });

  it('TC-CON-24: generateContractReport classifica corretamente', () => {
    const squad = [
      { userCardId: 'a', contractsRemaining: 5, maxContracts: 99, status: 'active' as const },
      { userCardId: 'b', contractsRemaining: 1, maxContracts: 99, status: 'low' as const },
      { userCardId: 'c', contractsRemaining: 0, maxContracts: 99, status: 'expired' as const },
      { userCardId: 'd', contractsRemaining: 2, maxContracts: 99, status: 'low' as const },
    ];
    const report = generateContractReport(squad);
    expect(report.totalCards).toBe(4);
    expect(report.activeCount).toBe(1);
    expect(report.lowCount).toBe(2);
    expect(report.expiredCount).toBe(1);
    expect(report.expiredCardIds).toContain('c');
    expect(report.lowCardIds).toContain('b');
    expect(report.lowCardIds).toContain('d');
  });

  it('TC-CON-25: validateSquadContracts bloqueia cartas expiradas', () => {
    const squad = [
      { userCardId: 'ok1', contractsRemaining: 5, maxContracts: 99, status: 'active' as const },
      { userCardId: 'ok2', contractsRemaining: 2, maxContracts: 99, status: 'low' as const },
      { userCardId: 'exp', contractsRemaining: 0, maxContracts: 99, status: 'expired' as const },
    ];
    const result = validateSquadContracts(squad);
    expect(result.valid).toBe(false);
    expect(result.blockedCardIds).toContain('exp');
    expect(result.blockedCardIds).toHaveLength(1);
    expect(result.message).toContain('exp');

    // Squad totalmente válido
    const validSquad = squad.filter((c) => c.userCardId !== 'exp');
    const valid = validateSquadContracts(validSquad);
    expect(valid.valid).toBe(true);
    expect(valid.blockedCardIds).toHaveLength(0);
  });
});
