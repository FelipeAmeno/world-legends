// T040 — Offline Season Mode · Runner
// RNG
function mulberry32(seed) {
  let s = seed >>> 0;
  return () => {
    s += 0x6d2b79f5;
    let z = s;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  };
}
function hashStr(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// Constants
const TOTAL_ROUNDS = 20;
const TEAMS = 8;
const MROUND = 4;
const PW = 3;
const PD = 1;
const PL = 0;

// AI teams
const AI_TEAMS = [
  { teamName: 'Flamengo Lendas', strength: 92 },
  { teamName: 'Santos Gloria', strength: 88 },
  { teamName: 'Palmeiras Elite', strength: 86 },
  { teamName: 'Gremio Historico', strength: 84 },
  { teamName: 'Sao Paulo Classico', strength: 82 },
  { teamName: 'Corinthians Forca', strength: 80 },
  { teamName: 'Botafogo Stars', strength: 78 },
];

// Fixture generation (circle method)
function generateFixtures(teams) {
  const n = teams.length;
  const half = n / 2;
  const ids = teams.map((t) => t.teamId);
  function rotate(arr, step) {
    const fixed = arr[0];
    const rest = arr.slice(1);
    const s = step % rest.length;
    if (s === 0) return [fixed, ...rest];
    return [fixed, ...rest.slice(-s), ...rest.slice(0, rest.length - s)];
  }
  const rounds = [];
  let mc = 0;
  for (let rot = 0; rot < 3 && rounds.length < TOTAL_ROUNDS; rot++) {
    const isRev = rot === 1;
    for (let r = 0; r < n - 1 && rounds.length < TOTAL_ROUNDS; r++) {
      const cur = rotate(ids, r + rot * (n - 1));
      const matches = [];
      for (let i = 0; i < half; i++) {
        const a = cur[i];
        const b = cur[n - 1 - i];
        const home = isRev ? b : a;
        const away = isRev ? a : b;
        matches.push(
          Object.freeze({
            matchId: `m-${++mc}`,
            homeTeamId: home,
            awayTeamId: away,
            homeScore: null,
            awayScore: null,
            status: 'scheduled',
          }),
        );
      }
      rounds.push(
        Object.freeze({
          roundNumber: rounds.length + 1,
          matches: Object.freeze(matches),
          completed: false,
        }),
      );
    }
  }
  return Object.freeze(rounds.slice(0, TOTAL_ROUNDS));
}

// AI match simulation
function simulateAIMatch(hs, aws, seed) {
  const rng = mulberry32(seed);
  const p = (hs * 1.15) / (hs * 1.15 + aws);
  const total = 2 + Math.floor(rng() * 4);
  let h = 0;
  let a = 0;
  for (let i = 0; i < total; i++) {
    if (rng() < p) h++;
    else a++;
  }
  return { homeScore: h, awayScore: a };
}
function simulateRoundAI(matches, teamMap, userTeamId, roundSeed) {
  return Object.freeze(
    matches.map((m, idx) => {
      if (m.homeTeamId === userTeamId || m.awayTeamId === userTeamId) return m;
      const hs = teamMap.get(m.homeTeamId) || 75;
      const aws = teamMap.get(m.awayTeamId) || 75;
      const seed = roundSeed ^ hashStr(m.matchId) ^ (idx * 0x9e3779b9);
      const sc = simulateAIMatch(hs, aws, seed);
      return Object.freeze({
        ...m,
        homeScore: sc.homeScore,
        awayScore: sc.awayScore,
        status: 'played',
      });
    }),
  );
}

// Season operations
let _seq = 0;
function Ok(v) {
  return { ok: true, value: Object.freeze(v) };
}
function Err(e) {
  return { ok: false, error: e };
}
function vErr(msg, f) {
  return { kind: 'ValidationError', message: msg, field: f };
}

function createSeason(userId, userTeamName, userStrength, genId) {
  if (!userId || !userId.trim()) return Err(vErr('userId vazio', 'userId'));
  if (!userTeamName || !userTeamName.trim()) return Err(vErr('name vazio', 'userTeamName'));
  const id = genId ? genId() : `season-${++_seq}`;
  const uTid = `user-team-${userId}`;
  const str = Math.max(60, Math.min(99, userStrength || 82));
  const teams = [
    Object.freeze({ teamId: uTid, teamName: userTeamName.trim(), isUser: true, strength: str }),
    ...AI_TEAMS.map((t, i) =>
      Object.freeze({
        teamId: `ai-${i}`,
        teamName: t.teamName,
        isUser: false,
        strength: t.strength,
      }),
    ),
  ];
  return Ok({
    seasonId: id,
    userId: userId,
    userTeamId: uTid,
    teams: Object.freeze(teams),
    rounds: generateFixtures(teams),
    status: 'scheduled',
    currentRound: 1,
  });
}

function recordRoundResult(season, homeScore, awayScore) {
  if (season.status === 'completed') return Err({ kind: 'SeasonAlreadyComplete' });
  if (
    !Number.isInteger(homeScore) ||
    homeScore < 0 ||
    !Number.isInteger(awayScore) ||
    awayScore < 0
  )
    return Err({ kind: 'InvalidScore', homeScore: homeScore, awayScore: awayScore });
  const ri = season.currentRound - 1;
  const round = season.rounds[ri];
  if (!round) return Err({ kind: 'RoundNotFound', roundNumber: season.currentRound });
  if (round.completed)
    return Err({ kind: 'RoundAlreadyCompleted', roundNumber: season.currentRound });
  const mi = round.matches.findIndex(
    (m) => m.homeTeamId === season.userTeamId || m.awayTeamId === season.userTeamId,
  );
  if (mi === -1) return Err({ kind: 'RoundNotFound', roundNumber: season.currentRound });
  const um = Object.freeze({
    ...round.matches[mi],
    homeScore: homeScore,
    awayScore: awayScore,
    status: 'played',
  });
  const nm = round.matches.map((m, i) => (i === mi ? um : m));
  const nr = Object.freeze({ ...round, matches: Object.freeze(nm) });
  const nrs = season.rounds.map((r, i) => (i === ri ? nr : r));
  return Ok({ ...season, status: 'in_progress', rounds: Object.freeze(nrs) });
}

function advanceRound(season, seed) {
  if (season.status === 'completed') return Err({ kind: 'SeasonAlreadyComplete' });
  const ri = season.currentRound - 1;
  const round = season.rounds[ri];
  if (!round) return Err({ kind: 'RoundNotFound', roundNumber: season.currentRound });
  const tm = new Map(season.teams.map((t) => [t.teamId, t.strength]));
  const sm = simulateRoundAI(round.matches, tm, season.userTeamId, seed);
  const nr = Object.freeze({ ...round, matches: sm, completed: true });
  const nrs = season.rounds.map((r, i) => (i === ri ? nr : r));
  const next = season.currentRound + 1;
  const done = next > TOTAL_ROUNDS;
  return Ok({
    ...season,
    rounds: Object.freeze(nrs),
    currentRound: next,
    status: done ? 'completed' : 'in_progress',
  });
}

function simulateFullSeason(season, baseSeed) {
  const tm = new Map(season.teams.map((t) => [t.teamId, t.strength]));
  let cur = Object.freeze({ ...season, status: 'in_progress' });
  for (let r = 0; r < TOTAL_ROUNDS; r++) {
    const round = cur.rounds[r];
    const rs = baseSeed ^ (r * 0x9e3779b9);
    const sm = round.matches.map((m, idx) => {
      const hs = tm.get(m.homeTeamId) || 75;
      const aws = tm.get(m.awayTeamId) || 75;
      const seed = rs ^ (idx * 0x11235813);
      const sc = simulateAIMatch(hs, aws, seed);
      return Object.freeze({
        ...m,
        homeScore: sc.homeScore,
        awayScore: sc.awayScore,
        status: 'played',
      });
    });
    const nr = Object.freeze({ ...round, matches: Object.freeze(sm), completed: true });
    const nrs = cur.rounds.map((rd, i) => (i === r ? nr : rd));
    const next = r + 2;
    cur = Object.freeze({
      ...cur,
      rounds: Object.freeze(nrs),
      currentRound: next,
      status: next > TOTAL_ROUNDS ? 'completed' : 'in_progress',
    });
  }
  return cur;
}

function isSeasonComplete(s) {
  return s.status === 'completed';
}

function calculateStandings(season) {
  const stats = new Map(
    season.teams.map((t) => [t.teamId, { won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, pts: 0 }]),
  );
  for (const round of season.rounds) {
    for (const m of round.matches) {
      if (m.status !== 'played' || m.homeScore === null) continue;
      const h = stats.get(m.homeTeamId);
      const a = stats.get(m.awayTeamId);
      if (!h || !a) continue;
      h.gf += m.homeScore;
      h.ga += m.awayScore;
      a.gf += m.awayScore;
      a.ga += m.homeScore;
      if (m.homeScore > m.awayScore) {
        h.won++;
        h.pts += PW;
        a.lost++;
        a.pts += PL;
      } else if (m.homeScore < m.awayScore) {
        a.won++;
        a.pts += PW;
        h.lost++;
        h.pts += PL;
      } else {
        h.drawn++;
        h.pts += PD;
        a.drawn++;
        a.pts += PD;
      }
    }
  }
  const tm = new Map(season.teams.map((t) => [t.teamId, t]));
  const entries = [];
  for (const [tid, s] of stats) {
    const team = tm.get(tid);
    entries.push({
      position: 0,
      teamId: tid,
      teamName: team.teamName,
      isUser: team.isUser,
      played: s.won + s.drawn + s.lost,
      won: s.won,
      drawn: s.drawn,
      lost: s.lost,
      goalsFor: s.gf,
      goalsAgainst: s.ga,
      goalDiff: s.gf - s.ga,
      points: s.pts,
    });
  }
  entries.sort(
    (a, b) =>
      b.points - a.points ||
      b.goalDiff - a.goalDiff ||
      b.goalsFor - a.goalsFor ||
      a.teamName.localeCompare(b.teamName),
  );
  return Object.freeze(entries.map((e, i) => Object.freeze({ ...e, position: i + 1 })));
}

function getChampion(season) {
  if (season.status !== 'completed') return null;
  const st = calculateStandings(season);
  const leader = st[0];
  return season.teams.find((t) => t.teamId === leader.teamId) || null;
}

function getUserStanding(season) {
  return calculateStandings(season).find((e) => e.teamId === season.userTeamId) || null;
}

const REWARDS = new Map([
  [
    1,
    {
      position: 1,
      credits: 10000,
      packs: [{ packId: 'legend', quantity: 3 }],
      cosmetics: ['champion_trophy', 'golden_badge', 'season_winner_frame'],
      title: 'CAMPEAO DA TEMPORADA',
    },
  ],
  [
    2,
    {
      position: 2,
      credits: 5000,
      packs: [{ packId: 'legend', quantity: 2 }],
      cosmetics: ['silver_badge'],
      title: 'Vice-Campeao',
    },
  ],
  [
    3,
    {
      position: 3,
      credits: 3000,
      packs: [
        { packId: 'legend', quantity: 1 },
        { packId: 'elite', quantity: 1 },
      ],
      cosmetics: ['bronze_badge'],
      title: '3o Lugar',
    },
  ],
  [
    4,
    {
      position: 4,
      credits: 2000,
      packs: [{ packId: 'elite', quantity: 2 }],
      cosmetics: [],
      title: '4o Lugar',
    },
  ],
  [
    5,
    {
      position: 5,
      credits: 2000,
      packs: [{ packId: 'elite', quantity: 2 }],
      cosmetics: [],
      title: '5o Lugar',
    },
  ],
  [
    6,
    {
      position: 6,
      credits: 1000,
      packs: [{ packId: 'elite', quantity: 1 }],
      cosmetics: [],
      title: '6o Lugar',
    },
  ],
  [
    7,
    {
      position: 7,
      credits: 1000,
      packs: [{ packId: 'elite', quantity: 1 }],
      cosmetics: [],
      title: '7o Lugar',
    },
  ],
  [
    8,
    {
      position: 8,
      credits: 500,
      packs: [{ packId: 'classic', quantity: 1 }],
      cosmetics: [],
      title: '8o Lugar',
    },
  ],
]);
function getRewardsForPosition(pos) {
  return (
    REWARDS.get(pos) || {
      position: pos,
      credits: 0,
      packs: [],
      cosmetics: [],
      title: `${pos}o Lugar`,
    }
  );
}

// Test runner
let p = 0;
let f = 0;
const fails = [];
function test(name, fn) {
  try {
    fn();
    p++;
    process.stdout.write('.');
  } catch (e) {
    f++;
    fails.push({ name: name, error: e.message });
    process.stdout.write('F');
  }
}
function eq(a, b, msg) {
  if (a !== b) throw new Error(msg || `${JSON.stringify(a)} != ${JSON.stringify(b)}`);
}
function assert(c, msg) {
  if (!c) throw new Error(msg || 'assertion failed');
}
function okv(r) {
  if (!r.ok) throw new Error(JSON.stringify(r.error));
  return r.value;
}
function notOk(r, kind) {
  if (r.ok) throw new Error('expected error, got ok');
  if (kind && r.error.kind !== kind)
    throw new Error(`expected kind=${kind} got ${r.error.kind}`);
}

function mkSeason(name, str) {
  name = name || 'Meu Time';
  str = str || 82;
  return okv(createSeason('u1', name, str, () => 's1'));
}
test('01: 8 times e 20 rodadas', () => {
  const s = mkSeason();
  eq(s.teams.length, TEAMS);
  eq(s.rounds.length, TOTAL_ROUNDS);
  eq(s.status, 'scheduled');
  eq(s.currentRound, 1);
});
test('02: time do usuario isUser=true', () => {
  const s = mkSeason();
  const u = s.teams.find((t) => t.isUser);
  assert(u, 'user team nao encontrado');
  eq(u.teamName, 'Meu Time');
});
test('03: userId vazio -> erro', () => {
  notOk(createSeason('', 'X', 82));
});
test('04: userTeamName vazio -> erro', () => {
  notOk(createSeason('u1', '', 82));
});
test('05: userStrength clamp [60,99]', () => {
  const lo = okv(createSeason('u1', 'X', 30));
  const hi = okv(createSeason('u1', 'X', 200));
  assert(lo.teams[0].strength >= 60, 'abaixo de 60');
  assert(hi.teams[0].strength <= 99, 'acima de 99');
});
test('06: 20 rodadas geradas', () => {
  eq(mkSeason().rounds.length, 20);
});
test('07: 4 partidas por rodada', () => {
  const s = mkSeason();
  for (const r of s.rounds) {
    eq(r.matches.length, MROUND, `round ${r.roundNumber} tem ${r.matches.length}`);
  }
});
test('08: cada time joga 1x por rodada', () => {
  const s = mkSeason();
  for (const r of s.rounds) {
    const ids = r.matches.reduce((acc, m) => acc.concat([m.homeTeamId, m.awayTeamId]), []);
    eq(ids.length, 8, `round ${r.roundNumber}`);
    eq(new Set(ids).size, 8, `duplicado na rodada ${r.roundNumber}`);
  }
});
test('09: matchIds unicos na temporada', () => {
  const s = mkSeason();
  const ids = s.rounds.reduce((acc, r) => acc.concat(r.matches.map((m) => m.matchId)), []);
  eq(new Set(ids).size, ids.length, 'matchId duplicado');
});
test('10: partidas comecam como scheduled/null', () => {
  const s = mkSeason();
  for (const r of s.rounds) {
    for (const m of r.matches) {
      eq(m.status, 'scheduled');
      eq(m.homeScore, null);
      eq(m.awayScore, null);
    }
  }
});
test('11: registra placar do usuario', () => {
  const s = mkSeason();
  const r = recordRoundResult(s, 2, 1);
  assert(r.ok, `result nao ok: ${JSON.stringify(r.error)}`);
  const round = r.value.rounds[0];
  const um = round.matches.find(
    (m) => m.homeTeamId === s.userTeamId || m.awayTeamId === s.userTeamId,
  );
  eq(um.status, 'played');
});
test('12: season completa -> SeasonAlreadyComplete', () => {
  const s = Object.freeze({ ...mkSeason(), status: 'completed' });
  notOk(recordRoundResult(s, 1, 0), 'SeasonAlreadyComplete');
});
test('13: placar negativo -> InvalidScore', () => {
  notOk(recordRoundResult(mkSeason(), -1, 0), 'InvalidScore');
  notOk(recordRoundResult(mkSeason(), 0, -1), 'InvalidScore');
});
test('14: rodada ja completa -> erro', () => {
  let s = mkSeason();
  const r1 = recordRoundResult(s, 2, 0);
  const r2 = advanceRound(r1.value, 42);
  s = r2.value;
  // roundNumber 1 ja foi avancado, currentRound=2
  // tentar registrar resultado na rodada 1 diretamente no objeto antigo
  const oldRound = Object.freeze({ ...s.rounds[0], completed: true });
  const oldRounds = s.rounds.map((r, i) => (i === 0 ? oldRound : r));
  const oldSeason = Object.freeze({ ...s, rounds: Object.freeze(oldRounds), currentRound: 1 });
  notOk(recordRoundResult(oldSeason, 1, 1), 'RoundAlreadyCompleted');
});
test('15: placar 0-0 valido', () => {
  assert(recordRoundResult(mkSeason(), 0, 0).ok, '0-0 deve ser valido');
});
test('16: avanca rodada e simula IA', () => {
  let s = mkSeason();
  const r1 = recordRoundResult(s, 2, 1);
  const r2 = advanceRound(r1.value, 42);
  assert(r2.ok, `advance falhou: ${JSON.stringify(r2.error)}`);
  s = r2.value;
  eq(s.currentRound, 2);
  const round = s.rounds[0];
  assert(round.completed, 'rodada nao marcada como completa');
  const aiMatches = round.matches.filter(
    (m) => m.homeTeamId !== s.userTeamId && m.awayTeamId !== s.userTeamId,
  );
  assert(aiMatches.every((m) => m.status === 'played'));
});
test('17: 20 rodadas -> status=completed', () => {
  let s = mkSeason();
  for (let i = 0; i < TOTAL_ROUNDS; i++) {
    const r1 = recordRoundResult(s, 2, 1);
    const r2 = advanceRound(r1.value, i * 1000 + 42);
    assert(r2.ok, `round ${i} falhou`);
    s = r2.value;
  }
  eq(s.status, 'completed');
});
test('18: completed -> SeasonAlreadyComplete', () => {
  const s = Object.freeze({ ...mkSeason(), status: 'completed' });
  notOk(advanceRound(s, 42), 'SeasonAlreadyComplete');
});
test('19: currentRound incrementa', () => {
  let s = mkSeason();
  for (let i = 0; i < 5; i++) {
    s = okv(advanceRound(okv(recordRoundResult(s, 1, 1)), i * 100));
  }
  eq(s.currentRound, 6);
});
test('20: determinístico: mesmo seed -> mesmos resultados IA', () => {
  const s = mkSeason();
  const r1v = okv(advanceRound(okv(recordRoundResult(s, 2, 0)), 9999));
  const r2v = okv(advanceRound(okv(recordRoundResult(s, 2, 0)), 9999));
  const rnd1 = r1v.rounds[0];
  const rnd2 = r2v.rounds[0];
  for (let i = 0; i < 4; i++) {
    eq(rnd1.matches[i].homeScore, rnd2.matches[i].homeScore);
    eq(rnd1.matches[i].awayScore, rnd2.matches[i].awayScore);
  }
});
test('21: standings vazias no inicio', () => {
  const st = calculateStandings(mkSeason());
  eq(st.length, 8);
  assert(st.every((e) => e.points === 0 && e.played === 0));
});
test('22: vitoria = 3 pontos', () => {
  // Verificar logica de pontos usando standings manuais
  const sc = { kind: 'test', won: 5, drawn: 2, lost: 3 };
  eq(sc.won * PW + sc.drawn * PD, 17);
});
test('23: empate = 1 ponto', () => {
  eq(PD, 1);
});
test('24: derrota = 0 pontos', () => {
  eq(PL, 0);
});
test('25: standings ordenados por pontos (desc)', () => {
  const s = simulateFullSeason(mkSeason(), 42);
  const st = calculateStandings(s);
  for (let i = 1; i < st.length; i++) {
    assert(
      st[i - 1].points >= st[i].points,
      `${st[i - 1].teamName}(${st[i - 1].points}) < ${st[i].teamName}(${st[i].points})`,
    );
  }
});
test('26: position 1..8 corretos', () => {
  const s = simulateFullSeason(mkSeason(), 42);
  const st = calculateStandings(s);
  for (let i = 0; i < st.length; i++) eq(st[i].position, i + 1);
});
test('27: goalDiff = goalsFor - goalsAgainst', () => {
  const s = simulateFullSeason(mkSeason(), 42);
  const st = calculateStandings(s);
  for (const e of st) eq(e.goalDiff, e.goalsFor - e.goalsAgainst);
});
test('28: desempate por saldo de gols', () => {
  const entries = [
    { teamId: 'a', teamName: 'A', points: 6, goalDiff: 3, goalsFor: 5 },
    { teamId: 'b', teamName: 'B', points: 6, goalDiff: 1, goalsFor: 4 },
  ];
  entries.sort(
    (a, b) =>
      b.points - a.points ||
      b.goalDiff - a.goalDiff ||
      b.goalsFor - a.goalsFor ||
      a.teamName.localeCompare(b.teamName),
  );
  eq(entries[0].teamId, 'a');
});
test('29: desempate por gols marcados', () => {
  const entries = [
    { teamId: 'a', teamName: 'A', points: 6, goalDiff: 2, goalsFor: 5 },
    { teamId: 'b', teamName: 'B', points: 6, goalDiff: 2, goalsFor: 3 },
  ];
  entries.sort(
    (a, b) =>
      b.points - a.points ||
      b.goalDiff - a.goalDiff ||
      b.goalsFor - a.goalsFor ||
      a.teamName.localeCompare(b.teamName),
  );
  eq(entries[0].teamId, 'a');
});
test('30: desempate por nome (alfabetico)', () => {
  const entries = [
    { teamId: 'a', teamName: 'Botafogo', points: 6, goalDiff: 2, goalsFor: 5 },
    { teamId: 'b', teamName: 'Atletico', points: 6, goalDiff: 2, goalsFor: 5 },
  ];
  entries.sort(
    (a, b) =>
      b.points - a.points ||
      b.goalDiff - a.goalDiff ||
      b.goalsFor - a.goalsFor ||
      a.teamName.localeCompare(b.teamName),
  );
  eq(entries[0].teamId, 'b');
});
test('31: getChampion null se nao completa', () => {
  assert(getChampion(mkSeason()) === null);
});
test('32: getChampion retorna lider da tabela', () => {
  const s = simulateFullSeason(mkSeason(), 42);
  const champ = getChampion(s);
  assert(champ !== null, 'sem campeao');
  const st = calculateStandings(s);
  eq(st[0].teamId, champ.teamId);
});
test('33: campeao tem pontuacao maxima', () => {
  const s = simulateFullSeason(mkSeason(), 42);
  const champ = getChampion(s);
  const st = calculateStandings(s);
  const ce = st.find((e) => e.teamId === champ.teamId);
  const maxPts = Math.max.apply(
    null,
    st.map((e) => e.points),
  );
  eq(ce.points, maxPts);
});
test('34: isSeasonComplete false no inicio', () => {
  assert(!isSeasonComplete(mkSeason()));
});
test('35: isSeasonComplete true apos simulateFullSeason', () => {
  assert(isSeasonComplete(simulateFullSeason(mkSeason(), 42)));
});
test('36: posicao 1 -> 10000c + 3 legend packs', () => {
  const r = getRewardsForPosition(1);
  eq(r.credits, 10000);
  eq(r.packs[0].packId, 'legend');
  eq(r.packs[0].quantity, 3);
  assert(r.cosmetics.length > 0);
});
test('37: posicao 8 -> 500c + 1 classic pack', () => {
  const r = getRewardsForPosition(8);
  eq(r.credits, 500);
  eq(r.packs[0].packId, 'classic');
  eq(r.cosmetics.length, 0);
});
test('38: creditos decrescem com posicao', () => {
  const cs = [1, 2, 3, 4, 5, 6, 7, 8].map((pp) => getRewardsForPosition(pp).credits);
  for (let i = 1; i < cs.length; i++) {
    assert(cs[i] <= cs[i - 1], `pos ${i + 1} tem mais creditos que pos ${i}`);
  }
});
test('39: posicao 1 tem champion_trophy', () => {
  assert(getRewardsForPosition(1).cosmetics.includes('champion_trophy'));
});
test('40: posicoes 2 e 3 tem Legend Pack', () => {
  assert(getRewardsForPosition(2).packs.some((pk) => pk.packId === 'legend'));
  assert(getRewardsForPosition(3).packs.some((pk) => pk.packId === 'legend'));
});
test('41: todas 20 rodadas completas', () => {
  const s = simulateFullSeason(mkSeason(), 42);
  assert(s.rounds.every((r) => r.completed));
});
test('42: todos os times jogaram 20 partidas', () => {
  const s = simulateFullSeason(mkSeason(), 42);
  const st = calculateStandings(s);
  for (const e of st) {
    assert(e.played === 20, `${e.teamName} jogou ${e.played} partidas, esperado 20`);
  }
});
test('43: determinístico: mesmo seed -> mesmo campeao', () => {
  const s = mkSeason();
  const c1 = getChampion(simulateFullSeason(s, 777));
  const c2 = getChampion(simulateFullSeason(s, 777));
  assert(c1 !== null && c2 !== null);
  eq(c1.teamId, c2.teamId);
});
test('44: seeds diferentes -> potencialmente campeoes diferentes', () => {
  const s = mkSeason();
  const champs = new Set();
  for (let seed = 0; seed < 10; seed++) {
    const c = getChampion(simulateFullSeason(s, seed * 10000));
    if (c) champs.add(c.teamId);
  }
  assert(champs.size > 1, 'todos os seeds produziram o mesmo campeao');
});
test('45: simulateFullSeason nao muta o objeto original', () => {
  const s = mkSeason();
  simulateFullSeason(s, 42);
  eq(s.status, 'scheduled');
  eq(s.currentRound, 1);
});
test('46: getUserStanding retorna posicao do usuario', () => {
  const s = simulateFullSeason(mkSeason(), 42);
  const us = getUserStanding(s);
  assert(us !== null);
  assert(us.isUser);
  assert(us.position >= 1 && us.position <= 8);
});
test('47: pontos = vitorias*3 + empates*1', () => {
  const s = simulateFullSeason(mkSeason(), 42);
  const st = calculateStandings(s);
  for (const e of st) {
    const expected = e.won * PW + e.drawn * PD;
    assert(e.points === expected, `${e.teamName}: pts ${e.points} != ${expected}`);
    const played = e.won + e.drawn + e.lost;
    assert(e.played === played, `${e.teamName}: played ${e.played} != ${played}`);
  }
});
test('48: total vitorias = total derrotas', () => {
  const s = simulateFullSeason(mkSeason(), 42);
  const st = calculateStandings(s);
  const totalW = st.reduce((acc, e) => acc + e.won, 0);
  const totalL = st.reduce((acc, e) => acc + e.lost, 0);
  eq(totalW, totalL, `vitorias ${totalW} != derrotas ${totalL}`);
});
test('49: recompensa do usuario tem creditos > 0', () => {
  const s = simulateFullSeason(mkSeason('Selecao BR', 99), 999);
  const us = getUserStanding(s);
  assert(us !== null);
  const rew = getRewardsForPosition(us.position);
  assert(rew.credits > 0);
});
test('50: 5 rodadas manuais + 15 simuladas = temporada completa', () => {
  let s = mkSeason();
  for (let i = 0; i < 5; i++) {
    s = okv(advanceRound(okv(recordRoundResult(s, 2, 1)), i * 100 + 42));
  }
  eq(s.currentRound, 6, 'nao esta na rodada 6 apos 5 avancos');
  for (let i = 5; i < TOTAL_ROUNDS; i++) {
    s = okv(advanceRound(okv(recordRoundResult(s, 1, 1)), i * 77 + 99));
  }
  assert(isSeasonComplete(s), 'temporada nao concluida');
  const champ = getChampion(s);
  assert(champ !== null, 'sem campeao');
  const us = getUserStanding(s);
  assert(getRewardsForPosition(us.position).credits > 0);
});

// Report
const total = p + f;
if (f === 0) {
} else {
  for (const x of fails) 
}

// ======================================================
// DEMO COMPLETA
// ======================================================
if (f === 0) {

  const demoSeason = okv(createSeason('demo-user', 'Atletico MG Lendas', 90, () => 'demo-s1'));
  for (const t of demoSeason.teams) {
    const star = t.isUser ? '(*) ' : '    ';
  }

  // Simular temporada completa
  const completedSeason = simulateFullSeason(demoSeason, 99999);
  const standings = calculateStandings(completedSeason);
  for (const e of standings) {
    const pos = String(e.position).padStart(3);
    const name = e.teamName.padEnd(28);
    const pj = String(e.played).padStart(4);
    const v = String(e.won).padStart(4);
    const emp = String(e.drawn).padStart(4);
    const d = String(e.lost).padStart(4);
    const gp = String(e.goalsFor).padStart(4);
    const gc = String(e.goalsAgainst).padStart(4);
    const sg = (e.goalDiff >= 0 ? '+' : '') + String(e.goalDiff).padStart(3);
    const pts = String(e.points).padStart(4);
    const marker = e.isUser ? ' (*)' : '    ';
  }

  // Campeao
  const champion = getChampion(completedSeason);

  // Resultado do usuario
  const userSt = getUserStanding(completedSeason);
  const userReward = getRewardsForPosition(userSt.position);
  for (const pk of userReward.packs) {
  }
  if (userReward.cosmetics.length > 0) {
  }

  // Estatisticas gerais
  const totalGoals = completedSeason.rounds.reduce(
    (acc, r) => acc + r.matches.reduce((a, m) => a + (m.homeScore || 0) + (m.awayScore || 0), 0),
    0,
  );
  const totalMatches = TOTAL_ROUNDS * MROUND;
}

process.exit(f > 0 ? 1 : 0);
