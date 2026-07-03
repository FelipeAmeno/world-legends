/**
 * app/auth/callback/route.ts — T060
 *
 * Route Handler para o callback OAuth do Supabase.
 * Troca o code por uma sessão e redireciona para o app.
 *
 * Configuração no Supabase Dashboard:
 *   Authentication → URL Configuration → Site URL: https://seu-dominio.com
 *   Redirect URLs: https://seu-dominio.com/auth/callback
 */

import { createServerClient } from '@supabase/ssr';
import type { CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const redirect = searchParams.get('next') ?? '/';
  const error = searchParams.get('error');
  const errorDesc = searchParams.get('error_description');

  // Erro do provider OAuth
  if (error) {
    const loginUrl = new URL('/login', origin);
    loginUrl.searchParams.set('error', errorDesc ?? error);
    return NextResponse.redirect(loginUrl);
  }

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=no_code', origin));
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    // Sem Supabase configurado → ir para home normalmente
    return NextResponse.redirect(new URL('/', origin));
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet: { name: string; value: string; options: CookieOptions }[]) => {
        for (const { name, value, options } of cookiesToSet) {
          cookieStore.set(
            name,
            value,
            options as unknown as NonNullable<Parameters<typeof cookieStore.set>[2]>,
          );
        }
      },
    },
  });

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    const loginUrl = new URL('/login', origin);
    loginUrl.searchParams.set('error', exchangeError.message);
    return NextResponse.redirect(loginUrl);
  }

  // Sucesso → redirecionar para destino (ou home)
  const forwardedHost = request.headers.get('x-forwarded-host');
  const isLocalEnv = process.env.NODE_ENV === 'development';

  if (isLocalEnv) {
    return NextResponse.redirect(new URL(redirect, origin));
  }
  if (forwardedHost) {
    return NextResponse.redirect(new URL(redirect, `https://${forwardedHost}`));
  }
  return NextResponse.redirect(new URL(redirect, origin));
}
