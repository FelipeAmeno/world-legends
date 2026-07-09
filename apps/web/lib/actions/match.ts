'use server';

import { checkAndUnlockAchievementsInternal } from '@/lib/actions/achievements';
import { awardMatchXpInternal } from '@/lib/actions/card-mastery';
import {
  incrementMissionProgressInternal,
  setAchievementValueInternal,
} from '@/lib/actions/missions';
import { crash } from '@/lib/crash/sentry';
import {
  MATCH_OPPONENTS,
  type MatchDifficulty,
  type MatchDisplay,
  type MatchOpponent,
} from '@/lib/match-data';
import {
  applyHalftimeSubstitution,
  applyHalftimeTactic,
  applyLegendaryAiHalftimeReaction,
  buildAiTeamSnapshot,
  buildHalftimeDisplay,
  buildUserTeamSnapshot,
  finishMatchSimulation,
  startMatchSimulation,
} from '@/lib/match-session';
import { getAuthenticatedUserId, getServiceDb } from '@/lib/server/db';
import { type SavedSquad, getUserActiveSquad, getUserCollection } from '@/lib/server/game-data';
import { SupabaseMatchRepository, SupabaseProfileRepository } from '@world-legends/db';
import type { MatchProgressState, TacticalIntensity } from '@world-legends/engine';
import type { HalftimeActionResult, PlayMatchResult, StartMatchResult } from './match.types';

/**
 * Sprint 26 (Gameplay Foundation) — o fluxo síncrono de ponta a ponta
 * virou 4 ações menores pra sustentar o intervalo jogável real:
 *
 *   startMatchAction()       → valida squad, roda o 1º tempo, PAUSA.
 *   applySubstitutionAction() → troca titular↔reserva no estado pausado.
 *   applyTacticAction()       → muda mentalidade no estado pausado.
 *   continueMatchAction()     → roda o resto, credita/persiste/atualiza
 *                                missões — só agora, depois da decisão
 *                                do usuário (antes rodava tudo de uma vez
 *                                em `playMatchAction`, que não existe mais).
 *
 * `applySubstitutionAction`/`applyTacticAction` são puras (não tocam
 * Supabase) — o estado inteiro da simulação viaja no round-trip
 * client↔server (ver `MatchProgressState`, 100% serializável).
 */

function resolveOpponent(opponentId: string): MatchOpponent {
  // biome-ignore lint/style/noNonNullAssertion: MATCH_OPPONENTS is a non-empty static array
  return MATCH_OPPONENTS.find((o) => o.id === opponentId) ?? MATCH_OPPONENTS[0]!;
}

// ─── Finalização compartilhada (recompensas + persistência + missões) ────────

async function finalizeMatch(input: {
  userId: string;
  display: MatchDisplay;
  opponent: MatchOpponent;
  activeSquad: SavedSquad | null;
  seed: number;
  playedCardIds: string[];
}): Promise<PlayMatchResult> {
  const { userId, display, opponent, activeSquad, seed, playedCardIds } = input;
  const db = getServiceDb();
  let matchId = '';
  let newBalance = 0;

  try {
    const profileRepo = new SupabaseProfileRepository(db);
    const creditResult = await profileRepo.creditSoftCurrency(userId, display.rewards.credits);
    if (creditResult.ok) newBalance = creditResult.value;

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

  const homeGoals = display.homeScore;
  const outcome = display.winner;

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

      const xpSources: import('@world-legends/card-mastery').XpGainSource[] = ['match_played'];
      if (outcome === 'home') xpSources.push('match_win');
      if (homeGoals > 0) xpSources.push('goal');
      await awardMatchXpInternal(userId, playedCardIds, xpSources);

      await checkAndUnlockAchievementsInternal(userId);
    } catch (e) {
      crash.captureError(e, {
        context: 'match_post_game_background',
        userId,
        extras: { opponentId: opponent.id, outcome, homeGoals },
        level: 'warning',
      });
    }
  })();

  return { ok: true, display, opponent, matchId, newBalance };
}

// ─── 1. Iniciar partida — valida squad, roda 1º tempo, pausa ─────────────────

