/**
 * lib/analytics/events.ts — T067
 *
 * Eventos PostHog tipados para o World Legends.
 *
 * Nomenclatura: objeto_verbo (snake_case)
 *   ex: pack_opened, match_completed, onboarding_step_completed
 *
 * Categorias:
 *   - session_*      retenção e engajamento de sessão
 *   - onboarding_*   funil de cadastro/onboarding
 *   - match_*        partidas jogadas
 *   - pack_*         abertura de packs
 *   - collection_*   interação com coleção
 *   - squad_*        construção de squad
 *   - event_*        participação em eventos
 *   - mission_*      progresso de missões
 *   - market_*       marketplace (futuro)
 *   - notification_* interação com notificações
 *   - navigation_*   navegação entre telas
 */

import { track, trackPageView } from './posthog';

// ─── Session & Retention ──────────────────────────────────────────────────────

export const sessionEvents = {
  /** Sessão iniciada (tab aberta, app aberto) */
  start(props: {
    userId?:         string;
    level?:          number;
    daysSinceFirst?: number;
    dayStreak?:      number;
    platform?:       'web' | 'pwa' | 'mobile';
  }) {
    track('session_started', props);
  },

  /** Usuário retorna em outro dia (DAU/WAU tracking) */
  dailyReturn(props: {
    dayStreak:   number;
    level:       number;
    totalCards:  number;
    lastSeenDays:number;
  }) {
    track('session_daily_return', props);
  },

  /** App colocado em background (abandono temporário) */
  backgrounded(props: { page: string; durationMs: number }) {
    track('session_backgrounded', props);
  },
};

// ─── Onboarding Funnel ────────────────────────────────────────────────────────

export const onboardingEvents = {
  /** Usuário chegou à tela de onboarding */
  started(props: { method: 'fresh_install' | 'returning' }) {
    track('onboarding_started', props);
  },

  /** Usuário completou uma etapa */
  stepCompleted(props: {
    step:      number;
    stepName:  'enter_name' | 'choose_squad' | 'open_first_pack' | 'play_tutorial';
    durationMs:number;
  }) {
    track('onboarding_step_completed', props);
  },

  /** Onboarding completo */
  completed(props: {
    username:   string;
    totalTimeMs:number;
    stepsCount: number;
  }) {
    track('onboarding_completed', props);
  },

  /** Usuário abandonou antes de concluir */
  abandoned(props: {
    atStep:    number;
    stepName:  string;
    timeSpentMs:number;
  }) {
    track('onboarding_abandoned', props);
  },
};

// ─── Match Events ─────────────────────────────────────────────────────────────

export const matchEvents = {
  /** Partida iniciada */
  started(props: {
    opponentId:  string;
    opponentOvr: number;
    userSquadOvr:number;
    formation:   string;
    difficulty:  string;
  }) {
    track('match_started', props);
  },

  /** Partida concluída */
  completed(props: {
    outcome:       'win' | 'draw' | 'loss';
    homeScore:     number;
    awayScore:     number;
    durationMs:    number;
    opponentOvr:   number;
    userSquadOvr:  number;
    creditsEarned: number;
    xpEarned:      number;
    mvpCardId?:    string;
    mvpOvr?:       number;
    formation:     string;
  }) {
    track('match_completed', props);
  },

  /** Usuário abandonou durante a partida */
  abandoned(props: {
    atMinute:    number;
    phase:       'pre' | 'live' | 'ht';
    homeScore:   number;
    awayScore:   number;
    winning:     boolean;
  }) {
    track('match_abandoned', props);
  },

  /** Adversário selecionado */
  opponentSelected(props: {
    opponentId:    string;
    difficulty:    string;
    winProbability:number;
  }) {
    track('match_opponent_selected', props);
  },
};

// ─── Pack Events ──────────────────────────────────────────────────────────────

export const packEvents = {
  /** Usuário tocou no pack para começar a abertura */
  openStarted(props: {
    packId:   string;
    packName: string;
    cost:     number;
    balance:  number;
  }) {
    track('pack_open_started', props);
  },

  /** Pack completamente aberto (todas as cartas reveladas) */
  opened(props: {
    packId:         string;
    packName:       string;
    cost:           number;
    cardCount:      number;
    rarityBreakdown:Record<string, number>;   // { legendary:1, rare:3, ... }
    highestRarity:  string;
    highestOvr:     number;
    hasGoat:        boolean;
    revealDurationMs:number;
  }) {
    track('pack_opened', props);
  },

  /** Carta individual revelada */
  cardRevealed(props: {
    packId:      string;
    cardId:      string;
    rarityCode:  string;
    ovr:         number;
    position:    number;   // ordem de revelação (1-5)
    durationMs:  number;   // tempo para revelar
  }) {
    track('pack_card_revealed', props);
  },

  /** GOAT revelado (evento raro — rastrear sempre) */
  goatRevealed(props: {
    packId:  string;
    cardId:  string;
    cardOvr: number;
    cardName:string;
  }) {
    track('pack_goat_revealed', { ...props, $set_once: { first_goat: new Date().toISOString() } });
  },
};

