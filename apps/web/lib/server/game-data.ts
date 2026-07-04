/**
 * lib/server/game-data.ts
 *
 * Funções de leitura server-side do banco Supabase.
 * Chamadas apenas de Server Components — nunca importadas em Client Components.
 *
 * Usa service_role para leitura direta (contorna RLS de forma controlada).
 */

import { type CollectionCard, enrichWithUserCards } from '@/lib/collection-data';
import { getServiceDb } from '@/lib/server/db';
import type { SBState } from '@/lib/squad-builder';
import type { FormationKey } from '@/lib/squad-data';
import { SupabaseProfileRepository, SupabaseRankingRepository, SupabaseSeasonRepository, SupabaseUserCardRepository } from '@world-legends/db';
import type { ProfileRow } from '@world-legends/db';

// ─── Tipos de match history ───────────────────────────────────────────────────

export type MatchRecord = {
  id:         string;
  opponent:   string;
  homeScore:  number;
  awayScore:  number;
  isHome:     boolean;
  outcome:    'win' | 'draw' | 'loss';
  credits:    number;
  xp:         number;
  date:       string;
};

export type UserMatchStats = {
  wins:          number;
  draws:         number;
  losses:        number;
  recentMatches: MatchRecord[];
  eloRating:     number;
};

// ─── Coleção do usuário ───────────────────────────────────────────────────────

/**
 * Retorna as cartas que o usuário possui, enriquecidas com dados do catálogo.
 * Retorna [] se usuário não tem cartas ou ocorre erro.
 */
export async function getUserCollection(userId: string): Promise<CollectionCard[]> {
  const db = getServiceDb();
  const repo = new SupabaseUserCardRepository(db);
  const result = await repo.findByProfile(userId);
  if (!result.ok) return [];
  return enrichWithUserCards(
    result.value.map((uc) => ({ cardId: uc.cardId, userCardId: uc.id, acquiredAt: uc.acquiredAt instanceof Date ? uc.acquiredAt.toISOString() : String(uc.acquiredAt) })),
  );
}

// ─── Perfil do usuário ────────────────────────────────────────────────────────

export async function getUserProfile(userId: string): Promise<ProfileRow | null> {
  const db = getServiceDb();
  const repo = new SupabaseProfileRepository(db);
  const result = await repo.findById(userId);
  return result.ok ? result.value : null;
}

// ─── Squad salvo ─────────────────────────────────────────────────────────────

export type SavedSquadSlot = {
  slotId: string;
  userCardId: string;
  isStarter: boolean;
  benchOrder: number | null;
};

export type SavedSquad = {
  id: string;
  formation: FormationKey;
  slots: SavedSquadSlot[];
};

/**
 * Carrega o squad ativo do usuário com seus slots.
 * Retorna null se o usuário não tem squad salvo.
 */
export async function getUserActiveSquad(userId: string): Promise<SavedSquad | null> {
  const db = getServiceDb();

  // Cast necessário — squads FK graph causa inferência 'never' no supabase-js 2.47
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: squad, error: squadErr } = (await (db
    .from('squads')
    .select('id, formation')
    .eq('profile_id', userId)
    .eq('is_active', true)
    .maybeSingle() as any)) as {
    data: { id: string; formation: string } | null;
    error: { message: string } | null;
  };

  if (squadErr || !squad) return null;

  // Cast needed — squad_slots FK graph causes 'never' inference with supabase-js 2.47
  type SlotRow = {
    id: string;
    slot_position: string;
    user_card_id: string;
    is_starter: boolean;
    bench_order: number | null;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: slots, error: slotsErr } = (await (db
    .from('squad_slots')
    .select('*')
    .eq('squad_id', squad.id) as any)) as {
    data: SlotRow[] | null;
    error: { message: string } | null;
  };

  if (slotsErr) return null;

  return {
    id: squad.id,
    formation: squad.formation as FormationKey,
    slots: (slots ?? []).map((s) => ({
      slotId: s.slot_position,
      userCardId: s.user_card_id,
      isStarter: s.is_starter,
      benchOrder: s.bench_order,
    })),
  };
}

