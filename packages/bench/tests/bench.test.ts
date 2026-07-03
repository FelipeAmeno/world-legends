/**
 * T035 — Bench System · 25 testes
 *
 * TC-BENCH-01..05  createBench + estrutura
 * TC-BENCH-06..11  addToBench / removeFromBench
 * TC-BENCH-12..17  substitute (regras e erros)
 * TC-BENCH-18..22  calculateBenchMoral (fórmula e níveis)
 * TC-BENCH-23..25  invariantes: moral ≠ química, determinismo, overflow
 */
import { describe, expect, it } from 'vitest';
import {
  MAX_BENCH_SIZE,
  MAX_SUBSTITUTIONS_MATCH,
  addToBench,
  calculateBenchMoral,
  createBench,
  moralLevel,
  removeFromBench,
  substitute,
} from '../src/index';
import type { BenchPlayer } from '../src/index';

// ─── Fixtures ──────────────────────────────────────────────────────────────────

function bp(id: string, ovr = 80, opts: Partial<BenchPlayer> = {}): BenchPlayer {
  return Object.freeze({
    userCardId: id,
    position: 'CM' as any,
    overall: ovr,
    traits: [],
    isInjured: false,
    suspendedMatches: 0,
    ...opts,
  });
}

function fullBench(squadId = 'sq-1') {
  const r = createBench(squadId);
  if (!r.ok) throw new Error();
  let bench = r.value;
  for (let i = 0; i < 7; i++) {
    const a = addToBench({ bench, player: bp(`p${i}`, 80) });
    if (!a.ok) throw new Error(`addToBench p${i}: ${JSON.stringify(a.error)}`);
    bench = a.value;
  }
  return bench;
}

// ─── TC-BENCH-01..05: createBench ─────────────────────────────────────────────

describe('TC-BENCH-01..05: createBench', () => {
  it('TC-BENCH-01: cria banco vazio', () => {
    const r = createBench('sq-1');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.players).toHaveLength(0);
    expect(r.value.substitutions).toHaveLength(0);
    expect(r.value.squadId).toBe('sq-1');
  });

  it('TC-BENCH-02: subsRemaining = MAX_SUBSTITUTIONS_MATCH (3)', () => {
    const r = createBench('sq-1');
    if (!r.ok) return;
    expect(r.value.subsRemaining).toBe(MAX_SUBSTITUTIONS_MATCH);
    expect(r.value.subsRemaining).toBe(3);
  });

  it('TC-BENCH-03: MAX_BENCH_SIZE = 7', () => {
    expect(MAX_BENCH_SIZE).toBe(7);
  });

  it('TC-BENCH-04: squadId vazio → erro', () => {
    expect(createBench('').ok).toBe(false);
    expect(createBench('   ').ok).toBe(false);
  });

  it('TC-BENCH-05: banco é imutável (frozen)', () => {
    const r = createBench('sq-1');
    if (!r.ok) return;
    expect(Object.isFrozen(r.value)).toBe(true);
    expect(Object.isFrozen(r.value.players)).toBe(true);
  });
});

// ─── TC-BENCH-06..11: addToBench / removeFromBench ────────────────────────────

