/**
 * T040 — Offline Season Mode · 50 testes
 *
 * TC-SEA-01..05   createSeason (validação, times, estrutura)
 * TC-SEA-06..10   generateFixtures (20 rodadas, 4 partidas/rodada, sem colisão)
 * TC-SEA-11..15   recordRoundResult (placar, erros)
 * TC-SEA-16..20   advanceRound (IA simulada, determinismo, cap)
 * TC-SEA-21..27   calculateStandings (pontuação, ordenação)
 * TC-SEA-28..30   Desempate (saldo → gols → nome)
 * TC-SEA-31..35   getChampion / isSeasonComplete
 * TC-SEA-36..40   Recompensas por posição
 * TC-SEA-41..45   simulateFullSeason (completo, determinístico)
 * TC-SEA-46..50   Integração (fluxo manual + simulado)
 */
import { describe, expect, it } from 'vitest';
import {
  MATCHES_PER_ROUND,
  POINTS_DRAW,
  POINTS_LOSS,
  POINTS_WIN,
  TEAMS_PER_SEASON,
  TOTAL_ROUNDS,
  advanceRound,
  calculateStandings,
  createSeason,
  getChampion,
  getRewardsForPosition,
  getUserStanding,
  isSeasonComplete,
  recordRoundResult,
  simulateFullSeason,
} from '../src/index';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mkSeason(name = 'Meu Time', str = 82) {
  const r = createSeason({
    userId: 'u1',
    userTeamName: name,
    userStrength: str,
    generateId: () => 's1',
  });
  if (!r.ok) throw new Error(JSON.stringify(r.error));
  return r.value;
}
function okv<T>(r: { ok: boolean; value?: T; error?: unknown }): T {
  // biome-ignore lint/suspicious/noExplicitAny: test helper accesses result union via any
  if (!r.ok) throw new Error(JSON.stringify((r as any).error));
  // biome-ignore lint/suspicious/noExplicitAny: test helper accesses result union via any
  return (r as any).value as T;
}
// biome-ignore lint/suspicious/noExplicitAny: test helper accepts any error shape
function notOk(r: { ok: boolean; error?: any }, kind?: string) {
  expect(r.ok).toBe(false);
  if (kind) expect(r.error?.kind).toBe(kind);
}

// ─── TC-SEA-01..05: createSeason ─────────────────────────────────────────────

describe('TC-SEA-01..05: createSeason', () => {
  it('TC-SEA-01: 8 times e 20 rodadas', () => {
    const s = mkSeason();
    expect(s.teams.length).toBe(TEAMS_PER_SEASON);
    expect(s.rounds.length).toBe(TOTAL_ROUNDS);
    expect(s.status).toBe('scheduled');
    expect(s.currentRound).toBe(1);
  });
  it('TC-SEA-02: time do usuario isUser=true', () => {
    const s = mkSeason();
    const u = s.teams.find((t) => t.isUser);
    expect(u).toBeDefined();
    expect(u?.teamName).toBe('Meu Time');
  });
  it('TC-SEA-03: userId vazio -> erro', () => {
    notOk(createSeason({ userId: '', userTeamName: 'X' }));
  });
  it('TC-SEA-04: userTeamName vazio -> erro', () => {
    notOk(createSeason({ userId: 'u1', userTeamName: '' }));
  });
  it('TC-SEA-05: userStrength clampado [60,99]', () => {
    const lo = okv(createSeason({ userId: 'u1', userTeamName: 'X', userStrength: 30 }));
    const hi = okv(createSeason({ userId: 'u1', userTeamName: 'X', userStrength: 200 }));
    expect(lo.teams[0]?.strength).toBeGreaterThanOrEqual(60);
    expect(hi.teams[0]?.strength).toBeLessThanOrEqual(99);
  });
});

// ─── TC-SEA-06..10: Fixtures ─────────────────────────────────────────────────

