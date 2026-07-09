/**
 * lib/match-session.ts — Sprint 26 (Gameplay Foundation)
 *
 * Orquestração do fluxo de partida REAL (squad salvo pelo usuário),
 * distinto de `lib/match-data.ts`'s `runMatch` (que continua existindo,
 * inalterado, usado só por ferramentas internas/demo — nunca pela tela
 * de Partida de verdade).
 *
 * Responsabilidades:
 *   1. Reconstruir o Squad salvo (packages/squad) a partir do que o
 *      usuário montou no Squad Builder, validando posições/banco/
 *      duplicatas via `validateSquad` — bloqueia a partida se inválido
 *      ou inexistente (Prioridade 0 do brief).
 *   2. Construir o time adversário sintético (mesma lógica que já
 *      existia em `runMatch`, adaptada).
 *   3. Rodar o primeiro tempo (`simulateFirstHalf`), expor o estado
 *      pro intervalo, aplicar substituições/tática do usuário, rodar o
 *      resto da partida (`simulateRestOfMatch`).
 *   4. Transformar `MatchResult` → `MatchDisplay` reaproveitando
 *      `transformEvents`/`computeRewards`/labels de `match-data.ts`.
 *
 * Só importado por `lib/actions/match.ts` ('use server') — nunca por
 * componentes cliente.
 */

import type { CollectionCard } from '@/lib/collection-data';
import {
  DIFFICULTY_DEFS,
  EMPTY_DISPLAY,
  type LineupPlayer,
  type MatchDifficulty,
  type MatchDisplay,
  type MatchOpponent,
  REFEREE_LABELS,
  WEATHER_LABELS,
  computeRewards,
  transformEvents,
} from '@/lib/match-data';
import type { SavedSquad } from '@/lib/server/game-data';
import { FORMATIONS, type FormationKey } from '@/lib/squad-data';
import type {
  FirstHalfOutcome,
  MatchPlayer,
  MatchProgressState,
  MatchResult,
  TacticalIntensity,
  TeamSide,
  TeamSnapshot,
} from '@world-legends/engine';
import {
  applyManualSubstitution as engineApplyManualSubstitution,
  applyTacticalIntensity as engineApplyTacticalIntensity,
  simulateFirstHalf,
  simulateRestOfMatch,
} from '@world-legends/engine';
import type { PlayerMatchResolver } from '@world-legends/match-simulator';
import { chemistryToTacticalIntensity, squadToTeamSnapshot } from '@world-legends/match-simulator';
import { addPlayer, calculateChemistry, createSquad, validateSquad } from '@world-legends/squad';
import type { PlayerInfo, Squad, SquadSlot } from '@world-legends/squad';

const USER_ID = 'match-user';

// ─── Squad real do usuário → TeamSnapshot ────────────────────────────────────

export type SquadTeamResult =
  | Readonly<{
      ok: true;
      snapshot: TeamSnapshot;
      chemistry: number;
      lineup: LineupPlayer[];
      bench: LineupPlayer[];
    }>
  | Readonly<{ ok: false; code: 'NO_SQUAD' | 'INVALID_SQUAD'; errors: string[] }>;

function toLineupPlayer(position: string, userCardId: string, card: CollectionCard): LineupPlayer {
  return {
    position,
    name: card.displayName,
    ovr: card.overall,
    flag: card.flagEmoji,
    rarity: card.rarityCode,
    userCardId,
  };
}

function nameByUserCardId(userCards: readonly CollectionCard[]): Map<string, string> {
  const entries: Array<[string, string]> = [];
  for (const c of userCards) {
    if (c.userCardId) entries.push([c.userCardId, c.displayName]);
  }
  return new Map(entries);
}

