/**
 * Testes de packages/telemetry (doc 12).
 *
 * Cobertos:
 * - Envelope comum e factory functions (§2/§3)
 * - TelemetryBus: publish/subscribe, filtros, log append-only
 * - KPIs: goalsPerMatch, drawRate, walkoverRate (DD-01), seedTiebreakRate (DD-02)
 * - Alertas automáticos (§10): W.O., inflação, drop rates, winrate, combo, meta
 * - Regression Guards: todos os 7 cenários do §12
 */
import { describe, expect, it } from 'vitest';

// Bus
import { createTelemetryBus } from '../../src/bus/event-bus';

// Factory
import {
  cardEvents,
  economyEvents,
  engineEvents,
  marketEvents,
  matchEvents,
  packEvents,
  sessionEvents,
} from '../../src/events/factory';

// KPIs
import {
  KPI_DRAW_RATE_TARGET,
  KPI_GOALS_PER_MATCH_TARGET,
  KPI_WALKOVER_RATE_ALERT,
  RETENTION_TARGETS,
  drawRate,
  economySourcingFromLog,
  goalsPerMatch,
  inflationIndex,
  isInTarget,
  seedTiebreakRate,
  walkoverRate,
} from '../../src/kpi/metrics';

// Alerts
import {
  alertDominantCombo,
  alertDropRateDeviation,
  alertHighWinRate,
  alertInflation,
  alertMetaHealth,
  alertSeedTiebreakRate,
  alertWalkoverRate,
} from '../../src/alerts/alert-rules';

// Guards
import {
  guardElevenUltras,
  guardElevenWCH,
  guardEventIsolation,
  guardMaxChemistry,
  guardMaxCombo,
  guardPrimeCardBonus,
  guardTraitStack,
  runAllGuards,
} from '../../src/guards/regression-guards';

// ─── Envelope e Factory ───────────────────────────────────────────────────────

describe('Envelope — estrutura comum (doc 12 §3)', () => {
  it('session_login tem todos os campos do envelope', () => {
    const e = sessionEvents.login(
      { device: 'ios', build: '1.0.0', region: 'BR' },
      { userId: 'u1', seasonId: 'szn1', build: '1.0.0' },
    );
    expect(e.eventType).toBe('session_login');
    expect(e.userId).toBe('u1');
    expect(e.seasonId).toBe('szn1');
    expect(e.timestamp).not.toBeNull();
    expect(Object.isFrozen(e)).toBe(true);
    expect(Object.isFrozen(e.payload)).toBe(true);
  });

  it('matchId null por padrão para eventos não-match', () => {
    const e = sessionEvents.logout({ durationMs: 60_000 });
    expect(e.matchId).toBeNull();
  });

  it('match_started inclui seed e engineVersion no payload', () => {
    const e = matchEvents.started(
      {
        seed: 'abc123',
        engineVersion: '1.0.0-t010',
        mode: 'ranked',
        homeSquadId: 'h',
        awaySquadId: 'a',
      },
      { matchId: 'm1', gameMode: 'ranked' },
    );
    expect(e.eventType).toBe('match_started');
    const p = e.payload as { seed: string; engineVersion: string };
    expect(p.seed).toBe('abc123');
    expect(p.engineVersion).toBe('1.0.0-t010');
  });

  it('match_walkover inclui payload DD-01', () => {
    const e = matchEvents.walkover({
      affectedSide: 'away',
      minuteOfInterruption: 65,
      remainingPlayers: 6,
      reason: 'insuficiência de elenco',
    });
    expect(e.eventType).toBe('match_walkover');
  });

  it('match_penalty_shootout inclui resolvedBySeed (DD-02)', () => {
    const e = matchEvents.penaltyShootout({
      totalRounds: 7,
      resolvedBySeed: false,
      homeScore: 4,
      awayScore: 3,
    });
    const p = e.payload as { resolvedBySeed: boolean };
    expect(p.resolvedBySeed).toBe(false);
  });

  it('todas as 6 categorias de factory produzem envelopes', () => {
    const evts = [
      sessionEvents.dailyStreak(5),
      matchEvents.card({
        side: 'home',
        minute: 45,
        cardType: 'yellow',
        reason: 'direct',
        playerUserCardId: 'p1',
      }),
      packEvents.opened({ packId: 'classic', seed: 's1', raritiesDrawn: ['common', 'rare'] }),
      economyEvents.creditsEarned({ amount: 150, reason: 'match_reward' }),
      cardEvents.obtained({ cardId: 'c1', source: 'pack' }),
      marketEvents.listingCreated({ cardId: 'c1', rarityCode: 'rare', price: 500 }),
    ];
    evts.forEach((e) => {
      expect(e.timestamp).not.toBeNull();
      expect(typeof e.eventType).toBe('string');
    });
  });
});

