import { type PlayerInfo, addPlayer, createSquad } from '@world-legends/squad';
/**
 * T028 — Match Simulator MVP · Vitest test suite
 *
 * Testa a camada de orquestração do packages/match-simulator:
 *   TC-SIM-01..10  Unitários de simulateSquadMatch
 *   TC-SIM-20..29  Monte Carlo: 1000 partidas
 *
 * Importante: este package depende de @world-legends/engine e
 * @world-legends/squad — ao rodar com vitest, ambos devem estar
 * instalados via pnpm workspace. O runner Node.js em /tmp/t028-test.mjs
 * replica a lógica para ambientes sem pnpm (ex: CI offline).
 */
import { describe, expect, it } from 'vitest';
import {
  type PlayerMatchData,
  type PlayerMatchResolver,
  buildAdjacentPairs,
  chemistryToTacticalIntensity,
  determineWinner,
  makeAttributesFromOverall,
  simulateSquadMatch,
} from '../src/index';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makePlayer(
  overrides: Partial<PlayerInfo> & { naturalPosition: import('@world-legends/types').Position },
): PlayerInfo {
  return {
    userCardId: 'uc-x',
    userId: 'user-001',
    nationality: overrides.nationality ?? 'BR',
    overall: overrides.overall ?? 80,
    isInjured: overrides.isInjured ?? false,
    suspendedMatches: overrides.suspendedMatches ?? 0,
    ...overrides,
  };
}

const PLANTEL_433: PlayerInfo[] = [
  makePlayer({ userCardId: 'uc-gk', naturalPosition: 'GK', overall: 88 }),
  makePlayer({ userCardId: 'uc-rb', naturalPosition: 'RB', overall: 82 }),
  makePlayer({ userCardId: 'uc-cb1', naturalPosition: 'CB', overall: 84 }),
  makePlayer({ userCardId: 'uc-cb2', naturalPosition: 'CB', overall: 83 }),
  makePlayer({ userCardId: 'uc-lb', naturalPosition: 'LB', overall: 82 }),
  makePlayer({ userCardId: 'uc-cm1', naturalPosition: 'CM', overall: 86 }),
  makePlayer({ userCardId: 'uc-cm2', naturalPosition: 'CM', overall: 85 }),
  makePlayer({ userCardId: 'uc-cm3', naturalPosition: 'CM', overall: 87 }),
  makePlayer({ userCardId: 'uc-rw', naturalPosition: 'RW', overall: 88 }),
  makePlayer({ userCardId: 'uc-st', naturalPosition: 'ST', overall: 92 }),
  makePlayer({ userCardId: 'uc-lw', naturalPosition: 'LW', overall: 90 }),
  makePlayer({ userCardId: 'uc-b1', naturalPosition: 'GK', overall: 78, nationality: 'DE' }),
  makePlayer({ userCardId: 'uc-b2', naturalPosition: 'CB', overall: 78, nationality: 'DE' }),
  makePlayer({ userCardId: 'uc-b3', naturalPosition: 'CM', overall: 79, nationality: 'FR' }),
  makePlayer({ userCardId: 'uc-b4', naturalPosition: 'ST', overall: 80, nationality: 'AR' }),
  makePlayer({ userCardId: 'uc-b5', naturalPosition: 'LW', overall: 81, nationality: 'NL' }),
  makePlayer({ userCardId: 'uc-b6', naturalPosition: 'RB', overall: 78, nationality: 'IT' }),
  makePlayer({ userCardId: 'uc-b7', naturalPosition: 'CDM', overall: 79, nationality: 'ES' }),
];

function makeResolver(plantel: PlayerInfo[]): PlayerMatchResolver {
  const map = new Map(plantel.map((p) => [p.userCardId, p]));
  return (id) => {
    const p = map.get(id);
    if (!p) return null;
    return {
      userCardId: p.userCardId,
      naturalPosition: p.naturalPosition,
      overall: p.overall,
      nationality: p.nationality,
      traits: [],
    };
  };
}

