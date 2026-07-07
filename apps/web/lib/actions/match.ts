'use server';

import { checkAndUnlockAchievementsInternal } from '@/lib/actions/achievements';
import { awardMatchXpInternal } from '@/lib/actions/card-mastery';
import {
  incrementMissionProgressInternal,
  setAchievementValueInternal,
} from '@/lib/actions/missions';
import { crash } from '@/lib/crash/sentry';
import { MATCH_OPPONENTS, runMatch } from '@/lib/match-data';
import { getAuthenticatedUserId, getServiceDb } from '@/lib/server/db';
import { getUserActiveSquad, getUserCollection } from '@/lib/server/game-data';
import { SupabaseMatchRepository, SupabaseProfileRepository } from '@world-legends/db';
import type { PlayMatchResult } from './match.types';

/**
 * Simula uma partida com o squad ativo do usuário, persiste e credita recompensas.
 *
 * Garantias:
 *   - Se o usuário não tiver squad salvo, usa a escalação padrão.
 *   - Rewards são creditados mesmo se a persistência da partida falhar.
 *   - Não cria rows órfãs: usa o squad do usuário como away_squad_id
 *     (FK de auto-referência — válido e sem custo de storage extra).
 */
export async function playMatchAction(opponentId: string): Promise<PlayMatchResult> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { ok: false, error: 'Não autenticado.' };

  const opponent = MATCH_OPPONENTS.find((o) => o.id === opponentId) ?? MATCH_OPPONENTS[0]!;
  const seed = Date.now();

  const [activeSquad, userCards] = await Promise.all([
    getUserActiveSquad(userId),
    getUserCollection(userId),
  ]);

  // Construir escalação real a partir do squad salvo no banco.
  // Usamos playerId como identificador na simulação (compatível com a
  // lógica interna de runMatch que busca cartas por playerId).
  let lineup: Array<{ slotId: string; cardId: string }> | undefined;
  if (activeSquad && activeSquad.slots.length > 0) {
    const cardByUserCardId = new Map(
      userCards.filter((c) => c.userCardId).map((c) => [c.userCardId!, c]),
    );
    const starters = activeSquad.slots
      .filter((s) => s.isStarter)
      .map((s) => {
        const card = cardByUserCardId.get(s.userCardId);
        return card ? { slotId: s.slotId, cardId: card.playerId } : null;
      })
      .filter((x): x is { slotId: string; cardId: string } => x !== null);
    if (starters.length > 0) lineup = starters;
  }

  // Simulação pura — determinística por seed
  const display = runMatch(opponent, seed, lineup);

  const db = getServiceDb();
  let matchId = '';
  let newBalance = 0;

  try {
    // Creditar recompensas independentemente da persistência da partida
    const profileRepo = new SupabaseProfileRepository(db);
    const creditResult = await profileRepo.creditSoftCurrency(userId, display.rewards.credits);
    if (creditResult.ok) newBalance = creditResult.value;

    // Registrar partida — apenas se o usuário tiver squad ativo.
    // away_squad_id = home_squad_id por auto-referência (sem criar rows órfãs).
    if (activeSquad?.id) {
      const matchRepo = new SupabaseMatchRepository(db);
      const matchRow = await matchRepo.create({
        homeProfileId: userId,
        homeSquadId: activeSquad.id,
        awaySquadId: activeSquad.id,
        rngSeed: seed,
        engineVersion: '1.0',
      });

      if (matchRow.ok) {
        matchId = matchRow.value.id;
        const events = display.events
          .filter((e) => e.type !== 'kickoff' && e.type !== 'assist')
          .map((e) => ({
            minute: e.minute,
            eventType: e.type,
            teamSide: e.side as 'home' | 'away' | 'neutral',
            primaryUserCardId: null as string | null,
            secondaryUserCardId: null as string | null,
            description: e.text,
            meta: {} as Record<string, unknown>,
          }));
        await matchRepo.recordSimulation(matchId, {
          homeScore: display.homeScore,
          awayScore: display.awayScore,
          events,
        });
      }
    }
  } catch {
    // Persistência falhou — resultado da simulação ainda é válido
  }

  // Atualizar progresso de missões de forma assíncrona (não bloqueia a resposta)
  const homeGoals = display.homeScore;
  const outcome = display.winner;

  // Card IDs that played the match (for mastery XP)
  const playedCardIds = lineup ? lineup.map((s) => s.cardId) : [];

  void (async () => {
    try {
      await incrementMissionProgressInternal(userId, 'matchesPlayed', 1);
      await incrementMissionProgressInternal(userId, 'goalsScored', homeGoals);

      if (outcome === 'home') {
        await incrementMissionProgressInternal(userId, 'wins', 1);
        await incrementMissionProgressInternal(userId, 'winStreak', 1);
      } else if (outcome === 'away') {
        await incrementMissionProgressInternal(userId, 'losses', 1);
        await setAchievementValueInternal(userId, 'achiev_30_unbeaten', 0);
      } else {
        await incrementMissionProgressInternal(userId, 'draws', 1);
      }

      // Award mastery XP to all cards that played
      const xpSources: import('@world-legends/card-mastery').XpGainSource[] = ['match_played'];
      if (outcome === 'home') xpSources.push('match_win');
      if (homeGoals > 0) xpSources.push('goal');
      await awardMatchXpInternal(userId, playedCardIds, xpSources);

      // Check and unlock Xbox-style achievements
      await checkAndUnlockAchievementsInternal(userId);
    } catch (e) {
      crash.captureError(e, {
        context: 'match_post_game_background',
        userId,
        extras: { opponentId, outcome, homeGoals },
        level: 'warning',
      });
    }
  })();

  return { ok: true, display, opponent, matchId, newBalance };
}
