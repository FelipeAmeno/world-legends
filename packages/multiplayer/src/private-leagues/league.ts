/**
 * Liga privada entre amigos — Aggregate Root `League` (doc 17 §15, doc 06 §2).
 *
 * Implementa:
 *   createLeague()       — cria liga com código de convite único
 *   joinLeague()         — adiciona membro via código ou convite direto
 *   scheduleRoundRobin() — gera calendário todos-contra-todos (doc 06 §2.3)
 *   generateStandings()  — tabela de classificação com os 5 critérios
 *   calculatePoints()    — pontuação de um membro (3/1/0)
 *
 * INVARIANTES (doc 17 §15):
 * - Número de LeagueMember nunca excede max_members.
 * - Só o owner pode iniciar o draft / avançar o status.
 * - Rounds só são gerados quando status = 'pending' e há membros suficientes.
 *
 * Funções puras: sem efeito colateral. Retornam novos objetos imutáveis.
 */
import { Err, Ok, type Result, validationError } from '@world-legends/shared';
import {
  type League,
  type LeagueFormat,
  type LeagueMatch,
  type LeagueMember,
  type LeagueRound,
  type LeagueStatus,
  type MatchResult,
  type MultiplayerError,
  type Standings,
  type StandingsRow,
  inviteCode,
  leagueId,
  matchSlotId,
  memberId,
  roundId,
} from '../types/types';

// ─── Pontuação (T018 §critérios) ──────────────────────────────────────────────

export const POINTS_WIN = 3;
export const POINTS_DRAW = 1;
export const POINTS_LOSS = 0;
export const MIN_MEMBERS_ROUND_ROBIN = 2;

// ─── createLeague ─────────────────────────────────────────────────────────────

export type CreateLeagueInput = Readonly<{
  id: string;
  name: string;
  ownerId: string;
  format: LeagueFormat;
  maxMembers: number;
  homeAndAway?: boolean;
}>;

export function createLeague(
  input: CreateLeagueInput,
): Result<League, MultiplayerError | ReturnType<typeof validationError>> {
  if (!input.name.trim()) {
    return Err(validationError('name não pode ser vazio', 'name'));
  }
  if (input.maxMembers < 2 || input.maxMembers > 20) {
    return Err(validationError('maxMembers deve ser entre 2 e 20', 'maxMembers'));
  }
  if (!['round_robin', 'knockout', 'groups_knockout'].includes(input.format)) {
    return Err(Object.freeze({ kind: 'InvalidFormat' as const, format: input.format }));
  }

  const ownerAsMember: LeagueMember = Object.freeze({
    id: memberId(`${input.id}-owner`),
    profileId: input.ownerId,
    squadId: null,
    joinedAt: new Date(),
  });

  const league: League = Object.freeze({
    id: leagueId(input.id),
    name: input.name.trim(),
    ownerId: input.ownerId,
    format: input.format,
    maxMembers: input.maxMembers,
    inviteCode: generateInviteCode(input.id),
    status: 'pending' as const,
    members: Object.freeze([ownerAsMember]),
    rounds: Object.freeze([]),
    createdAt: new Date(),
    homeAndAway: input.homeAndAway ?? false,
  });

  return Ok(league);
}

function generateInviteCode(leagueIdStr: string): ReturnType<typeof inviteCode> {
  // Código determinístico baseado no ID (sem crypto para manter domínio puro)
  const hash = leagueIdStr.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const code = ((hash % 900000) + 100000).toString().padStart(6, '0');
  return inviteCode(code);
}

// ─── joinLeague ───────────────────────────────────────────────────────────────

export type JoinLeagueInput = Readonly<{
  profileId: string;
  memberIdStr: string;
  /** Código de convite digitado pelo usuário. */
  code: string;
}>;

export function joinLeague(
  league: League,
  input: JoinLeagueInput,
): Result<League, MultiplayerError> {
  // Invariante: só aceita novos membros enquanto status = pending
  if (league.status !== 'pending') {
    return Err(Object.freeze({ kind: 'LeagueNotPending' as const, status: league.status }));
  }
  // Invariante: código correto
  if (league.inviteCode !== inviteCode(input.code)) {
    return Err(Object.freeze({ kind: 'InvalidInviteCode' as const, code: input.code }));
  }
  // Invariante: não duplicar membro
  if (league.members.some((m) => m.profileId === input.profileId)) {
    return Err(Object.freeze({ kind: 'AlreadyMember' as const, profileId: input.profileId }));
  }
  // Invariante: respeitar max_members
  if (league.members.length >= league.maxMembers) {
    return Err(Object.freeze({ kind: 'LeagueFull' as const, maxMembers: league.maxMembers }));
  }

  const newMember: LeagueMember = Object.freeze({
    id: memberId(input.memberIdStr),
    profileId: input.profileId,
    squadId: null,
    joinedAt: new Date(),
  });

  return Ok(
    Object.freeze({
      ...league,
      members: Object.freeze([...league.members, newMember]),
    }),
  );
}