function buildFullSquad(userId: string, plantel: PlayerInfo[]) {
  const resolver = makeResolver(plantel);
  const r = createSquad({ userId, formation: '4-3-3' });
  if (!r.ok) throw new Error('createSquad falhou');
  let squad = r.value;

  // Derive IDs from the plantel so this works for any ID scheme (including prefixed away squads)
  const SLOT_NAMES = [
    'GK-1',
    'RB-1',
    'CB-1',
    'CB-2',
    'LB-1',
    'CM-1',
    'CM-2',
    'CM-3',
    'RW-1',
    'ST-1',
    'LW-1',
  ];
  const STARTERS: [string, string][] = plantel
    .slice(0, 11)
    .map((p, i) => [p.userCardId, SLOT_NAMES[i]!]);
  const BENCH = plantel.slice(11).map((p) => p.userCardId);

  const resolvePlayer = (uid: string) => {
    const p = plantel.find((x) => x.userCardId === uid);
    return p ? { ...p, userId } : null;
  };

  for (const [id, slotId] of STARTERS) {
    const a = addPlayer({ squad, userCardId: id, slotId, resolvePlayer });
    if (!a.ok) throw new Error(`Starter ${id}: ${JSON.stringify(a.error)}`);
    squad = a.value;
  }
  for (const id of BENCH) {
    const a = addPlayer({ squad, userCardId: id, resolvePlayer });
    if (!a.ok) throw new Error(`Bench ${id}: ${JSON.stringify(a.error)}`);
    squad = a.value;
  }

  return { squad, resolver };
}

// ─── TC-SIM ───────────────────────────────────────────────────────────────────

describe('simulateSquadMatch', () => {
  describe('TC-SIM-01: partida básica completa sem erro', () => {
    it('retorna homeScore, awayScore, events', () => {
      const { squad: home, resolver: homeRes } = buildFullSquad('h', PLANTEL_433);
      const { squad: away, resolver: awayRes } = buildFullSquad(
        'a',
        PLANTEL_433.map((p) => ({ ...p, userId: 'a', userCardId: `a-${p.userCardId}` })),
      );
      const out = simulateSquadMatch({
        homeSquad: home,
        awaySquad: away,
        seed: 42,
        resolveHome: homeRes,
        resolveAway: awayRes,
      });
      expect(out.result.homeScore).toBeGreaterThanOrEqual(0);
      expect(out.result.awayScore).toBeGreaterThanOrEqual(0);
      expect(out.result.events.length).toBeGreaterThan(0);
      expect(['home', 'away', 'draw']).toContain(out.winner);
    });
  });

  describe('TC-SIM-02: determinismo', () => {
    it('mesmo seed produz resultado idêntico', () => {
      const { squad: home, resolver: homeRes } = buildFullSquad('h', PLANTEL_433);
      const { squad: away, resolver: awayRes } = buildFullSquad(
        'a',
        PLANTEL_433.map((p) => ({ ...p, userId: 'a', userCardId: `a-${p.userCardId}` })),
      );
      const input = {
        homeSquad: home,
        awaySquad: away,
        seed: 9999,
        resolveHome: homeRes,
        resolveAway: awayRes,
      };
      const r1 = simulateSquadMatch(input);
      const r2 = simulateSquadMatch(input);
      expect(r1.result.homeScore).toBe(r2.result.homeScore);
      expect(r1.result.awayScore).toBe(r2.result.awayScore);
      expect(r1.winner).toBe(r2.winner);
      expect(r1.result.events.length).toBe(r2.result.events.length);
    });
  });

  describe('TC-SIM-07: química → TacticalIntensity', () => {
    it('mapeamento correto', () => {
      expect(chemistryToTacticalIntensity(80)).toBe('ofensivo');
      expect(chemistryToTacticalIntensity(65)).toBe('equilibrado');
      expect(chemistryToTacticalIntensity(50)).toBe('defensivo');
      expect(chemistryToTacticalIntensity(30)).toBe('ultra_defensivo');
    });
  });

  describe('TC-SIM-08: makeAttributesFromOverall', () => {
    it('GK OVR=90 tem gk_reflexes=90', () => {
      const attrs = makeAttributesFromOverall('GK', 90);
      expect(attrs.gk_reflexes).toBe(90);
      expect(attrs.gk_positioning).toBe(90);
    });
    it('ST OVR=95 tem finishing=95', () => {
      const attrs = makeAttributesFromOverall('ST', 95);
      expect(attrs.finishing).toBe(95);
      expect(attrs.shot_power).toBe(95);
    });
    it('CB OVR=80 tem defending=80', () => {
      const attrs = makeAttributesFromOverall('CB', 80);
      expect(attrs.defending).toBe(80);
    });
  });

  describe('TC-SIM-09: adjacentPairs', () => {
    it('4-3-3 gera pares não-vazios incluindo GK', () => {
      const { squad } = buildFullSquad('h', PLANTEL_433);
      const starters = squad.starters
        .filter((s) => s.userCardId !== null)
        .map((s) => ({
          slotId: s.slotId,
          formationPosition: s.requiredPosition,
          player: null as any,
        }));
      const pairs = buildAdjacentPairs(starters);
      expect(pairs.length).toBeGreaterThan(5);
      const gkPairs = pairs.filter((p) => p.slotIdA === 'GK-1' || p.slotIdB === 'GK-1');
      expect(gkPairs.length).toBeGreaterThan(0);
    });
  });

  describe('TC-SIM-06: determineWinner', () => {
    it('home win', () => {
      expect(
        determineWinner({
          homeScore: 2,
          awayScore: 0,
          events: [],
          stats: {} as any,
          mvpUserCardId: null,
          weather: 'ensolarado',
          refereeProfile: 'normal',
          seed: { value: '0' },
          engineVersion: '1',
        }),
      ).toBe('home');
    });
    it('draw', () => {
      expect(
        determineWinner({
          homeScore: 1,
          awayScore: 1,
          events: [],
          stats: {} as any,
          mvpUserCardId: null,
          weather: 'ensolarado',
          refereeProfile: 'normal',
          seed: { value: '0' },
          engineVersion: '1',
        }),
      ).toBe('draw');
    });
  });
});

