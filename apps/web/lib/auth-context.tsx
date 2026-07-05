'use client';

/**
 * lib/auth-context.tsx — T060
 *
 * Provê o estado de autenticação Supabase para toda a app.
 *
 * API:
 *   useAuth()         → { user, session, loading, signOut, signIn... }
 *   useUser()         → User | null (shortcut)
 *   SessionProvider   → envolve a app com o contexto
 *
 * Funciona em modo guest (Supabase não configurado):
 *   user = null, loading = false, signIn = no-op
 */

import type { AuthError, Session, User } from '@supabase/supabase-js';
import { type ReactNode, createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getSupabaseClient, isSupabaseConfigured } from './supabase/client';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type SignInResult = { error: AuthError | null };

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isGuest: boolean; // true se Supabase não configurado
  configured: boolean; // true se env vars presentes

  /** Login com Google OAuth */
  signInGoogle: (redirectTo?: string) => Promise<SignInResult>;
  /** Login com Apple OAuth */
  signInApple: (redirectTo?: string) => Promise<SignInResult>;
  /** Login com email/senha */
  signInEmail: (email: string, password: string) => Promise<SignInResult>;
  /** Magic link (email apenas) */
  signInMagicLink: (email: string) => Promise<SignInResult>;
  /** Signup com email/senha */
  signUp: (email: string, password: string) => Promise<SignInResult>;
  /** Envia email de recuperação de senha */
  resetPassword: (email: string) => Promise<SignInResult>;
  /** Logout */
  signOut: () => Promise<void>;
};

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  loading: true,
  isGuest: true,
  configured: false,
  signInGoogle: async (_r?: string) => ({ error: null }),
  signInApple: async (_r?: string) => ({ error: null }),
  signInEmail: async () => ({ error: null }),
  signInMagicLink: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  resetPassword: async () => ({ error: null }),
  signOut: async () => {},
});

// ─── Provider ─────────────────────────────────────────────────────────────────

type Props = {
  children: ReactNode;
  initialUser?: User | null;
  initialSession?: Session | null;
};

export function SessionProvider({ children, initialUser = null, initialSession = null }: Props) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [session, setSession] = useState<Session | null>(initialSession);
  const [loading, setLoading] = useState(!initialUser);
  const configured = isSupabaseConfigured();
  const sb = getSupabaseClient();

  // Ouvir mudanças de auth state
  useEffect(() => {
    if (!sb) {
      setLoading(false);
      return;
    }

    // Obter sessão inicial
    sb.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listener para mudanças
    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (event === 'SIGNED_OUT') {
        // Limpar game state local
        try {
          localStorage.removeItem('wl-game-state-v1');
        } catch {}
      }
    });

    return () => subscription.unsubscribe();
  }, [sb]);

  // ── Auth actions ─────────────────────────────────────────────────────────────

  const signInGoogle = useCallback(
    async (redirectTo = '/'): Promise<SignInResult> => {
      if (!sb) return { error: null };
      const callbackUrl = new URL(`${window.location.origin}/auth/callback`);
      if (redirectTo && redirectTo !== '/') callbackUrl.searchParams.set('next', redirectTo);
      const { error } = await sb.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl.toString(),
          queryParams: { prompt: 'select_account' },
        },
      });
      return { error };
    },
    [sb],
  );

  const signInApple = useCallback(
    async (redirectTo = '/'): Promise<SignInResult> => {
      if (!sb) return { error: null };
      const callbackUrl = new URL(`${window.location.origin}/auth/callback`);
      if (redirectTo && redirectTo !== '/') callbackUrl.searchParams.set('next', redirectTo);
      const { error } = await sb.auth.signInWithOAuth({
        provider: 'apple',
        options: { redirectTo: callbackUrl.toString() },
      });
      return { error };
    },
    [sb],
  );

  const signInEmail = useCallback(
    async (email: string, password: string): Promise<SignInResult> => {
      if (!sb) return { error: null };
      const { error } = await sb.auth.signInWithPassword({ email, password });
      return { error };
    },
    [sb],
  );

  const signInMagicLink = useCallback(
    async (email: string): Promise<SignInResult> => {
      if (!sb) return { error: null };
      const { error } = await sb.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      return { error };
    },
    [sb],
  );

  const signUp = useCallback(
    async (email: string, password: string): Promise<SignInResult> => {
      if (!sb) return { error: null };
      const { error } = await sb.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      return { error };
    },
    [sb],
  );

  const resetPassword = useCallback(
    async (email: string): Promise<SignInResult> => {
      if (!sb) return { error: null };
      const { error } = await sb.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback`,
      });
      return { error };
    },
    [sb],
  );

  const signOut = useCallback(async () => {
    if (!sb) return;
    await sb.auth.signOut();
  }, [sb]);

  const value: AuthContextValue = {
    user,
    session,
    loading,
    isGuest: !configured || !user,
    configured,
    signInGoogle,
    signInApple,
    signInEmail,
    signInMagicLink,
    signUp,
    resetPassword,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}

export function useUser(): User | null {
  return useContext(AuthContext).user;
}

export function useSession(): Session | null {
  return useContext(AuthContext).session;
}
