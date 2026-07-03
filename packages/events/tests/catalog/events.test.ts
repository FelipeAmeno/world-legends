import { describe, expect, it } from 'vitest';
import { isWindowActive, isWindowUpcoming, isWindowExpired, resolveEventStatus, windowDurationMs } from '../../src/catalog/types';
import { createEventCard, isEventCardTradeable } from '../../src/catalog/event-card';
import { createWeekendBoost, createDoubleDrop, applyBoostMultiplier, MAX_BOOST_WINDOW_MS } from '../../src/boost/weekend-boost';
import { createCommunityGoal, contributeToGoal, goalCompletionPercent } from '../../src/community/community-goal';
import { createLegendRescue, canCraftDuringRescue, LEGEND_RESCUE_MIN_COST } from '../../src/legend-rescue/legend-rescue';
import { createSeasonEvent, advanceMission, completedMissions } from '../../src/schedule/season-event';
import { calculateCommunityRewards, calculateSeasonRewards, getActiveBoosts, aggregateBoostMultiplier } from '../../src/rewards/event-rewards';

// ─── Fixtures de janela ───────────────────────────────────────────────────────

const HOUR = 60 * 60 * 1000;
const DAY  = 24 * HOUR;

function activeWindow() {
  const now = new Date();
  return { startsAt: new Date(now.getTime() - HOUR), endsAt: new Date(now.getTime() + HOUR) };
}
function futureWindow() {
  const now = new Date();
  return { startsAt: new Date(now.getTime() + HOUR), endsAt: new Date(now.getTime() + 2 * HOUR) };
}
function expiredWindow() {
  const now = new Date();
  return { startsAt: new Date(now.getTime() - 2 * HOUR), endsAt: new Date(now.getTime() - HOUR) };
}
function weekendWindow() {
  const now = new Date();
  return { startsAt: new Date(now.getTime() - HOUR), endsAt: new Date(now.getTime() + 47 * HOUR) };
}

// ─── EventWindow helpers ──────────────────────────────────────────────────────

describe('EventWindow — helpers de tempo', () => {
  it('isWindowActive: retorna true para janela ativa', () => {
    expect(isWindowActive(activeWindow(), new Date())).toBe(true);
  });

  it('isWindowActive: retorna false para janela futura', () => {
    expect(isWindowActive(futureWindow(), new Date())).toBe(false);
  });

  it('isWindowExpired: retorna true para janela passada', () => {
    expect(isWindowExpired(expiredWindow(), new Date())).toBe(true);
  });

  it('isWindowUpcoming: retorna true para janela futura', () => {
    expect(isWindowUpcoming(futureWindow(), new Date())).toBe(true);
  });

  it('resolveEventStatus: active → "active"', () => {
    expect(resolveEventStatus(activeWindow(), new Date())).toBe('active');
  });

  it('resolveEventStatus: cancelled prevalece sobre ativo', () => {
    expect(resolveEventStatus(activeWindow(), new Date(), true)).toBe('cancelled');
  });

  it('windowDurationMs calcula duração corretamente', () => {
    const w = { startsAt: new Date(0), endsAt: new Date(HOUR) };
    expect(windowDurationMs(w)).toBe(HOUR);
  });
});

// ─── EventCard ────────────────────────────────────────────────────────────────