export async function startMatchAction(
  opponentId: string,
  difficulty: MatchDifficulty,
): Promise<StartMatchResult> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { ok: false, code: 'AUTH', error: 'Não autenticado.' };

  const opponent = resolveOpponent(opponentId);
  const [activeSquad, userCards] = await Promise.all([
    getUserActiveSquad(userId),
    getUserCollection(userId),
  ]);

  // Prioridade 0 (Sprint 26): sem squad válido, bloqueia — nunca cai
  // pra um XI fixo hardcoded.
  const teamResult = buildUserTeamSnapshot(activeSquad, userCards);
  if (!teamResult.ok) {
    return {
      ok: false,
      code: teamResult.code,
      error: teamResult.errors[0] ?? 'Squad inválido.',
      errors: teamResult.errors,
    };
  }

  const ai = buildAiTeamSnapshot(opponent);
  const seed = Date.now();

  const outcome = startMatchSimulation({
    home: teamResult.snapshot,
    away: ai.snapshot,
    seed,
    difficulty,
    opponent,
    userCards,
    aiCardIds: ai.aiCardIds,
  });

  if (outcome.kind === 'walkover') {
    const playedCardIds = teamResult.lineup
      .map((p) => p.userCardId)
      .filter((id): id is string => Boolean(id));
    const result = await finalizeMatch({
      userId,
      display: outcome.display,
      opponent,
      activeSquad,
      seed,
      playedCardIds,
    });
    return { ok: true, kind: 'finished', result };
  }

  const halftime = buildHalftimeDisplay(outcome.state, opponent, userCards, ai.aiCardIds);
  return { ok: true, kind: 'halftime', state: outcome.state, halftime, opponent };
}

// ─── 2. Substituição no intervalo (pura) ─────────────────────────────────────

export async function applySubstitutionAction(
  state: MatchProgressState,
  opponentId: string,
  outgoingUserCardId: string,
  incomingUserCardId: string,
): Promise<HalftimeActionResult> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { ok: false, error: 'Não autenticado.' };

  const sub = applyHalftimeSubstitution(state, outgoingUserCardId, incomingUserCardId);
  if (!sub.ok) return { ok: false, error: sub.error };

  const opponent = resolveOpponent(opponentId);
  const userCards = await getUserCollection(userId);
  const ai = buildAiTeamSnapshot(opponent);
  const halftime = buildHalftimeDisplay(sub.state, opponent, userCards, ai.aiCardIds);
  return { ok: true, state: sub.state, halftime };
}

// ─── 3. Trocar tática no intervalo (pura) ────────────────────────────────────

export async function applyTacticAction(
  state: MatchProgressState,
  opponentId: string,
  intensity: TacticalIntensity,
): Promise<HalftimeActionResult> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { ok: false, error: 'Não autenticado.' };

  const next = applyHalftimeTactic(state, intensity);
  const opponent = resolveOpponent(opponentId);
  const userCards = await getUserCollection(userId);
  const ai = buildAiTeamSnapshot(opponent);
  const halftime = buildHalftimeDisplay(next, opponent, userCards, ai.aiCardIds);
  return { ok: true, state: next, halftime };
}

// ─── 4. Continuar — roda o resto, credita/persiste/atualiza missões ─────────

export async function continueMatchAction(
  state: MatchProgressState,
  opponentId: string,
  difficulty: MatchDifficulty,
): Promise<PlayMatchResult> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { ok: false, error: 'Não autenticado.' };

  const opponent = resolveOpponent(opponentId);
  const [activeSquad, userCards] = await Promise.all([
    getUserActiveSquad(userId),
    getUserCollection(userId),
  ]);
  const ai = buildAiTeamSnapshot(opponent);

  // Lendário: a IA reage no intervalo (tática + 1 substituição) — aplicado
  // aqui, exatamente antes de rodar o resto da partida.
  const reactedState = applyLegendaryAiHalftimeReaction(state, difficulty);
  const display = finishMatchSimulation(reactedState, opponent, userCards, ai.aiCardIds);

  const playedCardIds = reactedState.home.fieldPlayers.map((fp) => fp.player.userCardId);

  return finalizeMatch({
    userId,
    display,
    opponent,
    activeSquad,
    seed: Number(reactedState.seed.value) || Date.now(),
    playedCardIds,
  });
}
