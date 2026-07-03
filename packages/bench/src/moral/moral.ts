/**
 * Cálculo de moral do time baseado no banco de reservas (T035).
 *
 * Fórmula:
 *   depthScore    = (availablePlayers / MAX_BENCH_SIZE) × 50    (0–50)
 *   qualityScore  = (avgOVR dos disponíveis / 99) × 50          (0–50)
 *   injuryPenalty = injuredCount × 5                            (−5 por lesão)
 *   moral         = clamp(depthScore + qualityScore − penalty, 0, 100)
 *
 * "Disponível" = não lesionado e não suspenso.
 *
 * Banco vazio                    →  moral = 0  ('poor')
 * 4 reservas a 80 OVR, s/ lesão →  moral ≈ 69 ('good')
 * 7 reservas a 99 OVR, s/ lesão →  moral = 100 ('excellent')
 *
 * Banco NÃO afeta química (regra fundamental do T035).
 * Química é calculada APENAS pelos titulares via packages/squad.
 */
import type { BenchMoral, BenchPlayer, MoralLevel } from '../types/types';
import { MAX_BENCH_SIZE } from '../types/types';

// ─── moralLevel ───────────────────────────────────────────────────────────────

export function moralLevel(score: number): MoralLevel {
  if (score >= 75) return 'excellent';
  if (score >= 50) return 'good';
  if (score >= 25) return 'fair';
  return 'poor';
}

// ─── calculateBenchMoral ──────────────────────────────────────────────────────

/**
 * Calcula a moral do time com base no banco de reservas.
 *
 * @param players  Jogadores reservas atuais (0–7).
 */
export function calculateBenchMoral(players: readonly BenchPlayer[]): BenchMoral {
  if (players.length === 0) {
    return Object.freeze({
      score: 0,
      level: 'poor',
      factors: Object.freeze({
        depthScore: 0,
        qualityScore: 0,
        injuryPenalty: 0,
        availableCount: 0,
      }),
    });
  }

  // Jogadores disponíveis (podem entrar em campo)
  const available = players.filter((p) => !p.isInjured && p.suspendedMatches === 0);
  const injured = players.filter((p) => p.isInjured || p.suspendedMatches > 0);
  const avgOvr =
    available.length > 0 ? available.reduce((s, p) => s + p.overall, 0) / available.length : 0;

  const depthScore = Math.round((available.length / MAX_BENCH_SIZE) * 50);
  const qualityScore = Math.round((avgOvr / 99) * 50);
  const penalty = injured.length * 5;

  const raw = depthScore + qualityScore - penalty;
  const score = Math.max(0, Math.min(100, raw));

  return Object.freeze({
    score,
    level: moralLevel(score),
    factors: Object.freeze({
      depthScore,
      qualityScore,
      injuryPenalty: penalty,
      availableCount: available.length,
    }),
  });
}