// ─── Match stats do usuário ───────────────────────────────────────────────────

/**
 * Retorna wins/draws/losses (da temporada ativa ou soma total),
 * elo_rating do perfil, e as últimas 10 partidas.
 */
export async function getUserMatchStats(userId: string): Promise<UserMatchStats> {
  const db = getServiceDb();
  const empty: UserMatchStats = { wins: 0, draws: 0, losses: 0, recentMatches: [], eloRating: 1000 };

  // Perfil → elo_rating atual
  const profileRepo = new SupabaseProfileRepository(db);
  const profileResult = await profileRepo.findById(userId);
  const eloRating = profileResult.ok && profileResult.value ? profileResult.value.eloRating : 1000;

  // Temporada ativa → wins/draws/losses
  const seasonRepo  = new SupabaseSeasonRepository(db);
  const rankingRepo = new SupabaseRankingRepository(db);
  const seasonResult = await seasonRepo.findActive();
  let wins = 0, draws = 0, losses = 0;

  if (seasonResult.ok && seasonResult.value) {
    const rankResult = await rankingRepo.findBySeasonAndProfile(seasonResult.value.id, userId);
    if (rankResult.ok && rankResult.value) {
      wins   = rankResult.value.wins;
      draws  = rankResult.value.draws;
      losses = rankResult.value.losses;
    }
  } else {
    // Sem temporada ativa → contar das partidas diretamente
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type MatchRow = { id: string; home_profile_id: string | null; home_score: number | null; away_score: number | null };
    const { data } = (await (db as any)
      .from('matches')
      .select('id, home_profile_id, home_score, away_score')
      .or(`home_profile_id.eq.${userId},away_profile_id.eq.${userId}`)
      .eq('status', 'simulated')) as { data: MatchRow[] | null };

    for (const m of data ?? []) {
      const hs = m.home_score ?? 0;
      const as_ = m.away_score ?? 0;
      const isHome = m.home_profile_id === userId;
      const myScore    = isHome ? hs : as_;
      const theirScore = isHome ? as_ : hs;
      if (myScore > theirScore) wins++;
      else if (myScore === theirScore) draws++;
      else losses++;
    }
  }

  // Últimas 10 partidas com nome do adversário
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type FullMatchRow = {
    id: string;
    home_profile_id: string | null;
    away_profile_id: string | null;
    home_score: number | null;
    away_score: number | null;
    simulated_at: string | null;
    home_profile: { username: string } | null;
    away_profile: { username: string } | null;
  };
  const { data: matchRows } = (await (db as any)
    .from('matches')
    .select('id, home_profile_id, away_profile_id, home_score, away_score, simulated_at, home_profile:profiles!home_profile_id(username), away_profile:profiles!away_profile_id(username)')
    .or(`home_profile_id.eq.${userId},away_profile_id.eq.${userId}`)
    .eq('status', 'simulated')
    .order('simulated_at', { ascending: false })
    .limit(10)) as { data: FullMatchRow[] | null };

  const recentMatches: MatchRecord[] = (matchRows ?? []).map((m) => {
    const isHome     = m.home_profile_id === userId;
    const homeScore  = m.home_score  ?? 0;
    const awayScore  = m.away_score  ?? 0;
    const myScore    = isHome ? homeScore : awayScore;
    const theirScore = isHome ? awayScore : homeScore;
    const opponent   = isHome
      ? (m.away_profile?.username ?? 'Adversário')
      : (m.home_profile?.username ?? 'Adversário');

    let outcome: 'win' | 'draw' | 'loss' = 'draw';
    if (myScore > theirScore) outcome = 'win';
    else if (myScore < theirScore) outcome = 'loss';

    const when = m.simulated_at ? new Date(m.simulated_at) : null;
    const now  = new Date();
    let date = 'Recente';
    if (when) {
      const diffDays = Math.floor((now.getTime() - when.getTime()) / 86_400_000);
      if (diffDays === 0) date = 'Hoje';
      else if (diffDays === 1) date = 'Ontem';
      else if (diffDays < 7) date = `${diffDays} dias atrás`;
      else date = when.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }

    return {
      id: m.id,
      opponent,
      homeScore: isHome ? homeScore : awayScore,
      awayScore: isHome ? awayScore : homeScore,
      isHome,
      outcome,
      credits: 0,
      xp: 0,
      date,
    };
  });

  return { wins, draws, losses, recentMatches, eloRating };
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────

export type LeaderboardUserRow = {
  profileId:     string;
  username:      string;
  countryCode:   string;
  eloRating:     number;
  wins:          number;
  draws:         number;
  losses:        number;
  matchesPlayed: number;
};

/**
 * Retorna o leaderboard global (top 100 por elo_rating).
 * Usa rankings da temporada ativa; fallback para profiles se sem temporada.
 */
export async function getLeaderboardData(): Promise<LeaderboardUserRow[]> {
  const db = getServiceDb();
  const seasonRepo  = new SupabaseSeasonRepository(db);
  const rankingRepo = new SupabaseRankingRepository(db);

  const seasonResult = await seasonRepo.findActive();

  if (seasonResult.ok && seasonResult.value) {
    const result = await rankingRepo.findLeaderboard(seasonResult.value.id, 100);
    if (result.ok && result.value.length > 0) {
      // Join de profile usernames inline — service_role não exige RLS
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      type PRow = { id: string; username: string; country_code: string };
      const profileIds = result.value.map((r) => r.profileId);
      const { data: profiles } = (await (db as any)
        .from('profiles')
        .select('id, username, country_code')
        .in('id', profileIds)) as { data: PRow[] | null };

      const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

      return result.value.map((r) => {
        const p = profileMap.get(r.profileId);
        return {
          profileId:     r.profileId,
          username:      p?.username ?? 'Jogador',
          countryCode:   p?.country_code ?? 'BR',
          eloRating:     r.eloRating,
          wins:          r.wins,
          draws:         r.draws,
          losses:        r.losses,
          matchesPlayed: r.matchesPlayed,
        };
      });
    }
  }

  // Fallback: sem temporada → query direto na tabela profiles
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type ProfileFallback = { id: string; username: string; country_code: string; elo_rating: number };
  const { data: profileFallback } = (await (db as any)
    .from('profiles')
    .select('id, username, country_code, elo_rating')
    .order('elo_rating', { ascending: false })
    .limit(100)) as { data: ProfileFallback[] | null };

  return (profileFallback ?? []).map((p) => ({
    profileId:     p.id,
    username:      p.username,
    countryCode:   p.country_code,
    eloRating:     p.elo_rating,
    wins:          0,
    draws:         0,
    losses:        0,
    matchesPlayed: 0,
  }));
}

// ─── Squad salvo ─────────────────────────────────────────────────────────────

/**
 * Reconstrói o SBState a partir dos dados do banco.
 * Requer a coleção do usuário (com userCardId) para montar as cartas nos slots.
 */
export function buildSBStateFromSaved(
  saved: SavedSquad,
  userCards: CollectionCard[],
): Partial<SBState> {
  const cardByUserCardId = new Map(
    userCards.filter((c) => c.userCardId).map((c) => [c.userCardId!, c]),
  );

  const slots: Record<string, CollectionCard | null> = {};
  const bench: (CollectionCard | null)[] = Array(7).fill(null);

  for (const slot of saved.slots) {
    const card = cardByUserCardId.get(slot.userCardId) ?? null;
    if (slot.isStarter) {
      slots[slot.slotId] = card;
    } else if (slot.benchOrder !== null) {
      bench[slot.benchOrder] = card;
    }
  }

  return { formation: saved.formation, slots, bench };
}