describe('createEventCard (doc 10 §10/§23)', () => {
  it('cria EventCard válida durante janela ativa', () => {
    const r = createEventCard({ id: 'ev-1', name: 'Copa 70', description: 'd', window: activeWindow(), featuredCardId: 'pele-70', featuredRarity: 'legendary' });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.kind).toBe('event_card');
      expect(r.value.status).toBe('active');
      expect(r.value.featuredCardId).toBe('pele-70');
    }
  });

  it('rejeita janela inválida (end <= start)', () => {
    const now = new Date();
    const r = createEventCard({ id: 'ev-1', name: 'X', description: 'd', window: { startsAt: now, endsAt: new Date(now.getTime() - 1) }, featuredCardId: 'c1', featuredRarity: 'elite' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe('InvalidWindow');
  });

  it('rejeita occasionalBonus > 10', () => {
    const r = createEventCard({ id: 'ev-1', name: 'X', description: 'd', window: activeWindow(), featuredCardId: 'c1', featuredRarity: 'elite', occasionalBonus: 15 });
    expect(r.ok).toBe(false);
  });

  it('occasionalBonus null por padrão', () => {
    const r = createEventCard({ id: 'ev-1', name: 'X', description: 'd', window: activeWindow(), featuredCardId: 'c1', featuredRarity: 'rare' });
    if (r.ok) expect(r.value.occasionalBonus).toBeNull();
  });

  it('não-tradeable durante janela ativa (doc 10 §10/§21)', () => {
    const r = createEventCard({ id: 'ev-1', name: 'X', description: 'd', window: activeWindow(), featuredCardId: 'c1', featuredRarity: 'legendary', tradeableAfterEvent: true });
    if (r.ok) expect(isEventCardTradeable(r.value, new Date())).toBe(false);
  });

  it('tradeable após janela encerrada', () => {
    const r = createEventCard({ id: 'ev-1', name: 'X', description: 'd', window: expiredWindow(), featuredCardId: 'c1', featuredRarity: 'legendary', tradeableAfterEvent: true });
    if (r.ok) expect(isEventCardTradeable(r.value, new Date())).toBe(true);
  });

  it('resultado imutável', () => {
    const r = createEventCard({ id: 'ev-1', name: 'X', description: 'd', window: activeWindow(), featuredCardId: 'c1', featuredRarity: 'common' });
    if (r.ok) expect(Object.isFrozen(r.value)).toBe(true);
  });
});

// ─── WeekendBoost ─────────────────────────────────────────────────────────────

describe('createWeekendBoost (doc 10 §23)', () => {
  it('cria WeekendBoost válido', () => {
    const r = createWeekendBoost({ id: 'wb-1', name: 'Fim de Semana +50% frags', description: 'd', window: weekendWindow(), multiplier: 1.5, target: 'fragments' });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.kind).toBe('weekend_boost');
      expect(r.value.multiplier).toBe(1.5);
      expect(r.value.target).toBe('fragments');
    }
  });

  it('rejeita janela > 72h (doc 10 §23: "janelas curtas")', () => {
    const now = new Date();
    const r = createWeekendBoost({ id: 'wb-1', name: 'X', description: 'd', window: { startsAt: now, endsAt: new Date(now.getTime() + 73 * HOUR) }, multiplier: 2.0, target: 'fragments' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe('InvalidWindow');
  });

  it('rejeita multiplier < 1.0', () => {
    const r = createWeekendBoost({ id: 'wb-1', name: 'X', description: 'd', window: weekendWindow(), multiplier: 0.9, target: 'credits' });
    expect(r.ok).toBe(false);
  });

  it('MAX_BOOST_WINDOW_MS = 72 horas', () => {
    expect(MAX_BOOST_WINDOW_MS).toBe(72 * 60 * 60 * 1000);
  });
});

// ─── DoubleDrop ───────────────────────────────────────────────────────────────

describe('createDoubleDrop (doc 10 §23)', () => {
  it('cria DoubleDrop com multiplier 2.0 por padrão', () => {
    const r = createDoubleDrop({ id: 'dd-1', name: 'Drop Dobrado Elite', description: 'd', window: weekendWindow(), doubledRarity: 'elite' });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.kind).toBe('double_drop');
      expect(r.value.dropMultiplier).toBe(2.0);
      expect(r.value.doubledRarity).toBe('elite');
    }
  });

  it('rejeita janela > 72h', () => {
    const now = new Date();
    const r = createDoubleDrop({ id: 'dd-1', name: 'X', description: 'd', window: { startsAt: now, endsAt: new Date(now.getTime() + 100 * HOUR) }, doubledRarity: 'legendary' });
    expect(r.ok).toBe(false);
  });

  it('applyBoostMultiplier aplica o dobro durante a janela', () => {
    const dd = createDoubleDrop({ id: 'dd-1', name: 'X', description: 'd', window: activeWindow(), doubledRarity: 'rare' });
    if (dd.ok) {
      const result = applyBoostMultiplier(100, dd.value, new Date());
      expect(result).toBe(200);
    }
  });

  it('applyBoostMultiplier retorna base quando não ativo', () => {
    const dd = createDoubleDrop({ id: 'dd-1', name: 'X', description: 'd', window: expiredWindow(), doubledRarity: 'rare' });
    if (dd.ok) {
      expect(applyBoostMultiplier(100, dd.value, new Date())).toBe(100);
    }
  });
});