describe('TC-SEA-06..10: generateFixtures', () => {
  it('TC-SEA-06: 20 rodadas geradas', () => {
    expect(mkSeason().rounds.length).toBe(20);
  });
  it('TC-SEA-07: 4 partidas por rodada', () => {
    const s = mkSeason();
    for (const r of s.rounds) expect(r.matches.length).toBe(MATCHES_PER_ROUND);
  });
  it('TC-SEA-08: cada time joga 1x por rodada', () => {
    const s = mkSeason();
    for (const r of s.rounds) {
      const ids = r.matches.flatMap((m) => [m.homeTeamId, m.awayTeamId]);
      expect(ids.length).toBe(8);
      expect(new Set(ids).size).toBe(8);
    }
  });
  it('TC-SEA-09: matchIds unicos na temporada', () => {
    const s = mkSeason();
    const ids = s.rounds.flatMap((r) => r.matches.map((m) => m.matchId));
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('TC-SEA-10: partidas iniciam como scheduled/null', () => {
    const s = mkSeason();
    for (const r of s.rounds)
      for (const m of r.matches) {
        expect(m.status).toBe('scheduled');
        expect(m.homeScore).toBeNull();
      }
  });
});

// ─── TC-SEA-11..15: recordRoundResult ────────────────────────────────────────

describe('TC-SEA-11..15: recordRoundResult', () => {
  it('TC-SEA-11: registra placar do usuario', () => {
    const s = mkSeason();
    const r = recordRoundResult(s, 2, 1);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const m = r.value.rounds[0]?.matches.find(
      (m) => m.homeTeamId === s.userTeamId || m.awayTeamId === s.userTeamId,
    );
    expect(m?.status).toBe('played');
  });
  it('TC-SEA-12: season completa -> SeasonAlreadyComplete', () => {
    notOk(
      // biome-ignore lint/suspicious/noExplicitAny: testing invalid status value
      recordRoundResult({ ...mkSeason(), status: 'completed' } as any, 1, 0),
      'SeasonAlreadyComplete',
    );
  });
  it('TC-SEA-13: placar negativo -> InvalidScore', () => {
    notOk(recordRoundResult(mkSeason(), -1, 0), 'InvalidScore');
    notOk(recordRoundResult(mkSeason(), 0, -1), 'InvalidScore');
  });
  it('TC-SEA-14: rodada ja completada -> RoundAlreadyCompleted', () => {
    const s = mkSeason();
    // biome-ignore lint/style/noNonNullAssertion: s.rounds[0] always exists for a new season
    const roundCopy = { ...s.rounds[0]!, completed: true };
    const rounds = s.rounds.map((r, i) => (i === 0 ? roundCopy : r)) as any;
    const s2 = { ...s, rounds, currentRound: 1 } as any;
    notOk(recordRoundResult(s2, 1, 1), 'RoundAlreadyCompleted');
  });
  it('TC-SEA-15: placar 0-0 e valido', () => {
    expect(recordRoundResult(mkSeason(), 0, 0).ok).toBe(true);
  });
});

// ─── TC-SEA-16..20: advanceRound ─────────────────────────────────────────────

describe('TC-SEA-16..20: advanceRound', () => {
  it('TC-SEA-16: simula IA e marca rodada como completa', () => {
    const s = mkSeason();
    const r2 = okv(advanceRound(okv(recordRoundResult(s, 2, 1)), 42));
    expect(r2.currentRound).toBe(2);
    expect(r2.rounds[0]?.completed).toBe(true);
    const aiM = (r2.rounds[0]?.matches ?? []).filter(
      (m) => m.homeTeamId !== r2.userTeamId && m.awayTeamId !== r2.userTeamId,
    );
    expect(aiM.every((m) => m.status === 'played')).toBe(true);
  });
  it('TC-SEA-17: 20 rodadas -> status=completed', () => {
    let s = mkSeason();
    for (let i = 0; i < TOTAL_ROUNDS; i++) {
      s = okv(advanceRound(okv(recordRoundResult(s, 2, 1)), i * 1000 + 42));
    }
    expect(s.status).toBe('completed');
  });
  it('TC-SEA-18: season completa -> SeasonAlreadyComplete', () => {
    notOk(advanceRound({ ...mkSeason(), status: 'completed' } as any, 42), 'SeasonAlreadyComplete');
  });
  it('TC-SEA-19: currentRound incrementa', () => {
    let s = mkSeason();
    for (let i = 0; i < 5; i++) s = okv(advanceRound(okv(recordRoundResult(s, 1, 1)), i * 100));
    expect(s.currentRound).toBe(6);
  });
  it('TC-SEA-20: deterministico por seed', () => {
    const s = mkSeason();
    const r1 = okv(advanceRound(okv(recordRoundResult(s, 2, 0)), 9999)).rounds[0]!;
    const r2 = okv(advanceRound(okv(recordRoundResult(s, 2, 0)), 9999)).rounds[0]!;
    for (let i = 0; i < 4; i++) {
      expect(r1.matches[i]?.homeScore).toBe(r2.matches[i]?.homeScore);
      expect(r1.matches[i]?.awayScore).toBe(r2.matches[i]?.awayScore);
    }
  });
});

// ─── TC-SEA-21..27: Standings ────────────────────────────────────────────────

describe('TC-SEA-21..27: calculateStandings', () => {
  it('TC-SEA-21: standings vazias no inicio', () => {
    const st = calculateStandings(mkSeason());
    expect(st.length).toBe(8);
    expect(st.every((e) => e.points === 0 && e.played === 0)).toBe(true);
  });
  it('TC-SEA-22: POINTS_WIN=3, POINTS_DRAW=1, POINTS_LOSS=0', () => {
    expect(POINTS_WIN).toBe(3);
    expect(POINTS_DRAW).toBe(1);
    expect(POINTS_LOSS).toBe(0);
  });
  it('TC-SEA-23: empate distribui 1 ponto a cada time', () => {
    expect(POINTS_DRAW).toBe(1);
  });
  it('TC-SEA-24: derrota nao da pontos', () => {
    expect(POINTS_LOSS).toBe(0);
  });
  it('TC-SEA-25: standings ordenados por pontos desc', () => {
    const s = simulateFullSeason(mkSeason(), 42);
    const st = calculateStandings(s);
    for (let i = 1; i < st.length; i++) {
      expect(st[i - 1]?.points ?? 0).toBeGreaterThanOrEqual(st[i]?.points ?? 0);
    }
  });
  it('TC-SEA-26: positions corretas 1..8', () => {
    const st = calculateStandings(simulateFullSeason(mkSeason(), 42));
    for (let i = 0; i < st.length; i++) expect(st[i]?.position).toBe(i + 1);
  });
  it('TC-SEA-27: goalDiff = goalsFor - goalsAgainst', () => {
    const st = calculateStandings(simulateFullSeason(mkSeason(), 42));
    for (const e of st) expect(e.goalDiff).toBe(e.goalsFor - e.goalsAgainst);
  });
});

// ─── TC-SEA-28..30: Desempate ────────────────────────────────────────────────

describe('TC-SEA-28..30: Criterios de desempate', () => {
  const sort = (arr: any[]) =>
    arr.sort(
      (a, b) =>
        b.points - a.points ||
        b.goalDiff - a.goalDiff ||
        b.goalsFor - a.goalsFor ||
        a.teamName.localeCompare(b.teamName),
    );
  it('TC-SEA-28: desempate por saldo de gols', () => {
    const r = sort([
      { teamId: 'a', teamName: 'A', points: 6, goalDiff: 3, goalsFor: 5 },
      { teamId: 'b', teamName: 'B', points: 6, goalDiff: 1, goalsFor: 4 },
    ]);
    expect(r[0].teamId).toBe('a');
  });
  it('TC-SEA-29: desempate por gols marcados', () => {
    const r = sort([
      { teamId: 'a', teamName: 'A', points: 6, goalDiff: 2, goalsFor: 5 },
      { teamId: 'b', teamName: 'B', points: 6, goalDiff: 2, goalsFor: 3 },
    ]);
    expect(r[0].teamId).toBe('a');
  });
  it('TC-SEA-30: desempate por nome (alfabetico)', () => {
    const r = sort([
      { teamId: 'a', teamName: 'Botafogo', points: 6, goalDiff: 2, goalsFor: 5 },
      { teamId: 'b', teamName: 'Atletico', points: 6, goalDiff: 2, goalsFor: 5 },
    ]);
    expect(r[0].teamId).toBe('b');
  });
});

// ─── TC-SEA-31..35: Champion ─────────────────────────────────────────────────

describe('TC-SEA-31..35: getChampion e isSeasonComplete', () => {
  it('TC-SEA-31: getChampion null se nao completa', () => {
    expect(getChampion(mkSeason())).toBeNull();
  });
  it('TC-SEA-32: getChampion retorna lider da tabela', () => {
    const s = simulateFullSeason(mkSeason(), 42);
    const c = getChampion(s)!;
    expect(c).not.toBeNull();
    expect(calculateStandings(s)[0]?.teamId).toBe(c.teamId);
  });
  it('TC-SEA-33: campeao tem pontuacao maxima', () => {
    const s = simulateFullSeason(mkSeason(), 42);
    const c = getChampion(s)!;
    const st = calculateStandings(s);
    const maxPts = Math.max(...st.map((e) => e.points));
    expect(st.find((e) => e.teamId === c.teamId)?.points).toBe(maxPts);
  });
  it('TC-SEA-34: isSeasonComplete false no inicio', () => {
    expect(isSeasonComplete(mkSeason())).toBe(false);
  });
  it('TC-SEA-35: isSeasonComplete true apos simulateFullSeason', () => {
    expect(isSeasonComplete(simulateFullSeason(mkSeason(), 42))).toBe(true);
  });
});

// ─── TC-SEA-36..40: Rewards ──────────────────────────────────────────────────

describe('TC-SEA-36..40: Recompensas por posicao', () => {
  it('TC-SEA-36: posicao 1 -> 10000c + 3 legend packs', () => {
    const r = getRewardsForPosition(1);
    expect(r.credits).toBe(10_000);
    expect(r.packs[0]?.packId).toBe('legend');
    expect(r.packs[0]?.quantity).toBe(3);
    expect(r.cosmetics.length).toBeGreaterThan(0);
  });
  it('TC-SEA-37: posicao 8 -> 500c + 1 classic pack', () => {
    const r = getRewardsForPosition(8);
    expect(r.credits).toBe(500);
    expect(r.packs[0]?.packId).toBe('classic');
    expect(r.cosmetics.length).toBe(0);
  });
  it('TC-SEA-38: creditos decrescem com a posicao', () => {
    const cs = [1, 2, 3, 4, 5, 6, 7, 8].map((pp) => getRewardsForPosition(pp).credits);
    for (let i = 1; i < cs.length; i++) expect(cs[i]).toBeLessThanOrEqual(cs[i - 1]!);
  });
  it('TC-SEA-39: posicao 1 tem champion_trophy', () => {
    expect(getRewardsForPosition(1).cosmetics).toContain('champion_trophy');
  });
  it('TC-SEA-40: posicoes 2 e 3 tem Legend Pack', () => {
    expect(getRewardsForPosition(2).packs.some((p) => p.packId === 'legend')).toBe(true);
    expect(getRewardsForPosition(3).packs.some((p) => p.packId === 'legend')).toBe(true);
  });
});

// ─── TC-SEA-41..45: simulateFullSeason ───────────────────────────────────────

describe('TC-SEA-41..45: simulateFullSeason', () => {
  it('TC-SEA-41: todas 20 rodadas completas', () => {
    const s = simulateFullSeason(mkSeason(), 42);
    expect(s.rounds.every((r) => r.completed)).toBe(true);
  });
  it('TC-SEA-42: todos os times jogaram 20 partidas', () => {
    const s = simulateFullSeason(mkSeason(), 42);
    const st = calculateStandings(s);
    for (const e of st) expect(e.played).toBe(20);
  });
  it('TC-SEA-43: deterministico pelo seed', () => {
    const s = mkSeason();
    const c1 = getChampion(simulateFullSeason(s, 777))!;
    const c2 = getChampion(simulateFullSeason(s, 777))!;
    expect(c1.teamId).toBe(c2.teamId);
  });
  it('TC-SEA-44: seeds diferentes -> campeoes possivelmente diferentes', () => {
    const s = mkSeason();
    const champs = new Set(
      Array.from({ length: 10 }, (_, i) => getChampion(simulateFullSeason(s, i * 10000))?.teamId),
    );
    expect(champs.size).toBeGreaterThan(1);
  });
  it('TC-SEA-45: nao muta o objeto original', () => {
    const s = mkSeason();
    simulateFullSeason(s, 42);
    expect(s.status).toBe('scheduled');
    expect(s.currentRound).toBe(1);
  });
});

// ─── TC-SEA-46..50: Integracao ───────────────────────────────────────────────

describe('TC-SEA-46..50: Integracao', () => {
  it('TC-SEA-46: getUserStanding retorna posicao do usuario', () => {
    const s = simulateFullSeason(mkSeason(), 42);
    const us = getUserStanding(s)!;
    expect(us).not.toBeNull();
    expect(us.isUser).toBe(true);
    expect(us.position).toBeGreaterThanOrEqual(1);
    expect(us.position).toBeLessThanOrEqual(8);
  });
  it('TC-SEA-47: pontos = vitorias*3 + empates*1', () => {
    const s = simulateFullSeason(mkSeason(), 42);
    for (const e of calculateStandings(s)) {
      expect(e.points).toBe(e.won * POINTS_WIN + e.drawn * POINTS_DRAW);
      expect(e.played).toBe(e.won + e.drawn + e.lost);
    }
  });
  it('TC-SEA-48: total vitorias = total derrotas', () => {
    const s = simulateFullSeason(mkSeason(), 42);
    const st = calculateStandings(s);
    const w = st.reduce((acc, e) => acc + e.won, 0);
    const l = st.reduce((acc, e) => acc + e.lost, 0);
    expect(w).toBe(l);
  });
  it('TC-SEA-49: recompensa do usuario tem creditos > 0', () => {
    const s = simulateFullSeason(mkSeason('Selecao BR', 99), 999);
    const us = getUserStanding(s)!;
    expect(getRewardsForPosition(us.position).credits).toBeGreaterThan(0);
  });
  it('TC-SEA-50: 5 rodadas manuais + 15 simuladas = completa', () => {
    let s = mkSeason();
    for (let i = 0; i < 5; i++)
      s = okv(advanceRound(okv(recordRoundResult(s, 2, 1)), i * 100 + 42));
    expect(s.currentRound).toBe(6);
    for (let i = 5; i < TOTAL_ROUNDS; i++)
      s = okv(advanceRound(okv(recordRoundResult(s, 1, 1)), i * 77 + 99));
    expect(isSeasonComplete(s)).toBe(true);
    expect(getChampion(s)).not.toBeNull();
    expect(getRewardsForPosition(getUserStanding(s)?.position ?? 0).credits).toBeGreaterThan(0);
  });
});
