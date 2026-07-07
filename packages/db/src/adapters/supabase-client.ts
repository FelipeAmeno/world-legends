/**
 * Supabase client factory para packages/db.
 *
 * REGRA INVIOLÁVEL (doc 18 §3):
 * Nenhum package de domínio (engine → telemetry) importa este arquivo.
 * O cliente Supabase é instanciado exclusivamente em:
 *   - apps/* (composição real)
 *   - packages/db/src/* (adapters)
 *
 * O cliente é passado aos repositórios via injeção — nunca um singleton
 * global importado por domínio.
 */
import { type SupabaseClient, createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

export type DbClient = SupabaseClient<Database>;

export function createDbClient(supabaseUrl: string, supabaseKey: string): DbClient {
  return createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
  });
}

/**
 * Cria um cliente com service_role para operações de backend que precisam
 * contornar RLS (simulação de partida, entrega de recompensas, etc.).
 * NUNCA exposto ao client-side ou a packages de domínio.
 */
export function createServiceClient(supabaseUrl: string, serviceRoleKey: string): DbClient {
  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/** Tipo utilitário para extrair o tipo de retorno de uma tabela. */
export type TableRow<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type TableInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type TableUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