// ─── CommunityGoal ────────────────────────────────────────────────────────────

describe('createCommunityGoal (doc 10 §23)', () => {
  it('cria meta comunitária com progresso zerado', () => {
    const r = createCommunityGoal({ id: 'cg-1', name: 'Abrir 10k packs', description: 'd', window: activeWindow(), contributionKind: 'packs_opened', targetContribution: 10_000, rewards: [{ kind: 'fragments', amount: 500 }] });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.currentContribution).toBe(0);
      expect(r.value.reachedAt).toBeNull();
    }
  });

  it('contributeToGoal avança o progresso', () => {
    const goal = createCommunityGoal({ id: 'cg-1', name: 'X', description: 'd', window: activeWindow(), contributionKind: 'packs_opened', targetContribution: 100, rewards: [] });
    if (!goal.ok) throw new Error();
    const r = contributeToGoal(goal.value, 30);
    if (r.ok) expect(r.value.currentContribution).toBe(30);
  });

  it('meta atingida preenche reachedAt exatamente uma vez', () => {
    const goal = createCommunityGoal({ id: 'cg-1', name: 'X', description: 'd', window: activeWindow(), contributionKind: 'packs_opened', targetContribution: 100, rewards: [] });
    if (!goal.ok) throw new Error();
    const r = contributeToGoal(goal.value, 100);
    if (r.ok) {
      expect(r.value.reachedAt).not.toBeNull();
      // Segunda contribuição: idempotente
      const r2 = contributeToGoal(r.value, 50, new Date());
      if (r2.ok) expect(r2.value.reachedAt?.getTime()).toBe(r.value.reachedAt?.getTime());
    }
  });

  it('rejeita contribuição fora da janela', () => {
    const goal = createCommunityGoal({ id: 'cg-1', name: 'X', description: 'd', window: expiredWindow(), contributionKind: 'matches_played', targetContribution: 50, rewards: [] });
    if (!goal.ok) throw new Error();
    const r = contributeToGoal(goal.value, 10);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe('EventNotActive');
  });

  it('rejeita delta <= 0', () => {
    const goal = createCommunityGoal({ id: 'cg-1', name: 'X', description: 'd', window: activeWindow(), contributionKind: 'wins_scored', targetContribution: 50, rewards: [] });
    if (!goal.ok) throw new Error();
    expect(contributeToGoal(goal.value, 0).ok).toBe(false);
    expect(contributeToGoal(goal.value, -5).ok).toBe(false);
  });

  it('goalCompletionPercent: 0% no início, 50% na metade, 100% ao atingir', () => {
    const goal = createCommunityGoal({ id: 'cg-1', name: 'X', description: 'd', window: activeWindow(), contributionKind: 'packs_opened', targetContribution: 100, rewards: [] });
    if (!goal.ok) throw new Error();
    expect(goalCompletionPercent(goal.value)).toBe(0);
    const half = contributeToGoal(goal.value, 50);
    if (half.ok) expect(goalCompletionPercent(half.value)).toBe(0.5);
    const full = contributeToGoal(goal.value, 100);
    if (full.ok) expect(goalCompletionPercent(full.value)).toBe(1);
  });

  it('calculateCommunityRewards: vazio antes da meta, recompensas após', () => {
    const goal = createCommunityGoal({ id: 'cg-1', name: 'X', description: 'd', window: activeWindow(), contributionKind: 'packs_opened', targetContribution: 10, rewards: [{ kind: 'fragments', amount: 200 }] });
    if (!goal.ok) throw new Error();
    expect(calculateCommunityRewards(goal.value).length).toBe(0);
    const done = contributeToGoal(goal.value, 10);
    if (done.ok) expect(calculateCommunityRewards(done.value).length).toBe(1);
  });
});

// ─── LegendRescue ─────────────────────────────────────────────────────────────

