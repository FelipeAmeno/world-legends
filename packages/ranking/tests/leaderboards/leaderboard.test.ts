import { describe, expect, it } from 'vitest';
import { eloRating } from '../../src/elo/calculate-rating';
import { buildLeaderboard, getPlayerRank, getTopN } from '../../src/leaderboards/leaderboard';
import { createPlayerRanking, seasonId, updatePlayerRanking } from '../../src/season/season-reset';

const SID = seasonId('season-001');

function makeRanking(profileId: string, rating: number, wins = 0) {
  let r = createPlayerRanking({
    id: `r-${profileId}`,
    profileId,
    seasonId: SID,
    initialRating: rating,
  });
  if (wins > 0) r = updatePlayerRanking(r, eloRating(rating), 'win');
  return r;
}

describe('buildLeaderboard — ordenação', () => {
  it('ordena por eloRating decrescente', () => {
    const rankings = [makeRanking('C', 1200), makeRanking('A', 1800), makeRanking('B', 1500)];
    const board = buildLeaderboard({ rankings, seasonId: SID });
    expect(board.entries[0]?.profileId).toBe('A');
    expect(board.entries[1]?.profileId).toBe('B');
    expect(board.entries[2]?.profileId).toBe('C');
  });

  it('desempate por vitórias quando ratings iguais', () => {
    const a = updatePlayerRanking(
      createPlayerRanking({ id: 'rA', profileId: 'A', seasonId: SID, initialRating: 1500 }),
      eloRating(1500),
      'win',
    );
    const b = createPlayerRanking({ id: 'rB', profileId: 'B', seasonId: SID, initialRating: 1500 });
    const board = buildLeaderboard({ rankings: [b, a], seasonId: SID });
    expect(board.entries[0]?.profileId).toBe('A'); // mais vitórias
  });

  it('ranks são sequenciais 1, 2, 3...', () => {
    const rankings = ['A', 'B', 'C'].map((p, i) => makeRanking(p, 2000 - i * 200));
    const board = buildLeaderboard({ rankings, seasonId: SID });
    board.entries.forEach((e, i) => expect(e.rank).toBe(i + 1));
  });

  it('totalCount = número de jogadores na season', () => {
    const rankings = ['A', 'B', 'C', 'D'].map((p) => makeRanking(p, 1000));
    const board = buildLeaderboard({ rankings, seasonId: SID });
    expect(board.totalCount).toBe(4);
  });

  it('winRate calculado corretamente', () => {
    let r = createPlayerRanking({ id: 'r', profileId: 'p', seasonId: SID });
    r = updatePlayerRanking(r, eloRating(1100), 'win');
    r = updatePlayerRanking(r, eloRating(1050), 'loss');
    r = updatePlayerRanking(r, eloRating(1080), 'draw');
    const board = buildLeaderboard({ rankings: [r], seasonId: SID });
    // 1 win, 1 loss, 1 draw = 3 matches → winRate = 1/3
    expect(board.entries[0]?.winRate).toBe(0.333);
  });
});

describe('buildLeaderboard — filtro por tier', () => {
  it('filtra jogadores pelo tier solicitado', () => {
    const rankings = [
      makeRanking('A', 2500), // Lenda
      makeRanking('B', 1500), // Ouro
      makeRanking('C', 1600), // Ouro
    ];
    const board = buildLeaderboard({ rankings, seasonId: SID, tier: 'Ouro' });
    expect(board.entries.length).toBe(2);
    expect(board.tier).toBe('Ouro');
  });
});

describe('buildLeaderboard — paginação', () => {
  it('paginação: página 1 retorna primeiros N', () => {
    const rankings = Array.from({ length: 10 }, (_, i) => makeRanking(`p${i}`, 2000 - i * 100));
    const board = buildLeaderboard({ rankings, seasonId: SID, page: 1, pageSize: 3 });
    expect(board.entries.length).toBe(3);
    expect(board.entries[0]?.rank).toBe(1);
  });

  it('paginação: página 2 retorna os seguintes', () => {
    const rankings = Array.from({ length: 10 }, (_, i) => makeRanking(`p${i}`, 2000 - i * 100));
    const board = buildLeaderboard({ rankings, seasonId: SID, page: 2, pageSize: 3 });
    expect(board.entries[0]?.rank).toBe(4);
  });

  it('pageSize default = 50', () => {
    const rankings = Array.from({ length: 30 }, (_, i) => makeRanking(`p${i}`, 1000 + i));
    const board = buildLeaderboard({ rankings, seasonId: SID });
    expect(board.pageSize).toBe(50);
    expect(board.entries.length).toBe(30);
  });

  it('resultado é imutável', () => {
    const board = buildLeaderboard({ rankings: [makeRanking('A', 1000)], seasonId: SID });
    expect(Object.isFrozen(board)).toBe(true);
    expect(Object.isFrozen(board.entries)).toBe(true);
  });
});

describe('getPlayerRank', () => {
  it('retorna o rank de um jogador', () => {
    const rankings = [makeRanking('A', 2000), makeRanking('B', 1500)];
    expect(getPlayerRank(rankings, 'A', SID)).toBe(1);
    expect(getPlayerRank(rankings, 'B', SID)).toBe(2);
  });

  it('retorna null para jogador não encontrado', () => {
    expect(getPlayerRank([makeRanking('A', 1000)], 'X', SID)).toBeNull();
  });
});

describe('getTopN', () => {
  it('retorna exatamente N jogadores', () => {
    const rankings = Array.from({ length: 10 }, (_, i) => makeRanking(`p${i}`, 2000 - i * 100));
    const top3 = getTopN(rankings, SID, 3);
    expect(top3.length).toBe(3);
    expect(top3[0]?.rank).toBe(1);
  });

  it('filtra por tier quando especificado', () => {
    const rankings = [
      makeRanking('A', 2500), // Lenda
      makeRanking('B', 2600), // Lenda
      makeRanking('C', 1500), // Ouro
    ];
    const topLenda = getTopN(rankings, SID, 10, 'Lenda');
    expect(topLenda.length).toBe(2);
    expect(topLenda.every((e) => e.tier === 'Lenda')).toBe(true);
  });
});
