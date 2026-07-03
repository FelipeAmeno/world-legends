/**
 * Gerenciamento da Season (T040).
 *
 *   createSeason()        Cria uma temporada com 8 times e 20 rodadas geradas.
 *   recordRoundResult()   Registra o resultado do usuário na rodada atual.
 *   advanceRound()        Simula IA e avança para a próxima rodada.
 *   simulateFullSeason()  Simula toda a temporada automaticamente (sem input do usuário).
 *   isSeasonComplete()    true após 20 rodadas.
 */
import { Err, Ok, type Result, validationError } from '@world-legends/shared';
import { generateFixtures } from '../fixtures/fixtures';
import { simulateAIMatch, simulateRoundAI } from '../simulation/simulation';
import type { Round, Season, SeasonError, SeasonMatch, SeasonTeam } from '../types/types';
import { TEAMS_PER_SEASON, TOTAL_ROUNDS } from '../types/types';

// ─── Times da IA ─────────────────────────────────────────────────────────────

const AI_TEAMS: readonly Omit<SeasonTeam, 'teamId'>[] = [
  { teamName: 'Flamengo Lendas', isUser: false, strength: 92 },
  { teamName: 'Santos Glória', isUser: false, strength: 88 },
  { teamName: 'Palmeiras Elite', isUser: false, strength: 86 },
  { teamName: 'Grêmio Histórico', isUser: false, strength: 84 },
  { teamName: 'São Paulo Clássico', isUser: false, strength: 82 },
  { teamName: 'Corinthians Força', isUser: false, strength: 80 },
  { teamName: 'Botafogo Stars', isUser: false, strength: 78 },
];

// ─── createSeason ─────────────────────────────────────────────────────────────

export type CreateSeasonInput = Readonly<{
  readonly userId: string;
  readonly userTeamName: string;
  readonly userStrength?: number;
  readonly generateId?: () => string;
}>;

let _seq = 0;

export function createSeason(input: CreateSeasonInput): Result<Season, SeasonError> {
  if (!input.userId.trim()) {
    return Err(validationError('userId não pode ser vazio', 'userId'));
  }
  if (!input.userTeamName.trim()) {
    return Err(validationError('userTeamName não pode ser vazio', 'userTeamName'));
  }

  const seasonId = (input.generateId ?? (() => `season-${++_seq}`))();
  const userTeamId = `user-team-${input.userId}`;
  const userStrength = Math.max(60, Math.min(99, input.userStrength ?? 82));

  const teams: SeasonTeam[] = [
    Object.freeze({
      teamId: userTeamId,
      teamName: input.userTeamName.trim(),
      isUser: true,
      strength: userStrength,
    }),
    ...AI_TEAMS.map((t, i) => Object.freeze({ teamId: `ai-${i}`, ...t })),
  ];

  const rounds = generateFixtures(teams);

  return Ok(
    Object.freeze({
      seasonId,
      userId: input.userId,
      userTeamId,
      teams: Object.freeze(teams),
      rounds,
      status: 'scheduled',
      currentRound: 1,
    }),
  );
}

// ─── recordRoundResult ────────────────────────────────────────────────────────

/**
 * Registra o placar da partida do usuário na rodada atual.
 * Não avança a rodada — chame advanceRound() depois.
 */
export function recordRoundResult(
  season: Season,
  homeScore: number,
  awayScore: number,
): Result<Season, SeasonError> {
  if (season.status === 'completed') {
    return Err({ kind: 'SeasonAlreadyComplete' } as const);
  }
  if (
    !Number.isInteger(homeScore) ||
    homeScore < 0 ||
    !Number.isInteger(awayScore) ||
    awayScore < 0
  ) {
    return Err({ kind: 'InvalidScore', homeScore, awayScore } as const);
  }

  const roundIdx = season.currentRound - 1;
  const round = season.rounds[roundIdx];
  if (!round) {
    return Err({ kind: 'RoundNotFound', roundNumber: season.currentRound } as const);
  }
  if (round.completed) {
    return Err({ kind: 'RoundAlreadyCompleted', roundNumber: season.currentRound } as const);
  }

  // Encontrar a partida do usuário
  const matchIdx = round.matches.findIndex(
    (m) => m.homeTeamId === season.userTeamId || m.awayTeamId === season.userTeamId,
  );
  if (matchIdx === -1) {
    return Err({ kind: 'RoundNotFound', roundNumber: season.currentRound } as const);
  }

  const updatedMatch: SeasonMatch = Object.freeze({
    // biome-ignore lint/style/noNonNullAssertion: matchIdx is validated via findIndex above (>= 0)
    ...round.matches[matchIdx]!,
    homeScore,
    awayScore,
    status: 'played',
  });

  const updatedMatches = round.matches.map((m, i) => (i === matchIdx ? updatedMatch : m));
  const updatedRound: Round = Object.freeze({
    ...round,
    matches: Object.freeze(updatedMatches),
  });

  const updatedRounds = season.rounds.map((r, i) => (i === roundIdx ? updatedRound : r));

  return Ok(
    Object.freeze({
      ...season,
      status: 'in_progress',
      rounds: Object.freeze(updatedRounds),
    }),
  );
}

