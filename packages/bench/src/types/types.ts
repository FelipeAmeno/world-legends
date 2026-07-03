import type { ValidationError } from '@world-legends/shared';
/**
 * Tipos do bounded context Bench (T035).
 *
 * Regras fundamentais (doc T035):
 *   - Squad: exatamente 11 titulares + até 7 reservas.
 *   - Bench influencia MORAL do time (profundidade de elenco).
 *   - Bench NÃO influencia química — química é exclusiva dos titulares.
 *   - Substituição: jogador do banco entra, titular sai.
 *   - Limite de 3 substituições por partida (regra FIFA padrão).
 *
 * Separação de responsabilidades:
 *   @world-legends/squad    → titulares + química
 *   @world-legends/bench    → banco + moral + substituições
 *   @world-legends/rewards  → recompensas pós-partida
 */
import type { Position } from '@world-legends/types';

// ─── BenchPlayer ──────────────────────────────────────────────────────────────

export type BenchPlayer = Readonly<{
  readonly userCardId: string;
  readonly position: Position;
  readonly overall: number;
  readonly traits: readonly string[];
  readonly isInjured: boolean;
  readonly suspendedMatches: number;
}>;

// ─── Bench — Aggregate ────────────────────────────────────────────────────────

export const MAX_BENCH_SIZE = 7 as const;
export const MAX_SUBSTITUTIONS_MATCH = 3 as const;

export type Bench = Readonly<{
  /** ID do squad ao qual este banco pertence. */
  readonly squadId: string;
  /** Jogadores reservas (0–7). */
  readonly players: readonly BenchPlayer[];
  /** Histórico de substituições desta partida. */
  readonly substitutions: readonly Substitution[];
  /** Número de substituições restantes nesta partida. */
  readonly subsRemaining: number;
}>;

// ─── Substitution ─────────────────────────────────────────────────────────────

export type SubstitutionReason = 'tactical' | 'injury' | 'tired';

export type Substitution = Readonly<{
  readonly id: string;
  readonly minute: number;
  /** UserCardId do titular que sai. */
  readonly playerOutId: string;
  /** UserCardId do reserva que entra. */
  readonly playerInId: string;
  readonly reason: SubstitutionReason;
  /** Snapshots de OVR para auditoria. */
  readonly playerOutOvr: number;
  readonly playerInOvr: number;
}>;

// ─── BenchMoral — impacto do banco na moral do time ──────────────────────────

export type MoralLevel = 'poor' | 'fair' | 'good' | 'excellent';

export type BenchMoral = Readonly<{
  /** Score de moral (0–100). */
  readonly score: number;
  /** Nível qualitativo. */
  readonly level: MoralLevel;
  readonly factors: Readonly<{
    /** Pontuação de profundidade (0–50): proporção do banco preenchido. */
    readonly depthScore: number;
    /** Pontuação de qualidade (0–50): OVR médio dos disponíveis / 99. */
    readonly qualityScore: number;
    /** Penalidade por lesionados no banco (−5 por jogador). */
    readonly injuryPenalty: number;
    /** Jogadores disponíveis (não lesionados, não suspensos). */
    readonly availableCount: number;
  }>;
}>;

// ─── Erros ────────────────────────────────────────────────────────────────────

export type BenchError =
  | Readonly<{ kind: 'BenchFull'; currentSize: number }>
  | Readonly<{ kind: 'PlayerNotOnBench'; userCardId: string }>
  | Readonly<{ kind: 'PlayerAlreadyOnBench'; userCardId: string }>
  | Readonly<{ kind: 'PlayerInjured'; userCardId: string }>
  | Readonly<{ kind: 'PlayerSuspended'; userCardId: string; matches: number }>
  | Readonly<{ kind: 'NoSubsRemaining'; used: number; max: number }>
  | Readonly<{ kind: 'PlayerAlreadySubbedIn'; userCardId: string }>
  | ValidationError;
