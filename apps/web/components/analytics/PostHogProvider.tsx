'use client';

/**
 * components/analytics/PostHogProvider.tsx — T067
 *
 * Provider PostHog para Next.js App Router.
 *
 * Responsabilidades:
 *   1. Inicializar PostHog no primeiro render do cliente
 *   2. Identificar usuário autenticado (Supabase Auth)
 *   3. Rastrear page views automaticamente no router
 *   4. Rastrear abandono de sessão (beforeunload / visibilitychange)
 *   5. Respeitar opt-out do usuário (settings de privacidade)
 */

import { navEvents, sessionEvents } from '@/lib/analytics/events';
import {
  hasOptedOut,
  identify,
  initPostHog,
  optIn,
  optOut,
  reset,
  trackPageView,
} from '@/lib/analytics/posthog';
import { useAuth } from '@/lib/auth-context';
import { useGameState } from '@/lib/game-context';
import { loadSettings } from '@/lib/settings-store';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

// ─── Provider ────────────────────────────────────────────────────────────────

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const state = useGameState();
  const prevPath = useRef<string>('');
  const sessionStart = useRef(Date.now());

  // 1. Inicializar PostHog
  useEffect(() => {
    initPostHog();

    // Checar opt-out do usuário nas settings
    const settings = loadSettings();
    if (!settings.analytics) {
      optOut();
    } else {
      optIn();
    }
  }, []);

  // 2. Identificar usuário quando faz login
  useEffect(() => {
    if (!user) {
      reset();
      return;
    }

    identify({
      userId: user.id,
      username: user.user_metadata?.full_name ?? user.email?.split('@')[0],
      ...(state.isOnboarded ? { level: state.level, wins: state.wins } : {}),
    });
  }, [user, state.isOnboarded, state.level, state.wins]);

  // 3. Page views automáticos
  useEffect(() => {
    if (!pathname) return;

    navEvents.pageView(pathname);

    // Medir tempo na página anterior
    if (prevPath.current && prevPath.current !== pathname) {
      // (PostHog page_leave é capturado automaticamente pelo capture_pageleave)
    }

    prevPath.current = pathname;
  }, [pathname]);

  // 4. Sessão iniciada (uma vez por tab)
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally runs once on mount; sessionEvents is a stable singleton
  useEffect(() => {
    sessionEvents.start({
      ...(user?.id ? { userId: user.id } : {}),
      ...(state.isOnboarded ? { level: state.level } : {}),
      platform:
        typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches
          ? 'pwa'
          : 'web',
    });

    sessionStart.current = Date.now();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 5. Abandono (tab fechada / app em background)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        const durationMs = Date.now() - sessionStart.current;
        sessionEvents.backgrounded({ page: pathname, durationMs });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [pathname]);

  return <>{children}</>;
}