// ─── scheduleRoundRobin ───────────────────────────────────────────────────────

/**
 * Gera o calendário de rodadas para formato round_robin (doc 06 §2.3).
 *
 * Usa o algoritmo clássico de circle rotation:
 * - N times → N-1 rodadas (N par) ou N rodadas (N ímpar, 1 time descansa a cada rodada)
 * - Se homeAndAway=true, duplica invertendo casa/fora
 *
 * Retorna a League com as rounds preenchidas.
 */
export function scheduleRoundRobin(
  league: League,
  seedPrefix = 'round',
): Result<League, MultiplayerError> {
  if (league.status !== 'pending') {
    return Err(Object.freeze({ kind: 'LeagueNotPending' as const, status: league.status }));
  }
  if (league.rounds.length > 0) {
    return Err(Object.freeze({ kind: 'RoundsAlreadyScheduled' as const }));
  }
  if (league.members.length < MIN_MEMBERS_ROUND_ROBIN) {
    return Err(
      Object.freeze({
        kind: 'NotEnoughMembers' as const,
        have: league.members.length,
        need: MIN_MEMBERS_ROUND_ROBIN,
      }),
    );
  }

  const profiles = league.members.map((m) => m.profileId);
  const rounds = buildRoundRobinRounds(profiles, league.id, seedPrefix);

  // Duplicar se ida e volta
  const allRounds = league.homeAndAway
    ? [
        ...rounds,
        ...buildRoundRobinRounds(profiles, league.id, `${seedPrefix}-return`, true, rounds.length),
      ]
    : rounds;

  return Ok(
    Object.freeze({
      ...league,
      status: 'active' as LeagueStatus,
      rounds: Object.freeze(allRounds),
    }),
  );
}

function buildRoundRobinRounds(
  profiles: string[],
  lgId: ReturnType<typeof leagueId>,
  seedPfx: string,
  invert = false,
  startRound = 0,
): LeagueRound[] {
  // Garantir número par para o algoritmo
  const ps = profiles.length % 2 === 0 ? [...profiles] : [...profiles, '__bye__'];
  const n = ps.length;
  const totalRounds = n - 1;
  const rounds: LeagueRound[] = [];

  for (let r = 0; r < totalRounds; r++) {
    const matches: LeagueMatch[] = [];
    for (let i = 0; i < n / 2; i++) {
      // biome-ignore lint/style/noNonNullAssertion: i < n/2, array has n elements
      const home = ps[i]!;
      // biome-ignore lint/style/noNonNullAssertion: n-1-i >= n/2, within bounds
      const away = ps[n - 1 - i]!;
      if (home === '__bye__' || away === '__bye__') continue;

      const [h, a] = invert ? [away, home] : [home, away];
      const slotStr = `${lgId}-r${r + startRound}-m${i}`;
      matches.push(
        Object.freeze({
          id: matchSlotId(slotStr),
          homeProfileId: h,
          awayProfileId: a,
          status: 'scheduled' as const,
          result: null,
        }),
      );
    }

    rounds.push(
      Object.freeze({
        id: roundId(`${lgId}-round-${r + startRound + 1}`),
        roundNumber: r + startRound + 1,
        status: 'scheduled' as const,
        matches: Object.freeze(matches),
      }),
    );

    // Rotate: mantém ps[0] fixo, rotaciona o resto
    // biome-ignore lint/style/noNonNullAssertion: ps is non-empty (n >= 2)
    const last = ps.pop()!;
    ps.splice(1, 0, last);
  }

  return rounds;
}

// ─── recordMatchResult ────────────────────────────────────────────────────────

/**
 * Registra o resultado de uma partida na liga.
 * Imutável: retorna uma nova League com o resultado gravado.
 */
export function recordMatchResult(
  league: League,
  roundId_: ReturnType<typeof roundId>,
  matchId: ReturnType<typeof matchSlotId>,
  result: MatchResult,
): Result<League, MultiplayerError> {
  const updatedRounds = league.rounds.map((round): LeagueRound => {
    if (round.id !== roundId_) return round;
    const updatedMatches = round.matches.map((m): LeagueMatch => {
      if (m.id !== matchId) return m;
      return Object.freeze({ ...m, status: 'done' as const, result });
    });
    const allDone = updatedMatches.every((m) => m.status !== 'scheduled');
    return Object.freeze({
      ...round,
      matches: Object.freeze(updatedMatches),
      status: (allDone ? 'done' : round.status) as typeof round.status,
    });
  });

  const allRoundsDone = updatedRounds.every((r) => r.status === 'done');

  return Ok(
    Object.freeze({
      ...league,
      rounds: Object.freeze(updatedRounds),
      status: (allRoundsDone ? 'finished' : league.status) as LeagueStatus,
    }),
  );
}

