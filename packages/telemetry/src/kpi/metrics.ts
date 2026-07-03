/**
 * Cálculo de KPIs e métricas de telemetria (doc 12 §4/§7/§14).
 *
 * Funções puras sobre arrays de `TelemetryEnvelope` — sem banco.
 * Cada função corresponde a uma métrica documentada no doc 12.
 *
 * NOTA: Em produção, essas funções seriam calculadas sobre consultas
 * a bancos de dados otimizados (BigQuery, ClickHouse). Em domínio puro
 * (T023), operam sobre o log em memória do `TelemetryBus`.
 */
import type { TelemetryEnvelope } from '../events/envelope';
import type {
  MatchEndedPayload,
  MatchPenaltyShootoutPayload,
  MatchWalkoverPayload,
} from '../events/envelope';

// ─── Match Engine KPIs (doc 12 §4) ───────────────────────────────────────────

/** Média de gols por jogo (meta: 2,6–2,8 per doc 12 §4). */
export function goalsPerMatch(log: readonly TelemetryEnvelope[]): number {
  const ended = log.filter((e) => e.eventType === 'match_ended');
  if (ended.length === 0) return 0;

  const totalGoals = ended.reduce((sum, e) => {
    const p = e.payload as MatchEndedPayload;
    return sum + (p.homeScore ?? 0) + (p.awayScore ?? 0);
  }, 0);

  return totalGoals / ended.length;
}

/** Taxa de empates (meta: 24%–26% per doc 12 §4). */
export function drawRate(log: readonly TelemetryEnvelope[]): number {
  const ended = log.filter((e) => e.eventType === 'match_ended');
  if (ended.length === 0) return 0;
  const draws = ended.filter((e) => {
    const p = e.payload as MatchEndedPayload;
    return p.homeScore === p.awayScore && p.status !== 'walkover';
  }).length;
  return draws / ended.length;
}

/**
 * Taxa de W.O. (DD-01 — doc 12 §4, meta: próxima de 0%).
 * Alerta se > 0,05% (doc 12 §10).
 */
export function walkoverRate(log: readonly TelemetryEnvelope[]): number {
  const ended = log.filter((e) => e.eventType === 'match_ended').length;
  const walkovers = log.filter((e) => e.eventType === 'match_walkover').length;
  if (ended === 0) return 0;
  return walkovers / ended;
}

/**
 * Distribuição de rodadas de pênaltis (DD-02 — doc 12 §4).
 * Deve ter frequência decrescente — maioria resolve em poucas rodadas.
 */
export function penaltyRoundsDistribution(log: readonly TelemetryEnvelope[]): Map<number, number> {
  const dist = new Map<number, number>();
  for (const e of log) {
    if (e.eventType !== 'match_penalty_shootout') continue;
    const p = e.payload as MatchPenaltyShootoutPayload;
    const rounds = p.totalRounds;
    dist.set(rounds, (dist.get(rounds) ?? 0) + 1);
  }
  return dist;
}

/** Taxa de resolução por seed em pênaltis — deve ser próxima de 0% (doc 12 §4, DD-02). */
export function seedTiebreakRate(log: readonly TelemetryEnvelope[]): number {
  const shootouts = log.filter((e) => e.eventType === 'match_penalty_shootout');
  if (shootouts.length === 0) return 0;
  const bySeeds = shootouts.filter((e) => {
    const p = e.payload as MatchPenaltyShootoutPayload;
    return p.resolvedBySeed;
  }).length;
  return bySeeds / shootouts.length;
}

// ─── Economia KPIs (doc 12 §7) ───────────────────────────────────────────────

/**
 * Índice de Inflação (doc 12 §7):
 * `(Sources - Sinks) / TotalDeMoedaEmCirculação`
 * Meta: ≈ 0 ou levemente negativo. Positivo sustentado → alerta.
 */
export function inflationIndex(
  totalSources: number,
  totalSinks: number,
  totalCurrencyInCirculation: number,
): number {
  if (totalCurrencyInCirculation === 0) return 0;
  return (totalSources - totalSinks) / totalCurrencyInCirculation;
}

/** Calcula sources e sinks a partir do log de telemetria. */
export function economySourcingFromLog(log: readonly TelemetryEnvelope[]): {
  sources: number;
  sinks: number;
} {
  let sources = 0;
  let sinks = 0;
  for (const e of log) {
    const p = e.payload as { amount?: number };
    const amount = p.amount ?? 0;
    if (e.eventType === 'economy_source_applied') sources += amount;
    if (e.eventType === 'economy_sink_applied') sinks += amount;
  }
  return { sources, sinks };
}

// ─── Retenção KPIs (doc 12 §8) ───────────────────────────────────────────────

export type RetentionBands = {
  d1: number;
  d7: number;
  d30: number;
  d90: number;
  d180: number;
  d365: number;
};

/** Bandas-alvo de retenção documentadas no doc 12 §8. */
export const RETENTION_TARGETS: RetentionBands = Object.freeze({
  d1: 0.4, // 35%–45%
  d7: 0.175, // 15%–20%
  d30: 0.1, // 8%–12%
  d90: 0.065, // 5%–8%
  d180: 0.04, // 3%–5%
  d365: 0.03, // 2%–4%
});

// ─── KPIs Oficiais (doc 12 §14) ──────────────────────────────────────────────

/** Meta de gols por jogo (doc 12 §14). */
export const KPI_GOALS_PER_MATCH_TARGET = Object.freeze({ min: 2.6, max: 2.8 });

/** Stickiness alvo DAU/MAU (doc 12 §14). */
export const KPI_STICKINESS_TARGET = Object.freeze({ min: 0.2, max: 0.3 });

/** Partidas por dia por usuário ativo (doc 12 §14). */
export const KPI_MATCHES_PER_DAU_TARGET = Object.freeze({ min: 2, max: 5 });

/** Tempo de sessão alvo (doc 12 §14). */
export const KPI_SESSION_DURATION_MS_TARGET = Object.freeze({
  min: 10 * 60 * 1000, // 10 min
  max: 20 * 60 * 1000, // 20 min
});

/** Taxa de draw alvo (doc 12 §4). */
export const KPI_DRAW_RATE_TARGET = Object.freeze({ min: 0.24, max: 0.26 });

/** Limiar de alerta de W.O. (doc 12 §4, DD-01). */
export const KPI_WALKOVER_RATE_ALERT = 0.0005; // 0,05%

/**
 * Verifica se um KPI está dentro da banda-alvo.
 * Útil nos Regression Guards.
 */
export function isInTarget(value: number, target: { min: number; max: number }): boolean {
  return value >= target.min && value <= target.max;
}
