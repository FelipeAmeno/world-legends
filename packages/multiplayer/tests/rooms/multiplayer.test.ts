import { describe, expect, it } from 'vitest';
import {
  cancelFriendlyMatch,
  createFriendlyMatch,
  getFriendlyOutcome,
  recordFriendlyResult,
} from '../../src/friendlies/friendly-match';
import { createLeague } from '../../src/private-leagues/league';
import { createRoom, joinRoom, leaveRoom, setReady, startDraft } from '../../src/rooms/room';
import {
  closeSeason,
  createLeagueSeason,
  getSeasonDurationDays,
  isSeasonActive,
  openSeason,
} from '../../src/seasons/season';
import type { LeagueId } from '../../src/types/types';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const LID = 'league-001' as LeagueId;

function makeLeague() {
  const r = createLeague({
    id: LID,
    name: 'Liga Teste',
    ownerId: 'A',
    format: 'round_robin',
    maxMembers: 4,
  });
  if (!r.ok) throw new Error('fixture falhou');
  return r.value;
}

// ─── Rooms ────────────────────────────────────────────────────────────────────

describe('createRoom — LobbyRoom', () => {
  it('cria room com owner', () => {
    const r = createRoom({ id: 'room-1', leagueId: LID, ownerProfileId: 'A', maxSize: 4 });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.members.length).toBe(1);
      expect(r.value.status).toBe('waiting');
    }
  });

  it('rejeita maxSize < 2', () => {
    const r = createRoom({ id: 'r', leagueId: LID, ownerProfileId: 'A', maxSize: 1 });
    expect(r.ok).toBe(false);
  });
});

describe('joinRoom', () => {
  it('adiciona membro', () => {
    const room = createRoom({ id: 'r', leagueId: LID, ownerProfileId: 'A', maxSize: 4 });
    if (!room.ok) throw new Error();
    const r = joinRoom(room.value, 'B');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.members.length).toBe(2);
  });

  it('rejeita sala cheia', () => {
    const room = createRoom({ id: 'r', leagueId: LID, ownerProfileId: 'A', maxSize: 2 });
    if (!room.ok) throw new Error();
    const r1 = joinRoom(room.value, 'B');
    if (!r1.ok) throw new Error();
    const r2 = joinRoom(r1.value, 'C');
    expect(r2.ok).toBe(false);
    if (!r2.ok) expect(r2.error.kind).toBe('RoomFull');
  });

  it('rejeita membro duplicado', () => {
    const room = createRoom({ id: 'r', leagueId: LID, ownerProfileId: 'A', maxSize: 4 });
    if (!room.ok) throw new Error();
    const r = joinRoom(room.value, 'A');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe('AlreadyMember');
  });
});

describe('setReady e startDraft', () => {
  it('todos prontos → status=ready', () => {
    const room = createRoom({ id: 'r', leagueId: LID, ownerProfileId: 'A', maxSize: 4 });
    if (!room.ok) throw new Error();
    const r1 = joinRoom(room.value, 'B');
    if (!r1.ok) throw new Error();
    let r = r1.value;
    r = setReady(r, 'A');
    r = setReady(r, 'B');
    expect(r.status).toBe('ready');
  });

  it('apenas 1 pronto → status=waiting', () => {
    const room = createRoom({ id: 'r', leagueId: LID, ownerProfileId: 'A', maxSize: 4 });
    if (!room.ok) throw new Error();
    const r = setReady(room.value, 'A');
    expect(r.status).toBe('waiting');
  });

  it('startDraft exige status=ready', () => {
    const room = createRoom({ id: 'r', leagueId: LID, ownerProfileId: 'A', maxSize: 4 });
    if (!room.ok) throw new Error();
    const r = startDraft(room.value);
    expect(r.ok).toBe(false);
  });

  it('startDraft com status=ready → started', () => {
    const room = createRoom({ id: 'r', leagueId: LID, ownerProfileId: 'A', maxSize: 4 });
    if (!room.ok) throw new Error();
    const r1 = joinRoom(room.value, 'B');
    if (!r1.ok) throw new Error();
    let r = setReady(r1.value, 'A');
    r = setReady(r, 'B');
    const started = startDraft(r);
    expect(started.ok).toBe(true);
    if (started.ok) expect(started.value.status).toBe('started');
  });
});