describe('createLegendRescue (doc 10 §23)', () => {
  it('cria LegendRescue válido', () => {
    const r = createLegendRescue({ id: 'lr-1', name: 'Resgate WCH Zico', description: 'd', window: activeWindow(), targetCardId: 'wch-zico-82', targetRarity: 'world_cup_hero', targetEdition: 'event', craftCostFragments: 3_000 });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.kind).toBe('legend_rescue');
      expect(r.value.craftCostFragments).toBe(3_000);
      expect(r.value.perAccountLimit).toBe(1);
    }
  });

  it('TC-HOF-03: rejeita edição goat', () => {
    const r = createLegendRescue({ id: 'lr-1', name: 'X', description: 'd', window: activeWindow(), targetCardId: 'goat-pele', targetRarity: 'ultra', targetEdition: 'goat' as never, craftCostFragments: 3_000 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe('GoatNotRescuable');
  });

  it(`rejeita craftCostFragments < ${LEGEND_RESCUE_MIN_COST}`, () => {
    const r = createLegendRescue({ id: 'lr-1', name: 'X', description: 'd', window: activeWindow(), targetCardId: 'c1', targetRarity: 'legendary', targetEdition: 'base', craftCostFragments: 1_000 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe('InvalidWindow');
  });

  it('canCraftDuringRescue: permite craft dentro da janela', () => {
    const r = createLegendRescue({ id: 'lr-1', name: 'X', description: 'd', window: activeWindow(), targetCardId: 'c1', targetRarity: 'legendary', targetEdition: 'base', craftCostFragments: 2_000 });
    if (r.ok) expect(canCraftDuringRescue(r.value, 'c1', 0, new Date()).allowed).toBe(true);
  });

  it('canCraftDuringRescue: bloqueia fora da janela', () => {
    const r = createLegendRescue({ id: 'lr-1', name: 'X', description: 'd', window: expiredWindow(), targetCardId: 'c1', targetRarity: 'legendary', targetEdition: 'base', craftCostFragments: 2_000 });
    if (r.ok) expect(canCraftDuringRescue(r.value, 'c1', 0, new Date()).allowed).toBe(false);
  });

  it('canCraftDuringRescue: bloqueia carta diferente', () => {
    const r = createLegendRescue({ id: 'lr-1', name: 'X', description: 'd', window: activeWindow(), targetCardId: 'c1', targetRarity: 'legendary', targetEdition: 'base', craftCostFragments: 2_000 });
    if (r.ok) expect(canCraftDuringRescue(r.value, 'c-outro', 0, new Date()).allowed).toBe(false);
  });

  it('canCraftDuringRescue: bloqueia quando limite por conta atingido', () => {
    const r = createLegendRescue({ id: 'lr-1', name: 'X', description: 'd', window: activeWindow(), targetCardId: 'c1', targetRarity: 'legendary', targetEdition: 'base', craftCostFragments: 2_000, perAccountLimit: 1 });
    if (r.ok) expect(canCraftDuringRescue(r.value, 'c1', 1, new Date()).allowed).toBe(false);
  });
});

// ─── SeasonEvent ──────────────────────────────────────────────────────────────

describe('createSeasonEvent (doc 10 §23)', () => {
  it('cria SeasonEvent com missões', () => {
    const r = createSeasonEvent({
      id: 'se-1', name: 'Copa 70 — Brasil Pentacampeão', description: 'd',
      theme: 'Copa do Mundo 1970', window: activeWindow(),
      missions: [{ missionId: 'm1', name: 'Vencer 5 partidas', description: 'd', targetCount: 5, rewards: [{ kind: 'fragments', amount: 100 }] }],
      generalRewards: [{ kind: 'badge', itemId: 'badge-copa70' }],
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.kind).toBe('season_event');
      expect(r.value.missions.length).toBe(1);
      expect(r.value.missions[0]?.currentCount).toBe(0);
    }
  });

  it('advanceMission avança o progresso da missão', () => {
    const se = createSeasonEvent({ id: 'se-1', name: 'X', description: 'd', theme: 'T', window: activeWindow(), missions: [{ missionId: 'm1', name: 'Win 5', description: 'd', targetCount: 5, rewards: [] }] });
    if (!se.ok) throw new Error();
    const r = advanceMission(se.value, 'm1', 3);
    if (r.ok) expect(r.value.missions[0]?.currentCount).toBe(3);
  });

  it('advanceMission conclui missão ao atingir target', () => {
    const se = createSeasonEvent({ id: 'se-1', name: 'X', description: 'd', theme: 'T', window: activeWindow(), missions: [{ missionId: 'm1', name: 'Win 5', description: 'd', targetCount: 5, rewards: [] }] });
    if (!se.ok) throw new Error();
    const r = advanceMission(se.value, 'm1', 5);
    if (r.ok) {
      expect(r.value.missions[0]?.completedAt).not.toBeNull();
      expect(completedMissions(r.value).length).toBe(1);
    }
  });

  it('advanceMission é idempotente após conclusão', () => {
    const se = createSeasonEvent({ id: 'se-1', name: 'X', description: 'd', theme: 'T', window: activeWindow(), missions: [{ missionId: 'm1', name: 'Win 5', description: 'd', targetCount: 5, rewards: [] }] });
    if (!se.ok) throw new Error();
    const first = advanceMission(se.value, 'm1', 5);
    if (!first.ok) throw new Error();
    const ts1 = first.value.missions[0]?.completedAt?.getTime();
    const second = advanceMission(first.value, 'm1', 5);
    if (second.ok) expect(second.value.missions[0]?.completedAt?.getTime()).toBe(ts1);
  });

  it('rejeita delta <= 0 em advanceMission', () => {
    const se = createSeasonEvent({ id: 'se-1', name: 'X', description: 'd', theme: 'T', window: activeWindow(), missions: [{ missionId: 'm1', name: 'X', description: 'd', targetCount: 5, rewards: [] }] });
    if (!se.ok) throw new Error();
    expect(advanceMission(se.value, 'm1', 0).ok).toBe(false);
  });

  it('calculateSeasonRewards: recompensas de missões concluídas', () => {
    const se = createSeasonEvent({ id: 'se-1', name: 'X', description: 'd', theme: 'T', window: activeWindow(), missions: [{ missionId: 'm1', name: 'X', description: 'd', targetCount: 1, rewards: [{ kind: 'fragments', amount: 200 }] }], generalRewards: [{ kind: 'badge', itemId: 'b1' }] });
    if (!se.ok) throw new Error();
    const r = advanceMission(se.value, 'm1', 1);
    if (!r.ok) throw new Error();
    const rewards = calculateSeasonRewards(r.value);
    expect(rewards.length).toBe(2); // 1 missão + 1 geral
  });
});

// ─── aggregateBoostMultiplier ─────────────────────────────────────────────────

describe('aggregateBoostMultiplier — maior prevalece (anti-stacking)', () => {
  it('sem boost ativo: multiplier = 1.0', () => {
    const boosts = (() => {
      const r = createWeekendBoost({ id: 'wb', name: 'X', description: 'd', window: expiredWindow(), multiplier: 2.0, target: 'fragments' });
      return r.ok ? [r.value] : [];
    })();
    expect(aggregateBoostMultiplier(boosts, 'fragments', new Date())).toBe(1.0);
  });

  it('dois boosts ativos: prevalece o maior', () => {
    const wb1 = createWeekendBoost({ id: 'wb1', name: 'X', description: 'd', window: activeWindow(), multiplier: 1.5, target: 'fragments' });
    const wb2 = createWeekendBoost({ id: 'wb2', name: 'X', description: 'd', window: activeWindow(), multiplier: 2.0, target: 'fragments' });
    const boosts = [wb1, wb2].flatMap((r) => r.ok ? [r.value] : []);
    expect(aggregateBoostMultiplier(boosts, 'fragments', new Date())).toBe(2.0);
  });

  it('getActiveBoosts filtra apenas os boosts ativos', () => {
    const active  = createWeekendBoost({ id: 'wb1', name: 'X', description: 'd', window: activeWindow(),  multiplier: 1.5, target: 'credits' });
    const expired = createWeekendBoost({ id: 'wb2', name: 'Y', description: 'd', window: expiredWindow(), multiplier: 2.0, target: 'credits' });
    const boosts = [active, expired].flatMap((r) => r.ok ? [r.value] : []);
    expect(getActiveBoosts(boosts, new Date()).length).toBe(1);
  });
});
