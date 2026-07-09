import type { Seed } from '@world-legends/shared';
import { calculateChemistry } from '../chemistry/chemistry';
import type { ChemistryPlayer, ChemistrySquadSlot } from '../chemistry/types';
import {
  createAssistEvent,
  createCardEvent,
  createFullTimeEvent,
  createGoalEvent,
  createHalfTimeEvent,
  createInjuryEvent,
  createKickoffEvent,
  createSubstitutionEvent,
  createWalkoverEvent,
} from '../events/events';
import type { MatchEvent, TeamSide } from '../events/types';
import { applyFatigueToAttribute, calculateIntraMatchFatigue } from '../fatigue/fatigue';
import type { TacticalIntensity } from '../fatigue/types';
import {
  INJURY_CHANCE_FOUL_VICTIM,
  applyIronManRiskReduction,
  rollInjurySeverity,
  sampleRecoveryDays,
  shouldInjuryOccur,
} from '../injuries/injuries';
/**
 * `simulateMatch` — doc 09 §25 (`ALGORITMO simulateMatch`), a visão
 * integrada de TODA a engine. Função PURA: não muta `input.home`/
 * `input.away`, não lê relógio/Math.random, não guarda estado entre
 * chamadas — todo o estado da simulação vive numa closure local,
 * descartada ao retornar. Determinístico: o mesmo `(home, away,
 * context, seed)` produz sempre, byte a byte, o mesmo `MatchResult`.
 *
 * A explicação completa da arquitetura, decisões de síntese e o que
 * ficou fora desta primeira versão está na resposta de texto desta
 * tarefa — aqui, só os comentários pontuais de cada decisão.
 *
 * Sprint 26 (Gameplay Foundation) — refatorado para expor um ponto de
 * pausa no intervalo (`simulateFirstHalf`/`simulateRestOfMatch`) sem
 * mudar NADA do comportamento de `simulateMatch`: é literalmente a
 * mesma sequência de operações, só reorganizada em `createRuntime`
 * (construção do estado) + `runMinuteRange` (o loop, hoje chamado duas
 * vezes — 1-45 e 46-90/120 — em vez de uma vez só 1-90/120). Os testes
 * de regressão/determinismo (`match.regression.test.ts`,
 * `match.determinism.test.ts`) validam que isso continua byte-idêntico.
 */
import { calculateOverall } from '../overall/overall';
import type { Position } from '../position';
import { type RNGInstance, type WeightedItem, restoreRNG } from '../rng/rng';
import { getRefereeCardMultiplier, resolveFoulCardOutcome, rollRefereeProfile } from './cards';
import { calculateGoalProbability, selectAssister, selectShooter } from './goal';
import { simulatePenaltyShootout } from './shootout';
import { calculateMvp } from './stats';
import { initializeMatchRngStreams } from './streams';
import {
  EXTRA_TIME_SUBSTITUTION_WINDOWS,
  MAX_SUBSTITUTIONS,
  MAX_SUBSTITUTION_WINDOWS,
  isCriticallyFatigued,
  selectForcedReplacement,
} from './substitutions';
import {
  HOME_ADVANTAGE_CARD_LENIENCY_PERCENT,
  HOME_ADVANTAGE_MORALE_BONUS,
  SECTOR_BY_POSITION,
  calculateTeamPower,
} from './team-power';
import type {
  FirstHalfOutcome,
  MatchContext,
  MatchPlayer,
  MatchProgressState,
  MatchResult,
  MatchRngStreams,
  RefereeProfile,
  SerializedFieldPlayer,
  SerializedRngState,
  SerializedSideState,
  SideStats,
  StartingSlot,
  TeamSnapshot,
  Weather,
} from './types';
import {
  calculateWeatherFatigueMultiplier,
  calculateWeatherInjuryChanceBonus,
  rollWeather,
} from './weather';

export const ENGINE_VERSION = '1.0.0-t010';

/** doc 09 §12.1, DD-01: abaixo de 7 jogadores em campo, W.O. técnico imediato. */
export const MINIMUM_PLAYERS_ON_FIELD = 7;

/**
 * Extraída como função pura standalone (em vez de só uma checagem
 * embutida no loop) especificamente para ser testável isoladamente —
 * TC-WO-01/02 testam o limiar exato (7 → segue jogo; 6 → W.O.), cenário
 * estatisticamente raro demais para surgir de forma confiável rodando
 * `simulateMatch` de ponta a ponta em volume de teste razoável.
 */
export function shouldDeclareWalkover(
  homeFieldCount: number,
  awayFieldCount: number,
): { triggered: boolean; affectedSide?: TeamSide } {
  if (homeFieldCount < MINIMUM_PLAYERS_ON_FIELD) {
    return { triggered: true, affectedSide: 'home' };
  }
  if (awayFieldCount < MINIMUM_PLAYERS_ON_FIELD) {
    return { triggered: true, affectedSide: 'away' };
  }
  return { triggered: false };
}

/**
 * doc 05 §4.4 — única fonte concreta para a chance-base de evento por
 * minuto; doc 09 §16 deixa isso "calibrável" sem dar número. Aplicado
 * de forma FIXA em todos os 90/120 minutos — a variação por fase de
 * jogo que doc 09 §16 descreve qualitativamente ("desespero ofensivo")
 * NÃO está implementada (nenhum multiplicador numérico documentado).
 */