describe('TC-BENCH-06..11: addToBench / removeFromBench', () => {
  it('TC-BENCH-06: adicionar jogador ao banco', () => {
    const r = createBench('sq-1');
    if (!r.ok) return;
    const a = addToBench({ bench: r.value, player: bp('p1', 85) });
    expect(a.ok).toBe(true);
    if (!a.ok) return;
    expect(a.value.players).toHaveLength(1);
    expect(a.value.players[0]!.userCardId).toBe('p1');
  });

  it('TC-BENCH-07: banco cheio (7) → BenchFull', () => {
    const bench = fullBench();
    const a = addToBench({ bench, player: bp('p8', 80) });
    expect(a.ok).toBe(false);
    if (a.ok) return;
    expect(a.error).toMatchObject({ kind: 'BenchFull', currentSize: 7 });
  });

  it('TC-BENCH-08: mesmo jogador duas vezes → PlayerAlreadyOnBench', () => {
    const r = createBench('sq-1');
    if (!r.ok) return;
    const a1 = addToBench({ bench: r.value, player: bp('dup', 80) });
    if (!a1.ok) return;
    const a2 = addToBench({ bench: a1.value, player: bp('dup', 80) });
    expect(a2.ok).toBe(false);
    if (a2.ok) return;
    expect(a2.error).toMatchObject({ kind: 'PlayerAlreadyOnBench', userCardId: 'dup' });
  });

  it('TC-BENCH-09: remover jogador do banco', () => {
    const r = createBench('sq-1');
    if (!r.ok) return;
    const a = addToBench({ bench: r.value, player: bp('rem', 80) });
    if (!a.ok) return;
    const rem = removeFromBench({ bench: a.value, userCardId: 'rem' });
    expect(rem.ok).toBe(true);
    if (!rem.ok) return;
    expect(rem.value.players).toHaveLength(0);
  });

  it('TC-BENCH-10: remover jogador inexistente → PlayerNotOnBench', () => {
    const r = createBench('sq-1');
    if (!r.ok) return;
    const rem = removeFromBench({ bench: r.value, userCardId: 'ghost' });
    expect(rem.ok).toBe(false);
    if (rem.ok) return;
    expect(rem.error).toMatchObject({ kind: 'PlayerNotOnBench', userCardId: 'ghost' });
  });

  it('TC-BENCH-11: adicionar até o máximo (7) sem erro', () => {
    const bench = fullBench();
    expect(bench.players).toHaveLength(7);
  });
});

// ─── TC-BENCH-12..17: substitute ─────────────────────────────────────────────

