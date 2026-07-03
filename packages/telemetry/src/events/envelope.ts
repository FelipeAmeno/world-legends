/**
 * Envelope comum de telemetria e tipos de evento (doc 12 §2/§3).
 *
 * NOTA DE NOMENCLATURA (doc 18 §2):
 * `TelemetryEvent` aqui são eventos de observabilidade do jogo
 * (doc 12 §2: session, match, economy etc.) — distintos dos
 * `DomainEvent` de `packages/shared`, que são o mecanismo de
 * pub/sub interno entre packages. Os dois vivem em módulos diferentes
 * por design.
 *
 * PROPRIEDADES DO ARMAZENAMENTO (doc 12 §3):
 * - Append-only e imutável.
 * - `seed` + `engine_version` preservados permanentemente para replay.
 * - Particionamento lógico por `season_id`.
 */

// ─── Envelope comum (doc 12 §3) ───────────────────────────────────────────────

export type GameMode = 'ranked' | 'casual' | 'private_league' | 'event';

export type TelemetryEnvelope = Readonly<{
  /** Momento exato do evento — base de toda análise temporal. */
  readonly timestamp: Date;
  /** Identifica a conta. null para eventos anônimos (ex: erro de auth). */
  readonly userId: string | null;
  /** Vincula ao ciclo competitivo vigente. */
  readonly seasonId: string | null;
  /** Vincula à partida, quando aplicável. */
  readonly matchId: string | null;
  /** Nome canônico do evento (tabelas da seção 2). */
  readonly eventType: TelemetryEventType;
  /** Payload específico daquele tipo de evento. */
  readonly payload: TelemetryPayload;
  /** Versão do engine — nunca misturar dados de versões diferentes (doc 12 §1). */
  readonly engineVersion: string | null;
  /** Versão do client/app que gerou o evento. */
  readonly build: string | null;
  /** Região geográfica do cliente. */
  readonly region: string | null;
  /** Modo de jogo (normalização competitiva só se aplica em ranked/event). */
  readonly gameMode: GameMode | null;
}>;

// ─── Tipos de evento — nomes canônicos (doc 12 §2) ───────────────────────────

export type TelemetryEventType =
  // 2.1 Sessão
  | 'session_login'
  | 'session_logout'
  | 'session_heartbeat'
  | 'session_daily_streak'
  | 'session_count_daily'
  // 2.2 Partidas
  | 'match_started'
  | 'match_ended'
  | 'match_lineup_submitted'
  | 'match_substitution'
  | 'match_foul'
  | 'match_card'
  | 'match_penalty'
  | 'match_injury'
  | 'match_extra_time_triggered'
  | 'match_penalty_shootout'
  | 'match_walkover' // DD-01
  | 'match_xg_snapshot'
  | 'match_possession_tick'
  | 'match_mvp_assigned'
  // 2.3 Engine (granularidade de jogada)
  | 'engine_play_resolved'
  | 'engine_shot_resolved'
  | 'engine_assist_resolved'
  | 'engine_hero_moment_triggered'
  | 'engine_trait_activated'
  | 'engine_combo_activated'
  | 'engine_chemistry_calculated'
  | 'engine_clutch_event'
  // 2.4 Cartas
  | 'card_obtained'
  | 'card_crafted'
  | 'card_listed'
  | 'card_sold'
  | 'card_bought'
  | 'card_duplicate_converted'
  | 'card_evolution_applied'
  | 'card_showcased'
  | 'card_traded'
  // 2.5 Packs
  | 'pack_opened'
  | 'pack_pity_triggered'
  | 'pack_rare_card_interval'
  // 2.6 Mercado
  | 'market_listing_created'
  | 'market_listing_purchased'
  | 'market_listing_cancelled'
  | 'market_price_history_point'
  // 2.7 Economia
  | 'economy_credits_earned'
  | 'economy_credits_spent'
  | 'economy_fragments_earned'
  | 'economy_fragments_spent'
  | 'economy_premium_purchased'
  | 'economy_premium_spent'
  | 'economy_sink_applied'
  | 'economy_source_applied';