describe('leaveRoom', () => {
  it('remove membro e recalcula status', () => {
    const room = createRoom({ id: 'r', leagueId: LID, ownerProfileId: 'A', maxSize: 4 });
    if (!room.ok) throw new Error();
    const r1 = joinRoom(room.value, 'B');
    if (!r1.ok) throw new Error();
    let r = setReady(r1.value, 'A');
    r = setReady(r, 'B');
    expect(r.status).toBe('ready');
    r = leaveRoom(r, 'B');
    expect(r.members.length).toBe(1);
    expect(r.status).toBe('waiting');
  });
});

// ─── FriendlyMatch ────────────────────────────────────────────────────────────

describe('createFriendlyMatch', () => {
  it('cria amistoso válido', () => {
    const r = createFriendlyMatch({ id: 'f1', homeProfileId: 'A', awayProfileId: 'B' });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.status).toBe('pending');
      expect(r.value.result).toBeNull();
    }
  });

  it('rejeita mesmo jogador como home e away', () => {
    const r = createFriendlyMatch({ id: 'f1', homeProfileId: 'A', awayProfileId: 'A' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe('SamePlayer');
  });
});

describe('recordFriendlyResult', () => {
  it('registra resultado e avança para done', () => {
    const fm = createFriendlyMatch({ id: 'f1', homeProfileId: 'A', awayProfileId: 'B' });
    if (!fm.ok) throw new Error();
    const r = recordFriendlyResult(fm.value, { homeGoals: 2, awayGoals: 1, seed: 'xyz' });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.status).toBe('done');
      expect(r.value.result?.homeGoals).toBe(2);
    }
  });

  it('rejeita gravação de resultado em amistoso já finalizado', () => {
    const fm = createFriendlyMatch({ id: 'f1', homeProfileId: 'A', awayProfileId: 'B' });
    if (!fm.ok) throw new Error();
    const r1 = recordFriendlyResult(fm.value, { homeGoals: 1, awayGoals: 0, seed: 'x' });
    if (!r1.ok) throw new Error();
    const r2 = recordFriendlyResult(r1.value, { homeGoals: 2, awayGoals: 0, seed: 'y' });
    expect(r2.ok).toBe(false);
    if (!r2.ok) expect(r2.error.kind).toBe('AlreadyFinished');
  });
});

describe('cancelFriendlyMatch', () => {
  it('cancela amistoso pendente', () => {
    const fm = createFriendlyMatch({ id: 'f1', homeProfileId: 'A', awayProfileId: 'B' });
    if (!fm.ok) throw new Error();
    const r = cancelFriendlyMatch(fm.value);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.status).toBe('cancelled');
  });

  it('rejeita cancelar amistoso já finalizado', () => {
    const fm = createFriendlyMatch({ id: 'f1', homeProfileId: 'A', awayProfileId: 'B' });
    if (!fm.ok) throw new Error();
    const done = recordFriendlyResult(fm.value, { homeGoals: 1, awayGoals: 0, seed: 'x' });
    if (!done.ok) throw new Error();
    const r = cancelFriendlyMatch(done.value);
    expect(r.ok).toBe(false);
  });
});