// ─── Collection Events ────────────────────────────────────────────────────────

export const collectionEvents = {
  /** Usuário abriu a coleção */
  viewed(props: { totalCards: number }) {
    track('collection_viewed', props);
  },

  /** Busca realizada */
  searched(props: {
    query:        string;
    resultsCount: number;
    filterCount:  number;
  }) {
    track('collection_searched', props);
  },

  /** Carta visualizada em detalhe */
  cardViewed(props: {
    cardId:     string;
    rarityCode: string;
    ovr:        number;
    source:     'grid' | 'search' | 'filter';
  }) {
    track('collection_card_viewed', props);
  },

  /** Carta adicionada à comparação */
  compareStarted(props: { cardCount: number; rarities: string[] }) {
    track('collection_compare_started', props);
  },

  /** Carta favoritada */
  cardFavorited(props: { cardId: string; rarityCode: string }) {
    track('collection_card_favorited', props);
  },
};

// ─── Squad Builder Events ─────────────────────────────────────────────────────

export const squadEvents = {
  /** Usuário abriu o squad builder */
  opened(props: { starterCount: number; formation: string; ovr: number }) {
    track('squad_opened', props);
  },

  /** Formação alterada */
  formationChanged(props: { from: string; to: string }) {
    track('squad_formation_changed', props);
  },

  /** Carta adicionada ao campo */
  cardPlaced(props: {
    slotPosition: string;
    cardId:       string;
    rarityCode:   string;
    ovr:          number;
    newSquadOvr:  number;
    chemistry:    number;
  }) {
    track('squad_card_placed', props);
  },

  /** Squad salvo */
  saved(props: {
    formation:    string;
    starterCount: number;
    benchCount:   number;
    ovr:          number;
    chemistry:    number;
  }) {
    track('squad_saved', props);
  },
};

// ─── Event (in-game events) ───────────────────────────────────────────────────

export const inGameEventEvents = {
  /** Evento visualizado */
  viewed(props: { eventId: string; category: string; status: string }) {
    track('event_viewed', props);
  },

  /** Tentativa de entrar no evento */
  entryAttempted(props: {
    eventId:       string;
    category:      string;
    canEnter:      boolean;
    blockingReason:string | null;
  }) {
    track('event_entry_attempted', props);
  },

  /** Entrou no evento */
  entered(props: { eventId: string; category: string; difficulty: string }) {
    track('event_entered', props);
  },
};

// ─── Mission Events ───────────────────────────────────────────────────────────

export const missionEvents = {
  /** Recompensa coletada */
  claimed(props: {
    missionId:  string;
    missionType:'daily' | 'weekly' | 'lifetime';
    stage:      number;
    credits:    number;
    xp:         number;
  }) {
    track('mission_claimed', props);
  },
};

// ─── Navigation ───────────────────────────────────────────────────────────────

export const navEvents = {
  pageView(path: string) {
    trackPageView(path);
  },

  /** Usuário descobriu uma feature nova (primeira vez) */
  featureDiscovered(props: { feature: string; page: string }) {
    track('feature_discovered', props);
  },
};

// ─── Market Events ────────────────────────────────────────────────────────────

export const marketEvents = {
  listingViewed(props: { listingId: string; rarityCode: string; price: number }) {
    track('market_listing_viewed', props);
  },

  searchPerformed(props: {
    query:         string;
    filtersApplied:number;
    resultsCount:  number;
    sortBy:        string;
  }) {
    track('market_search_performed', props);
  },
};

// ─── Notificação ──────────────────────────────────────────────────────────────

export const notificationEvents = {
  received(props: { kind: string; priority: string }) {
    track('notification_received', props);
  },
  actionClicked(props: { kind: string; actionLabel: string; href: string }) {
    track('notification_action_clicked', props);
  },
  dismissed(props: { kind: string; readDurationMs: number }) {
    track('notification_dismissed', props);
  },
};
