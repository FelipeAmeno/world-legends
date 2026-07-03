/**
 * src/registry/PersistenceRegistry.ts — T061
 *
 * Fábrica central de persistência — Ports & Adapters.
 *
 * Uso:
 *   // Memory (dev/test):
 *   const repo = createRegistry('memory');
 *
 *   // Supabase (produção):
 *   const repo = createRegistry('supabase', {
 *     url:    process.env.NEXT_PUBLIC_SUPABASE_URL!,
 *     anonKey:process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
 *   });
 *
 *   // Auto-detect (usa env vars):
 *   const repo = getRegistry();
 */

import { createClient } from '@supabase/supabase-js';

import type {
  IAchievementRepository,
  ICollectionRepository,
  IMatchRepository,
  IPackRepository,
  ISquadRepository,
  IUserRepository,
} from '../ports/index';

import {
  MemAchievementRepository,
  MemCollectionRepository,
  MemMatchRepository,
  MemPackRepository,
  MemSquadRepository,
  MemUserRepository,
} from '../adapters/memory/MemoryAdapters';

import {
  SupabaseAchievementRepository,
  SupabaseCollectionRepository,
  SupabaseMatchRepository,
  SupabasePackRepository,
  SupabaseSquadRepository,
  SupabaseUserRepository,
} from '../adapters/supabase/SupabaseAdapters';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type PersistenceAdapter = 'memory' | 'supabase';

export type SupabaseConfig = {
  url: string;
  anonKey: string;
};

export type PersistenceRegistry = {
  readonly adapter: PersistenceAdapter;
  readonly users: IUserRepository;
  readonly collection: ICollectionRepository;
  readonly squads: ISquadRepository;
  readonly matches: IMatchRepository;
  readonly packs: IPackRepository;
  readonly achievements: IAchievementRepository;
};

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createRegistry(
  adapter: PersistenceAdapter = 'memory',
  config?: SupabaseConfig,
): PersistenceRegistry {
  if (adapter === 'supabase' && config) {
    const client = createClient(config.url, config.anonKey);
    return Object.freeze({
      adapter,
      users: new SupabaseUserRepository(client),
      collection: new SupabaseCollectionRepository(client),
      squads: new SupabaseSquadRepository(client),
      matches: new SupabaseMatchRepository(client),
      packs: new SupabasePackRepository(client),
      achievements: new SupabaseAchievementRepository(client),
    });
  }

  // 'memory' — padrão, funcional sem banco
  return Object.freeze({
    adapter,
    users: new MemUserRepository(),
    collection: new MemCollectionRepository(),
    squads: new MemSquadRepository(),
    matches: new MemMatchRepository(),
    packs: new MemPackRepository(),
    achievements: new MemAchievementRepository(),
  });
}

// ─── Singleton ────────────────────────────────────────────────────────────────

let _instance: PersistenceRegistry | null = null;

export function getRegistry(): PersistenceRegistry {
  if (!_instance) {
    const url = process.env?.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const canUseSupabase = url && anonKey && url !== 'https://your-project.supabase.co';

    _instance = createRegistry(
      canUseSupabase ? 'supabase' : 'memory',
      // biome-ignore lint/style/noNonNullAssertion: env vars verified before use
      canUseSupabase ? { url: url!, anonKey: anonKey! } : undefined,
    );
  }
  return _instance;
}

export function initRegistry(
  adapter: PersistenceAdapter,
  config?: SupabaseConfig,
): PersistenceRegistry {
  _instance = createRegistry(adapter, config);
  return _instance;
}

export function resetRegistry(): void {
  _instance = null;
}