describe('Monte Carlo: 1000 partidas', () => {
  it('1000 partidas completam, são determinísticas e têm distribuição sã', () => {
    const { squad: home, resolver: homeRes } = buildFullSquad('h', PLANTEL_433);
    const { squad: away, resolver: awayRes } = buildFullSquad(
      'a',
      PLANTEL_433.map((p) => ({ ...p, userId: 'a', userCardId: `a-${p.userCardId}` })),
    );

    let homeWins = 0,
      awayWins = 0,
      draws = 0;
    let totalGoals = 0,
      matchesWithGoal = 0;
    let detOk = true;

    for (let s = 0; s < 1000; s++) {
      const input = {
        homeSquad: home,
        awaySquad: away,
        seed: s,
        resolveHome: homeRes,
        resolveAway: awayRes,
      };
      const r1 = simulateSquadMatch(input);
      const r2 = simulateSquadMatch(input);

      // Determinismo
      if (r1.result.homeScore !== r2.result.homeScore || r1.winner !== r2.winner) detOk = false;

      if (r1.winner === 'home') homeWins++;
      else if (r1.winner === 'away') awayWins++;
      else draws++;

      const goals = r1.result.events.filter((e) => e.type === 'goal').length;
      totalGoals += goals;
      if (goals > 0) matchesWithGoal++;
    }

    expect(detOk).toBe(true);
    expect(homeWins + awayWins + draws).toBe(1000);
    expect(homeWins / 1000).toBeGreaterThan(0.35);
    expect(homeWins / 1000).toBeLessThan(0.7);
    expect(draws / 1000).toBeGreaterThan(0.1);
    expect(draws / 1000).toBeLessThan(0.4);
    expect(totalGoals / 1000).toBeGreaterThan(1.5);
    expect(matchesWithGoal / 1000).toBeGreaterThan(0.7);
  }, 30_000); // 30s timeout para o monte carlo
});
