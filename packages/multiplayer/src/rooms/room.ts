/**
 * `LobbyRoom` — sala de espera social antes do início do draft (doc 06 §2.5).
 *
 * Fluxo: membros entram na room → marcam "ready" → owner inicia o draft.
 * Sem WebSocket nesta camada (domínio puro) — a camada de aplicação é
 * responsável pelo realtime (Supabase Presence, doc 06 §2.5).
 *
 * Funções puras: produzem novas LobbyRoom imutáveis.
 */
import { Err, Ok, type Result, validationError } from '@world-legends/shared';
import {
  type LeagueId,
  type LobbyRoom,
  type MultiplayerError,
  type RoomMember,
  roomId,
} from '../types/types';

// ─── createRoom ───────────────────────────────────────────────────────────────

export function createRoom(input: {
  id: string;
  leagueId: LeagueId;
  ownerProfileId: string;
  maxSize: number;
}): Result<LobbyRoom, ReturnType<typeof validationError>> {
  if (input.maxSize < 2 || input.maxSize > 20) {
    return Err(validationError('maxSize deve ser entre 2 e 20', 'maxSize'));
  }

  const ownerMember: RoomMember = Object.freeze({
    profileId: input.ownerProfileId,
    joinedAt: new Date(),
    isReady: false,
  });

  return Ok(
    Object.freeze({
      id: roomId(input.id),
      leagueId: input.leagueId,
      members: Object.freeze([ownerMember]),
      maxSize: input.maxSize,
      status: 'waiting' as const,
    }),
  );
}

// ─── joinRoom ─────────────────────────────────────────────────────────────────

export function joinRoom(room: LobbyRoom, profileId: string): Result<LobbyRoom, MultiplayerError> {
  if (room.members.length >= room.maxSize) {
    return Err(Object.freeze({ kind: 'RoomFull' as const, maxSize: room.maxSize }));
  }
  if (room.members.some((m) => m.profileId === profileId)) {
    return Err(Object.freeze({ kind: 'AlreadyMember' as const, profileId }));
  }

  const newMember: RoomMember = Object.freeze({
    profileId,
    joinedAt: new Date(),
    isReady: false,
  });

  return Ok(
    Object.freeze({
      ...room,
      members: Object.freeze([...room.members, newMember]),
    }),
  );
}

// ─── setReady ─────────────────────────────────────────────────────────────────

/**
 * Marca um membro como "pronto". Quando todos estão prontos → status='ready'.
 */
export function setReady(room: LobbyRoom, profileId: string): LobbyRoom {
  const updated = room.members.map((m) =>
    m.profileId === profileId ? Object.freeze({ ...m, isReady: true }) : m,
  );

  const allReady = updated.length >= 2 && updated.every((m) => m.isReady);

  return Object.freeze({
    ...room,
    members: Object.freeze(updated),
    status: (allReady ? 'ready' : room.status) as LobbyRoom['status'],
  });
}

// ─── startDraft ───────────────────────────────────────────────────────────────

/** Avança a room para 'started'. Requer status='ready'. */
export function startDraft(room: LobbyRoom): Result<LobbyRoom, ReturnType<typeof validationError>> {
  if (room.status !== 'ready') {
    return Err(
      validationError(
        `Room não está pronta: status=${room.status}. Todos os membros devem marcar "ready".`,
        'status',
      ),
    );
  }
  return Ok(Object.freeze({ ...room, status: 'started' as const }));
}

// ─── leaveRoom ────────────────────────────────────────────────────────────────

export function leaveRoom(room: LobbyRoom, profileId: string): LobbyRoom {
  const remaining = room.members.filter((m) => m.profileId !== profileId);
  const allReady = remaining.length >= 2 && remaining.every((m) => m.isReady);

  return Object.freeze({
    ...room,
    members: Object.freeze(remaining),
    status: (allReady ? 'ready' : 'waiting') as LobbyRoom['status'],
  });
}