/**
 * Reconstrói o `Squad` (packages/squad) DIRETAMENTE do que está salvo no
 * banco — sem passar por `createSquad`/`addPlayer`/`buildSquadSlots`.
 * Motivo: `packages/squad`'s `buildSquadSlots` gera slotIds com hífen
 * ("CB-1"), mas o Squad Builder desta app (`lib/squad-data.ts`, dona de
 * verdade do que é gravado em `squad_slots.slot_position`) usa slotIds
 * sem hífen ("CB1") — os dois formatos nunca colidem. Como estamos
 * reconstruindo um squad JÁ salvo (não montando um novo interativamente),
 * construir o objeto direto evita esse descompasso por completo;
 * `validateSquad`/`calculateChemistry`/`squadToTeamSnapshot` não se
 * importam com QUAL função criou o objeto, só com seu formato.
 */
function buildDomainSquad(activeSquad: SavedSquad): Squad | null {
  const formationSlots = FORMATIONS[activeSquad.formation as FormationKey];
  if (!formationSlots) return null;

  const starters: SquadSlot[] = formationSlots.map((slotDef) => {
    const saved = activeSquad.slots.find((s) => s.slotId === slotDef.slotId && s.isStarter);
    return {
      slotId: slotDef.slotId,
      requiredPosition: slotDef.position,
      userCardId: saved?.userCardId ?? null,
    };
  });
  const bench = activeSquad.slots.filter((s) => !s.isStarter).map((s) => s.userCardId);

  return {
    id: activeSquad.id as Squad['id'],
    userId: USER_ID,
    formation: activeSquad.formation as Squad['formation'],
    starters,
    bench,
    name: 'Meu Time',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Constrói e valida o `TeamSnapshot` do usuário a partir do squad salvo —
 * Prioridade 0 do Sprint 26: "garantir que o time que entra em campo
 * seja exatamente o Squad salvo pelo usuário". Bloqueia (retorna
 * `ok: false`) se não houver squad ou se ele não passar em
 * `validateSquad` (posições, banco 5-7, sem duplicata, sem
 * lesionado/suspenso — checks TC-SQUAD-20..27, `packages/squad`).
 */
export function buildUserTeamSnapshot(
  activeSquad: SavedSquad | null,
  userCards: readonly CollectionCard[],
): SquadTeamResult {
  if (!activeSquad || activeSquad.slots.length === 0) {
    return {
      ok: false,
      code: 'NO_SQUAD',
      errors: ['Você ainda não montou um time. Monte seu Squad antes de jogar uma partida.'],
    };
  }

  const domainSquad = buildDomainSquad(activeSquad);
  if (!domainSquad) {
    return { ok: false, code: 'INVALID_SQUAD', errors: ['Formação do squad é inválida.'] };
  }

  const cardByUserCardId = new Map(
    userCards
      .filter((c): c is CollectionCard & { userCardId: string } => Boolean(c.userCardId))
      .map((c) => [c.userCardId, c]),
  );

  const resolvePlayer = (ucId: string): PlayerInfo | null => {
    const card = cardByUserCardId.get(ucId);
    if (!card) return null;
    return {
      userCardId: ucId,
      userId: USER_ID,
      naturalPosition: card.position,
      nationality: card.nationality,
      overall: card.overall,
      isInjured: false,
      suspendedMatches: 0,
    };
  };

  const validation = validateSquad({ squad: domainSquad, resolvePlayer, minBenchSize: 5 });
  if (!validation.valid) {
    return {
      ok: false,
      code: 'INVALID_SQUAD',
      errors: validation.errors.map((e) => e.message),
    };
  }

  const chemistry = calculateChemistry(domainSquad, resolvePlayer);

  const matchResolver: PlayerMatchResolver = (ucId) => {
    const card = cardByUserCardId.get(ucId);
    if (!card) return null;
    return {
      userCardId: ucId,
      naturalPosition: card.position,
      overall: card.overall,
      nationality: card.nationality,
      traits: [],
    };
  };

  const snapshot = squadToTeamSnapshot(domainSquad, chemistry.total, true, matchResolver);

  const lineup: LineupPlayer[] = domainSquad.starters
    .filter((s): s is SquadSlot & { userCardId: string } => Boolean(s.userCardId))
    .map((s) => {
      const card = cardByUserCardId.get(s.userCardId);
      return card
        ? toLineupPlayer(s.requiredPosition, s.userCardId, card)
        : { position: s.requiredPosition, name: '?', ovr: 0, flag: '', userCardId: s.userCardId };
    });
  const bench: LineupPlayer[] = domainSquad.bench.map((ucId) => {
    const card = cardByUserCardId.get(ucId);
    return card
      ? toLineupPlayer(card.position, ucId, card)
      : { position: '?', name: '?', ovr: 0, flag: '', userCardId: ucId };
  });

  return { ok: true, snapshot, chemistry: chemistry.total, lineup, bench };
}

// ─── Time adversário sintético (mesma lógica de sempre) ──────────────────────

type AISeed = { slotId: string; position: string; ovr: number };

function aiSlotsFor(opponent: MatchOpponent): AISeed[] {
  return [
    { slotId: 'GK-1', position: 'GK', ovr: opponent.avgOvr - 2 },
    { slotId: 'RB-1', position: 'RB', ovr: opponent.avgOvr - 3 },
    { slotId: 'CB-1', position: 'CB', ovr: opponent.avgOvr - 1 },
    { slotId: 'CB-2', position: 'CB', ovr: opponent.avgOvr },
    { slotId: 'LB-1', position: 'LB', ovr: opponent.avgOvr - 3 },
    { slotId: 'CM-1', position: 'CM', ovr: opponent.avgOvr + 2 },
    { slotId: 'CM-2', position: 'CM', ovr: opponent.avgOvr },
    { slotId: 'CM-3', position: 'CM', ovr: opponent.avgOvr - 1 },
    { slotId: 'RW-1', position: 'RW', ovr: opponent.avgOvr + 1 },
    { slotId: 'ST-1', position: 'ST', ovr: opponent.avgOvr + 3 },
    { slotId: 'LW-1', position: 'LW', ovr: opponent.avgOvr + 1 },
  ];
}

export function buildAiTeamSnapshot(opponent: MatchOpponent): {
  snapshot: TeamSnapshot;
  aiCardIds: readonly string[];
  lineup: LineupPlayer[];
} {
  const aiSlots = aiSlotsFor(opponent);
  const AWAY_USER_ID = `opp-${opponent.id}`;

  const squadResult = createSquad({
    userId: AWAY_USER_ID,
    formation: '4-3-3',
    generateId: () => 'sq-away',
  });
  let awaySquad = squadResult.ok
    ? squadResult.value
    : ({
        id: 'sq-away' as Squad['id'],
        userId: AWAY_USER_ID,
        formation: '4-3-3',
        starters: [],
        bench: [],
        name: 'AI',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Squad);

  const resolvePlayer = (ucId: string): PlayerInfo | null => {
    const slot = aiSlots.find((s) => `ai-${s.slotId}` === ucId);
    if (!slot) return null;
    return {
      userCardId: ucId,
      userId: AWAY_USER_ID,
      naturalPosition: slot.position as PlayerInfo['naturalPosition'],
      nationality: 'XX',
      overall: Math.max(60, Math.min(99, slot.ovr)),
      isInjured: false,
      suspendedMatches: 0,
    };
  };

  for (const slot of aiSlots) {
    const ucId = `ai-${slot.slotId}`;
    const r = addPlayer({ squad: awaySquad, userCardId: ucId, slotId: slot.slotId, resolvePlayer });
    if (r.ok) awaySquad = r.value;
  }

  const matchResolver: PlayerMatchResolver = (ucId) => {
    const slot = aiSlots.find((s) => `ai-${s.slotId}` === ucId);
    if (!slot) return null;
    return {
      userCardId: ucId,
      naturalPosition: slot.position as PlayerInfo['naturalPosition'],
      overall: Math.max(60, Math.min(99, slot.ovr)),
      nationality: 'XX',
      traits: [],
    };
  };

  const snapshot = squadToTeamSnapshot(awaySquad, 60, false, matchResolver);
  const lineup: LineupPlayer[] = aiSlots.map((s) => ({
    position: s.position,
    name: `${opponent.name.split(' ')[0]} ${s.position}`,
    ovr: Math.max(60, Math.min(99, s.ovr)),
    flag: opponent.flag,
    rarity: 'elite',
  }));

  return { snapshot, aiCardIds: aiSlots.map((s) => `ai-${s.slotId}`), lineup };
}

// ─── Dificuldade → modificador do engine ─────────────────────────────────────

export function difficultyToAiModifier(difficulty: MatchDifficulty) {
  return { powerModifierPercent: DIFFICULTY_DEFS[difficulty].powerModifierPercent };
}

// ─── Iniciar partida (primeiro tempo) ────────────────────────────────────────

export type StartMatchOutcome =
  | Readonly<{ kind: 'walkover'; display: MatchDisplay }>
  | Readonly<{ kind: 'halftime'; state: MatchProgressState }>;

export function startMatchSimulation(input: {
  home: TeamSnapshot;
  away: TeamSnapshot;
  seed: number;
  difficulty: MatchDifficulty;
  opponent: MatchOpponent;
  userCards: readonly CollectionCard[];
  aiCardIds: readonly string[];
}): StartMatchOutcome {
  const outcome: FirstHalfOutcome = simulateFirstHalf({
    home: input.home,
    away: input.away,
    context: {
      requiresWinner: false,
      awayAiDifficulty: difficultyToAiModifier(input.difficulty),
    },
    seed: { value: String(input.seed >>> 0) },
  });

  if (outcome.kind === 'walkover') {
    return {
      kind: 'walkover',
      display: buildMatchDisplay(outcome.result, input.opponent, input.userCards, input.aiCardIds),
    };
  }
  return { kind: 'halftime', state: outcome.state };
}

// ─── Intervalo: montar display + substituição/tática ─────────────────────────

export type BenchOption = LineupPlayer;

export type HalftimeDisplay = {
  homeScore: number;
  awayScore: number;
  stats: MatchDisplay['stats'];
  events: MatchDisplay['events'];
  homeFieldPlayers: LineupPlayer[];
  homeBench: BenchOption[];
  homeSubsUsed: number;
  maxSubs: number;
  bestPlayerName: string | null;
  worstPlayerName: string | null;
  weather: string;
  referee: string;
  homeName: string;
  awayName: string;
};

const MAX_SUBSTITUTIONS = 5;

function resolveDisplayName(
  userCardId: string,
  userCards: readonly CollectionCard[],
  aiCardIds: readonly string[],
  opponent: MatchOpponent,
): string {
  if (aiCardIds.includes(userCardId)) {
    const pos = userCardId.replace('ai-', '').replace(/-\d+$/, '');
    return `${opponent.name.split(' ')[0]} ${pos}`;
  }
  const card = userCards.find((c) => c.userCardId === userCardId);
  return card?.displayName ?? userCardId.slice(0, 8);
}

function scoreEventsByCard(events: MatchProgressState['events']): Map<string, number> {
  const scoreByCard = new Map<string, number>();
  const bump = (id: string, delta: number) =>
    scoreByCard.set(id, (scoreByCard.get(id) ?? 0) + delta);

  for (const ev of events) {
    if (ev.type === 'goal') {
      bump(ev.scorerUserCardId, 3);
      if (ev.assisterUserCardId) bump(ev.assisterUserCardId, 2);
    }
    if (ev.type === 'card') bump(ev.playerUserCardId, ev.cardType === 'yellow' ? -2 : -4);
  }
  return scoreByCard;
}

function pickExtremes(scoreByCard: Map<string, number>): {
  bestId: string | null;
  bestScore: number;
  worstId: string | null;
  worstScore: number;
} {
  let bestId: string | null = null;
  let worstId: string | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;
  let worstScore = Number.POSITIVE_INFINITY;
  for (const [id, score] of scoreByCard) {
    if (score > bestScore) {
      bestScore = score;
      bestId = id;
    }
    if (score < worstScore) {
      worstScore = score;
      worstId = id;
    }
  }
  return { bestId, bestScore, worstId, worstScore };
}

function findBestAndWorst(
  state: MatchProgressState,
  userCards: readonly CollectionCard[],
  aiCardIds: readonly string[],
  opponent: MatchOpponent,
): { bestPlayerName: string | null; worstPlayerName: string | null } {
  const scoreByCard = scoreEventsByCard(state.events);
  if (scoreByCard.size === 0) return { bestPlayerName: null, worstPlayerName: null };

  const { bestId, bestScore, worstId, worstScore } = pickExtremes(scoreByCard);
  return {
    bestPlayerName:
      bestId && bestScore > 0 ? resolveDisplayName(bestId, userCards, aiCardIds, opponent) : null,
    worstPlayerName:
      worstId && worstScore < 0
        ? resolveDisplayName(worstId, userCards, aiCardIds, opponent)
        : null,
  };
}

export function buildHalftimeDisplay(
  state: MatchProgressState,
  opponent: MatchOpponent,
  userCards: readonly CollectionCard[],
  aiCardIds: readonly string[],
): HalftimeDisplay {
  const nameByPlayerId = nameByUserCardId(userCards);
  const aiIdSet = new Set(aiCardIds);
  const events = transformEvents(
    state.events,
    (id) => nameByPlayerId.get(id) ?? resolveDisplayName(id, userCards, aiCardIds, opponent),
    (id) => !aiIdSet.has(id),
  );

  const s = state.stats;
  const { bestPlayerName, worstPlayerName } = findBestAndWorst(
    state,
    userCards,
    aiCardIds,
    opponent,
  );

  const homeFieldPlayers: LineupPlayer[] = state.home.fieldPlayers.map((fp) => {
    const card = userCards.find((c) => c.userCardId === fp.player.userCardId);
    return card
      ? toLineupPlayer(fp.formationPosition, fp.player.userCardId, card)
      : {
          position: fp.formationPosition,
          name: fp.player.userCardId.slice(0, 8),
          ovr: 0,
          flag: '',
          userCardId: fp.player.userCardId,
        };
  });
  const homeBench: BenchOption[] = state.home.benchRemaining.map((p) => {
    const card = userCards.find((c) => c.userCardId === p.userCardId);
    return card
      ? toLineupPlayer(p.primaryPosition, p.userCardId, card)
      : {
          position: p.primaryPosition,
          name: p.userCardId.slice(0, 8),
          ovr: 0,
          flag: '',
          userCardId: p.userCardId,
        };
  });

  return {
    homeScore: state.homeScore,
    awayScore: state.awayScore,
    stats: {
      possession: [s.home.possessionPercent, s.away.possessionPercent],
      shots: [s.home.shots, s.away.shots],
      shotsOnTarget: [s.home.shotsOnTarget, s.away.shotsOnTarget],
      xg: [Math.round(s.home.xg * 10) / 10, Math.round(s.away.xg * 10) / 10],
      fouls: [s.home.fouls, s.away.fouls],
      corners: [s.home.corners, s.away.corners],
      yellowCards: [s.home.yellowCards, s.away.yellowCards],
      redCards: [s.home.redCards, s.away.redCards],
    },
    events,
    homeFieldPlayers,
    homeBench,
    homeSubsUsed: state.home.substitutionsUsed,
    maxSubs: MAX_SUBSTITUTIONS,
    bestPlayerName,
    worstPlayerName,
    weather: WEATHER_LABELS[state.weather] ?? state.weather,
    referee: REFEREE_LABELS[state.refereeProfile] ?? state.refereeProfile,
    homeName: 'Seu Time',
    awayName: opponent.name,
  };
}

// ─── Substituição / tática no intervalo ──────────────────────────────────────

export function applyHalftimeSubstitution(
  state: MatchProgressState,
  outgoingUserCardId: string,
  incomingUserCardId: string,
): { ok: true; state: MatchProgressState } | { ok: false; error: string } {
  return engineApplyManualSubstitution(
    state,
    'home' as TeamSide,
    outgoingUserCardId,
    incomingUserCardId,
  );
}

export function applyHalftimeTactic(
  state: MatchProgressState,
  intensity: TacticalIntensity,
  side: TeamSide = 'home',
): MatchProgressState {
  return engineApplyTacticalIntensity(state, side, intensity);
}

/**
 * IA "Lendária" (Sprint 26, item 7): reage no intervalo — muda de tática
 * conforme o placar e usa 1 substituição (o melhor reserva disponível no
 * lugar do titular mais desgastado/pior avaliado nesta metade).
 */
export function applyLegendaryAiHalftimeReaction(
  state: MatchProgressState,
  difficulty: MatchDifficulty,
): MatchProgressState {
  if (!DIFFICULTY_DEFS[difficulty].reactsAtHalftime) return state;

  let next = state;
  const losing = state.awayScore < state.homeScore;
  const winning = state.awayScore > state.homeScore;
  const newTactic: TacticalIntensity = losing
    ? 'pressao_alta'
    : winning
      ? 'contra_ataque'
      : 'ofensivo';
  next = engineApplyTacticalIntensity(next, 'away', newTactic);

  const bench = next.away.benchRemaining;
  const field = next.away.fieldPlayers;
  if (bench.length > 0 && field.length > 0) {
    const best = bench.reduce((a, b) => (a.attributes.stamina >= b.attributes.stamina ? a : b));
    const mostTired = field.reduce((a, b) =>
      state.nextMinute - a.enteredAtMinute >= state.nextMinute - b.enteredAtMinute ? a : b,
    );
    const subResult = engineApplyManualSubstitution(
      next,
      'away',
      mostTired.player.userCardId,
      best.userCardId,
    );
    if (subResult.ok) next = subResult.state;
  }

  return next;
}

// ─── Finalizar partida (segundo tempo + recompensas) ─────────────────────────

export function finishMatchSimulation(
  state: MatchProgressState,
  opponent: MatchOpponent,
  userCards: readonly CollectionCard[],
  aiCardIds: readonly string[],
): MatchDisplay {
  const result = simulateRestOfMatch(state);
  return buildMatchDisplay(result, opponent, userCards, aiCardIds);
}

function buildMatchDisplay(
  result: MatchResult,
  opponent: MatchOpponent,
  userCards: readonly CollectionCard[],
  aiCardIds: readonly string[],
): MatchDisplay {
  const nameByPlayerId = nameByUserCardId(userCards);
  const aiIdSet = new Set(aiCardIds);
  const events = transformEvents(
    result.events,
    (id) => nameByPlayerId.get(id) ?? resolveDisplayName(id, userCards, aiCardIds, opponent),
    (id) => !aiIdSet.has(id),
  );

  const winner: 'home' | 'away' | 'draw' = result.penaltyShootout
    ? result.penaltyShootout.homeScore > result.penaltyShootout.awayScore
      ? 'home'
      : 'away'
    : result.homeScore > result.awayScore
      ? 'home'
      : result.awayScore > result.homeScore
        ? 'away'
        : 'draw';

  const mvpCard = result.mvpUserCardId
    ? (userCards.find((c) => c.userCardId === result.mvpUserCardId) ?? null)
    : null;

  const rewards = computeRewards(winner, result.homeScore, result.stats);
  const s = result.stats;

  return {
    homeScore: result.homeScore,
    awayScore: result.awayScore,
    winner,
    events,
    stats: {
      possession: [s.home.possessionPercent, s.away.possessionPercent],
      shots: [s.home.shots, s.away.shots],
      shotsOnTarget: [s.home.shotsOnTarget, s.away.shotsOnTarget],
      xg: [Math.round(s.home.xg * 10) / 10, Math.round(s.away.xg * 10) / 10],
      fouls: [s.home.fouls, s.away.fouls],
      corners: [s.home.corners, s.away.corners],
      yellowCards: [s.home.yellowCards, s.away.yellowCards],
      redCards: [s.home.redCards, s.away.redCards],
    },
    mvp: mvpCard,
    weather: WEATHER_LABELS[result.weather] ?? result.weather,
    referee: REFEREE_LABELS[result.refereeProfile] ?? result.refereeProfile,
    rewards,
    homeName: 'Seu Time',
    awayName: opponent.name,
  };
}

export { EMPTY_DISPLAY };
