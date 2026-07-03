/**
 * `LeagueSeason` — contexto de ciclo de tempo de uma liga privada.
 *
 * DISTINÇÃO IMPORTANTE (doc 18 §10):
 * `multiplayer` NÃO possui `Season` global. `Season` global vive em
 * `packages/ranking` e só afeta ligas `public_ranked`.
 *
 * `LeagueSeason` é um conceito de LIGA PRIVADA: um ciclo de tempo
 * em que os membros de uma liga privada competem. Por exemplo:
 * "Liga de Verão 2025" (4 semanas, todos contra todos).
 *
 * Funções puras — sem efeito colateral.
 */
import { Err, Ok, type Result, validationError } from '@world-legends/shared';
import type { League, LeagueId } from '../types/types';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type LeagueSeasonId = string & { readonly _brand: 'LeagueSeasonId' };
export type LeagueSeasonStatus = 'upcoming' | 'active' | 'closed';

export type LeagueSeason = Readonly<{
  readonly id: LeagueSeasonId;
  readonly leagueId: LeagueId;
  readonly name: string;
  readonly status: LeagueSeasonStatus;
  readonly startDate: Date;
  readonly endDate: Date;
  readonly createdAt: Date;
}>;

export type SeasonError =
  | ReturnType<typeof validationError>
  | Readonly<{ kind: 'SeasonNotActive' }>
  | Readonly<{ kind: 'SeasonAlreadyClosed' }>
  | Readonly<{ kind: 'InvalidDateRange'; startDate: Date; endDate: Date }>;

// ─── createLeagueSeason ───────────────────────────────────────────────────────

export function createLeagueSeason(input: {
  id: string;
  league: League;
  name: string;
  startDate: Date;
  endDate: Date;
}): Result<LeagueSeason, SeasonError> {
  if (!input.name.trim()) {
    return Err(validationError('name não pode ser vazio', 'name'));
  }
  if (input.endDate <= input.startDate) {
    return Err(
      Object.freeze({
        kind: 'InvalidDateRange' as const,
        startDate: input.startDate,
        endDate: input.endDate,
      }),
    );
  }

  const now = new Date();
  const status: LeagueSeasonStatus =
    now < input.startDate ? 'upcoming' : now <= input.endDate ? 'active' : 'closed';

  return Ok(
    Object.freeze({
      id: input.id as LeagueSeasonId,
      leagueId: input.league.id,
      name: input.name.trim(),
      status,
      startDate: input.startDate,
      endDate: input.endDate,
      createdAt: now,
    }),
  );
}

// ─── openSeason ──────────────────────────────────────────────────────────────

export function openSeason(season: LeagueSeason): Result<LeagueSeason, SeasonError> {
  if (season.status === 'closed') {
    return Err(Object.freeze({ kind: 'SeasonAlreadyClosed' as const }));
  }
  return Ok(Object.freeze({ ...season, status: 'active' as const }));
}

// ─── closeSeason ─────────────────────────────────────────────────────────────

/**
 * Fecha a temporada. Liga privada: sem promoção/rebaixamento global
 * (isso só ocorre em `packages/ranking` para `public_ranked`).
 * Aqui apenas marca o status e sinaliza que recompensas devem ser entregues.
 */
export function closeSeason(season: LeagueSeason): Result<LeagueSeason, SeasonError> {
  if (season.status === 'closed') {
    return Err(Object.freeze({ kind: 'SeasonAlreadyClosed' as const }));
  }
  return Ok(Object.freeze({ ...season, status: 'closed' as const }));
}

// ─── isSeasonActive ───────────────────────────────────────────────────────────

export function isSeasonActive(season: LeagueSeason): boolean {
  return season.status === 'active';
}

// ─── getSeasonDurationDays ────────────────────────────────────────────────────

export function getSeasonDurationDays(season: LeagueSeason): number {
  const ms = season.endDate.getTime() - season.startDate.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}