// ─── TelemetryBus ─────────────────────────────────────────────────────────────

describe('TelemetryBus — publish/subscribe (doc 12 §1)', () => {
  it('publish adiciona ao log (append-only)', () => {
    const bus = createTelemetryBus();
    bus.publish(
      sessionEvents.login({ device: 'ios', build: '1.0', region: 'BR' }, { userId: 'u1' }),
    );
    bus.publish(sessionEvents.logout({ durationMs: 10_000 }, { userId: 'u1' }));
    expect(bus.getLog().length).toBe(2);
  });

  it('eventos no log são imutáveis', () => {
    const bus = createTelemetryBus();
    bus.publish(sessionEvents.dailyStreak(3, { userId: 'u1' }));
    const log = bus.getLog();
    expect(Object.isFrozen(log)).toBe(true);
    expect(Object.isFrozen(log[0])).toBe(true);
  });

  it('subscribe recebe todos os eventos sem filtro', () => {
    const bus = createTelemetryBus();
    const received: string[] = [];
    bus.subscribe((e) => received.push(e.eventType));
    bus.publish(sessionEvents.login({ device: 'android', build: '1.0', region: 'BR' }));
    bus.publish(
      matchEvents.ended({ homeScore: 2, awayScore: 1, durationMs: 5000, status: 'normal' }),
    );
    expect(received.length).toBe(2);
  });

  it('filtro por eventType entrega apenas eventos do tipo solicitado', () => {
    const bus = createTelemetryBus();
    const matchEndedEvents: string[] = [];
    bus.subscribe((e) => matchEndedEvents.push(e.eventType), { eventType: 'match_ended' });
    bus.publish(sessionEvents.login({ device: 'ios', build: '1.0', region: 'BR' }));
    bus.publish(
      matchEvents.ended({ homeScore: 1, awayScore: 0, durationMs: 4000, status: 'normal' }),
    );
    bus.publish(
      matchEvents.ended({ homeScore: 2, awayScore: 2, durationMs: 4500, status: 'normal' }),
    );
    expect(matchEndedEvents.length).toBe(2);
  });

  it('filtro por userId entrega apenas eventos daquele usuário', () => {
    const bus = createTelemetryBus();
    const u2Events: string[] = [];
    bus.subscribe((e) => u2Events.push(e.eventType), { userId: 'u2' });
    bus.publish(
      sessionEvents.login({ device: 'ios', build: '1.0', region: 'BR' }, { userId: 'u1' }),
    );
    bus.publish(
      sessionEvents.login({ device: 'android', build: '1.0', region: 'BR' }, { userId: 'u2' }),
    );
    expect(u2Events.length).toBe(1);
  });

  it('unsubscribe cancela a entrega', () => {
    const bus = createTelemetryBus();
    const received: string[] = [];
    const subId = bus.subscribe((e) => received.push(e.eventType));
    bus.publish(sessionEvents.dailyStreak(1));
    bus.unsubscribe(subId);
    bus.publish(sessionEvents.dailyStreak(2));
    expect(received.length).toBe(1);
  });

  it('getByType filtra o log por tipo', () => {
    const bus = createTelemetryBus();
    bus.publish(sessionEvents.login({ device: 'ios', build: '1.0', region: 'BR' }));
    bus.publish(
      matchEvents.ended({ homeScore: 1, awayScore: 0, durationMs: 4000, status: 'normal' }),
    );
    expect(bus.getByType('match_ended').length).toBe(1);
    expect(bus.getByType('session_login').length).toBe(1);
  });

  it('countByType conta eventos do log', () => {
    const bus = createTelemetryBus();
    for (let i = 0; i < 5; i++) {
      bus.publish(
        matchEvents.ended({ homeScore: i, awayScore: 0, durationMs: 4000, status: 'normal' }),
      );
    }
    expect(bus.countByType('match_ended')).toBe(5);
  });
});

