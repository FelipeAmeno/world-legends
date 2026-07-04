/**
 * lib/supabase/server.ts
 *
 * Cliente Supabase para Server Components e Route Handlers.
 * Usa @supabase/ssr com cookies do Next.js.
 *
 * Criado a cada request (NÃO singleton) para evitar
 * compartilhamento de estado entre requisições.
 */

import { createServerClient } from '@supabase/ssr';
import type { CookieOptions }  from '@supabase/ssr';
import { cookies }            from 'next/headers';
import type { Database }      from './client';
import { isSupabaseConfigured } from './client';

// ─── Para Server Components ───────────────────────────────────────────────────

/**
 * Retorna null se Supabase não estiver configurado.
 * Use: const sb = createSupabaseServer(); const user = await sb?.auth.getUser()
 */
export async function createSupabaseServer() {
  if (!isSupabaseConfigured()) return null;

  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options as any));
          } catch {
            // Server Components não podem escrever cookies
            // O middleware cuida de atualizar os cookies de sessão
          }
        },
      },
    },
  );
}

// ─── Helper: obter usuário atual ──────────────────────────────────────────────

export async function getCurrentUser() {
  const sb = await createSupabaseServer();
  if (!sb) return null;

  const { data: { user }, error } = await sb.auth.getUser();
  if (error || !user) return null;
  return user;
}

export async function getCurrentSession() {
  const sb = await createSupabaseServer();
  if (!sb) return null;

  const { data: { session } } = await sb.auth.getSession();
  return session;
}