// ─── advanceRound ────────────────────────────────────────────────────────────

/**
 * Simula partidas de IA da rodada atual e avança para a próxima.
 * Deve ser chamado APÓS recordRoundResult().
 */
export function advanceRound(season: Season, seed: number): Result<Season, SeasonError> {
  if (season.status === 'completed') {
    return Err({ kind: 'SeasonAlreadyComplete' } as const);
  }

  const roundIdx = season.currentRound - 1;
  const round = season.rounds[roundIdx];
  if (!round) {
    return Err({ kind: 'RoundNotFound', roundNumber: season.currentRound } as const);
  }

  // Mapa de força dos times
  const teamMap = new Map<string, number>(season.teams.map((t) => [t.teamId, t.strength]));

  // Simular partidas de IA
  const simulatedMatches = simulateRoundAI(round.matches, teamMap, season.userTeamId, seed);

  const updatedRound: Round = Object.freeze({
    ...round,
    matches: simulatedMatches,
    completed: true,
  });

  const updatedRounds = season.rounds.map((r, i) => (i === roundIdx ? updatedRound : r));
  const nextRound = season.currentRound + 1;
  const isComplete = nextRound > TOTAL_ROUNDS;

  return Ok(
    Object.freeze({
      ...season,
      rounds: Object.freeze(updatedRounds),
      currentRound: nextRound,
      status: isComplete ? 'completed' : 'in_progress',
    }),
  );
}

// ─── simulateFullSeason ───────────────────────────────────────────────────────

/**
 * Simula uma temporada completa automaticamente.
 * O time do usuário também é simulado como IA (força = userStrength).
 * Útil para testes, demo e simulação offline.
 *
 * @param season  Season inicial (status = 'scheduled').
 * @param baseSeed  Semente base para determinismo.
 */
export function simulateFullSeason(season: Season, baseSeed: number): Season {
  const teamMap = new Map<string, number>(season.teams.map((t) => [t.teamId, t.strength]));

  let current = { ...season, status: 'in_progress' as const };

  for (let r = 0; r < TOTAL_ROUNDS; r++) {
    // biome-ignore lint/style/noNonNullAssertion: r < TOTAL_ROUNDS guarantees current.rounds[r] exists
    const round = current.rounds[r]!;
    const roundSeed = baseSeed ^ (r * 0x9e3779b9);

    // Simular TODAS as partidas (incluindo a do usuário)
    const simMatches = round.matches.map((match, idx) => {
      const homeStr = teamMap.get(match.homeTeamId) ?? 75;
      const awayStr = teamMap.get(match.awayTeamId) ?? 75;
      const matchSeed = roundSeed ^ (idx * 0x11235813);
      const { homeScore, awayScore } = simulateAIMatch(homeStr, awayStr, matchSeed);
      return Object.freeze({ ...match, homeScore, awayScore, status: 'played' as const });
    });

    const updatedRound: Round = Object.freeze({
      ...round,
      matches: Object.freeze(simMatches),
      completed: true,
    });

    const updatedRounds = current.rounds.map((rd, i) => (i === r ? updatedRound : rd));
    const nextRound = r + 2; // próxima rodada (1-indexed)
    const isComplete = nextRound > TOTAL_ROUNDS;

    current = Object.freeze({
      ...current,
      rounds: Object.freeze(updatedRounds),
      currentRound: nextRound,
      status: isComplete ? 'completed' : 'in_progress',
    }) as typeof current;
  }

  return current as Season;
}

// ─── isSeasonComplete ────────────────────────────────────────────────────────

export function isSeasonComplete(season: Season): boolean {
  return season.status === 'completed';
}
