/**
 * Tipos do domínio Multiplayer (doc 17 §15, doc 06 §2).
 *
 * Entidades documentadas:
 *   League         — Aggregate Root principal
 *   LeagueMember   — entidade interna da League (vive e morre com ela)
 *   LeagueRound    — rodada do calendário (entidade interna)
 *   LeagueMatch    — partida agendada dentro de uma rodada
 *   DraftSession   — transitório: gerencia o draft de cards (doc 06 §2.2)
 *   LobbyRoom      — sala de espera antes do draft (não documentada formalmente;
 *                    inferida do fluxo doc 06 §2.5)
 *   FriendlyMatch  — amistoso entre 2 jogadores (sem impacto em Elo, doc 06 §3.1)
 *
 * NOTA (doc 18 §10): `multiplayer` NÃO possui `Season`. Ligas privadas
 * operam fora de qualquer Season — só ligas `public_ranked` referenciam Season.
 */

// ─── IDs nominais ─────────────────────────────────────────────────────────────
export type LeagueId = string & { readonly _brand: 'LeagueId' };
export type MemberId = string & { readonly _brand: 'MemberId' };
export type RoundId = string & { readonly _brand: 'RoundId' };
export type MatchSlotId = string & { readonly _brand: 'MatchSlotId' };
export type InviteCode = string & { readonly _brand: 'InviteCode' };
export type DraftId = string & { readonly _brand: 'DraftId' };
export type RoomId = string & { readonly _brand: 'RoomId' };

export function leagueId(v: string): LeagueId {
  if (!v.trim()) throw new Error('LeagueId vazio');
  return v as LeagueId;
}
export function memberId(v: string): MemberId {
  if (!v.trim()) throw new Error('MemberId vazio');
  return v as MemberId;
}
export function roundId(v: string): RoundId {
  if (!v.trim()) throw new Error('RoundId vazio');
  return v as RoundId;
}
export function matchSlotId(v: string): MatchSlotId {
  if (!v.trim()) throw new Error('MatchSlotId vazio');
  return v as MatchSlotId;
}
export function inviteCode(v: string): InviteCode {
  if (!v.trim()) throw new Error('InviteCode vazio');
  return v as InviteCode;
}
export function draftId(v: string): DraftId {
  if (!v.trim()) throw new Error('DraftId vazio');
  return v as DraftId;
}
export function roomId(v: string): RoomId {
  if (!v.trim()) throw new Error('RoomId vazio');
  return v as RoomId;
}

// ─── Enums de formato (doc 06 §2.1) ──────────────────────────────────────────
export type LeagueFormat = 'round_robin' | 'knockout' | 'groups_knockout';
export type LeagueStatus = 'pending' | 'draft' | 'active' | 'finished';
export type RoundStatus = 'scheduled' | 'processing' | 'done';
export type MatchStatus = 'scheduled' | 'done' | 'walkover';

// ─── LeagueMember (entidade interna de League) ────────────────────────────────
export type LeagueMember = Readonly<{
  readonly id: MemberId;
  readonly profileId: string;
  /** SquadId congelado para esta liga (doc 17 §15, doc 03 §3.3). null antes do draft. */
  readonly squadId: string | null;
  readonly joinedAt: Date;
}>;

// ─── LeagueMatch — partida agendada em uma rodada ────────────────────────────
export type MatchResult = Readonly<{
  readonly homeGoals: number;
  readonly awayGoals: number;
  /** seed usada na simulação — auditabilidade (doc 09 §21). */
  readonly seed: string;
}>;

export type LeagueMatch = Readonly<{
  readonly id: MatchSlotId;
  readonly homeProfileId: string;
  readonly awayProfileId: string;
  readonly status: MatchStatus;
  readonly result: MatchResult | null;
}>;

// ─── LeagueRound (entidade interna de League) ─────────────────────────────────
export type LeagueRound = Readonly<{
  readonly id: RoundId;
  readonly roundNumber: number;
  readonly status: RoundStatus;
  readonly matches: readonly LeagueMatch[];
}>;