describe('TC-BENCH-12..17: substitute', () => {
  it('TC-BENCH-12: substituição válida remove reserva do banco', () => {
    const r = createBench('sq-1');
    if (!r.ok) return;
    const a = addToBench({ bench: r.value, player: bp('sub1', 85) });
    if (!a.ok) return;
    const s = substitute({
      bench: a.value,
      playerOutId: 'starter1',
      playerOutOvr: 80,
      playerInId: 'sub1',
      minute: 60,
      reason: 'tactical',
      generateId: () => 'sub-id-1',
    });
    expect(s.ok).toBe(true);
    if (!s.ok) return;
    expect(s.value.players.find((p) => p.userCardId === 'sub1')).toBeUndefined();
    expect(s.value.substitutions).toHaveLength(1);
    expect(s.value.subsRemaining).toBe(2);
  });

  it('TC-BENCH-13: reserva não está no banco → PlayerNotOnBench', () => {
    const r = createBench('sq-1');
    if (!r.ok) return;
    const s = substitute({
      bench: r.value,
      playerOutId: 'out1',
      playerOutOvr: 80,
      playerInId: 'ghost',
      minute: 45,
      reason: 'tactical',
    });
    expect(s.ok).toBe(false);
    if (s.ok) return;
    expect(s.error).toMatchObject({ kind: 'PlayerNotOnBench', userCardId: 'ghost' });
  });

  it('TC-BENCH-14: reserva lesionada → PlayerInjured', () => {
    const r = createBench('sq-1');
    if (!r.ok) return;
    const a = addToBench({ bench: r.value, player: bp('inj', 80, { isInjured: true }) });
    if (!a.ok) return;
    const s = substitute({
      bench: a.value,
      playerOutId: 'out',
      playerOutOvr: 80,
      playerInId: 'inj',
      minute: 70,
      reason: 'tactical',
    });
    expect(s.ok).toBe(false);
    if (s.ok) return;
    expect(s.error).toMatchObject({ kind: 'PlayerInjured', userCardId: 'inj' });
  });

  it('TC-BENCH-15: reserva suspensa → PlayerSuspended', () => {
    const r = createBench('sq-1');
    if (!r.ok) return;
    const a = addToBench({ bench: r.value, player: bp('susp', 80, { suspendedMatches: 1 }) });
    if (!a.ok) return;
    const s = substitute({
      bench: a.value,
      playerOutId: 'out',
      playerOutOvr: 80,
      playerInId: 'susp',
      minute: 70,
      reason: 'tactical',
    });
    expect(s.ok).toBe(false);
    if (s.ok) return;
    expect(s.error).toMatchObject({ kind: 'PlayerSuspended', userCardId: 'susp', matches: 1 });
  });

  it('TC-BENCH-16: limite de 3 substituições excedido → NoSubsRemaining', () => {
    const r = createBench('sq-1');
    if (!r.ok) return;
    let bench = r.value;
    for (let i = 0; i < 4; i++) {
      const a = addToBench({ bench, player: bp(`s${i}`, 80) });
      if (!a.ok) throw new Error();
      bench = a.value;
    }
    // Fazer 3 substituições válidas
    for (let i = 0; i < 3; i++) {
      const s = substitute({
        bench,
        playerOutId: `out${i}`,
        playerOutOvr: 80,
        playerInId: `s${i}`,
        minute: 30 + i * 15,
        reason: 'tactical',
        generateId: () => `sub-${i}`,
      });
      if (!s.ok) throw new Error(`sub ${i}: ${JSON.stringify(s.error)}`);
      bench = s.value;
    }
    expect(bench.subsRemaining).toBe(0);
    // 4ª substituição → erro
    const s4 = substitute({
      bench,
      playerOutId: 'out3',
      playerOutOvr: 80,
      playerInId: 's3',
      minute: 80,
      reason: 'tactical',
    });
    expect(s4.ok).toBe(false);
    if (s4.ok) return;
    expect(s4.error).toMatchObject({ kind: 'NoSubsRemaining', used: 3, max: 3 });
  });

  it('TC-BENCH-17: mesmo reserva não pode entrar duas vezes → PlayerAlreadySubbedIn', () => {
    const r = createBench('sq-1');
    if (!r.ok) return;
    // Adicionar 2 jogadores no banco para simular: sub1 entra, depois tentativa de sub1 de novo
    const a1 = addToBench({ bench: r.value, player: bp('sub1', 80) });
    if (!a1.ok) return;
    const a2 = addToBench({ bench: a1.value, player: bp('sub2', 80) });
    if (!a2.ok) return;
    // Primeira sub: sub1 entra
    const s1 = substitute({
      bench: a2.value,
      playerOutId: 'out1',
      playerOutOvr: 80,
      playerInId: 'sub1',
      minute: 60,
      reason: 'tactical',
      generateId: () => 'sub-1',
    });
    if (!s1.ok) throw new Error();
    // sub1 saiu do banco, mas tentamos marcar uma nova sub com ele via histórico
    // Cenário: sub1 já aparece no histórico de substituições
    // Como ele saiu do banco, PlayerNotOnBench seria o erro natural.
    // Para testar PlayerAlreadySubbedIn especificamente, readicionamos sub1 ao banco manualmente
    // (cenário de teste: simular que o jogador voltou ao banco — não acontece no jogo, mas testa a regra)
    const bench = s1.value;
    const reAdded = { ...bench, players: Object.freeze([...bench.players, bp('sub1', 80)]) };
    const s2 = substitute({
      bench: reAdded,
      playerOutId: 'out2',
      playerOutOvr: 80,
      playerInId: 'sub1',
      minute: 75,
      reason: 'tactical',
      generateId: () => 'sub-2',
    });
    expect(s2.ok).toBe(false);
    if (s2.ok) return;
    expect(s2.error).toMatchObject({ kind: 'PlayerAlreadySubbedIn', userCardId: 'sub1' });
  });
});

// ─── TC-BENCH-18..22: calculateBenchMoral ─────────────────────────────────────