// ─── Payloads por categoria ───────────────────────────────────────────────────

// 2.1 Sessão
export type SessionLoginPayload = { device: string; build: string; region: string };
export type SessionLogoutPayload = { durationMs: number };
export type SessionHeartbeatPayload = { timeOnlineMs: number };
export type SessionStreakPayload = { consecutiveDays: number };

// 2.2 Partidas
export type MatchStartedPayload = {
  seed: string;
  engineVersion: string;
  mode: GameMode;
  homeSquadId: string;
  awaySquadId: string;
};
export type MatchEndedPayload = {
  homeScore: number;
  awayScore: number;
  durationMs: number;
  status: 'normal' | 'extra_time' | 'penalties' | 'walkover';
};
export type MatchWalkoverPayload = {
  // DD-01
  affectedSide: 'home' | 'away';
  minuteOfInterruption: number;
  remainingPlayers: number;
  reason: 'insuficiência de elenco';
};
export type MatchPenaltyShootoutPayload = {
  // DD-02
  totalRounds: number;
  resolvedBySeed: boolean;
  homeScore: number;
  awayScore: number;
};
export type MatchCardPayload = {
  side: 'home' | 'away';
  minute: number;
  cardType: 'yellow' | 'red';
  reason: 'direct' | 'second_yellow';
  playerUserCardId: string;
};
export type MatchInjuryPayload = {
  side: 'home' | 'away';
  minute: number;
  playerUserCardId: string;
  severity: 'leve' | 'moderada' | 'grave';
  recoveryDays: number;
};

// 2.3 Engine
export type EngineTraitActivatedPayload = {
  trait: string;
  playerUserCardId: string;
  magnitude: number;
};
export type EngineComboActivatedPayload = {
  comboId: string;
  playerUserCardIds: string[];
  bonusApplied: number;
};
export type EngineChemistryCalculatedPayload = {
  chemistryScore: number;
  linkCount: number;
};

// 2.5 Packs
export type PackOpenedPayload = {
  packId: string;
  seed: string;
  raritiesDrawn: string[];
};
export type PackPityTriggeredPayload = {
  type: 'legendary_plus' | 'ultra_plus';
  packsSinceLastHit: number;
};

// 2.6 Mercado
export type MarketListingPayload = {
  cardId: string;
  rarityCode: string;
  price: number;
};
export type MarketPurchasedPayload = {
  cardId: string;
  price: number;
  timeListedMs: number;
};

// 2.7 Economia
export type EconomyTransactionPayload = {
  amount: number;
  reason: string;
};
export type EconomySinkSourcePayload = {
  sinkType?: string;
  sourceType?: string;
  amount: number;
  currency: 'credits' | 'fragments' | 'premium';
};

// 2.4 Cartas
export type CardObtainedPayload = {
  cardId: string;
  source: 'pack' | 'craft' | 'reward' | 'trade' | 'achievement';
};
export type CardCraftedPayload = {
  cardId: string;
  fragmentCost: number;
};
export type CardDuplicateConvertedPayload = {
  cardId: string;
  fragmentsGenerated: number;
};

// ─── Union de payload ─────────────────────────────────────────────────────────
export type TelemetryPayload =
  | SessionLoginPayload
  | SessionLogoutPayload
  | SessionHeartbeatPayload
  | SessionStreakPayload
  | MatchStartedPayload
  | MatchEndedPayload
  | MatchWalkoverPayload
  | MatchPenaltyShootoutPayload
  | MatchCardPayload
  | MatchInjuryPayload
  | EngineTraitActivatedPayload
  | EngineComboActivatedPayload
  | EngineChemistryCalculatedPayload
  | PackOpenedPayload
  | PackPityTriggeredPayload
  | MarketListingPayload
  | MarketPurchasedPayload
  | EconomyTransactionPayload
  | EconomySinkSourcePayload
  | CardObtainedPayload
  | CardCraftedPayload
  | CardDuplicateConvertedPayload
  | Record<string, unknown>; // escape hatch para eventos não listados explicitamente
