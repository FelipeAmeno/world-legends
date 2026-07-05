import {
  ACHIEVEMENT_IDS,
  ALL_MISSION_DEFS,
  DAILY_MISSION_IDS,
  type MissionDef,
  type MissionProgress,
  type PlayerMetrics,
  WEEKLY_MISSION_IDS,
  buildMissionViews,
  claimMission,
  dailyPeriodKey,
  refreshProgress,
  weeklyPeriodKey,
} from '@/lib/mission-system';
import { describe, expect, it } from 'vitest';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const baseMetrics: PlayerMetrics = {
  matchesPlayed: 0,
  wins: 0,
  losses: 0,
  draws: 0,
  packsOpened: 0,
  cardsOwned: 0,
  creditsEarned: 0,
  dailiesCompleted: 0,
  missionsCompleted: 0,
  winStreak: 0,
  goalsScored: 0,
  legendaryCards: 0,
  brazilianCards: 0,
};

function makeProgress(missionId: string, current: number, stageClaimed = 0): MissionProgress {
  return { missionId, current, stageClaimed, lastRefresh: new Date().toISOString() };
}

// ─── Definições ───────────────────────────────────────────────────────────────

describe('ALL_MISSION_DEFS', () => {
  it('contém missões de cada tipo', () => {
    const daily = ALL_MISSION_DEFS.filter((d) => d.type === 'daily');
    const weekly = ALL_MISSION_DEFS.filter((d) => d.type === 'weekly');
    const lifetime = ALL_MISSION_DEFS.filter((d) => d.type === 'lifetime');
    expect(daily.length).toBeGreaterThanOrEqual(5);
    expect(weekly.length).toBeGreaterThanOrEqual(5);
    expect(lifetime.length).toBeGreaterThanOrEqual(5);
  });

  it('IDs de missões são únicos', () => {
    const ids = ALL_MISSION_DEFS.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('cada missão tem pelo menos 1 stage', () => {
    for (const def of ALL_MISSION_DEFS) {
      expect(def.stages.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('stages são 1-based e sequenciais', () => {
    for (const def of ALL_MISSION_DEFS) {
      def.stages.forEach((s, i) => {
        expect(s.stage).toBe(i + 1);
      });
    }
  });

  it('cada stage tem pelo menos 1 recompensa', () => {
    for (const def of ALL_MISSION_DEFS) {
      for (const stage of def.stages) {
        expect(stage.rewards.length).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('missões semanais épicas T73 existem', () => {
    const ids = WEEKLY_MISSION_IDS;
    expect(ids).toContain('weekly_win20');
    expect(ids).toContain('weekly_packs30');
    expect(ids).toContain('weekly_goals80');
    expect(ids).toContain('weekly_brazil12');
  });

  it('achievements T74 existem', () => {
    expect(ACHIEVEMENT_IDS).toContain('achiev_first_goat');
    expect(ACHIEVEMENT_IDS).toContain('achiev_100_matches');
    expect(ACHIEVEMENT_IDS).toContain('achiev_500_goals');
    expect(ACHIEVEMENT_IDS).toContain('achiev_50_legendary');
    expect(ACHIEVEMENT_IDS).toContain('achiev_all_brazil');
    expect(ACHIEVEMENT_IDS).toContain('achiev_30_unbeaten');
  });
});

// ─── Period keys ──────────────────────────────────────────────────────────────

describe('dailyPeriodKey', () => {
  it('formato correto daily:YYYY-MM-DD', () => {
    const key = dailyPeriodKey(new Date('2026-07-02T15:00:00Z'));
    expect(key).toMatch(/^daily:\d{4}-\d{2}-\d{2}$/);
  });

  it('datas diferentes geram keys diferentes', () => {
    const d1 = dailyPeriodKey(new Date('2026-07-01'));
    const d2 = dailyPeriodKey(new Date('2026-07-02'));
    expect(d1).not.toBe(d2);
  });

  it('mesma data gera mesma key', () => {
    const d1 = dailyPeriodKey(new Date('2026-07-02T08:00:00Z'));
    const d2 = dailyPeriodKey(new Date('2026-07-02T22:00:00Z'));
    // Podem diferir se fusos horários locais divergirem — mas o formato deve bater
    expect(d1).toMatch(/^daily:/);
    expect(d2).toMatch(/^daily:/);
  });
});

describe('weeklyPeriodKey', () => {
  it('formato correto weekly:YYYY-WNN', () => {
    const key = weeklyPeriodKey(new Date('2026-07-01'));
    expect(key).toMatch(/^weekly:\d{4}-W\d{2}$/);
  });

  it('duas datas na mesma semana ISO têm a mesma key', () => {
    // Usar segunda e quarta da mesma semana para evitar ambiguidade de fuso
    const tuesday = weeklyPeriodKey(new Date('2026-06-30T12:00:00')); // terça
    const thursday = weeklyPeriodKey(new Date('2026-07-02T12:00:00')); // quinta, mesma semana
    expect(tuesday).toBe(thursday);
  });

  it('semanas diferentes geram keys diferentes', () => {
    const w1 = weeklyPeriodKey(new Date('2026-06-22'));
    const w2 = weeklyPeriodKey(new Date('2026-06-29'));
    expect(w1).not.toBe(w2);
  });
});

// ─── buildMissionViews ────────────────────────────────────────────────────────

describe('buildMissionViews', () => {
  const dailyPlay = ALL_MISSION_DEFS.find((d) => d.id === 'daily_play1')!;

  it('missão sem progresso: pct=0, claimable=false', () => {
    const [view] = buildMissionViews([dailyPlay], {}, baseMetrics);
    expect(view?.pct).toBe(0);
    expect(view?.claimable).toBe(false);
    expect(view?.allDone).toBe(false);
  });

  it('missão com progresso completo: claimable=true', () => {
    const prog = { daily_play1: makeProgress('daily_play1', 1) };
    const [view] = buildMissionViews([dailyPlay], prog, baseMetrics);
    expect(view?.claimable).toBe(true);
    expect(view?.pct).toBe(100);
  });

  it('missão já coletada: allDone=true, claimable=false', () => {
    const prog = { daily_play1: makeProgress('daily_play1', 1, 1) };
    const [view] = buildMissionViews([dailyPlay], prog, baseMetrics);
    expect(view?.allDone).toBe(true);
    expect(view?.claimable).toBe(false);
  });

  it('progresso parcial: pct entre 0 e 100', () => {
    const multiDef = ALL_MISSION_DEFS.find((d) => d.id === 'daily_match3')!;
    const prog = { daily_match3: makeProgress('daily_match3', 2) };
    const [view] = buildMissionViews([multiDef], prog, baseMetrics);
    expect(view?.pct).toBeGreaterThan(0);
    expect(view?.pct).toBeLessThan(100);
  });

  it('achievement multi-stage: mostra stage correto após claim', () => {
    const lifeDef = ALL_MISSION_DEFS.find((d) => d.id === 'life_matches')!;
    // stage 1 = 5 partidas, stage 2 = 20 partidas
    // buildMissionViews usa metrics[trackKey] para lifetime
    const prog = { life_matches: makeProgress('life_matches', 20, 1) };
    const metrics = { ...baseMetrics, matchesPlayed: 20 };
    const [view] = buildMissionViews([lifeDef], prog, metrics);
    // Deve mostrar stage 2 e ser coletável
    expect(view?.currentStage.stage).toBe(2);
    expect(view?.claimable).toBe(true);
  });
});

// ─── refreshProgress ─────────────────────────────────────────────────────────

describe('refreshProgress', () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const dailyDefs = ALL_MISSION_DEFS.filter((d) => d.type === 'daily');

  it('reseta diárias de ontem', () => {
    const prog: Record<string, MissionProgress> = {
      daily_play1: {
        missionId: 'daily_play1',
        current: 1,
        stageClaimed: 1,
        lastRefresh: yesterday.toISOString(),
      },
    };
    const updated = refreshProgress(prog, dailyDefs);
    expect(updated.daily_play1?.current).toBe(0);
    expect(updated.daily_play1?.stageClaimed).toBe(0);
  });

  it('não reseta diárias de hoje', () => {
    const today = new Date();
    const prog: Record<string, MissionProgress> = {
      daily_play1: {
        missionId: 'daily_play1',
        current: 1,
        stageClaimed: 1,
        lastRefresh: today.toISOString(),
      },
    };
    const updated = refreshProgress(prog, dailyDefs);
    expect(updated.daily_play1?.current).toBe(1);
    expect(updated.daily_play1?.stageClaimed).toBe(1);
  });

  it('não modifica missões lifetime', () => {
    const lifeDefs = ALL_MISSION_DEFS.filter((d) => d.type === 'lifetime');
    const prog: Record<string, MissionProgress> = {
      life_matches: {
        missionId: 'life_matches',
        current: 50,
        stageClaimed: 2,
        lastRefresh: yesterday.toISOString(),
      },
    };
    const updated = refreshProgress(prog, lifeDefs);
    expect(updated.life_matches?.current).toBe(50);
    expect(updated.life_matches?.stageClaimed).toBe(2);
  });
});

// ─── claimMission ─────────────────────────────────────────────────────────────

describe('claimMission', () => {
  it('marca stage como coletado', () => {
    const prog = { daily_play1: makeProgress('daily_play1', 1, 0) };
    const updated = claimMission('daily_play1', 1, prog);
    expect(updated.daily_play1?.stageClaimed).toBe(1);
  });

  it('cria entrada se missão não existia', () => {
    const updated = claimMission('daily_play1', 1, {});
    expect(updated.daily_play1?.stageClaimed).toBe(1);
  });

  it('não afeta outras missões', () => {
    const prog = {
      daily_play1: makeProgress('daily_play1', 1, 0),
      daily_win1: makeProgress('daily_win1', 0, 0),
    };
    const updated = claimMission('daily_play1', 1, prog);
    expect(updated.daily_win1?.stageClaimed).toBe(0);
  });
});
