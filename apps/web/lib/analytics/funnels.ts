/**
 * lib/analytics/funnels.ts — T067
 *
 * Funnels do World Legends para PostHog.
 *
 * Cada funil tem etapas nomeadas que o PostHog pode
 * visualizar automaticamente em "Funnels".
 *
 * Para criar um funil no PostHog:
 *   Insights → Funnels → Add step → selecionar os eventos abaixo
 *
 * Funnels definidos:
 *   1. Onboarding (4 etapas)
 *   2. Pack Opening (5 etapas)
 *   3. First Match (4 etapas)
 *   4. Collection Discovery (3 etapas)
 *   5. Event Participation (3 etapas)
 */

import { track } from './posthog';

// ─── Onboarding Funnel ────────────────────────────────────────────────────────
// PostHog: onboarding_started → onboarding_step_completed (step=1..4) → onboarding_completed

export const ONBOARDING_STEPS = {
  ENTER_NAME:       { step:1, name:'enter_name'        as const },
  CHOOSE_SQUAD:     { step:2, name:'choose_squad'      as const },
  OPEN_FIRST_PACK:  { step:3, name:'open_first_pack'   as const },
  PLAY_TUTORIAL:    { step:4, name:'play_tutorial'     as const },
} as const;

// ─── Pack Opening Funnel ──────────────────────────────────────────────────────
// PostHog: pack_select_viewed → pack_open_started → pack_card_revealed × N → pack_opened

export function trackPackFunnelStep(
  step: 'select_viewed' | 'float_shown' | 'tap_to_open' | 'exploded' | 'all_revealed',
  packId: string,
): void {
  track(`pack_funnel_${step}`, { packId });
}

// ─── First Match Funnel ───────────────────────────────────────────────────────
// PostHog: match_screen_opened → match_opponent_selected → match_started → match_completed

export function trackMatchFunnelStep(
  step: 'screen_opened' | 'opponent_selected' | 'started' | 'completed',
  props?: Record<string, unknown>,
): void {
  track(`match_funnel_${step}`, props);
}

// ─── Collection Funnel ────────────────────────────────────────────────────────
// PostHog: collection_viewed → collection_card_viewed → collection_compare_started

export function trackCollectionFunnelStep(
  step: 'viewed' | 'card_viewed' | 'compare_started' | 'filter_applied',
  props?: Record<string, unknown>,
): void {
  track(`collection_funnel_${step}`, props);
}

// ─── Retention Cohorts ────────────────────────────────────────────────────────
// Para o PostHog calcular D1/D7/D30 automaticamente

export function trackRetention(props: {
  dayNumber:   1 | 7 | 30;  // D1, D7, D30
  userId:      string;
  level:       number;
  totalCards:  number;
  wins:        number;
}): void {
  track(`retention_d${props.dayNumber}`, props);
}

// ─── Engagement Score ─────────────────────────────────────────────────────────
// Score calculado localmente, enviado ao PostHog para segmentação

type EngagementTier = 'churned' | 'at_risk' | 'casual' | 'engaged' | 'power';

export function calcEngagementTier(props: {
  daysSinceLastSession: number;
  sessionsLast7d:       number;
  packsLast7d:          number;
  matchesLast7d:        number;
}): EngagementTier {
  const { daysSinceLastSession, sessionsLast7d, packsLast7d, matchesLast7d } = props;

  if (daysSinceLastSession > 14)                 return 'churned';
  if (daysSinceLastSession > 7)                  return 'at_risk';
  if (sessionsLast7d < 2)                        return 'casual';
  if (sessionsLast7d >= 5 || matchesLast7d >= 10) return 'power';
  return 'engaged';
}

export function trackEngagementScore(props: {
  userId:            string;
  tier:              EngagementTier;
  sessionsLast7d:    number;
  matchesLast7d:     number;
  packsLast7d:       number;
}): void {
  track('engagement_scored', props);
}

// ─── PostHog Dashboard queries (documentação) ─────────────────────────────────

export const POSTHOG_QUERIES = {
  // Funil de onboarding
  onboardingFunnel: [
    'onboarding_started',
    'onboarding_step_completed', // filtrar por step=1
    'onboarding_step_completed', // filtrar por step=2
    'onboarding_completed',
  ],

  // Funil de pack
  packFunnel: [
    'pack_funnel_select_viewed',
    'pack_funnel_float_shown',
    'pack_funnel_tap_to_open',
    'pack_opened',
  ],

  // Taxa de partidas completadas vs abandonadas
  matchCompletion: {
    start:     'match_started',
    complete:  'match_completed',
    abandon:   'match_abandoned',
  },

  // Cohorts de retenção
  retention: {
    d1:  'retention_d1',
    d7:  'retention_d7',
    d30: 'retention_d30',
  },

  // Eventos chave para DAU
  dailyActive: [
    'session_started',
    'match_started',
    'pack_open_started',
    'collection_viewed',
  ],
} as const;
