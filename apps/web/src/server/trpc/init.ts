/**
 * tRPC — inicialização e contexto (T025).
 *
 * O contexto injeta os repositórios de `packages/db` na request.
 * Os routers nunca importam Supabase diretamente — só as Portas (doc 18 §3).
 *
 * Autenticação: JWT Supabase extraído do cookie via @supabase/ssr.
 * Se não autenticado: `ctx.userId = null` — os routers decidem o que proteger.
 */
import { initTRPC, TRPCError } from '@trpc/server';
import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import superjson from 'superjson';
import { createServerClient } from '@supabase/ssr';

import {
  SupabaseProfileRepository,
  SupabaseUserCardRepository,
  SupabaseMatchRepository,
  SupabaseSeasonRepository,
  SupabaseRankingRepository,
  SupabasePackRepository,
  SupabaseCraftRepository,
  createDbClient,
} from '@world-legends/db';

// ─── Contexto ─────────────────────────────────────────────────────────────────

export async function createContext({ req }: FetchCreateContextFnOptions) {
  const supabaseUrl  = process.env['NEXT_PUBLIC_SUPABASE_URL']!;
  const supabaseKey  = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!;

  // Cliente anônimo (RLS activo) para a maioria das operações
  const db = createDbClient(supabaseUrl, supabaseKey);

  // Resolver usuário autenticado via JWT no cookie
  let userId: string | null = null;
  try {
    const { data: { user } } = await db.auth.getUser();
    userId = user?.id ?? null;
  } catch {
    userId = null;
  }

  // Repositórios injetados — domínio nunca precisa saber que é Supabase
  return {
    userId,
    db,
    repos: {
      profile:  new SupabaseProfileRepository(db),
      userCard: new SupabaseUserCardRepository(db),
      match:    new SupabaseMatchRepository(db),
      season:   new SupabaseSeasonRepository(db),
      ranking:  new SupabaseRankingRepository(db),
      pack:     new SupabasePackRepository(db),
      craft:    new SupabaseCraftRepository(db),
    },
  };
}

export type TRPCContext = Awaited<ReturnType<typeof createContext>>;

// ─── tRPC init ────────────────────────────────────────────────────────────────

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter: ({ shape, error }) => ({
    ...shape,
    data: {
      ...shape.data,
      zodError: error.cause instanceof Error ? error.cause.message : null,
    },
  }),
});

export const router      = t.router;
export const publicProc  = t.procedure;

/** Middleware de autenticação obrigatória. */
const enforceAuth = t.middleware(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Autenticação necessária.' });
  }
  return next({ ctx: { ...ctx, userId: ctx.userId } });
});

export const protectedProc = t.procedure.use(enforceAuth);