// ─── League — Aggregate Root (doc 17 §15) ────────────────────────────────────
export type League = Readonly<{
  readonly id: LeagueId;
  readonly name: string;
  readonly ownerId: string;
  readonly format: LeagueFormat;
  readonly maxMembers: number;
  readonly inviteCode: InviteCode;
  readonly status: LeagueStatus;
  readonly members: readonly LeagueMember[];
  readonly rounds: readonly LeagueRound[];
  readonly createdAt: Date;
  /** Ida e volta no round_robin? (doc 06 §2.3) */
  readonly homeAndAway: boolean;
}>;

// ─── Standings (tabela de classificação) ─────────────────────────────────────
/**
 * Critérios de classificação (T018, padrão do futebol):
 * 1. Pontos (V=3, E=1, D=0)
 * 2. Saldo de gols
 * 3. Gols marcados
 * 4. Confronto direto (vencedor do jogo entre os empatados)
 * 5. Ordem de entrada na liga (tiebreaker final)
 */
export type StandingsRow = Readonly<{
  readonly profileId: string;
  readonly played: number;
  readonly won: number;
  readonly drawn: number;
  readonly lost: number;
  readonly goalsFor: number;
  readonly goalsAgainst: number;
  readonly goalDiff: number;
  readonly points: number;
  readonly rank: number;
}>;

export type Standings = Readonly<{
  readonly leagueId: LeagueId;
  readonly rows: readonly StandingsRow[];
}>;

// ─── DraftSession (doc 06 §2.2, doc 17 §15) ──────────────────────────────────
export type DraftPick = Readonly<{
  readonly pickNumber: number;
  readonly profileId: string;
  readonly cardId: string;
  readonly pickedAt: Date;
}>;

export type DraftSession = Readonly<{
  readonly id: DraftId;
  readonly leagueId: LeagueId;
  /** CardIds disponíveis para pick — reduz a cada pick feito. */
  readonly pool: readonly string[];
  readonly pickOrder: readonly string[]; // profileIds em ordem de pick
  readonly picks: readonly DraftPick[];
  readonly status: 'active' | 'finished';
}>;

// ─── LobbyRoom (doc 06 §2.5 — sala de espera social) ─────────────────────────
export type RoomMember = Readonly<{
  readonly profileId: string;
  readonly joinedAt: Date;
  readonly isReady: boolean;
}>;

export type LobbyRoom = Readonly<{
  readonly id: RoomId;
  readonly leagueId: LeagueId;
  readonly members: readonly RoomMember[];
  readonly maxSize: number;
  readonly status: 'waiting' | 'ready' | 'started';
}>;

// ─── FriendlyMatch (amistoso entre amigos — doc 06 §1, doc 06 §3.1) ──────────
/** Amistosos nunca afetam Elo (doc 06 §3.1). */
export type FriendlyMatch = Readonly<{
  readonly id: string;
  readonly homeProfileId: string;
  readonly awayProfileId: string;
  readonly status: 'pending' | 'done' | 'cancelled';
  readonly result: MatchResult | null;
  readonly scheduledAt: Date;
  readonly createdAt: Date;
}>;

// ─── Erros de domínio ─────────────────────────────────────────────────────────
export type MultiplayerError =
  | Readonly<{ kind: 'LeagueNotFound'; leagueId: string }>
  | Readonly<{ kind: 'LeagueFull'; maxMembers: number }>
  | Readonly<{ kind: 'AlreadyMember'; profileId: string }>
  | Readonly<{ kind: 'InvalidInviteCode'; code: string }>
  | Readonly<{ kind: 'LeagueNotPending'; status: LeagueStatus }>
  | Readonly<{ kind: 'NotEnoughMembers'; have: number; need: number }>
  | Readonly<{ kind: 'RoundsAlreadyScheduled' }>
  | Readonly<{ kind: 'InvalidFormat'; format: string }>
  | Readonly<{ kind: 'DraftCardAlreadyPicked'; cardId: string }>
  | Readonly<{ kind: 'NotYourTurn'; expected: string; got: string }>
  | Readonly<{ kind: 'DraftFinished' }>
  | Readonly<{ kind: 'RoomFull'; maxSize: number }>
  | Readonly<{ kind: 'InvalidPoints'; points: number }>;
