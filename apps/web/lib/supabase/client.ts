/**
 * lib/supabase/client.ts
 *
 * Cliente Supabase para uso no browser (Client Components).
 * Singleton para evitar múltiplas instâncias.
 *
 * Fallback graceful: se env vars não estiverem definidas,
 * retorna null e o app funciona em modo "guest" local.
 */

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type Database = {
  public: {
    Tables: {
      users: { Row: UserRow; Insert: Partial<UserRow>; Update: Partial<UserRow> };
      owned_cards: {
        Row: OwnedCardRow;
        Insert: Partial<OwnedCardRow>;
        Update: Partial<OwnedCardRow>;
      };
      squads: { Row: SquadRow; Insert: Partial<SquadRow>; Update: Partial<SquadRow> };
      match_history: {
        Row: MatchHistRow;
        Insert: Partial<MatchHistRow>;
        Update: Partial<MatchHistRow>;
      };
    };
  };
};

export type UserRow = {
  id: string;
  username: string;
  level: number;
  current_xp: number;
  xp_for_next: number;
  credits: number;
  fragments: number;
  wins: number;
  draws: number;
  losses: number;
  created_at: string;
  updated_at: string;
};

export type OwnedCardRow = {
  id: string;
  user_id: string;
  card_id: string;
  evolution: number;
  contracts: number;
  obtained_at: string;
};

export type SquadRow = {
  id: string;
  user_id: string;
  formation: string;
  slots: unknown;
  bench_ids: string[];
  updated_at: string;
};

export type MatchHistRow = {
  id: string;
  user_id: string;
  opponent: string;
  home_score: number;
  away_score: number;
  outcome: 'win' | 'draw' | 'loss';
  credits_earned: number;
  xp_earned: number;
  played_at: string;
};

// ─── Verificar se Supabase está configurado ───────────────────────────────────

export function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://your-project.supabase.co'
  );
}

// ─── Singleton ────────────────────────────────────────────────────────────────

let _client: SupabaseClient<Database> | null = null;

export function getSupabaseClient(): SupabaseClient<Database> | null {
  if (!isSupabaseConfigured()) return null;

  if (!_client) {
    _client = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    ) as unknown as SupabaseClient<Database>;
  }

  return _client;
}

/** Alias conveniente */
export const supabase = typeof window !== 'undefined' ? getSupabaseClient() : null;