const EVENT_CHANCE_PER_MINUTE = 0.18;

/**
 * Pesos de tipo de evento adaptados de doc 05 §3.2 (5 categorias) para
 * as 4 que o flowchart de doc 09 §16 de fato usa (chance/falta/
 * escanteio/disputa) — fundi o "set_piece" de doc 05 dentro de "chance"
 * (0.55+0.08=0.63). Decisão minha, claramente fora do doc canônico.
 */
type MinuteEventType = 'chance' | 'foul' | 'corner' | 'dispute';
const EVENT_TYPE_WEIGHTS: readonly WeightedItem<MinuteEventType>[] = [
  { value: 'chance', weight: 0.63 },
  { value: 'foul', weight: 0.15 },
  { value: 'corner', weight: 0.1 },
  { value: 'dispute', weight: 0.12 },
];

/** Doc nenhum dá a probabilidade de uma finalização fora do gol ainda ser "no alvo" — constante minha. */
const ON_TARGET_PROBABILITY_GIVEN_MISS = 0.4;

type FieldPlayerState = {
  slotId: string;
  formationPosition: Position;
  player: MatchPlayer;
  enteredAtMinute: number;
  hasYellowCard: boolean;
  foulsThisMatch: number;
};

type SideRuntime = {
  side: TeamSide;
  snapshot: TeamSnapshot;
  fieldPlayers: FieldPlayerState[];
  benchRemaining: MatchPlayer[];
  substitutionsUsed: number;
  substitutionWindowsUsed: number;
  morale: number;
};

function emptySideStats(): SideStats {
  return {
    possessionPercent: 50,
    shots: 0,
    shotsOnTarget: 0,
    xg: 0,
    fouls: 0,
    corners: 0,
    yellowCards: 0,
    redCards: 0,
  };
}

function buildInitialFieldPlayers(snapshot: TeamSnapshot): FieldPlayerState[] {
  return snapshot.starters.map((slot: StartingSlot) => ({
    slotId: slot.slotId,
    formationPosition: slot.formationPosition,
    player: slot.player,
    enteredAtMinute: 0,
    hasYellowCard: false,
    foulsThisMatch: 0,
  }));
}

function toStartingSlots(fieldPlayers: readonly FieldPlayerState[]): StartingSlot[] {
  return fieldPlayers.map((fp) => ({
    slotId: fp.slotId,
    formationPosition: fp.formationPosition,
    player: fp.player,
  }));
}

function toChemistrySquadSlots(fieldPlayers: readonly FieldPlayerState[]): ChemistrySquadSlot[] {
  return fieldPlayers.map((fp) => {
    const chemistryPlayer: ChemistryPlayer = {
      nationality: '',
      eraStart: 0,
      eraEnd: 0,
      primaryPosition: fp.formationPosition,
    };
    return { slotId: fp.slotId, formationPosition: fp.formationPosition, player: chemistryPlayer };
  });
}

function calculateAverageFatigue(
  fieldPlayers: readonly FieldPlayerState[],
  currentMinute: number,
  tacticalIntensity: TeamSnapshot['tacticalIntensity'],
  weather: Weather,
): number {
  if (fieldPlayers.length === 0) return 0;
  const total = fieldPlayers.reduce((sum, fp) => {
    const minutesOnField = currentMinute - fp.enteredAtMinute;
    const baseFatigue = calculateIntraMatchFatigue({
      minute: minutesOnField,
      staminaAttribute: fp.player.attributes.stamina,
      tacticalIntensity,
    });
    return sum + baseFatigue * calculateWeatherFatigueMultiplier(weather, minutesOnField);
  }, 0);
  return total / fieldPlayers.length;
}

function weightedSideChoice(homePower: number, awayPower: number, rng: RNGInstance): TeamSide {
  const total = homePower + awayPower;
  if (total <= 0) return rng.nextFloat() < 0.5 ? 'home' : 'away';
  return rng.nextFloat() < homePower / total ? 'home' : 'away';
}

const MAKESHIFT_GOALKEEPER_QUALITY = 20;

// ─── Serialização (Sprint 26) ──────────────────────────────────────────────────

function serializeFieldPlayer(fp: FieldPlayerState): SerializedFieldPlayer {
  return {
    slotId: fp.slotId,
    formationPosition: fp.formationPosition,
    player: fp.player,
    enteredAtMinute: fp.enteredAtMinute,
    hasYellowCard: fp.hasYellowCard,
    foulsThisMatch: fp.foulsThisMatch,
  };
}

function serializeSide(runtime: SideRuntime): SerializedSideState {
  return {
    fieldPlayers: runtime.fieldPlayers.map(serializeFieldPlayer),
    benchRemaining: runtime.benchRemaining,
    substitutionsUsed: runtime.substitutionsUsed,
    substitutionWindowsUsed: runtime.substitutionWindowsUsed,
    morale: runtime.morale,
    adjacentPairs: runtime.snapshot.adjacentPairs,
    tacticalIntensity: runtime.snapshot.tacticalIntensity,
    isHomeTeam: runtime.snapshot.isHomeTeam,
  };
}

