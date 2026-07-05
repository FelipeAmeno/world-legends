/**
 * middleware.ts — Next.js Edge Middleware (T060)
 *
 * Responsabilidades:
 *   1. Refresh automático de tokens Supabase (via cookies)
 *   2. Proteção de rotas autenticadas
 *   3. Redirect para /login se não autenticado
 *   4. Redirect para / se já autenticado e acessando /login
 *
 * Modo Guest: se Supabase não configurado → deixa passar tudo.
 *
 * Rotas públicas (não exigem auth):
 *   / /enter /login /auth/* /api/public/*
 */

import { createServerClient } from '@supabase/ssr';
import type { CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ─── Rotas públicas (sem auth) ────────────────────────────────────────────────

const PUBLIC_PATHS = ['/enter', '/login', '/auth'];
const PUBLIC_PREFIXES = ['/auth/', '/api/public/', '/_next/', '/favicon'];

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

// ─── Middleware ───────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Modo guest: sem configuração → deixar passar tudo
  if (!url || !anonKey || url === 'https://your-project.supabase.co') {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
        // Atualizar cookies na resposta (refresh token)
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options as any),
        );
      },
    },
  });

  // IMPORTANTE: não chamar getSession() aqui (pode ter bug de race)
  // Usar getUser() que valida o token no servidor
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Usuário autenticado tentando acessar /login ou /enter → redirecionar
  if (user && (pathname === '/login' || pathname === '/enter')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Rota protegida sem usuário → redirecionar para /login
  if (!user && !isPublic(pathname)) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}

// ─── Configurar em quais paths o middleware roda ──────────────────────────────

export const config = {
  matcher: [
    /*
     * Roda em todos os paths exceto:
     * - _next/static (arquivos estáticos)
     * - _next/image (otimização de imagem)
     * - favicon.ico
     * - public assets (png, jpg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
