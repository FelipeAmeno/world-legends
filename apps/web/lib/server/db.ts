/**
 * lib/server/db.ts
 *
 * Fonte única para o client de banco com service_role.
 * NUNCA importar em Client Components.
 *
 * Regra (doc 02 §8): escrita direta do client nunca ocorre —
 * só via Server Actions ou Edge Functions com service_role.
 */
import { type CookieOptions, createServerClient } from '@supabase/ssr';
import { createServiceClient } from '@world-legends/db';
import type { Database } from '@world-legends/db';
import { cookies } from 'next/headers';

/**
 * Client Supabase com service_role — bypassa RLS.
 * Usar exclusivamente em Server Actions e funções server-side.
 */
export function getServiceDb() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

/**
 * Obtém o userId autenticado via cookie de sessão.
 * Retorna null se não autenticado.
 */
export async function getAuthenticatedUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const client = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (all: { name: string; value: string; options: CookieOptions }[]) =>
          all.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    },
  );
  const {
    data: { user },
  } = await client.auth.getUser();
  return user?.id ?? null;
}