// ─── calculatePoints ─────────────────────────────────────────────────────────

/**
 * Calcula pontuação de um jogador em relação aos resultados já processados.
 * 3 pontos = vitória, 1 = empate, 0 = derrota (T018).
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: point calculation logic requires iterating nested rounds/matches
export function calculatePoints(
  profileId: string,
  rounds: readonly LeagueRound[],
): {
  points: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  played: number;
} {
  let points = 0;
  let won = 0;
  let drawn = 0;
  let lost = 0;
  let goalsFor = 0;
  let goalsAgainst = 0;
  let played = 0;

  for (const round of rounds) {
    for (const match of round.matches) {
      if (match.result === null) continue;
      const isHome = match.homeProfileId === profileId;
      const isAway = match.awayProfileId === profileId;
      if (!isHome && !isAway) continue;

      played++;
      const { homeGoals, awayGoals } = match.result;
      const myGoals = isHome ? homeGoals : awayGoals;
      const theirGoals = isHome ? awayGoals : homeGoals;
      goalsFor += myGoals;
      goalsAgainst += theirGoals;

      if (myGoals > theirGoals) {
        points += POINTS_WIN;
        won++;
      } else if (myGoals === theirGoals) {
        points += POINTS_DRAW;
        drawn++;
      } else {
        points += POINTS_LOSS;
        lost++;
      }
    }
  }

  return { points, won, drawn, lost, goalsFor, goalsAgainst, played };
}

// ─── generateStandings ────────────────────────────────────────────────────────

/**
 * Gera a tabela de classificação da liga com os critérios (T018):
 *   1. Pontos (V=3, E=1, D=0)
 *   2. Saldo de gols (goalsFor - goalsAgainst)
 *   3. Gols marcados (goalsFor)
 *   4. Confronto direto (quem ganhou o jogo entre os dois)
 *   5. Ordem de entrada na liga (posição em members[])
 */
export function generateStandings(league: League): Standings {
  // Construir rows brutas
  const rowsByProfile = new Map<string, StandingsRow>();
  const memberOrder = league.members.map((m) => m.profileId);

  for (const profileId of memberOrder) {
    const stats = calculatePoints(profileId, league.rounds);
    rowsByProfile.set(
      profileId,
      Object.freeze({
        profileId,
        played: stats.played,
        won: stats.won,
        drawn: stats.drawn,
        lost: stats.lost,
        goalsFor: stats.goalsFor,
        goalsAgainst: stats.goalsAgainst,
        goalDiff: stats.goalsFor - stats.goalsAgainst,
        points: stats.points,
        rank: 0, // calculado após ordenação
      }),
    );
  }

  const rows = [...rowsByProfile.values()];

  // Ordenar
  rows.sort((a, b) => {
    // 1. Pontos
    if (b.points !== a.points) return b.points - a.points;
    // 2. Saldo de gols
    if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
    // 3. Gols marcados
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    // 4. Confronto direto
    const directResult = getDirectResult(league.rounds, a.profileId, b.profileId);
    if (directResult !== 0) return directResult; // -1 = a ganhou, +1 = b ganhou
    // 5. Ordem de entrada na liga
    return memberOrder.indexOf(a.profileId) - memberOrder.indexOf(b.profileId);
  });

  // Atribuir ranks
  const rankedRows: StandingsRow[] = rows.map((row, idx) =>
    Object.freeze({ ...row, rank: idx + 1 }),
  );

  return Object.freeze({
    leagueId: league.id,
    rows: Object.freeze(rankedRows),
  });
}

/**
 * Confronto direto entre dois jogadores.
 * Retorna -1 se A ganhou, +1 se B ganhou, 0 se empate ou não jogaram.
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: direct-result calculation requires nested round/match iteration
function getDirectResult(
  rounds: readonly LeagueRound[],
  profileA: string,
  profileB: string,
): number {
  let aPoints = 0;
  let bPoints = 0;

  for (const round of rounds) {
    for (const match of round.matches) {
      if (match.result === null) continue;
      const { homeProfileId: hp, awayProfileId: ap, result: r } = match;

      const isABMatch =
        (hp === profileA && ap === profileB) || (hp === profileB && ap === profileA);
      if (!isABMatch) continue;

      const homeWins = r.homeGoals > r.awayGoals;
      const awayWins = r.awayGoals > r.homeGoals;

      if (homeWins) {
        if (hp === profileA) aPoints += 3;
        else bPoints += 3;
      } else if (awayWins) {
        if (ap === profileA) aPoints += 3;
        else bPoints += 3;
      } else {
        aPoints += 1;
        bPoints += 1;
      }
    }
  }

  if (aPoints > bPoints) return -1; // A melhor → A deve vir antes (sort a-b = negativo)
  if (bPoints > aPoints) return 1; // B melhor → B deve vir antes (sort a-b = positivo)
  return 0;
}