function deserializeSide(side: TeamSide, serialized: SerializedSideState): SideRuntime {
  const fieldPlayers: FieldPlayerState[] = serialized.fieldPlayers.map((fp) => ({
    slotId: fp.slotId,
    formationPosition: fp.formationPosition,
    player: fp.player,
    enteredAtMinute: fp.enteredAtMinute,
    hasYellowCard: fp.hasYellowCard,
    foulsThisMatch: fp.foulsThisMatch,
  }));
  const snapshot: TeamSnapshot = {
    starters: toStartingSlots(fieldPlayers),
    bench: serialized.benchRemaining,
    adjacentPairs: serialized.adjacentPairs,
    tacticalIntensity: serialized.tacticalIntensity,
    isHomeTeam: serialized.isHomeTeam,
  };
  return {
    side,
    snapshot,
    fieldPlayers,
    benchRemaining: [...serialized.benchRemaining],
    substitutionsUsed: serialized.substitutionsUsed,
    substitutionWindowsUsed: serialized.substitutionWindowsUsed,
    morale: serialized.morale,
  };
}

// ─── createRuntime — o motor de simulação em si ───────────────────────────────
//
// Toda a lógica que antes vivia direto dentro de `simulateMatch` agora
// mora aqui, INALTERADA — só passou a ser parametrizável por um estado
// inicial "fresco" (kickoff) ou "restaurado" (retomando do intervalo).

type RuntimeInit =
  | Readonly<{
      kind: 'fresh';
      home: TeamSnapshot;
      away: TeamSnapshot;
      context: MatchContext;
      seed: Seed;
    }>
  | Readonly<{ kind: 'resume'; state: MatchProgressState }>;

