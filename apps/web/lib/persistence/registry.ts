/**
 * apps/web/lib/persistence/registry.ts — T061
 *
 * Inicializa e expõe o PersistenceRegistry para o apps/web.
 * Auto-detecta se Supabase está configurado via env vars.
 *
 * SINGLETON: chamado uma vez por process (Server) ou por tab (Client).
 *
 * Uso:
 *   import { getDb } from '@/lib/persistence/registry'
 *   const { users, collection } = getDb()
 *   const result = await users.findById(userId)
 */

import { type PersistenceRegistry, getRegistry, initRegistry } from '@world-legends/persistence';

// ─── Auto-detect ──────────────────────────────────────────────────────────────

function isSupabaseReady(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return !!(
    url &&
    anonKey &&
    url !== 'https://your-project.supabase.co' &&
    !url.includes('placeholder')
  );
}

let _initialized = false;

/**
 * Garante que o registry foi inicializado com o adapter correto.
 * Idempotente — chame quando necessário.
 */
export function ensureRegistry(): void {
  if (_initialized) return;
  _initialized = true;

  if (isSupabaseReady()) {
    initRegistry('supabase', {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    });
    console.info('[db] Persistence: Supabase ✓');
  } else {
    initRegistry('memory');
    console.info('[db] Persistence: Memory (sem banco configurado)');
  }
}

/**
 * Retorna o registry singleton.
 * Inicializa automaticamente se ainda não foi feito.
 */
export function getDb(): PersistenceRegistry {
  ensureRegistry();
  return getRegistry();
}

// ─── Re-exports convenientes ──────────────────────────────────────────────────

export type { PersistenceRegistry };
