/**
 * Testes de `calculateRewards` — TC-REW-01..28
 *
 * Todos os testes usam MatchResult construídos em memória —
 * sem importar packages/engine, packages/match-simulator, etc.
 * Apenas as interfaces de tipo são importadas.
 */
import { describe, expect, it } from 'vitest';
import {
  BASE_REWARDS,
  BONUS_CLEAN_SHEET,
  BONUS_GOAL,
  BONUS_HAT_TRICK,
  BONUS_MVP,
  HAT_TRICK_THRESHOLD,
  calculateRewards,
  cleanSheetBonus,
  detectOutcome,
  goalScoredBonuses,
  hatTrickBonuses,
  mvpBonus,
} from '../src/index';
import type { MatchResult } from '../src/types/types';

// ─── Fábrica de MatchResult de teste ─────────────────────────────────────────

type EventOverride = {
  type: string;
  teamSide?: 'home' | 'away';
  scorerUserCardId?: string;
  isOwnGoal?: boolean;
  minute?: number;
};

function makeResult(
  overrides: {
    homeScore?: number;
    awayScore?: number;
    events?: EventOverride[];
    mvpUserCardId?: string | null;
    walkover?: { affectedTeamSide: 'home' | 'away'; minute: number; remainingPlayers: number };
    penaltyShootout?: {
      homeScore: number;
      awayScore: number;
      totalRounds: number;
      resolvedBySeedTiebreak: boolean;
    };
  } = {},
): MatchResult {
  const homeScore = overrides.homeScore ?? 0;
  const awayScore = overrides.awayScore ?? 0;

  // Construir eventos de gol a partir do placar se não fornecidos
  const events: any[] = overrides.events ?? [];
  if (!overrides.events) {
    // Gerar eventos de gol compatíveis com o placar
    for (let i = 0; i < homeScore; i++) {
      events.push({
        type: 'goal',
        teamSide: 'home',
        scorerUserCardId: `uc-home-${i + 1}`,
        isOwnGoal: false,
        minute: 10 + i * 8,
        description: 'Gol',
      });
    }
    for (let i = 0; i < awayScore; i++) {
      events.push({
        type: 'goal',
        teamSide: 'away',
        scorerUserCardId: `uc-away-${i + 1}`,
        isOwnGoal: false,
        minute: 15 + i * 8,
        description: 'Gol',
      });
    }
    events.push({ type: 'kickoff', minute: 0, description: 'Kickoff' });
    events.push({ type: 'full_time', minute: 90, description: 'Fim' });
  }

  return {
    homeScore,
    awayScore,
    events: Object.freeze(events) as any,
    stats: {
      home: {
        possessionPercent: 50,
        shots: 10,
        shotsOnTarget: 5,
        xg: 1.5,
        fouls: 8,
        corners: 4,
        yellowCards: 1,
        redCards: 0,
      },
      away: {
        possessionPercent: 50,
        shots: 8,
        shotsOnTarget: 4,
        xg: 1.2,
        fouls: 9,
        corners: 3,
        yellowCards: 2,
        redCards: 0,
      },
    },
    mvpUserCardId: overrides.mvpUserCardId ?? null,
    weather: 'ensolarado',
    refereeProfile: 'normal',
    seed: new Uint32Array([42]),
    engineVersion: '1.0.0-test',
    ...(overrides.walkover ? { walkover: overrides.walkover } : {}),
    ...(overrides.penaltyShootout ? { penaltyShootout: overrides.penaltyShootout } : {}),
  } as MatchResult;
}

const HOME_CARDS = [
  'uc-gk-h',
  'uc-cb1-h',
  'uc-cb2-h',
  'uc-lb-h',
  'uc-rb-h',
  'uc-cm1-h',
  'uc-cm2-h',
  'uc-cm3-h',
  'uc-rw-h',
  'uc-st-h',
  'uc-lw-h',
];
const AWAY_CARDS = [
  'uc-gk-a',
  'uc-cb1-a',
  'uc-cb2-a',
  'uc-lb-a',
  'uc-rb-a',
  'uc-cm1-a',
  'uc-cm2-a',
  'uc-cm3-a',
  'uc-rw-a',
  'uc-st-a',
  'uc-lw-a',
];

