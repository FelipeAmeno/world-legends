/**
 * Tipos do bounded context Seasons (T040).
 *
 * Temporada com 20 rodadas:
 *   - 8 times (1 usuário + 7 IA)
 *   - 4 partidas por rodada
 *   - Pontuação: vitória=3, empate=1, derrota=0
 *   - Classificação por: pontos → saldo de gols → gols marcados → nome
 *   - Campeão = time na 1ª posição após 20 rodadas
 *   - Recompensas por posição final
 */
import type { ValidationError } from '@world-legends/shared';

// ─── Configuração da temporada ────────────────────────────────────────────────

export const TOTAL_ROUNDS = 20;
export const TEAMS_PER_SEASON = 8;
export const MATCHES_PER_ROUND = 4; // TEAMS_PER_SEASON / 2
export const POINTS_WIN = 3;
export const POINTS_DRAW = 1;
export const POINTS_LOSS = 0;

// ─── Tipos de times ───────────────────────────────────────────────────────────

export type SeasonTeam = Readonly<{
  readonly teamId: string;
  readonly teamName: string;
  /** true = controlado pelo usuário. */
  readonly isUser: boolean;
  /** Força do time (60–99) para simulação de IA. */
  readonly strength: number;
}>;

// ─── Partida ──────────────────────────────────────────────────────────────────

export type MatchStatus = 'scheduled' | 'played';

export type SeasonMatch = Readonly<{
  readonly matchId: string;
  readonly homeTeamId: string;
  readonly awayTeamId: string;
  readonly homeScore: number | null;
  readonly awayScore: number | null;
  readonly status: MatchStatus;
}>;

// ─── Rodada ───────────────────────────────────────────────────────────────────

export type Round = Readonly<{
  readonly roundNumber: number;
  readonly matches: readonly SeasonMatch[];
  readonly completed: boolean;
}>;

// ─── Season — Aggregate Root ──────────────────────────────────────────────────

export type SeasonStatus = 'scheduled' | 'in_progress' | 'completed';

export type Season = Readonly<{
  readonly seasonId: string;
  readonly userId: string;
  readonly userTeamId: string;
  readonly teams: readonly SeasonTeam[];
  readonly rounds: readonly Round[];
  readonly status: SeasonStatus;
  readonly currentRound: number; // próxima rodada a jogar (1-20, 21=concluído)
}>;

// ─── Standings ────────────────────────────────────────────────────────────────

export type StandingsEntry = Readonly<{
  readonly position: number;
  readonly teamId: string;
  readonly teamName: string;
  readonly isUser: boolean;
  readonly played: number;
  readonly won: number;
  readonly drawn: number;
  readonly lost: number;
  readonly goalsFor: number;
  readonly goalsAgainst: number;
  readonly goalDiff: number;
  readonly points: number;
}>;

// ─── Recompensas ──────────────────────────────────────────────────────────────

export type SeasonReward = Readonly<{
  readonly position: number;
  readonly credits: number;
  readonly packs: readonly { packId: string; quantity: number }[];
  readonly cosmetics: readonly string[];
  readonly title: string;
}>;

// ─── Erros ────────────────────────────────────────────────────────────────────

export type SeasonError =
  | Readonly<{ kind: 'SeasonNotInProgress'; seasonId: string }>
  | Readonly<{ kind: 'RoundAlreadyCompleted'; roundNumber: number }>
  | Readonly<{ kind: 'RoundNotFound'; roundNumber: number }>
  | Readonly<{ kind: 'InvalidScore'; homeScore: number; awayScore: number }>
  | Readonly<{ kind: 'SeasonAlreadyComplete' }>
  | ValidationError;