function createRuntime(init: RuntimeInit) {
  let seed: Seed;
  let context: MatchContext;
  let streams: MatchRngStreams;
  let weather: Weather;
  let refereeProfile: RefereeProfile;
  const events: MatchEvent[] = [];
  let stats: { home: SideStats; away: SideStats };
  let runtimes: Record<TeamSide, SideRuntime>;
  let homeScore: number;
  let awayScore: number;
  let eventMinutesCounted: number;
  let eventMinutesFavoringHome: number;

  if (init.kind === 'fresh') {
    seed = init.seed;
    context = init.context;
    streams = initializeMatchRngStreams(seed);
    weather = rollWeather(streams.weather);
    refereeProfile = rollRefereeProfile(streams.events);
    events.push(createKickoffEvent('Bola rolando!'));
    stats = { home: emptySideStats(), away: emptySideStats() };
    const isNeutralVenueInit = context.isNeutralVenue ?? false;
    runtimes = {
      home: {
        side: 'home',
        snapshot: init.home,
        fieldPlayers: buildInitialFieldPlayers(init.home),
        benchRemaining: [...init.home.bench],
        substitutionsUsed: 0,
        substitutionWindowsUsed: 0,
        morale: isNeutralVenueInit ? 0 : HOME_ADVANTAGE_MORALE_BONUS,
      },
      away: {
        side: 'away',
        snapshot: init.away,
        fieldPlayers: buildInitialFieldPlayers(init.away),
        benchRemaining: [...init.away.bench],
        substitutionsUsed: 0,
        substitutionWindowsUsed: 0,
        morale: 0,
      },
    };
    homeScore = 0;
    awayScore = 0;
    eventMinutesCounted = 0;
    eventMinutesFavoringHome = 0;
  } else {
    const s = init.state;
    seed = s.seed;
    context = s.context;
    streams = {
      events: restoreRNG(s.rngState.events),
      weather: restoreRNG(s.rngState.weather),
      cards: restoreRNG(s.rngState.cards),
      injuries: restoreRNG(s.rngState.injuries),
      narrative: restoreRNG(s.rngState.narrative),
      penaltyTiebreak: restoreRNG(s.rngState.penaltyTiebreak),
    };
    weather = s.weather;
    refereeProfile = s.refereeProfile;
    events.push(...s.events);
    stats = { home: s.stats.home, away: s.stats.away };
    runtimes = {
      home: deserializeSide('home', s.home),
      away: deserializeSide('away', s.away),
    };
    homeScore = s.homeScore;
    awayScore = s.awayScore;
    eventMinutesCounted = s.eventMinutesCounted;
    eventMinutesFavoringHome = s.eventMinutesFavoringHome;
  }

  const isNeutralVenue = context.isNeutralVenue ?? false;

  function opposite(side: TeamSide): TeamSide {
    return side === 'home' ? 'away' : 'home';
  }

  function currentChemistry(side: TeamSide): {
    chemistry: number;
    isCompleteHistoricalSquad: boolean;
  } {
    const runtime = runtimes[side];
    const slots = toChemistrySquadSlots(runtime.fieldPlayers);
    // Filter out pairs that reference slots no longer on the field (e.g. after a red card)
    const activeSlotIds = new Set(slots.map((s) => s.slotId));
    const pairs = runtime.snapshot.adjacentPairs.filter(
      (p) => activeSlotIds.has(p.slotIdA) && activeSlotIds.has(p.slotIdB),
    );
    return calculateChemistry(slots, pairs);
  }

  function currentTeamPower(side: TeamSide, minute: number): number {
    const runtime = runtimes[side];
    const { chemistry, isCompleteHistoricalSquad } = currentChemistry(side);
    const averageFatigue = calculateAverageFatigue(
      runtime.fieldPlayers,
      minute,
      runtime.snapshot.tacticalIntensity,
      weather,
    );
    const base = calculateTeamPower({
      starters: toStartingSlots(runtime.fieldPlayers),
      tacticalIntensity: runtime.snapshot.tacticalIntensity,
      chemistry,
      isCompleteHistoricalSquad,
      moraleMinus100To100: runtime.morale,
      isHomeTeam: side === 'home',
      isNeutralVenue,
      averageFatiguePoints: averageFatigue,
    });
    // Sprint 26: dificuldade de IA — ajuste percentual de comportamento,
    // independente do OVR base do time (ver AiDifficultyModifier).
    if (side === 'away' && context.awayAiDifficulty) {
      const modifier = 1 + context.awayAiDifficulty.powerModifierPercent / 100;
      return Math.min(99, Math.max(1, base * modifier));
    }
    return base;
  }

  function sectorStrengthOf(side: TeamSide, sector: 'attack' | 'defense', minute: number): number {
    const runtime = runtimes[side];
    const inSector = runtime.fieldPlayers.filter(
      (fp) => SECTOR_BY_POSITION[fp.formationPosition] === sector,
    );
    if (inSector.length === 0) return 50;
    const total = inSector.reduce((sum, fp) => {
      const effective = applyFatigueToAttribute(
        calculateOverall(fp.player.attributes, fp.formationPosition),
        calculateIntraMatchFatigue({
          minute: minute - fp.enteredAtMinute,
          staminaAttribute: fp.player.attributes.stamina,
          tacticalIntensity: runtime.snapshot.tacticalIntensity,
        }) * calculateWeatherFatigueMultiplier(weather, minute - fp.enteredAtMinute),
      );
      return sum + effective;
    }, 0);
    return total / inSector.length;
  }

  function findGoalkeeperDefenseAttributes(side: TeamSide): {
    gk_reflexes: number;
    gk_penalty_save: number;
  } {
    const runtime = runtimes[side];
    const gk = runtime.fieldPlayers.find((fp) => fp.formationPosition === 'GK');
    if (gk === undefined) {
      return {
        gk_reflexes: MAKESHIFT_GOALKEEPER_QUALITY,
        gk_penalty_save: MAKESHIFT_GOALKEEPER_QUALITY,
      };
    }
    return {
      gk_reflexes: gk.player.attributes.gk_reflexes,
      gk_penalty_save: gk.player.attributes.gk_penalty_save,
    };
  }

  function fieldCount(side: TeamSide): number {
    return runtimes[side].fieldPlayers.length;
  }

  function removeFromField(side: TeamSide, userCardId: string): void {
    const runtime = runtimes[side];
    runtime.fieldPlayers = runtime.fieldPlayers.filter((fp) => fp.player.userCardId !== userCardId);
  }

  function tryForcedSubstitution(
    side: TeamSide,
    outgoingUserCardId: string,
    minute: number,
    reason: 'injury' | 'fatigue',
  ): void {
    const runtime = runtimes[side];
    if (runtime.substitutionsUsed >= MAX_SUBSTITUTIONS) return;
    const outgoing = runtime.fieldPlayers.find((fp) => fp.player.userCardId === outgoingUserCardId);
    if (outgoing === undefined) return;
    const replacement = selectForcedReplacement(runtime.benchRemaining, outgoing.formationPosition);
    if (replacement === null) return;

    runtime.fieldPlayers = runtime.fieldPlayers.map((fp) =>
      fp.player.userCardId === outgoingUserCardId
        ? {
            slotId: fp.slotId,
            formationPosition: fp.formationPosition,
            player: replacement,
            enteredAtMinute: minute,
            hasYellowCard: false,
            foulsThisMatch: 0,
          }
        : fp,
    );
    runtime.benchRemaining = runtime.benchRemaining.filter(
      (p) => p.userCardId !== replacement.userCardId,
    );
    runtime.substitutionsUsed += 1;
    if (reason === 'fatigue') runtime.substitutionWindowsUsed += 1;

    const result = createSubstitutionEvent({
      minute,
      teamSide: side,
      playerOutUserCardId: outgoingUserCardId,
      playerInUserCardId: replacement.userCardId,
      reason,
      description: `${minute}' Substituição (${reason === 'injury' ? 'lesão' : 'fadiga'}).`,
    });
    if (result.ok) events.push(result.value);
  }

  function resolveInjuryCheck(side: TeamSide, victim: FieldPlayerState, minute: number): boolean {
    const ironMan = victim.player.traits.find((t) => t.trait === 'Iron Man');
    const weatherBonus = calculateWeatherInjuryChanceBonus(weather);
    const baseChance = applyIronManRiskReduction(INJURY_CHANCE_FOUL_VICTIM + weatherBonus, ironMan);
    if (!shouldInjuryOccur(baseChance, streams.injuries)) return false;

    const severity = rollInjurySeverity(streams.injuries);
    const fastRecovery = victim.player.traits.find((t) => t.trait === 'Fast Recovery');
    const recoveryDays = sampleRecoveryDays({
      severity,
      physicalAttribute: victim.player.attributes.physical,
      rng: streams.injuries,
      ...(fastRecovery !== undefined ? { fastRecovery } : {}),
    });
    const result = createInjuryEvent({
      minute,
      teamSide: side,
      playerUserCardId: victim.player.userCardId,
      severity,
      recoveryDays,
      description: `${minute}' Lesão (${severity}), ${Math.round(recoveryDays)} dias previstos de recuperação.`,
    });
    if (result.ok) events.push(result.value);
    removeFromField(side, victim.player.userCardId);
    tryForcedSubstitution(side, victim.player.userCardId, minute, 'injury');
    return true;
  }

  function applyMoraleOnGoal(
    scoringSide: TeamSide,
    minute: number,
    scoringScoreBefore: number,
    concedingScoreBefore: number,
  ): void {
    const concedingSide = opposite(scoringSide);
    if (minute <= 10) {
      runtimes[concedingSide].morale = Math.max(-100, runtimes[concedingSide].morale - 4);
    }
    const wasBehind = scoringScoreBefore < concedingScoreBefore;
    const nowTiedOrAhead = scoringScoreBefore + 1 >= concedingScoreBefore;
    if (wasBehind && nowTiedOrAhead) {
      runtimes[scoringSide].morale = Math.min(100, runtimes[scoringSide].morale + 8);
    }
  }

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: chance resolution requires evaluating multiple outcome branches
  function resolveChanceEvent(favoredSide: TeamSide, minute: number): void {
    const defendingSide = opposite(favoredSide);
    const shooterSlot = selectShooter(
      toStartingSlots(runtimes[favoredSide].fieldPlayers),
      streams.events,
    );
    const matador = shooterSlot.player.traits.find((t) => t.trait === 'Matador');

    const attackStrength = sectorStrengthOf(favoredSide, 'attack', minute);
    const defenseStrength = sectorStrengthOf(defendingSide, 'defense', minute);
    const defendingGk = findGoalkeeperDefenseAttributes(defendingSide);

    const xg = calculateGoalProbability({
      shooterAttributes: shooterSlot.player.attributes,
      goalkeeperGkReflexes: defendingGk.gk_reflexes,
      defendingSectorStrength: defenseStrength,
      attackingSectorStrength: attackStrength,
      weather,
      ...(matador !== undefined ? { matadorBonusPercent: matador.areaConversionBonusPercent } : {}),
    });

    stats[favoredSide] = {
      ...stats[favoredSide],
      shots: stats[favoredSide].shots + 1,
      xg: stats[favoredSide].xg + xg,
    };

    const scored = streams.events.nextFloat() < xg;
    if (scored) {
      stats[favoredSide] = {
        ...stats[favoredSide],
        shotsOnTarget: stats[favoredSide].shotsOnTarget + 1,
      };
      const scoreBefore = favoredSide === 'home' ? homeScore : awayScore;
      const concedingBefore = favoredSide === 'home' ? awayScore : homeScore;

      const assister = selectAssister(
        toStartingSlots(runtimes[favoredSide].fieldPlayers),
        shooterSlot.player.userCardId,
        streams.events,
      );
      const goalResult = createGoalEvent({
        minute,
        teamSide: favoredSide,
        scorerUserCardId: shooterSlot.player.userCardId,
        ...(assister !== null ? { assisterUserCardId: assister.userCardId } : {}),
        description: `${minute}' GOOOL!`,
      });
      if (goalResult.ok) events.push(goalResult.value);
      if (assister !== null) {
        const assistResult = createAssistEvent({
          minute,
          teamSide: favoredSide,
          assisterUserCardId: assister.userCardId,
          scorerUserCardId: shooterSlot.player.userCardId,
          description: `${minute}' Bela assistência!`,
        });
        if (assistResult.ok) events.push(assistResult.value);
      }

      if (favoredSide === 'home') homeScore += 1;
      else awayScore += 1;
      applyMoraleOnGoal(favoredSide, minute, scoreBefore, concedingBefore);
    } else if (streams.events.nextFloat() < ON_TARGET_PROBABILITY_GIVEN_MISS) {
      stats[favoredSide] = {
        ...stats[favoredSide],
        shotsOnTarget: stats[favoredSide].shotsOnTarget + 1,
      };
    }
  }

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: foul resolution requires evaluating card/penalty/freekick branches
  function resolveFoulEvent(favoredSide: TeamSide, minute: number): void {
    const foulingSide = opposite(favoredSide);
    const runtime = runtimes[foulingSide];
    if (runtime.fieldPlayers.length === 0) return;

    const weighted: WeightedItem<FieldPlayerState>[] = runtime.fieldPlayers.map((fp) => ({
      value: fp,
      weight: Math.max(1, fp.player.attributes.aggression),
    }));
    const fouler = streams.events.weightedChoice(weighted);
    fouler.foulsThisMatch += 1;
    stats[foulingSide] = { ...stats[foulingSide], fouls: stats[foulingSide].fouls + 1 };

    const cardLeniency =
      foulingSide === 'home' && !isNeutralVenue
        ? 1 - HOME_ADVANTAGE_CARD_LENIENCY_PERCENT / 100
        : 1.0;
    const outcome = resolveFoulCardOutcome({
      aggressionAttribute: fouler.player.attributes.aggression,
      refereeProfile,
      alreadyHasYellowThisMatch: fouler.hasYellowCard,
      foulsAccumulatedThisMatch: fouler.foulsThisMatch,
      cardLeniencyMultiplier: cardLeniency,
      rng: streams.cards,
    });

    if (outcome === 'yellow') {
      fouler.hasYellowCard = true;
      stats[foulingSide] = {
        ...stats[foulingSide],
        yellowCards: stats[foulingSide].yellowCards + 1,
      };
      const result = createCardEvent({
        minute,
        teamSide: foulingSide,
        playerUserCardId: fouler.player.userCardId,
        cardType: 'yellow',
        description: `${minute}' Cartão amarelo.`,
      });
      if (result.ok) events.push(result.value);
    } else if (outcome === 'red_direct' || outcome === 'red_second_yellow') {
      stats[foulingSide] = { ...stats[foulingSide], redCards: stats[foulingSide].redCards + 1 };
      const result = createCardEvent({
        minute,
        teamSide: foulingSide,
        playerUserCardId: fouler.player.userCardId,
        cardType: 'red',
        redCardReason: outcome === 'red_direct' ? 'direct' : 'second_yellow',
        description: `${minute}' Cartão vermelho!`,
      });
      if (result.ok) events.push(result.value);
      removeFromField(foulingSide, fouler.player.userCardId); // doc 09 §13: vermelho NÃO gera substituição
    }

    selectFoulVictimAndCheckInjury(favoredSide, minute);
  }

  /** doc 09 §12: a chance de lesão (`INJURY_CHANCE_FOUL_VICTIM`) é da VÍTIMA da falta, não de quem a comete. */
  function selectFoulVictimAndCheckInjury(favoredSide: TeamSide, minute: number): void {
    const victims = runtimes[favoredSide].fieldPlayers;
    if (victims.length === 0) return;
    const victim = streams.events.choice(victims);
    resolveInjuryCheck(favoredSide, victim, minute);
  }

  function resolveCornerEvent(favoredSide: TeamSide): void {
    stats[favoredSide] = { ...stats[favoredSide], corners: stats[favoredSide].corners + 1 };
  }

  function evaluateCriticalFatigueSubstitutions(minute: number): void {
    for (const side of ['home', 'away'] as const) {
      const runtime = runtimes[side];
      if (runtime.substitutionsUsed >= MAX_SUBSTITUTIONS) continue;
      if (
        runtime.substitutionWindowsUsed >=
        MAX_SUBSTITUTION_WINDOWS + (minute > 90 ? EXTRA_TIME_SUBSTITUTION_WINDOWS : 0)
      )
        continue;
      const fatigued = runtime.fieldPlayers.find((fp) => {
        const minutesOnField = minute - fp.enteredAtMinute;
        const fatigue =
          calculateIntraMatchFatigue({
            minute: minutesOnField,
            staminaAttribute: fp.player.attributes.stamina,
            tacticalIntensity: runtime.snapshot.tacticalIntensity,
          }) * calculateWeatherFatigueMultiplier(weather, minutesOnField);
        return isCriticallyFatigued(fatigue);
      });
      if (fatigued !== undefined) {
        tryForcedSubstitution(side, fatigued.player.userCardId, minute, 'fatigue');
      }
    }
  }

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: per-minute simulation dispatches multiple event types
  function runMinute(minute: number): 'walkover' | 'continue' {
    const walkoverCheck = shouldDeclareWalkover(fieldCount('home'), fieldCount('away'));
    if (walkoverCheck.triggered && walkoverCheck.affectedSide !== undefined) {
      const affectedSide = walkoverCheck.affectedSide;
      const result = createWalkoverEvent({
        minute,
        affectedTeamSide: affectedSide,
        remainingPlayers: fieldCount(affectedSide),
        description: `${minute}' Partida interrompida por insuficiência de elenco.`,
      });
      if (result.ok) events.push(result.value);
      return 'walkover';
    }

    if (streams.events.nextFloat() < EVENT_CHANCE_PER_MINUTE) {
      const homePower = currentTeamPower('home', minute);
      const awayPower = currentTeamPower('away', minute);
      const favoredSide = weightedSideChoice(homePower, awayPower, streams.events);
      eventMinutesCounted += 1;
      if (favoredSide === 'home') eventMinutesFavoringHome += 1;

      const eventType = streams.events.weightedChoice(EVENT_TYPE_WEIGHTS);
      if (eventType === 'chance') resolveChanceEvent(favoredSide, minute);
      else if (eventType === 'foul') resolveFoulEvent(favoredSide, minute);
      else if (eventType === 'corner') resolveCornerEvent(favoredSide);
      // 'dispute': doc 09 §16 — "só estatística, sem finalização"; nenhuma estatística específica documentada além da que já é contada via posse.
    }

    evaluateCriticalFatigueSubstitutions(minute);
    return 'continue';
  }

  function runMinuteRange(fromMinute: number, toMinute: number): 'walkover' | 'completed' {
    for (let minute = fromMinute; minute <= toMinute; minute += 1) {
      if (runMinute(minute) === 'walkover') return 'walkover';
    }
    return 'completed';
  }

  function walkoverAffectedSide(): TeamSide {
    return fieldCount('home') < MINIMUM_PLAYERS_ON_FIELD ? 'home' : 'away';
  }

  function buildWalkoverResult(): MatchResult {
    const affectedSide = walkoverAffectedSide();
    // biome-ignore lint/style/noNonNullAssertion: events is non-empty (at least kickoff pushed)
    const lastEvent = events[events.length - 1]!;
    return {
      homeScore,
      awayScore,
      events,
      stats,
      mvpUserCardId: calculateMvp(events),
      weather,
      refereeProfile,
      walkover: {
        affectedTeamSide: affectedSide,
        minute: lastEvent.minute,
        remainingPlayers: Math.min(fieldCount('home'), fieldCount('away')),
      },
      seed,
      engineVersion: ENGINE_VERSION,
    };
  }

  function finalizePossession(): void {
    if (eventMinutesCounted > 0) {
      const homePossession = (eventMinutesFavoringHome / eventMinutesCounted) * 100;
      stats.home = { ...stats.home, possessionPercent: homePossession };
      stats.away = { ...stats.away, possessionPercent: 100 - homePossession };
    }
  }

  /** Roda 91→120 (prorrogação, se aplicável) + pênaltis, e monta o `MatchResult` final. */
  function finalizeFullTime(): MatchResult {
    events.push(createFullTimeEvent(90, 'Fim de jogo (90 minutos).'));

    let penaltyShootout: MatchResult['penaltyShootout'];
    if (homeScore === awayScore && context.requiresWinner) {
      if (runMinuteRange(91, 120) === 'walkover') {
        return buildWalkoverResult();
      }
      events.push(createFullTimeEvent(120, 'Fim da prorrogação.'));

      if (homeScore === awayScore) {
        const shootout = simulatePenaltyShootout({
          home: { starters: toStartingSlots(runtimes.home.fieldPlayers) },
          away: { starters: toStartingSlots(runtimes.away.fieldPlayers) },
          eventsRng: streams.events,
          penaltyTiebreakRng: streams.penaltyTiebreak,
        });
        penaltyShootout = {
          homeScore: shootout.homeScore,
          awayScore: shootout.awayScore,
          totalRounds: shootout.totalRounds,
          resolvedBySeedTiebreak: shootout.resolvedBySeedTiebreak,
        };
      }
    }

    finalizePossession();

    return {
      homeScore,
      awayScore,
      events,
      stats,
      mvpUserCardId: calculateMvp(events),
      weather,
      refereeProfile,
      ...(penaltyShootout !== undefined ? { penaltyShootout } : {}),
      seed,
      engineVersion: ENGINE_VERSION,
    };
  }

  function snapshot(nextMinute: number): MatchProgressState {
    const rngState: SerializedRngState = {
      events: streams.events.getState(),
      weather: streams.weather.getState(),
      cards: streams.cards.getState(),
      injuries: streams.injuries.getState(),
      narrative: streams.narrative.getState(),
      penaltyTiebreak: streams.penaltyTiebreak.getState(),
    };
    return {
      nextMinute,
      homeScore,
      awayScore,
      stats,
      events,
      weather,
      refereeProfile,
      eventMinutesCounted,
      eventMinutesFavoringHome,
      home: serializeSide(runtimes.home),
      away: serializeSide(runtimes.away),
      rngState,
      seed,
      context,
      engineVersion: ENGINE_VERSION,
    };
  }

  /**
   * Substituição MANUAL/tática (Sprint 26) — o usuário escolhe o reserva
   * que entra (diferente de `tryForcedSubstitution`, que escolhe
   * automaticamente por lesão/fadiga). Compartilha o MESMO limite de 5
   * (`MAX_SUBSTITUTIONS`) e a mesma contagem — regra real de futebol:
   * substituições táticas e forçadas saem do mesmo total.
   */
  function applyManualSubstitution(
    side: TeamSide,
    outgoingUserCardId: string,
    incomingUserCardId: string,
    minute: number,
  ): { ok: true } | { ok: false; error: string } {
    const runtime = runtimes[side];
    if (runtime.substitutionsUsed >= MAX_SUBSTITUTIONS) {
      return { ok: false, error: 'Limite de 5 substituições já atingido.' };
    }
    const outgoing = runtime.fieldPlayers.find((fp) => fp.player.userCardId === outgoingUserCardId);
    if (outgoing === undefined) {
      return { ok: false, error: 'Jogador titular não encontrado em campo.' };
    }
    const replacement = runtime.benchRemaining.find((p) => p.userCardId === incomingUserCardId);
    if (replacement === undefined) {
      return { ok: false, error: 'Reserva não encontrado no banco.' };
    }

    runtime.fieldPlayers = runtime.fieldPlayers.map((fp) =>
      fp.player.userCardId === outgoingUserCardId
        ? {
            slotId: fp.slotId,
            formationPosition: fp.formationPosition,
            player: replacement,
            enteredAtMinute: minute,
            hasYellowCard: false,
            foulsThisMatch: 0,
          }
        : fp,
    );
    runtime.benchRemaining = runtime.benchRemaining.filter(
      (p) => p.userCardId !== replacement.userCardId,
    );
    runtime.substitutionsUsed += 1;

    const result = createSubstitutionEvent({
      minute,
      teamSide: side,
      playerOutUserCardId: outgoingUserCardId,
      playerInUserCardId: replacement.userCardId,
      reason: 'tactical',
      description: `${minute}' Substituição tática.`,
    });
    if (result.ok) events.push(result.value);
    return { ok: true };
  }

  /** Troca a mentalidade tática de um lado a partir de agora — Sprint 26. */
  function setTacticalIntensity(side: TeamSide, intensity: TacticalIntensity): void {
    runtimes[side].snapshot = { ...runtimes[side].snapshot, tacticalIntensity: intensity };
  }

  return {
    runMinuteRange,
    buildWalkoverResult,
    finalizeFullTime,
    snapshot,
    applyManualSubstitution,
    setTacticalIntensity,
    pushHalfTimeEvent(minute: number): void {
      events.push(createHalfTimeEvent(minute, 'Fim do primeiro tempo.'));
    },
    getBenchRemaining(side: TeamSide): readonly MatchPlayer[] {
      return runtimes[side].benchRemaining;
    },
    getFieldPlayers(side: TeamSide): readonly FieldPlayerState[] {
      return runtimes[side].fieldPlayers;
    },
    getSubstitutionsUsed(side: TeamSide): number {
      return runtimes[side].substitutionsUsed;
    },
    getScore(): { home: number; away: number } {
      return { home: homeScore, away: awayScore };
    },
    getStats(): { home: SideStats; away: SideStats } {
      return stats;
    },
  };
}