// ─── KPIs (doc 12 §4/§7) ─────────────────────────────────────────────────────

describe('goalsPerMatch — meta 2,6–2,8 (doc 12 §4)', () => {
  it('0 para log vazio', () => {
    expect(goalsPerMatch([])).toBe(0);
  });

  it('calcula média correta', () => {
    const bus = createTelemetryBus();
    bus.publish(
      matchEvents.ended({ homeScore: 2, awayScore: 1, durationMs: 4000, status: 'normal' }),
    );
    bus.publish(
      matchEvents.ended({ homeScore: 1, awayScore: 1, durationMs: 4000, status: 'normal' }),
    );
    // (3 + 2) / 2 = 2.5
    expect(goalsPerMatch(bus.getLog())).toBe(2.5);
  });

  it('KPI_GOALS_PER_MATCH_TARGET é min=2.6 max=2.8', () => {
    expect(KPI_GOALS_PER_MATCH_TARGET.min).toBe(2.6);
    expect(KPI_GOALS_PER_MATCH_TARGET.max).toBe(2.8);
  });

  it('2.7 gols por jogo está na meta', () => {
    expect(isInTarget(2.7, KPI_GOALS_PER_MATCH_TARGET)).toBe(true);
  });
});

describe('drawRate — meta 24%–26% (doc 12 §4)', () => {
  it('calcula taxa de empates', () => {
    const bus = createTelemetryBus();
    bus.publish(
      matchEvents.ended({ homeScore: 1, awayScore: 1, durationMs: 4000, status: 'normal' }),
    );
    bus.publish(
      matchEvents.ended({ homeScore: 2, awayScore: 0, durationMs: 4000, status: 'normal' }),
    );
    bus.publish(
      matchEvents.ended({ homeScore: 0, awayScore: 1, durationMs: 4000, status: 'normal' }),
    );
    bus.publish(
      matchEvents.ended({ homeScore: 0, awayScore: 0, durationMs: 4000, status: 'normal' }),
    );
    // 2 empates de 4 = 50%
    expect(drawRate(bus.getLog())).toBe(0.5);
  });

  it('0.25 está dentro da meta', () => {
    expect(isInTarget(0.25, KPI_DRAW_RATE_TARGET)).toBe(true);
  });
});

describe('walkoverRate — DD-01 (doc 12 §4)', () => {
  it('0% para log sem W.O.', () => {
    const bus = createTelemetryBus();
    bus.publish(
      matchEvents.ended({ homeScore: 1, awayScore: 0, durationMs: 4000, status: 'normal' }),
    );
    expect(walkoverRate(bus.getLog())).toBe(0);
  });

  it('KPI_WALKOVER_RATE_ALERT = 0,05%', () => {
    expect(KPI_WALKOVER_RATE_ALERT).toBe(0.0005);
  });

  it('calcula taxa de W.O.', () => {
    const bus = createTelemetryBus();
    for (let i = 0; i < 999; i++) {
      bus.publish(
        matchEvents.ended({ homeScore: 1, awayScore: 0, durationMs: 4000, status: 'normal' }),
      );
    }
    bus.publish(
      matchEvents.walkover({
        affectedSide: 'away',
        minuteOfInterruption: 70,
        remainingPlayers: 6,
        reason: 'insuficiência de elenco',
      }),
    );
    // 1 WO / 999 ended = ~0.1%
    expect(walkoverRate(bus.getLog())).toBeGreaterThan(0);
  });
});