// ─── TC-REW-01..03: recompensas base ─────────────────────────────────────────

describe('BASE: vitória / empate / derrota', () => {
  it('TC-REW-01: vitória → base.credits=200, base.xp=150', () => {
    const r = calculateRewards({
      result: makeResult({ homeScore: 2, awayScore: 0 }),
      userSide: 'home',
      userCardIds: HOME_CARDS,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.base.outcome).toBe('win');
    expect(r.value.base.credits).toBe(BASE_REWARDS.win.credits);
    expect(r.value.base.xp).toBe(BASE_REWARDS.win.xp);
  });

  it('TC-REW-02: empate → base.credits=100, base.xp=80', () => {
    const r = calculateRewards({
      result: makeResult({ homeScore: 1, awayScore: 1 }),
      userSide: 'home',
      userCardIds: HOME_CARDS,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.base.outcome).toBe('draw');
    expect(r.value.base.credits).toBe(BASE_REWARDS.draw.credits);
    expect(r.value.base.xp).toBe(BASE_REWARDS.draw.xp);
  });

  it('TC-REW-03: derrota → base.credits=50, base.xp=40', () => {
    const r = calculateRewards({
      result: makeResult({ homeScore: 0, awayScore: 2 }),
      userSide: 'home',
      userCardIds: HOME_CARDS,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.base.outcome).toBe('loss');
    expect(r.value.base.credits).toBe(BASE_REWARDS.loss.credits);
    expect(r.value.base.xp).toBe(BASE_REWARDS.loss.xp);
  });

  it('TC-REW-03b: usuário como away, placar 0-3 → vitória para away', () => {
    const r = calculateRewards({
      result: makeResult({ homeScore: 0, awayScore: 3 }),
      userSide: 'away',
      userCardIds: AWAY_CARDS,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.base.outcome).toBe('win');
  });
});

// ─── TC-REW-04: clean sheet ───────────────────────────────────────────────────

describe('BONUS: clean sheet', () => {
  it('TC-REW-04a: adversário não marcou → bônus clean_sheet', () => {
    const r = calculateRewards({
      result: makeResult({ homeScore: 1, awayScore: 0 }),
      userSide: 'home',
      userCardIds: HOME_CARDS,
    });
    if (!r.ok) return;
    const cs = r.value.bonuses.find((b) => b.type === 'clean_sheet');
    expect(cs).toBeDefined();
    expect(cs!.credits).toBe(BONUS_CLEAN_SHEET.credits);
    expect(cs!.xp).toBe(BONUS_CLEAN_SHEET.xp);
  });

  it('TC-REW-04b: adversário marcou 1 → sem clean sheet', () => {
    const r = calculateRewards({
      result: makeResult({ homeScore: 2, awayScore: 1 }),
      userSide: 'home',
      userCardIds: HOME_CARDS,
    });
    if (!r.ok) return;
    expect(r.value.bonuses.find((b) => b.type === 'clean_sheet')).toBeUndefined();
  });

  it('TC-REW-04c: usuário como away, home não marcou → clean sheet', () => {
    const r = calculateRewards({
      result: makeResult({ homeScore: 0, awayScore: 2 }),
      userSide: 'away',
      userCardIds: AWAY_CARDS,
    });
    if (!r.ok) return;
    expect(r.value.bonuses.some((b) => b.type === 'clean_sheet')).toBe(true);
  });

  it('TC-REW-04d: W.O. não gera clean sheet', () => {
    const r = calculateRewards({
      result: makeResult({
        homeScore: 3,
        awayScore: 0,
        walkover: { affectedTeamSide: 'away', minute: 65, remainingPlayers: 6 },
      }),
      userSide: 'home',
      userCardIds: HOME_CARDS,
    });
    if (!r.ok) return;
    expect(r.value.bonuses.some((b) => b.type === 'clean_sheet')).toBe(false);
  });
});

// ─── TC-REW-05: hat trick ────────────────────────────────────────────────────

describe('BONUS: hat trick', () => {
  it('TC-REW-05a: jogador marca 3 gols → hat trick', () => {
    const result = makeResult({
      homeScore: 3,
      awayScore: 0,
      events: [
        {
          type: 'goal',
          teamSide: 'home',
          scorerUserCardId: 'uc-st-h',
          isOwnGoal: false,
          minute: 12,
        },
        {
          type: 'goal',
          teamSide: 'home',
          scorerUserCardId: 'uc-st-h',
          isOwnGoal: false,
          minute: 34,
        },
        {
          type: 'goal',
          teamSide: 'home',
          scorerUserCardId: 'uc-st-h',
          isOwnGoal: false,
          minute: 67,
        },
        { type: 'full_time', minute: 90 },
      ],
    });
    const r = calculateRewards({ result, userSide: 'home', userCardIds: HOME_CARDS });
    if (!r.ok) return;
    const ht = r.value.bonuses.find((b) => b.type === 'hat_trick');
    expect(ht).toBeDefined();
    expect(ht!.credits).toBe(BONUS_HAT_TRICK.credits);
    expect(ht!.detail).toContain('uc-st-h');
  });

  it('TC-REW-05b: jogador marca 4 gols → hat trick (limiar = 3)', () => {
    const result = makeResult({
      homeScore: 4,
      awayScore: 0,
      events: [
        {
          type: 'goal',
          teamSide: 'home',
          scorerUserCardId: 'uc-st-h',
          isOwnGoal: false,
          minute: 10,
        },
        {
          type: 'goal',
          teamSide: 'home',
          scorerUserCardId: 'uc-st-h',
          isOwnGoal: false,
          minute: 25,
        },
        {
          type: 'goal',
          teamSide: 'home',
          scorerUserCardId: 'uc-st-h',
          isOwnGoal: false,
          minute: 50,
        },
        {
          type: 'goal',
          teamSide: 'home',
          scorerUserCardId: 'uc-st-h',
          isOwnGoal: false,
          minute: 78,
        },
        { type: 'full_time', minute: 90 },
      ],
    });
    const r = calculateRewards({ result, userSide: 'home', userCardIds: HOME_CARDS });
    if (!r.ok) return;
    expect(r.value.bonuses.filter((b) => b.type === 'hat_trick')).toHaveLength(1);
  });

  it('TC-REW-05c: dois jogadores com 3 gols cada → dois hat tricks', () => {
    const result = makeResult({
      homeScore: 6,
      awayScore: 0,
      events: [
        {
          type: 'goal',
          teamSide: 'home',
          scorerUserCardId: 'uc-st-h',
          isOwnGoal: false,
          minute: 10,
        },
        {
          type: 'goal',
          teamSide: 'home',
          scorerUserCardId: 'uc-st-h',
          isOwnGoal: false,
          minute: 22,
        },
        {
          type: 'goal',
          teamSide: 'home',
          scorerUserCardId: 'uc-st-h',
          isOwnGoal: false,
          minute: 40,
        },
        {
          type: 'goal',
          teamSide: 'home',
          scorerUserCardId: 'uc-rw-h',
          isOwnGoal: false,
          minute: 51,
        },
        {
          type: 'goal',
          teamSide: 'home',
          scorerUserCardId: 'uc-rw-h',
          isOwnGoal: false,
          minute: 65,
        },
        {
          type: 'goal',
          teamSide: 'home',
          scorerUserCardId: 'uc-rw-h',
          isOwnGoal: false,
          minute: 80,
        },
        { type: 'full_time', minute: 90 },
      ],
    });
    const r = calculateRewards({ result, userSide: 'home', userCardIds: HOME_CARDS });
    if (!r.ok) return;
    expect(r.value.bonuses.filter((b) => b.type === 'hat_trick')).toHaveLength(2);
  });

  it('TC-REW-05d: apenas 2 gols → sem hat trick', () => {
    const result = makeResult({
      homeScore: 2,
      awayScore: 0,
      events: [
        {
          type: 'goal',
          teamSide: 'home',
          scorerUserCardId: 'uc-st-h',
          isOwnGoal: false,
          minute: 20,
        },
        {
          type: 'goal',
          teamSide: 'home',
          scorerUserCardId: 'uc-st-h',
          isOwnGoal: false,
          minute: 55,
        },
        { type: 'full_time', minute: 90 },
      ],
    });
    const r = calculateRewards({ result, userSide: 'home', userCardIds: HOME_CARDS });
    if (!r.ok) return;
    expect(r.value.bonuses.find((b) => b.type === 'hat_trick')).toBeUndefined();
  });

  it('TC-REW-05e: gol contra não conta para hat trick', () => {
    const result = makeResult({
      homeScore: 3,
      awayScore: 0,
      events: [
        // 2 gols legítimos
        {
          type: 'goal',
          teamSide: 'home',
          scorerUserCardId: 'uc-st-h',
          isOwnGoal: false,
          minute: 10,
        },
        {
          type: 'goal',
          teamSide: 'home',
          scorerUserCardId: 'uc-st-h',
          isOwnGoal: false,
          minute: 30,
        },
        // 1 gol contra (não deve contar)
        {
          type: 'goal',
          teamSide: 'home',
          scorerUserCardId: 'uc-cb1-a',
          isOwnGoal: true,
          minute: 60,
        },
        { type: 'full_time', minute: 90 },
      ],
    });
    const r = calculateRewards({ result, userSide: 'home', userCardIds: HOME_CARDS });
    if (!r.ok) return;
    expect(r.value.bonuses.find((b) => b.type === 'hat_trick')).toBeUndefined();
  });

  it('TC-REW-05f: hat trick do adversário não gera bônus para o usuário', () => {
    const result = makeResult({
      homeScore: 0,
      awayScore: 3,
      events: [
        {
          type: 'goal',
          teamSide: 'away',
          scorerUserCardId: 'uc-st-a',
          isOwnGoal: false,
          minute: 10,
        },
        {
          type: 'goal',
          teamSide: 'away',
          scorerUserCardId: 'uc-st-a',
          isOwnGoal: false,
          minute: 40,
        },
        {
          type: 'goal',
          teamSide: 'away',
          scorerUserCardId: 'uc-st-a',
          isOwnGoal: false,
          minute: 70,
        },
        { type: 'full_time', minute: 90 },
      ],
    });
    const r = calculateRewards({ result, userSide: 'home', userCardIds: HOME_CARDS });
    if (!r.ok) return;
    expect(r.value.bonuses.find((b) => b.type === 'hat_trick')).toBeUndefined();
  });

  it('TC-REW-05g: HAT_TRICK_THRESHOLD é 3', () => {
    expect(HAT_TRICK_THRESHOLD).toBe(3);
  });
});

// ─── TC-REW-06/07: MVP ───────────────────────────────────────────────────────

describe('BONUS: MVP', () => {
  it('TC-REW-06: MVP do squad do usuário → bônus mvp', () => {
    const result = makeResult({ homeScore: 2, awayScore: 0, mvpUserCardId: 'uc-cm1-h' });
    const r = calculateRewards({ result, userSide: 'home', userCardIds: HOME_CARDS });
    if (!r.ok) return;
    const mvp = r.value.bonuses.find((b) => b.type === 'mvp');
    expect(mvp).toBeDefined();
    expect(mvp!.credits).toBe(BONUS_MVP.credits);
    expect(mvp!.xp).toBe(BONUS_MVP.xp);
    expect(mvp!.detail).toContain('uc-cm1-h');
  });

  it('TC-REW-07a: MVP do adversário → sem bônus', () => {
    const result = makeResult({ homeScore: 0, awayScore: 1, mvpUserCardId: 'uc-cm1-a' });
    const r = calculateRewards({ result, userSide: 'home', userCardIds: HOME_CARDS });
    if (!r.ok) return;
    expect(r.value.bonuses.find((b) => b.type === 'mvp')).toBeUndefined();
  });

  it('TC-REW-07b: MVP null → sem bônus', () => {
    const result = makeResult({ homeScore: 1, awayScore: 0, mvpUserCardId: null });
    const r = calculateRewards({ result, userSide: 'home', userCardIds: HOME_CARDS });
    if (!r.ok) return;
    expect(r.value.bonuses.find((b) => b.type === 'mvp')).toBeUndefined();
  });
});

// ─── TC-REW-08: bônus por gol marcado ─────────────────────────────────────────

describe('BONUS: goal_scored', () => {
  it('TC-REW-08a: 3 gols próprios → 3 bônus goal_scored', () => {
    const result = makeResult({
      homeScore: 3,
      awayScore: 0,
      events: [
        {
          type: 'goal',
          teamSide: 'home',
          scorerUserCardId: 'uc-st-h',
          isOwnGoal: false,
          minute: 15,
        },
        {
          type: 'goal',
          teamSide: 'home',
          scorerUserCardId: 'uc-rw-h',
          isOwnGoal: false,
          minute: 38,
        },
        {
          type: 'goal',
          teamSide: 'home',
          scorerUserCardId: 'uc-lw-h',
          isOwnGoal: false,
          minute: 72,
        },
        { type: 'full_time', minute: 90 },
      ],
    });
    const r = calculateRewards({ result, userSide: 'home', userCardIds: HOME_CARDS });
    if (!r.ok) return;
    const goalBonuses = r.value.bonuses.filter((b) => b.type === 'goal_scored');
    expect(goalBonuses).toHaveLength(3);
    goalBonuses.forEach((g) => {
      expect(g.credits).toBe(BONUS_GOAL.credits);
      expect(g.xp).toBe(BONUS_GOAL.xp);
    });
  });

  it('TC-REW-08b: gol contra não gera bônus goal_scored', () => {
    const result = makeResult({
      homeScore: 1,
      awayScore: 0,
      events: [
        {
          type: 'goal',
          teamSide: 'home',
          scorerUserCardId: 'uc-cb1-a',
          isOwnGoal: true,
          minute: 50,
        },
        { type: 'full_time', minute: 90 },
      ],
    });
    const r = calculateRewards({ result, userSide: 'home', userCardIds: HOME_CARDS });
    if (!r.ok) return;
    // gol contra: scorerUserCardId pertence ao adversário
    const goalBonuses = r.value.bonuses.filter((b) => b.type === 'goal_scored');
    expect(goalBonuses).toHaveLength(0);
  });

  it('TC-REW-08c: 0 gols marcados → 0 bônus goal_scored', () => {
    const r = calculateRewards({
      result: makeResult({ homeScore: 0, awayScore: 0 }),
      userSide: 'home',
      userCardIds: HOME_CARDS,
    });
    if (!r.ok) return;
    expect(r.value.bonuses.filter((b) => b.type === 'goal_scored')).toHaveLength(0);
  });
});

// ─── TC-REW-09: total = base + bônus ─────────────────────────────────────────

describe('TOTAL: base + bonuses', () => {
  it('TC-REW-09a: total sem bônus = base.credits', () => {
    // Derrota 0–1: sem CS, sem HT, sem MVP, sem gols marcados
    const r = calculateRewards({
      result: makeResult({ homeScore: 0, awayScore: 1 }),
      userSide: 'home',
      userCardIds: HOME_CARDS,
    });
    if (!r.ok) return;
    expect(r.value.total.credits).toBe(r.value.base.credits);
    expect(r.value.total.xp).toBe(r.value.base.xp);
  });

  it('TC-REW-09b: total com clean sheet = base + CS', () => {
    const r = calculateRewards({
      result: makeResult({ homeScore: 1, awayScore: 0 }),
      userSide: 'home',
      userCardIds: HOME_CARDS,
    });
    if (!r.ok) return;
    // makeResult auto-generates scorer 'uc-home-1', which is NOT in HOME_CARDS,
    // so BONUS_GOAL does not apply — only base win + clean sheet
    const expectedCredits = BASE_REWARDS.win.credits + BONUS_CLEAN_SHEET.credits;
    const expectedXp = BASE_REWARDS.win.xp + BONUS_CLEAN_SHEET.xp;
    expect(r.value.total.credits).toBe(expectedCredits);
    expect(r.value.total.xp).toBe(expectedXp);
  });

  it('TC-REW-09c: total = somatório exato de base + todos os bônus', () => {
    const result = makeResult({
      homeScore: 3,
      awayScore: 0,
      mvpUserCardId: 'uc-st-h',
      events: [
        {
          type: 'goal',
          teamSide: 'home',
          scorerUserCardId: 'uc-st-h',
          isOwnGoal: false,
          minute: 10,
        },
        {
          type: 'goal',
          teamSide: 'home',
          scorerUserCardId: 'uc-st-h',
          isOwnGoal: false,
          minute: 35,
        },
        {
          type: 'goal',
          teamSide: 'home',
          scorerUserCardId: 'uc-st-h',
          isOwnGoal: false,
          minute: 60,
        },
        { type: 'full_time', minute: 90 },
      ],
    });
    const r = calculateRewards({ result, userSide: 'home', userCardIds: HOME_CARDS });
    if (!r.ok) return;
    const { base, bonuses, total } = r.value;
    const sumCredits = base.credits + bonuses.reduce((s, b) => s + b.credits, 0);
    const sumXp = base.xp + bonuses.reduce((s, b) => s + b.xp, 0);
    expect(total.credits).toBe(sumCredits);
    expect(total.xp).toBe(sumXp);
  });
});

// ─── TC-REW-10: bônus empilham ────────────────────────────────────────────────

describe('STACK: múltiplos bônus', () => {
  it('TC-REW-10: vitória + CS + HT + MVP → todos os 4 bônus aplicados', () => {
    const result = makeResult({
      homeScore: 3,
      awayScore: 0,
      mvpUserCardId: 'uc-st-h',
      events: [
        {
          type: 'goal',
          teamSide: 'home',
          scorerUserCardId: 'uc-st-h',
          isOwnGoal: false,
          minute: 10,
        },
        {
          type: 'goal',
          teamSide: 'home',
          scorerUserCardId: 'uc-st-h',
          isOwnGoal: false,
          minute: 35,
        },
        {
          type: 'goal',
          teamSide: 'home',
          scorerUserCardId: 'uc-st-h',
          isOwnGoal: false,
          minute: 60,
        },
        { type: 'full_time', minute: 90 },
      ],
    });
    const r = calculateRewards({ result, userSide: 'home', userCardIds: HOME_CARDS });
    if (!r.ok) return;
    const types = r.value.bonuses.map((b) => b.type);
    expect(types).toContain('clean_sheet');
    expect(types).toContain('hat_trick');
    expect(types).toContain('mvp');
    expect(types.filter((t) => t === 'goal_scored')).toHaveLength(3);
    // Total deve refletir todos os bônus
    const minTotal =
      BASE_REWARDS.win.credits +
      BONUS_CLEAN_SHEET.credits +
      BONUS_HAT_TRICK.credits +
      BONUS_MVP.credits +
      3 * BONUS_GOAL.credits;
    expect(r.value.total.credits).toBe(minTotal);
  });
});

// ─── TC-REW-11: progress updates ──────────────────────────────────────────────

describe('PROGRESS: atualizações', () => {
  it('TC-REW-11a: vitória → matches_played=1, wins=1', () => {
    const r = calculateRewards({
      result: makeResult({ homeScore: 1, awayScore: 0 }),
      userSide: 'home',
      userCardIds: HOME_CARDS,
    });
    if (!r.ok) return;
    const { progress } = r.value;
    expect(progress.find((p) => p.category === 'matches_played')?.increment).toBe(1);
    expect(progress.find((p) => p.category === 'wins')?.increment).toBe(1);
    expect(progress.find((p) => p.category === 'losses')).toBeUndefined();
    expect(progress.find((p) => p.category === 'draws')).toBeUndefined();
  });

  it('TC-REW-11b: derrota → losses=1, sem wins nem draws', () => {
    const r = calculateRewards({
      result: makeResult({ homeScore: 0, awayScore: 1 }),
      userSide: 'home',
      userCardIds: HOME_CARDS,
    });
    if (!r.ok) return;
    const { progress } = r.value;
    expect(progress.find((p) => p.category === 'losses')?.increment).toBe(1);
    expect(progress.find((p) => p.category === 'wins')).toBeUndefined();
  });

  it('TC-REW-11c: empate → draws=1', () => {
    const r = calculateRewards({
      result: makeResult({ homeScore: 1, awayScore: 1 }),
      userSide: 'home',
      userCardIds: HOME_CARDS,
    });
    if (!r.ok) return;
    expect(r.value.progress.find((p) => p.category === 'draws')?.increment).toBe(1);
  });

  it('TC-REW-11d: gols marcados e sofridos são contados corretamente', () => {
    const r = calculateRewards({
      result: makeResult({ homeScore: 3, awayScore: 2 }),
      userSide: 'home',
      userCardIds: HOME_CARDS,
    });
    if (!r.ok) return;
    expect(r.value.progress.find((p) => p.category === 'goals_scored')?.increment).toBe(3);
    expect(r.value.progress.find((p) => p.category === 'goals_conceded')?.increment).toBe(2);
  });

  it('TC-REW-11e: clean sheet → progress clean_sheets=1', () => {
    const r = calculateRewards({
      result: makeResult({ homeScore: 2, awayScore: 0 }),
      userSide: 'home',
      userCardIds: HOME_CARDS,
    });
    if (!r.ok) return;
    expect(r.value.progress.find((p) => p.category === 'clean_sheets')?.increment).toBe(1);
  });

  it('TC-REW-11f: hat trick → progress hat_tricks=1', () => {
    const result = makeResult({
      homeScore: 3,
      awayScore: 1,
      events: [
        {
          type: 'goal',
          teamSide: 'home',
          scorerUserCardId: 'uc-st-h',
          isOwnGoal: false,
          minute: 10,
        },
        {
          type: 'goal',
          teamSide: 'home',
          scorerUserCardId: 'uc-st-h',
          isOwnGoal: false,
          minute: 30,
        },
        {
          type: 'goal',
          teamSide: 'home',
          scorerUserCardId: 'uc-st-h',
          isOwnGoal: false,
          minute: 60,
        },
        {
          type: 'goal',
          teamSide: 'away',
          scorerUserCardId: 'uc-st-a',
          isOwnGoal: false,
          minute: 80,
        },
        { type: 'full_time', minute: 90 },
      ],
    });
    const r = calculateRewards({ result, userSide: 'home', userCardIds: HOME_CARDS });
    if (!r.ok) return;
    expect(r.value.progress.find((p) => p.category === 'hat_tricks')?.increment).toBe(1);
  });

  it('TC-REW-11g: MVP do squad → progress mvp_awards=1', () => {
    const r = calculateRewards({
      result: makeResult({ homeScore: 1, awayScore: 0, mvpUserCardId: 'uc-cm1-h' }),
      userSide: 'home',
      userCardIds: HOME_CARDS,
    });
    if (!r.ok) return;
    expect(r.value.progress.find((p) => p.category === 'mvp_awards')?.increment).toBe(1);
  });
});

// ─── TC-REW-12: cenários especiais ───────────────────────────────────────────

describe('ESPECIAIS: pênaltis, W.O.', () => {
  it('TC-REW-12a: empate → pênaltis ganhos → vitória', () => {
    const r = calculateRewards({
      result: makeResult({
        homeScore: 1,
        awayScore: 1,
        penaltyShootout: {
          homeScore: 5,
          awayScore: 3,
          totalRounds: 5,
          resolvedBySeedTiebreak: false,
        },
      }),
      userSide: 'home',
      userCardIds: HOME_CARDS,
    });
    if (!r.ok) return;
    expect(r.value.base.outcome).toBe('win');
    expect(r.value.base.credits).toBe(BASE_REWARDS.win.credits);
  });

  it('TC-REW-12b: empate → pênaltis perdidos → derrota', () => {
    const r = calculateRewards({
      result: makeResult({
        homeScore: 1,
        awayScore: 1,
        penaltyShootout: {
          homeScore: 3,
          awayScore: 5,
          totalRounds: 5,
          resolvedBySeedTiebreak: false,
        },
      }),
      userSide: 'home',
      userCardIds: HOME_CARDS,
    });
    if (!r.ok) return;
    expect(r.value.base.outcome).toBe('loss');
  });

  it('TC-REW-12c: W.O. afetando adversário → vitória', () => {
    const r = calculateRewards({
      result: makeResult({
        homeScore: 1,
        awayScore: 0,
        walkover: { affectedTeamSide: 'away', minute: 70, remainingPlayers: 6 },
      }),
      userSide: 'home',
      userCardIds: HOME_CARDS,
    });
    if (!r.ok) return;
    expect(r.value.base.outcome).toBe('win');
  });

  it('TC-REW-12d: W.O. afetando o próprio time → derrota', () => {
    const r = calculateRewards({
      result: makeResult({
        homeScore: 0,
        awayScore: 3,
        walkover: { affectedTeamSide: 'home', minute: 55, remainingPlayers: 6 },
      }),
      userSide: 'home',
      userCardIds: HOME_CARDS,
    });
    if (!r.ok) return;
    expect(r.value.base.outcome).toBe('loss');
  });
});

// ─── TC-REW-13: validação de input ───────────────────────────────────────────

describe('VALIDAÇÃO: inputs inválidos', () => {
  it('TC-REW-13a: userCardIds vazio → erro', () => {
    const r = calculateRewards({
      result: makeResult({ homeScore: 1, awayScore: 0 }),
      userSide: 'home',
      userCardIds: [],
    });
    expect(r.ok).toBe(false);
  });
});

// ─── TC-REW-14: regras isoladas ──────────────────────────────────────────────

describe('REGRAS ISOLADAS: funções puras', () => {
  it('detectOutcome: home wins → "win"', () => {
    expect(detectOutcome(makeResult({ homeScore: 2, awayScore: 0 }), 'home')).toBe('win');
    expect(detectOutcome(makeResult({ homeScore: 2, awayScore: 0 }), 'away')).toBe('loss');
  });

  it('detectOutcome: empate → "draw"', () => {
    expect(detectOutcome(makeResult({ homeScore: 1, awayScore: 1 }), 'home')).toBe('draw');
    expect(detectOutcome(makeResult({ homeScore: 1, awayScore: 1 }), 'away')).toBe('draw');
  });

  it('cleanSheetBonus: away=0 para home → bônus', () => {
    const bonus = cleanSheetBonus(makeResult({ homeScore: 1, awayScore: 0 }), 'home');
    expect(bonus).not.toBeNull();
    expect(bonus!.type).toBe('clean_sheet');
  });

  it('hatTrickBonuses: 3 gols do mesmo jogador no squad → 1 hat trick', () => {
    const result = makeResult({
      homeScore: 3,
      awayScore: 0,
      events: [
        {
          type: 'goal',
          teamSide: 'home',
          scorerUserCardId: 'uc-st-h',
          isOwnGoal: false,
          minute: 10,
        },
        {
          type: 'goal',
          teamSide: 'home',
          scorerUserCardId: 'uc-st-h',
          isOwnGoal: false,
          minute: 40,
        },
        {
          type: 'goal',
          teamSide: 'home',
          scorerUserCardId: 'uc-st-h',
          isOwnGoal: false,
          minute: 75,
        },
      ],
    });
    const bonuses = hatTrickBonuses(result, 'home', HOME_CARDS);
    expect(bonuses).toHaveLength(1);
    expect(bonuses[0]!.type).toBe('hat_trick');
  });

  it('mvpBonus: mvpUserCardId não no squad → null', () => {
    const result = makeResult({ homeScore: 1, awayScore: 0, mvpUserCardId: 'uc-unknown' });
    expect(mvpBonus(result, HOME_CARDS)).toBeNull();
  });

  it('goalScoredBonuses: 2 gols → 2 bônus', () => {
    const result = makeResult({
      homeScore: 2,
      awayScore: 0,
      events: [
        {
          type: 'goal',
          teamSide: 'home',
          scorerUserCardId: 'uc-st-h',
          isOwnGoal: false,
          minute: 22,
        },
        {
          type: 'goal',
          teamSide: 'home',
          scorerUserCardId: 'uc-rw-h',
          isOwnGoal: false,
          minute: 66,
        },
      ],
    });
    const bonuses = goalScoredBonuses(result, 'home', HOME_CARDS);
    expect(bonuses).toHaveLength(2);
    bonuses.forEach((b) => expect(b.type).toBe('goal_scored'));
  });
});
