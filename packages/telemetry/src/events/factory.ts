/**
 * Factory functions para criar eventos de telemetria com o envelope completo.
 * Cada função corresponde a uma categoria de eventos do doc 12 §2.
 * Funções puras — sem efeito colateral.
 */
import type {
  CardCraftedPayload,
  CardDuplicateConvertedPayload,
  CardObtainedPayload,
  EconomySinkSourcePayload,
  EconomyTransactionPayload,
  EngineComboActivatedPayload,
  EngineTraitActivatedPayload,
  GameMode,
  MarketListingPayload,
  MarketPurchasedPayload,
  MatchCardPayload,
  MatchEndedPayload,
  MatchInjuryPayload,
  MatchPenaltyShootoutPayload,
  MatchStartedPayload,
  MatchWalkoverPayload,
  PackOpenedPayload,
  PackPityTriggeredPayload,
  SessionHeartbeatPayload,
  SessionLoginPayload,
  SessionLogoutPayload,
  TelemetryEnvelope,
  TelemetryEventType,
  TelemetryPayload,
} from './envelope';

// ─── Builder base ─────────────────────────────────────────────────────────────

type BaseContext = Readonly<{
  userId?: string;
  matchId?: string;
  seasonId?: string;
  engineVersion?: string;
  build?: string;
  region?: string;
  gameMode?: GameMode;
  timestamp?: Date;
}>;

export function makeEnvelope(
  eventType: TelemetryEventType,
  payload: TelemetryPayload,
  ctx: BaseContext = {},
): TelemetryEnvelope {
  return Object.freeze({
    timestamp: ctx.timestamp ?? new Date(),
    userId: ctx.userId ?? null,
    seasonId: ctx.seasonId ?? null,
    matchId: ctx.matchId ?? null,
    eventType,
    payload: Object.freeze(payload),
    engineVersion: ctx.engineVersion ?? null,
    build: ctx.build ?? null,
    region: ctx.region ?? null,
    gameMode: ctx.gameMode ?? null,
  });
}

// ─── Sessão (doc 12 §2.1) ────────────────────────────────────────────────────

export const sessionEvents = {
  login(payload: SessionLoginPayload, ctx?: BaseContext): TelemetryEnvelope {
    return makeEnvelope('session_login', payload, ctx);
  },
  logout(payload: SessionLogoutPayload, ctx?: BaseContext): TelemetryEnvelope {
    return makeEnvelope('session_logout', payload, ctx);
  },
  heartbeat(payload: SessionHeartbeatPayload, ctx?: BaseContext): TelemetryEnvelope {
    return makeEnvelope('session_heartbeat', payload, ctx);
  },
  dailyStreak(consecutiveDays: number, ctx?: BaseContext): TelemetryEnvelope {
    return makeEnvelope('session_daily_streak', { consecutiveDays }, ctx);
  },
};

// ─── Partidas (doc 12 §2.2) ──────────────────────────────────────────────────

export const matchEvents = {
  started(payload: MatchStartedPayload, ctx?: BaseContext): TelemetryEnvelope {
    return makeEnvelope('match_started', payload, ctx);
  },
  ended(payload: MatchEndedPayload, ctx?: BaseContext): TelemetryEnvelope {
    return makeEnvelope('match_ended', payload, ctx);
  },
  walkover(payload: MatchWalkoverPayload, ctx?: BaseContext): TelemetryEnvelope {
    return makeEnvelope('match_walkover', payload, ctx); // DD-01
  },
  penaltyShootout(payload: MatchPenaltyShootoutPayload, ctx?: BaseContext): TelemetryEnvelope {
    return makeEnvelope('match_penalty_shootout', payload, ctx); // DD-02
  },
  card(payload: MatchCardPayload, ctx?: BaseContext): TelemetryEnvelope {
    return makeEnvelope('match_card', payload, ctx);
  },
  injury(payload: MatchInjuryPayload, ctx?: BaseContext): TelemetryEnvelope {
    return makeEnvelope('match_injury', payload, ctx);
  },
  extraTimeTriggered(ctx?: BaseContext): TelemetryEnvelope {
    return makeEnvelope('match_extra_time_triggered', {}, ctx);
  },
  lineupSubmitted(squadData: Record<string, unknown>, ctx?: BaseContext): TelemetryEnvelope {
    return makeEnvelope('match_lineup_submitted', squadData, ctx);
  },
  xgSnapshot(
    xg: number,
    side: 'home' | 'away',
    playerUserCardId: string,
    ctx?: BaseContext,
  ): TelemetryEnvelope {
    return makeEnvelope('match_xg_snapshot', { xg, side, playerUserCardId }, ctx);
  },
};

// ─── Engine (doc 12 §2.3) ────────────────────────────────────────────────────