describe('seedTiebreakRate — DD-02 (doc 12 §4)', () => {
  it('0% sem disputas de pênaltis', () => {
    expect(seedTiebreakRate([])).toBe(0);
  });

  it('calcula taxa de resolução por seed', () => {
    const bus = createTelemetryBus();
    bus.publish(
      matchEvents.penaltyShootout({
        totalRounds: 5,
        resolvedBySeed: false,
        homeScore: 4,
        awayScore: 3,
      }),
    );
    bus.publish(
      matchEvents.penaltyShootout({
        totalRounds: 25,
        resolvedBySeed: true,
        homeScore: 5,
        awayScore: 4,
      }),
    );
    expect(seedTiebreakRate(bus.getLog())).toBe(0.5);
  });
});

describe('inflationIndex — doc 12 §7', () => {
  it('0 quando sources = sinks', () => {
    expect(inflationIndex(1000, 1000, 10000)).toBe(0);
  });

  it('positivo quando sources > sinks (inflação)', () => {
    expect(inflationIndex(1500, 1000, 10000)).toBeGreaterThan(0);
  });

  it('negativo quando sinks > sources (deflação saudável)', () => {
    expect(inflationIndex(1000, 1100, 10000)).toBeLessThan(0);
  });

  it('economySourcingFromLog agrega do log', () => {
    const bus = createTelemetryBus();
    bus.publish(
      economyEvents.sourceApplied({ amount: 300, currency: 'credits', sourceType: 'match_reward' }),
    );
    bus.publish(
      economyEvents.sinkApplied({ amount: 200, currency: 'credits', sinkType: 'pack_purchase' }),
    );
    const { sources, sinks } = economySourcingFromLog(bus.getLog());
    expect(sources).toBe(300);
    expect(sinks).toBe(200);
  });

  it('RETENTION_TARGETS cobre D1 a D365', () => {
    expect(RETENTION_TARGETS.d1).toBe(0.4);
    expect(RETENTION_TARGETS.d365).toBe(0.03);
  });
});

// ─── Alertas (doc 12 §10) ────────────────────────────────────────────────────

describe('alertWalkoverRate — DD-01 (doc 12 §10)', () => {
  it('não dispara com taxa 0%', () => {
    expect(alertWalkoverRate(0).triggered).toBe(false);
  });

  it('não dispara com 0.0004 (< 0.05%)', () => {
    expect(alertWalkoverRate(0.0004).triggered).toBe(false);
  });

  it('dispara com 0.001 (> 0.05%)', () => {
    const r = alertWalkoverRate(0.001);
    expect(r.triggered).toBe(true);
    expect(r.severity).toBe('medium');
    expect(r.alertId).toBe('walkover-rate-dd01');
  });
});

describe('alertSeedTiebreakRate — DD-02 (doc 12 §10)', () => {
  it('não dispara com 0%', () => {
    expect(alertSeedTiebreakRate(0).triggered).toBe(false);
  });

  it('dispara com > 1%', () => {
    const r = alertSeedTiebreakRate(0.02);
    expect(r.triggered).toBe(true);
    expect(r.alertId).toBe('seed-tiebreak-rate-dd02');
  });
});

describe('alertInflation (doc 12 §10)', () => {
  it('não dispara com índice negativo (deflação saudável)', () => {
    expect(alertInflation(-0.01).triggered).toBe(false);
  });

  it('dispara com índice positivo', () => {
    const r = alertInflation(0.05);
    expect(r.triggered).toBe(true);
    expect(r.severity).toBe('high');
  });
});