// ─── API pública ────────────────────────────────────────────────────────────

/**
 * Função principal. Lança erro só em entradas estruturalmente
 * inválidas (ex: sem goleiro) — nunca em "resultado esportivo
 * indesejado" (gol, lesão, etc., que são resultados válidos do sorteio).
 */
export function simulateMatch(input: {
  home: TeamSnapshot;
  away: TeamSnapshot;
  context: MatchContext;
  seed: Seed;
}): MatchResult {
  const runtime = createRuntime({
    kind: 'fresh',
    home: input.home,
    away: input.away,
    context: input.context,
    seed: input.seed,
  });
  if (runtime.runMinuteRange(1, 45) === 'walkover') return runtime.buildWalkoverResult();
  runtime.pushHalfTimeEvent(46);
  if (runtime.runMinuteRange(46, 90) === 'walkover') return runtime.buildWalkoverResult();
  return runtime.finalizeFullTime();
}

/**
 * Simula só o primeiro tempo (1-45) — Sprint 26 (Gameplay Foundation).
 * Se W.O. for declarado antes do intervalo, já retorna o `MatchResult`
 * final (`kind: 'walkover'`); caso contrário retorna um
 * `MatchProgressState` 100% serializável, pronto para (a) exibir no
 * intervalo (placar parcial, estatísticas, banco disponível) e (b)
 * viajar por um round-trip stateless até `simulateRestOfMatch`.
 */