describe('getFriendlyOutcome', () => {
  it('retorna win para o vencedor', () => {
    const fm = createFriendlyMatch({ id: 'f1', homeProfileId: 'A', awayProfileId: 'B' });
    if (!fm.ok) throw new Error();
    const done = recordFriendlyResult(fm.value, { homeGoals: 3, awayGoals: 0, seed: 'x' });
    if (!done.ok) throw new Error();
    expect(getFriendlyOutcome(done.value, 'A')).toBe('win');
    expect(getFriendlyOutcome(done.value, 'B')).toBe('loss');
  });

  it('retorna draw em empate', () => {
    const fm = createFriendlyMatch({ id: 'f1', homeProfileId: 'A', awayProfileId: 'B' });
    if (!fm.ok) throw new Error();
    const done = recordFriendlyResult(fm.value, { homeGoals: 1, awayGoals: 1, seed: 'x' });
    if (!done.ok) throw new Error();
    expect(getFriendlyOutcome(done.value, 'A')).toBe('draw');
    expect(getFriendlyOutcome(done.value, 'B')).toBe('draw');
  });

  it('retorna null para amistoso pendente', () => {
    const fm = createFriendlyMatch({ id: 'f1', homeProfileId: 'A', awayProfileId: 'B' });
    if (!fm.ok) throw new Error();
    expect(getFriendlyOutcome(fm.value, 'A')).toBeNull();
  });
});

// ─── LeagueSeason ─────────────────────────────────────────────────────────────

describe('createLeagueSeason', () => {
  const league = makeLeague();
  const future = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // +7 dias
  const end = new Date(Date.now() + 1000 * 60 * 60 * 24 * 42); // +42 dias

  it('cria temporada de liga com status correto', () => {
    const r = createLeagueSeason({
      id: 'szn-1',
      league,
      name: 'Liga de Verão',
      startDate: future,
      endDate: end,
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.status).toBe('upcoming');
      expect(r.value.leagueId).toBe(league.id);
    }
  });

  it('rejeita end <= start', () => {
    const r = createLeagueSeason({
      id: 'szn-1',
      league,
      name: 'X',
      startDate: end,
      endDate: future,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe('InvalidDateRange');
  });

  it('rejeita nome vazio', () => {
    const r = createLeagueSeason({
      id: 'szn-1',
      league,
      name: '',
      startDate: future,
      endDate: end,
    });
    expect(r.ok).toBe(false);
  });

  it('calcula duração em dias corretamente', () => {
    const r = createLeagueSeason({
      id: 'szn-1',
      league,
      name: 'X',
      startDate: future,
      endDate: end,
    });
    if (!r.ok) throw new Error();
    // 42 - 7 = 35 dias
    expect(getSeasonDurationDays(r.value)).toBe(35);
  });
});

describe('openSeason e closeSeason', () => {
  const league = makeLeague();
  const future = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
  const end = new Date(Date.now() + 1000 * 60 * 60 * 24 * 42);

  it('openSeason ativa uma temporada upcoming', () => {
    const szn = createLeagueSeason({ id: 's', league, name: 'X', startDate: future, endDate: end });
    if (!szn.ok) throw new Error();
    const r = openSeason(szn.value);
    expect(r.ok).toBe(true);
    if (r.ok) expect(isSeasonActive(r.value)).toBe(true);
  });

  it('closeSeason encerra uma temporada ativa', () => {
    const szn = createLeagueSeason({ id: 's', league, name: 'X', startDate: future, endDate: end });
    if (!szn.ok) throw new Error();
    const opened = openSeason(szn.value);
    if (!opened.ok) throw new Error();
    const r = closeSeason(opened.value);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.status).toBe('closed');
  });

  it('rejeita closeSeason de uma temporada já encerrada', () => {
    const szn = createLeagueSeason({ id: 's', league, name: 'X', startDate: future, endDate: end });
    if (!szn.ok) throw new Error();
    const opened = openSeason(szn.value);
    if (!opened.ok) throw new Error();
    const closed = closeSeason(opened.value);
    if (!closed.ok) throw new Error();
    const r = closeSeason(closed.value);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe('SeasonAlreadyClosed');
  });
});
