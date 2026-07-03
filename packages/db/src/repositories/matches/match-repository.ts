/**
 * MatchRepository — Porta + Adapter Supabase.
 * Gravação e leitura de partidas — nunca escrita direta do client (doc 02 §8).
 */
import type { DbClient, TableRow } from '../../adapters/supabase-client';
import type { Database } from '../../adapters/database.types';
import { Err, Ok, type Result } from '@world-legends/shared';
import type { DbError } from '../profiles/profile-repository';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type MatchRow = Readonly<{
  id:              string;
  leagueRoundId:   string | null;
  homeProfileId:   string | null;
  awayProfileId:   string | null;
  homeSquadId:     string;
  awaySquadId:     string;
  homeScore:       number | null;
  awayScore:       number | null;
  rngSeed:         number;
  engineVersion:   string;
  status:          'scheduled' | 'simulated' | 'disputed';
  simulatedAt:     Date | null;
  createdAt:       Date;
}>;

export type MatchEventRow = Readonly<{
  id:                    number;
  matchId:               string;
  minute:                number;
  eventType:             string;
  teamSide:              'home' | 'away' | 'neutral';
  primaryUserCardId:     string | null;
  secondaryUserCardId:   string | null;
  description:           string;
  meta:                  Record<string, unknown>;
}>;

export type CreateMatchInput = Readonly<{
  leagueRoundId?:  string;
  homeProfileId?:  string;
  awayProfileId?:  string;
  homeSquadId:     string;
  awaySquadId:     string;
  rngSeed:         number;
  engineVersion:   string;
}>;

export type SimulateMatchInput = Readonly<{
  homeScore:   number;
  awayScore:   number;
  events:      readonly Omit<MatchEventRow, 'id' | 'matchId'>[];
}>;

// ─── Porta ────────────────────────────────────────────────────────────────────

export interface IMatchRepository {
  findById(id: string): Promise<Result<MatchRow | null, DbError>>;
  findByLeagueRound(leagueRoundId: string): Promise<Result<readonly MatchRow[], DbError>>;
  create(input: CreateMatchInput): Promise<Result<MatchRow, DbError>>;
  recordSimulation(id: string, result: SimulateMatchInput): Promise<Result<MatchRow, DbError>>;
  getEvents(matchId: string): Promise<Result<readonly MatchEventRow[], DbError>>;
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

function toMatchRow(row: TableRow<'matches'>): MatchRow {
  return Object.freeze({
    id:            row.id,
    leagueRoundId: row.league_round_id,
    homeProfileId: row.home_profile_id,
    awayProfileId: row.away_profile_id,
    homeSquadId:   row.home_squad_id,
    awaySquadId:   row.away_squad_id,
    homeScore:     row.home_score,
    awayScore:     row.away_score,
    rngSeed:       row.rng_seed,
    engineVersion: row.engine_version,
    status:        row.status as MatchRow['status'],
    simulatedAt:   row.simulated_at ? new Date(row.simulated_at) : null,
    createdAt:     new Date(row.created_at),
  });
}

function dbErr(error: { code?: string; message?: string } | null): DbError {
  return Object.freeze({ code: error?.code ?? 'UNKNOWN', message: error?.message ?? 'Erro no banco' });
}

// ─── Adapter Supabase ─────────────────────────────────────────────────────────

export class SupabaseMatchRepository implements IMatchRepository {
  constructor(private readonly db: DbClient) {}

  async findById(id: string): Promise<Result<MatchRow | null, DbError>> {
    const { data, error } = await this.db
      .from('matches').select('*').eq('id', id).maybeSingle();
    if (error) return Err(dbErr(error));
    return Ok(data ? toMatchRow(data) : null);
  }

  async findByLeagueRound(leagueRoundId: string): Promise<Result<readonly MatchRow[], DbError>> {
    const { data, error } = await this.db
      .from('matches').select('*').eq('league_round_id', leagueRoundId);
    if (error) return Err(dbErr(error));
    return Ok(Object.freeze((data ?? []).map(toMatchRow)));
  }

  async create(input: CreateMatchInput): Promise<Result<MatchRow, DbError>> {
    const { data, error } = await this.db
      .from('matches')
      .insert({
        league_round_id: input.leagueRoundId ?? null,
        home_profile_id: input.homeProfileId ?? null,
        away_profile_id: input.awayProfileId ?? null,
        home_squad_id:   input.homeSquadId,
        away_squad_id:   input.awaySquadId,
        rng_seed:        input.rngSeed,
        engine_version:  input.engineVersion,
        status:          'scheduled',
      })
      .select('*').single();
    if (error || !data) return Err(dbErr(error));
    return Ok(toMatchRow(data));
  }

  /**
   * Grava resultado da simulação e os match_events atomicamente.
   * Deve ser chamado via service_role (doc 02 §8: "nunca escrita direta do client").
   */
  async recordSimulation(id: string, result: SimulateMatchInput): Promise<Result<MatchRow, DbError>> {
    // 1. Atualizar placar e status da partida
    const { data, error } = await this.db
      .from('matches')
      .update({
        home_score:   result.homeScore,
        away_score:   result.awayScore,
        status:       'simulated',
        simulated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*').single();
    if (error || !data) return Err(dbErr(error));

    // 2. Inserir match_events em batch
    if (result.events.length > 0) {
      type MatchEventInsert = Database['public']['Tables']['match_events']['Insert'];
      const events: MatchEventInsert[] = result.events.map((e) => ({
        match_id:                id,
        minute:                  e.minute,
        event_type:              e.eventType,
        team_side:               e.teamSide,
        primary_user_card_id:    e.primaryUserCardId    ?? null,
        secondary_user_card_id:  e.secondaryUserCardId  ?? null,
        description:             e.description,
        meta:                    e.meta as import('../../adapters/database.types').Json,
      }));
      const { error: evErr } = await (this.db.from('match_events' as unknown as 'matches').insert(events as unknown as Record<string, unknown>) as unknown as Promise<{ error: { code?: string; message?: string } | null }>);
      if (evErr) return Err(dbErr(evErr));
    }

    return Ok(toMatchRow(data));
  }

  async getEvents(matchId: string): Promise<Result<readonly MatchEventRow[], DbError>> {
    type MatchEventRow_DB = Database['public']['Tables']['match_events']['Row'];
    const resp = await this.db
      .from('match_events')
      .select('*')
      .eq('match_id', matchId)
      .order('minute', { ascending: true }) as unknown as Promise<{ data: MatchEventRow_DB[] | null; error: { code?: string; message?: string } | null }>;
    const { data, error } = await resp;
    if (error) return Err(dbErr(error));
    return Ok(Object.freeze((data ?? []).map((row) => Object.freeze({
      id:                  row.id,
      matchId:             row.match_id,
      minute:              row.minute,
      eventType:           row.event_type,
      teamSide:            row.team_side as 'home' | 'away' | 'neutral',
      primaryUserCardId:   row.primary_user_card_id,
      secondaryUserCardId: row.secondary_user_card_id,
      description:         row.description,
      meta:                row.meta as Record<string, unknown>,
    }))));
  }
}