export function simulateFirstHalf(input: {
  home: TeamSnapshot;
  away: TeamSnapshot;
  context: MatchContext;
  seed: Seed;
}): FirstHalfOutcome {
  const runtime = createRuntime({
    kind: 'fresh',
    home: input.home,
    away: input.away,
    context: input.context,
    seed: input.seed,
  });
  if (runtime.runMinuteRange(1, 45) === 'walkover') {
    return { kind: 'walkover', result: runtime.buildWalkoverResult() };
  }
  runtime.pushHalfTimeEvent(46);
  return { kind: 'halftime', state: runtime.snapshot(46) };
}

/**
 * Retoma de um `MatchProgressState` (produzido por `simulateFirstHalf`,
 * opcionalmente já alterado por `applyManualSubstitution`/
 * `applyTacticalIntensity`) e simula até o fim — segundo tempo,
 * prorrogação e pênaltis se necessário. Sprint 26.
 */
export function simulateRestOfMatch(state: MatchProgressState): MatchResult {
  const runtime = createRuntime({ kind: 'resume', state });
  if (runtime.runMinuteRange(state.nextMinute, 90) === 'walkover') {
    return runtime.buildWalkoverResult();
  }
  return runtime.finalizeFullTime();
}

/**
 * Aplica uma substituição tática decidida pelo usuário/IA no intervalo,
 * retornando um NOVO `MatchProgressState` (a função é pura — não muta
 * `state`). Sprint 26.
 */
export function applyManualSubstitution(
  state: MatchProgressState,
  side: TeamSide,
  outgoingUserCardId: string,
  incomingUserCardId: string,
): { ok: true; state: MatchProgressState } | { ok: false; error: string } {
  const runtime = createRuntime({ kind: 'resume', state });
  const result = runtime.applyManualSubstitution(
    side,
    outgoingUserCardId,
    incomingUserCardId,
    state.nextMinute,
  );
  if (!result.ok) return result;
  return { ok: true, state: runtime.snapshot(state.nextMinute) };
}

/**
 * Aplica uma nova mentalidade tática a um lado a partir do próximo
 * minuto, retornando um NOVO `MatchProgressState` (pura). Sprint 26.
 */
export function applyTacticalIntensity(
  state: MatchProgressState,
  side: TeamSide,
  intensity: TacticalIntensity,
): MatchProgressState {
  const runtime = createRuntime({ kind: 'resume', state });
  runtime.setTacticalIntensity(side, intensity);
  return runtime.snapshot(state.nextMinute);
}