describe('alertDropRateDeviation (doc 12 §10)', () => {
  it('não dispara com amostra insuficiente (< 1M)', () => {
    const r = alertDropRateDeviation(0.06, 0.05, 100_000); // desvio 0.01 mas amostra pequena
    expect(r.triggered).toBe(false);
  });

  it('dispara com desvio > 0,1pp em amostra 1M+', () => {
    const r = alertDropRateDeviation(0.062, 0.05, 2_000_000);
    expect(r.triggered).toBe(true);
    expect(r.severity).toBe('critical');
  });

  it('não dispara com desvio < 0,1pp em amostra 1M+', () => {
    const r = alertDropRateDeviation(0.0509, 0.05, 2_000_000); // 0.09pp
    expect(r.triggered).toBe(false);
  });
});

describe('alertHighWinRate (doc 12 §10)', () => {
  it('não dispara com winrate 55%', () => {
    expect(alertHighWinRate('carta-x', 0.55).triggered).toBe(false);
  });

  it('dispara com winrate > 60%', () => {
    const r = alertHighWinRate('carta-op', 0.65);
    expect(r.triggered).toBe(true);
    expect(r.severity).toBe('high');
  });
});

describe('alertDominantCombo (doc 12 §10)', () => {
  it('não dispara com inclusão 15% e winrateDelta 3pp', () => {
    expect(alertDominantCombo('c1', 0.15, 0.03).triggered).toBe(false);
  });

  it('dispara com inclusão > 20% e winrateDelta > 5pp', () => {
    const r = alertDominantCombo('combo-op', 0.25, 0.07);
    expect(r.triggered).toBe(true);
    expect(r.severity).toBe('high');
  });

  it('não dispara se apenas uma condição for verdadeira', () => {
    expect(alertDominantCombo('c1', 0.25, 0.03).triggered).toBe(false); // inclusão alta, delta baixo
    expect(alertDominantCombo('c1', 0.15, 0.07).triggered).toBe(false); // inclusão baixa, delta alto
  });
});

describe('alertMetaHealth (doc 12 §6/§10)', () => {
  it('não dispara com adoção 20% (banda 10%–30%)', () => {
    expect(alertMetaHealth('arch-1', 0.2).triggered).toBe(false);
  });

  it('dispara com adoção < 10%', () => {
    expect(alertMetaHealth('arch-1', 0.08).triggered).toBe(true);
  });

  it('dispara com adoção > 30%', () => {
    expect(alertMetaHealth('arch-1', 0.35).triggered).toBe(true);
  });
});

// ─── Regression Guards (doc 12 §12) ──────────────────────────────────────────