export const engineEvents = {
  traitActivated(payload: EngineTraitActivatedPayload, ctx?: BaseContext): TelemetryEnvelope {
    return makeEnvelope('engine_trait_activated', payload, ctx);
  },
  comboActivated(payload: EngineComboActivatedPayload, ctx?: BaseContext): TelemetryEnvelope {
    return makeEnvelope('engine_combo_activated', payload, ctx);
  },
  chemistryCalculated(score: number, linkCount: number, ctx?: BaseContext): TelemetryEnvelope {
    return makeEnvelope('engine_chemistry_calculated', { chemistryScore: score, linkCount }, ctx);
  },
  heroMomentTriggered(
    playerUserCardId: string,
    minute: number,
    ctx?: BaseContext,
  ): TelemetryEnvelope {
    return makeEnvelope('engine_hero_moment_triggered', { playerUserCardId, minute }, ctx);
  },
  clutchEvent(playerUserCardId: string, eventKind: string, ctx?: BaseContext): TelemetryEnvelope {
    return makeEnvelope('engine_clutch_event', { playerUserCardId, eventKind }, ctx);
  },
};

// ─── Packs (doc 12 §2.5) ─────────────────────────────────────────────────────

export const packEvents = {
  opened(payload: PackOpenedPayload, ctx?: BaseContext): TelemetryEnvelope {
    return makeEnvelope('pack_opened', payload, ctx);
  },
  pityTriggered(payload: PackPityTriggeredPayload, ctx?: BaseContext): TelemetryEnvelope {
    return makeEnvelope('pack_pity_triggered', payload, ctx);
  },
  rareCardInterval(
    packsSinceLastHit: number,
    rarityCode: string,
    ctx?: BaseContext,
  ): TelemetryEnvelope {
    return makeEnvelope('pack_rare_card_interval', { packsSinceLastHit, rarityCode }, ctx);
  },
};

// ─── Mercado (doc 12 §2.6) ───────────────────────────────────────────────────

export const marketEvents = {
  listingCreated(payload: MarketListingPayload, ctx?: BaseContext): TelemetryEnvelope {
    return makeEnvelope('market_listing_created', payload, ctx);
  },
  listingPurchased(payload: MarketPurchasedPayload, ctx?: BaseContext): TelemetryEnvelope {
    return makeEnvelope('market_listing_purchased', payload, ctx);
  },
  listingCancelled(cardId: string, timeActiveMs: number, ctx?: BaseContext): TelemetryEnvelope {
    return makeEnvelope('market_listing_cancelled', { cardId, timeActiveMs }, ctx);
  },
  priceHistoryPoint(
    cardId: string,
    rarityCode: string,
    avgPrice: number,
    ctx?: BaseContext,
  ): TelemetryEnvelope {
    return makeEnvelope('market_price_history_point', { cardId, rarityCode, avgPrice }, ctx);
  },
};

// ─── Economia (doc 12 §2.7) ──────────────────────────────────────────────────

export const economyEvents = {
  creditsEarned(payload: EconomyTransactionPayload, ctx?: BaseContext): TelemetryEnvelope {
    return makeEnvelope('economy_credits_earned', payload, ctx);
  },
  creditsSpent(payload: EconomyTransactionPayload, ctx?: BaseContext): TelemetryEnvelope {
    return makeEnvelope('economy_credits_spent', payload, ctx);
  },
  fragmentsEarned(payload: EconomyTransactionPayload, ctx?: BaseContext): TelemetryEnvelope {
    return makeEnvelope('economy_fragments_earned', payload, ctx);
  },
  fragmentsSpent(payload: EconomyTransactionPayload, ctx?: BaseContext): TelemetryEnvelope {
    return makeEnvelope('economy_fragments_spent', payload, ctx);
  },
  premiumPurchased(amount: number, item: string, ctx?: BaseContext): TelemetryEnvelope {
    return makeEnvelope('economy_premium_purchased', { amount, reason: item }, ctx);
  },
  sinkApplied(payload: EconomySinkSourcePayload, ctx?: BaseContext): TelemetryEnvelope {
    return makeEnvelope('economy_sink_applied', payload, ctx);
  },
  sourceApplied(payload: EconomySinkSourcePayload, ctx?: BaseContext): TelemetryEnvelope {
    return makeEnvelope('economy_source_applied', payload, ctx);
  },
};

// ─── Cartas (doc 12 §2.4) ────────────────────────────────────────────────────

export const cardEvents = {
  obtained(payload: CardObtainedPayload, ctx?: BaseContext): TelemetryEnvelope {
    return makeEnvelope('card_obtained', payload, ctx);
  },
  crafted(payload: CardCraftedPayload, ctx?: BaseContext): TelemetryEnvelope {
    return makeEnvelope('card_crafted', payload, ctx);
  },
  duplicateConverted(payload: CardDuplicateConvertedPayload, ctx?: BaseContext): TelemetryEnvelope {
    return makeEnvelope('card_duplicate_converted', payload, ctx);
  },
  showcased(cardId: string, position: number, ctx?: BaseContext): TelemetryEnvelope {
    return makeEnvelope('card_showcased', { cardId, position }, ctx);
  },
  traded(
    cardId: string,
    fromUserId: string,
    toUserId: string,
    ctx?: BaseContext,
  ): TelemetryEnvelope {
    return makeEnvelope('card_traded', { cardId, fromUserId, toUserId }, ctx);
  },
};
