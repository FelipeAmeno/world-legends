/**
 * lib/analytics/posthog.ts — T067
 *
 * Cliente PostHog para o World Legends.
 *
 * Características:
 *   - Graceful no-op se NEXT_PUBLIC_POSTHOG_KEY não estiver definido
 *   - Singleton — inicializado uma vez no cliente
 *   - identify() com user properties completas
 *   - opt-out via settings de privacidade
 *
 * Para ativar:
 *   NEXT_PUBLIC_POSTHOG_KEY=phc_xxx
 *   NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com  (default)
 */

import posthog from 'posthog-js';

// ─── Configuração ─────────────────────────────────────────────────────────────

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://app.posthog.com';

let _initialized = false;

export function isAnalyticsEnabled(): boolean {
  return !!(POSTHOG_KEY && typeof window !== 'undefined');
}

// ─── Inicialização ────────────────────────────────────────────────────────────

export function initPostHog(): void {
  if (_initialized || !isAnalyticsEnabled() || !POSTHOG_KEY) return;
  _initialized = true;

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    person_profiles: 'identified_only', // não criar perfil para anônimos

    // Captura automática: desabilitada para controle total
    autocapture: false,
    capture_pageview: false, // controlado manualmente
    capture_pageleave: true, // abandono de página
    disable_session_recording: false,

    // Performance
    loaded: (ph) => {
      // Silenciar em dev
      if (process.env.NODE_ENV === 'development') {
        ph.opt_out_capturing();
        ph.set_config({ debug: false });
      }
    },
  });
}

// ─── Identify ────────────────────────────────────────────────────────────────

export type UserProperties = {
  userId: string;
  username?: string;
  level?: number;
  totalCards?: number;
  wins?: number;
  credits?: number;
  plan?: 'free' | 'premium';
};

export function identify(props: UserProperties): void {
  if (!isAnalyticsEnabled()) return;
  posthog.identify(props.userId, {
    $username: props.username,
    level: props.level,
    total_cards: props.totalCards,
    wins: props.wins,
    credits: props.credits,
    plan: props.plan ?? 'free',
  });
}

export function reset(): void {
  if (!isAnalyticsEnabled()) return;
  posthog.reset();
}

// ─── Track ────────────────────────────────────────────────────────────────────

export function track(event: string, properties?: Record<string, unknown>): void {
  if (!isAnalyticsEnabled()) return;
  posthog.capture(event, properties);
}

export function trackPageView(path: string): void {
  if (!isAnalyticsEnabled()) return;
  posthog.capture('$pageview', { $current_url: path });
}

export function setUserProperty(key: string, value: unknown): void {
  if (!isAnalyticsEnabled()) return;
  posthog.people.set({ [key]: value });
}

// ─── Feature flags ────────────────────────────────────────────────────────────

export function isFeatureEnabled(flag: string): boolean {
  if (!isAnalyticsEnabled()) return false;
  return posthog.isFeatureEnabled(flag) ?? false;
}

// ─── Opt-out ─────────────────────────────────────────────────────────────────

export function optOut(): void {
  if (!isAnalyticsEnabled()) return;
  posthog.opt_out_capturing();
}

export function optIn(): void {
  if (!isAnalyticsEnabled()) return;
  posthog.opt_in_capturing();
}

export function hasOptedOut(): boolean {
  if (!isAnalyticsEnabled()) return true;
  return posthog.has_opted_out_capturing();
}

export { posthog };