describe('Regression Guards — os 7 cenários obrigatórios (doc 12 §12)', () => {
  it('G1 — 11 Ultras: aprova com ≤ 6pp', () => {
    const r = guardElevenUltras(0.06);
    expect(r.passed).toBe(true);
    expect(r.guardId).toBe('G1-eleven-ultras');
  });

  it('G1 — 11 Ultras: reprova com > 6pp', () => {
    expect(guardElevenUltras(0.07).passed).toBe(false);
  });

  it('G2 — 11 WCH: aprova com ≤ 6pp', () => {
    expect(guardElevenWCH(0.05).passed).toBe(true);
  });

  it('G2 — 11 WCH: reprova com > 6pp', () => {
    expect(guardElevenWCH(0.061).passed).toBe(false);
  });

  it('G3 — Química máxima: aprova com bônus = 4', () => {
    expect(guardMaxChemistry(4).passed).toBe(true);
  });

  it('G3 — Química máxima: reprova com bônus = 5', () => {
    const r = guardMaxChemistry(5);
    expect(r.passed).toBe(false);
    expect(r.guardId).toBe('G3-max-chemistry');
  });

  it('G4 — Combo máximo: aprova com ≤ 10', () => {
    expect(guardMaxCombo(10).passed).toBe(true);
  });

  it('G4 — Combo máximo: reprova com > 10', () => {
    expect(guardMaxCombo(11).passed).toBe(false);
  });

  it('G5a — Leader stack: aprova com ≤ 2×', () => {
    expect(guardTraitStack(2, 1).g5a.passed).toBe(true);
  });

  it('G5a — Leader stack: reprova com > 2×', () => {
    expect(guardTraitStack(3, 1).g5a.passed).toBe(false);
  });

  it('G5b — Capitão único: aprova com 1 Capitão', () => {
    expect(guardTraitStack(1, 1).g5b.passed).toBe(true);
  });

  it('G5b — Capitão único: reprova com 2 Capitães', () => {
    expect(guardTraitStack(1, 2).g5b.passed).toBe(false);
  });

  it('G6 — Prime card: aprova com 60% de eficiência', () => {
    expect(guardPrimeCardBonus(0.6).passed).toBe(true);
  });

  it('G6 — Prime card: reprova com 100% (não descontado)', () => {
    expect(guardPrimeCardBonus(1.0).passed).toBe(false);
  });

  it('G7 — Isolamento de evento: aprova sem interação cruzada', () => {
    expect(guardEventIsolation(false).passed).toBe(true);
  });

  it('G7 — Isolamento de evento: reprova com interação cruzada', () => {
    expect(guardEventIsolation(true).passed).toBe(false);
  });
});

describe('runAllGuards — relatório completo (doc 12 §12)', () => {
  it('todos passam com valores dentro dos limiares', () => {
    const report = runAllGuards({
      g1_winrateDeltaUltras: 0.05,
      g2_winrateDeltaWCH: 0.04,
      g3_maxChemistryBonus: 4,
      g4_maxComboBonus: 9,
      g5_leaderBonusMultiple: 1.8,
      g5_captainCount: 1,
      g6_primeEfficiency: 0.6,
      g7_crossInteraction: false,
    });
    expect(report.allPassed).toBe(true);
    expect(report.failCount).toBe(0);
    expect(report.passCount).toBe(8); // 8 guards (G5 tem g5a e g5b)
  });

  it('allPassed = false quando qualquer guard falha', () => {
    const report = runAllGuards({
      g1_winrateDeltaUltras: 0.08, // falha
      g2_winrateDeltaWCH: 0.04,
      g3_maxChemistryBonus: 4,
      g4_maxComboBonus: 9,
      g5_leaderBonusMultiple: 1.8,
      g5_captainCount: 1,
      g6_primeEfficiency: 0.6,
      g7_crossInteraction: false,
    });
    expect(report.allPassed).toBe(false);
    expect(report.failCount).toBe(1);
    expect(report.summary).toContain('BLOQUEADO');
  });

  it('relatório tem 8 resultados (G5 conta como 2: g5a + g5b)', () => {
    const report = runAllGuards({
      g1_winrateDeltaUltras: 0.05,
      g2_winrateDeltaWCH: 0.04,
      g3_maxChemistryBonus: 4,
      g4_maxComboBonus: 9,
      g5_leaderBonusMultiple: 1.8,
      g5_captainCount: 1,
      g6_primeEfficiency: 0.6,
      g7_crossInteraction: false,
    });
    expect(report.results.length).toBe(8);
  });

  it('resultado é imutável', () => {
    const report = runAllGuards({
      g1_winrateDeltaUltras: 0.05,
      g2_winrateDeltaWCH: 0.04,
      g3_maxChemistryBonus: 4,
      g4_maxComboBonus: 9,
      g5_leaderBonusMultiple: 1.8,
      g5_captainCount: 1,
      g6_primeEfficiency: 0.6,
      g7_crossInteraction: false,
    });
    expect(Object.isFrozen(report)).toBe(true);
    expect(Object.isFrozen(report.results)).toBe(true);
  });
});