describe('TC-BENCH-18..22: calculateBenchMoral', () => {
  it('TC-BENCH-18: banco vazio → moral = 0 (poor)', () => {
    const m = calculateBenchMoral([]);
    expect(m.score).toBe(0);
    expect(m.level).toBe('poor');
  });

  it('TC-BENCH-19: banco cheio de 99 OVR → moral = 100 (excellent)', () => {
    const players = Array.from({ length: 7 }, (_, i) => bp(`p${i}`, 99));
    const m = calculateBenchMoral(players);
    expect(m.score).toBe(100);
    expect(m.level).toBe('excellent');
  });

  it('TC-BENCH-20: lesionados reduzem moral (−5 por lesionado)', () => {
    const sem = Array.from({ length: 7 }, (_, i) => bp(`p${i}`, 80));
    const comInj = Array.from(
      { length: 7 },
      (_, i) => bp(`p${i}`, 80, { isInjured: i < 2 }), // 2 lesionados
    );
    const m1 = calculateBenchMoral(sem);
    const m2 = calculateBenchMoral(comInj);
    // 2 lesionados = −10, além de reduzir disponíveis (menos depthScore)
    expect(m2.score).toBeLessThan(m1.score);
    expect(m2.factors.injuryPenalty).toBe(10);
  });

  it('TC-BENCH-21: suspensão também conta como indisponível', () => {
    const players = [bp('p0', 80, { suspendedMatches: 1 })];
    const m = calculateBenchMoral(players);
    expect(m.factors.availableCount).toBe(0);
    expect(m.factors.injuryPenalty).toBe(5);
  });

  it('TC-BENCH-22: níveis de moral corretos por score', () => {
    expect(moralLevel(0)).toBe('poor');
    expect(moralLevel(24)).toBe('poor');
    expect(moralLevel(25)).toBe('fair');
    expect(moralLevel(49)).toBe('fair');
    expect(moralLevel(50)).toBe('good');
    expect(moralLevel(74)).toBe('good');
    expect(moralLevel(75)).toBe('excellent');
    expect(moralLevel(100)).toBe('excellent');
  });
});

// ─── TC-BENCH-23..25: Invariantes ────────────────────────────────────────────

describe('TC-BENCH-23..25: Invariantes', () => {
  it('TC-BENCH-23: banco NÃO influencia química (separação arquitetural)', () => {
    // A química é calculada apenas pelos titulares (packages/squad).
    // Este teste verifica que calculateBenchMoral NÃO retorna nada relacionado
    // a química — o campo 'chemistry' não existe no BenchMoral.
    const m = calculateBenchMoral([bp('p1', 90)]);
    expect(m).not.toHaveProperty('chemistry');
    expect(m).not.toHaveProperty('chemistryBonus');
    // BenchMoral tem apenas: score, level, factors
    expect(Object.keys(m)).toEqual(expect.arrayContaining(['score', 'level', 'factors']));
  });

  it('TC-BENCH-24: moral sempre entre 0 e 100', () => {
    const cases = [
      [],
      [bp('p0', 99)],
      Array.from({ length: 7 }, (_, i) => bp(`p${i}`, 99)),
      Array.from({ length: 7 }, (_, i) => bp(`p${i}`, 40, { isInjured: true })),
    ];
    for (const players of cases) {
      const m = calculateBenchMoral(players);
      expect(m.score).toBeGreaterThanOrEqual(0);
      expect(m.score).toBeLessThanOrEqual(100);
    }
  });

  it('TC-BENCH-25: operações são determinísticas (mesma entrada → mesma saída)', () => {
    const players = Array.from({ length: 5 }, (_, i) => bp(`p${i}`, 80 + i));
    const m1 = calculateBenchMoral(players);
    const m2 = calculateBenchMoral(players);
    expect(m1.score).toBe(m2.score);
    expect(m1.level).toBe(m2.level);
    expect(m1.factors.depthScore).toBe(m2.factors.depthScore);
    expect(m1.factors.qualityScore).toBe(m2.factors.qualityScore);
  });
});
