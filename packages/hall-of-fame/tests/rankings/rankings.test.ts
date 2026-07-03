import { describe, expect, it } from 'vitest';
import {
  rankTopCollectors, rankTopWins, rankTopSeasons,
  rankTopGoats, rankTopAlbum,
} from '../../src/rankings/hof-rankings';
import { hofProfileId } from '../../src/categories/types';
import type {
  CollectorSnapshot, WinsSnapshot, SeasonSnapshot, GoatSnapshot,
} from '../../src/categories/types';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function collector(
  id: string, name: string,
  overrides: Partial<CollectorSnapshot> = {},
): CollectorSnapshot {
  return Object.freeze({
    profileId: hofProfileId(id),
    displayName: name,
    totalCards: 100,
    legendaryPlusCount: 5,
    ultraCount: 1,
    albumsCompleted: 0,
    bestAlbumCompletion: 0.5,
    ...overrides,
  });
}

function wins(
  id: string, name: string,
  overrides: Partial<WinsSnapshot> = {},
): WinsSnapshot {
  return Object.freeze({
    profileId: hofProfileId(id),
    displayName: name,
    totalRankedWins: 10,
    bestWinStreak: 3,
    currentWinStreak: 1,
    totalRankedMatches: 20,
    ...overrides,
  });
}

function season(
  id: string, name: string,
  overrides: Partial<SeasonSnapshot> = {},
): SeasonSnapshot {
  return Object.freeze({
    profileId: hofProfileId(id),
    displayName: name,
    seasonsPlayed: 5,
    seasonsAsWorldLegend: 1,
    bestGlobalRank: 50,
    highestTierReached: 'World Legend',
    ...overrides,
  });
}

function goat(
  id: string, name: string,
  count: number,
): GoatSnapshot {
  return Object.freeze({
    profileId: hofProfileId(id),
    displayName: name,
    goatCount: count,
    goatCardIds: Object.freeze(Array.from({ length: count }, (_, i) => `goat-${i}`)),
  });
}

// ─── rankTopCollectors ────────────────────────────────────────────────────────

describe('rankTopCollectors — Coleção Mais Completa (doc 10 §21)', () => {
  it('ordena por albumsCompleted DESC', () => {
    const data = [
      collector('A', 'Alice', { albumsCompleted: 1 }),
      collector('B', 'Bob',   { albumsCompleted: 3 }),
      collector('C', 'Carol', { albumsCompleted: 2 }),
    ];
    const r = rankTopCollectors(data);
    expect(r.entries[0]?.profileId).toBe('B');
    expect(r.entries[1]?.profileId).toBe('C');
    expect(r.entries[2]?.profileId).toBe('A');
  });

  it('desempate: bestAlbumCompletion DESC (TC-HOF-05)', () => {
    const data = [
      collector('A', 'Alice', { albumsCompleted: 2, bestAlbumCompletion: 0.7 }),
      collector('B', 'Bob',   { albumsCompleted: 2, bestAlbumCompletion: 0.9 }),
    ];
    const r = rankTopCollectors(data);
    expect(r.entries[0]?.profileId).toBe('B');
  });

  it('desempate final: displayName ASC (TC-HOF-05 — consistência)', () => {
    const data = [
      collector('B', 'Zeta', { albumsCompleted: 2, bestAlbumCompletion: 0.8, legendaryPlusCount: 5, totalCards: 100 }),
      collector('A', 'Abel', { albumsCompleted: 2, bestAlbumCompletion: 0.8, legendaryPlusCount: 5, totalCards: 100 }),
    ];
    const r = rankTopCollectors(data);
    expect(r.entries[0]?.displayName).toBe('Abel');
    expect(r.entries[1]?.displayName).toBe('Zeta');
  });

  it('ranks são 1-based e sequenciais', () => {
    const data = [collector('A', 'A'), collector('B', 'B'), collector('C', 'C')];
    const r = rankTopCollectors(data);
    expect(r.entries.map((e) => e.rank)).toEqual([1, 2, 3]);
  });

  it('array vazio retorna ranking vazio', () => {
    const r = rankTopCollectors([]);
    expect(r.totalCount).toBe(0);
    expect(r.entries.length).toBe(0);
  });

  it('category = top-collectors', () => {
    expect(rankTopCollectors([]).category).toBe('top-collectors');
  });

  it('resultado é imutável', () => {
    const r = rankTopCollectors([collector('A', 'A')]);
    expect(Object.isFrozen(r)).toBe(true);
    expect(Object.isFrozen(r.entries)).toBe(true);
    expect(Object.isFrozen(r.entries[0])).toBe(true);
  });
});

// ─── rankTopWins ──────────────────────────────────────────────────────────────

describe('rankTopWins — Maior Sequência de Vitórias (doc 10 §21)', () => {
  it('ordena por bestWinStreak DESC', () => {
    const data = [
      wins('A', 'Alice', { bestWinStreak: 5 }),
      wins('B', 'Bob',   { bestWinStreak: 15 }),
      wins('C', 'Carol', { bestWinStreak: 10 }),
    ];
    const r = rankTopWins(data);
    expect(r.entries[0]?.profileId).toBe('B');
    expect(r.entries[1]?.profileId).toBe('C');
    expect(r.entries[2]?.profileId).toBe('A');
  });

  it('desempate: totalRankedWins DESC (TC-HOF-05)', () => {
    const data = [
      wins('A', 'Alice', { bestWinStreak: 10, totalRankedWins: 50 }),
      wins('B', 'Bob',   { bestWinStreak: 10, totalRankedWins: 80 }),
    ];
    const r = rankTopWins(data);
    expect(r.entries[0]?.profileId).toBe('B');
  });

  it('desempate: totalRankedMatches DESC (TC-HOF-05)', () => {
    const data = [
      wins('A', 'Alice', { bestWinStreak: 10, totalRankedWins: 50, totalRankedMatches: 200 }),
      wins('B', 'Bob',   { bestWinStreak: 10, totalRankedWins: 50, totalRankedMatches: 300 }),
    ];
    const r = rankTopWins(data);
    expect(r.entries[0]?.profileId).toBe('B');
  });

  it('desempate final: displayName ASC', () => {
    const data = [
      wins('B', 'Zeta', { bestWinStreak: 10, totalRankedWins: 50, totalRankedMatches: 200 }),
      wins('A', 'Abel', { bestWinStreak: 10, totalRankedWins: 50, totalRankedMatches: 200 }),
    ];
    const r = rankTopWins(data);
    expect(r.entries[0]?.displayName).toBe('Abel');
  });

  it('category = top-wins', () => {
    expect(rankTopWins([]).category).toBe('top-wins');
  });

  it('não muta o array original', () => {
    const data = [
      wins('A', 'Alice', { bestWinStreak: 5 }),
      wins('B', 'Bob',   { bestWinStreak: 15 }),
    ];
    const originalFirst = data[0]?.profileId;
    rankTopWins(data);
    expect(data[0]?.profileId).toBe(originalFirst);
  });
});

// ─── rankTopSeasons ───────────────────────────────────────────────────────────

describe('rankTopSeasons — Top Temporadas (doc 06 §3.2)', () => {
  it('ordena por seasonsAsWorldLegend DESC', () => {
    const data = [
      season('A', 'Alice', { seasonsAsWorldLegend: 2 }),
      season('B', 'Bob',   { seasonsAsWorldLegend: 5 }),
      season('C', 'Carol', { seasonsAsWorldLegend: 3 }),
    ];
    const r = rankTopSeasons(data);
    expect(r.entries[0]?.profileId).toBe('B');
    expect(r.entries[1]?.profileId).toBe('C');
    expect(r.entries[2]?.profileId).toBe('A');
  });

  it('desempate: seasonsPlayed DESC', () => {
    const data = [
      season('A', 'Alice', { seasonsAsWorldLegend: 3, seasonsPlayed: 8 }),
      season('B', 'Bob',   { seasonsAsWorldLegend: 3, seasonsPlayed: 12 }),
    ];
    const r = rankTopSeasons(data);
    expect(r.entries[0]?.profileId).toBe('B');
  });

  it('desempate: bestGlobalRank ASC (menor rank = melhor posição — TC-HOF-05)', () => {
    const data = [
      season('A', 'Alice', { seasonsAsWorldLegend: 3, seasonsPlayed: 10, bestGlobalRank: 5 }),
      season('B', 'Bob',   { seasonsAsWorldLegend: 3, seasonsPlayed: 10, bestGlobalRank: 1 }),
    ];
    const r = rankTopSeasons(data);
    expect(r.entries[0]?.profileId).toBe('B'); // rank 1 > rank 5
  });

  it('category = top-seasons', () => {
    expect(rankTopSeasons([]).category).toBe('top-seasons');
  });
});

// ─── rankTopGoats ─────────────────────────────────────────────────────────────

describe('rankTopGoats — Mais GOATs Desbloqueados (doc 10 §21)', () => {
  it('ordena por goatCount DESC', () => {
    const data = [goat('A', 'Alice', 1), goat('B', 'Bob', 3), goat('C', 'Carol', 2)];
    const r = rankTopGoats(data);
    expect(r.entries[0]?.profileId).toBe('B');
    expect(r.entries[1]?.profileId).toBe('C');
    expect(r.entries[2]?.profileId).toBe('A');
  });

  it('desempate: displayName ASC (TC-HOF-05)', () => {
    const data = [goat('B', 'Zeta', 2), goat('A', 'Abel', 2)];
    const r = rankTopGoats(data);
    expect(r.entries[0]?.displayName).toBe('Abel');
  });

  it('jogador sem GOATs aparece no final', () => {
    const data = [goat('A', 'Alice', 0), goat('B', 'Bob', 2)];
    const r = rankTopGoats(data);
    expect(r.entries[0]?.profileId).toBe('B');
    expect(r.entries[1]?.profileId).toBe('A');
  });

  it('category = top-goats', () => {
    expect(rankTopGoats([]).category).toBe('top-goats');
  });

  it('snapshot é preservado na entrada', () => {
    const snap = goat('A', 'Alice', 3);
    const r = rankTopGoats([snap]);
    expect(r.entries[0]?.snapshot.goatCount).toBe(3);
    expect(r.entries[0]?.snapshot.goatCardIds.length).toBe(3);
  });
});

// ─── rankTopAlbum ─────────────────────────────────────────────────────────────

describe('rankTopAlbum — Primeiro a Completar Álbum (doc 10 §21)', () => {
  it('ordena por albumsCompleted DESC', () => {
    const data = [
      collector('A', 'Alice', { albumsCompleted: 1 }),
      collector('B', 'Bob',   { albumsCompleted: 4 }),
      collector('C', 'Carol', { albumsCompleted: 2 }),
    ];
    const r = rankTopAlbum(data);
    expect(r.entries[0]?.profileId).toBe('B');
  });

  it('desempate: bestAlbumCompletion DESC (TC-HOF-05)', () => {
    const data = [
      collector('A', 'Alice', { albumsCompleted: 1, bestAlbumCompletion: 0.6 }),
      collector('B', 'Bob',   { albumsCompleted: 1, bestAlbumCompletion: 0.95 }),
    ];
    const r = rankTopAlbum(data);
    expect(r.entries[0]?.profileId).toBe('B');
  });

  it('desempate final: displayName ASC', () => {
    const data = [
      collector('B', 'Zeta', { albumsCompleted: 2, bestAlbumCompletion: 0.8 }),
      collector('A', 'Abel', { albumsCompleted: 2, bestAlbumCompletion: 0.8 }),
    ];
    const r = rankTopAlbum(data);
    expect(r.entries[0]?.displayName).toBe('Abel');
  });

  it('category = top-album', () => {
    expect(rankTopAlbum([]).category).toBe('top-album');
  });
});

// ─── TC-HOF-05 — garantias gerais de consistência ────────────────────────────

describe('TC-HOF-05 — Ranking global: ordenação consistente e determinística', () => {
  it('mesmos dados → mesma ordem em 5 chamadas consecutivas', () => {
    const data = [
      wins('A', 'Alice', { bestWinStreak: 10 }),
      wins('B', 'Bob',   { bestWinStreak: 5 }),
      wins('C', 'Carol', { bestWinStreak: 15 }),
    ];
    const firstOrder = rankTopWins(data).entries.map((e) => e.profileId);
    for (let i = 0; i < 4; i++) {
      const order = rankTopWins(data).entries.map((e) => e.profileId);
      expect(order).toEqual(firstOrder);
    }
  });

  it('nenhuma função muta o array de entrada', () => {
    const collectorData = [collector('A', 'A'), collector('B', 'B')];
    const winsData      = [wins('A', 'A'), wins('B', 'B')];
    const seasonData    = [season('A', 'A'), season('B', 'B')];
    const goatData      = [goat('A', 'A', 1), goat('B', 'B', 2)];

    const c0 = collectorData[0]?.profileId;
    const w0 = winsData[0]?.profileId;
    const s0 = seasonData[0]?.profileId;
    const g0 = goatData[0]?.profileId;

    rankTopCollectors(collectorData);
    rankTopWins(winsData);
    rankTopSeasons(seasonData);
    rankTopGoats(goatData);

    expect(collectorData[0]?.profileId).toBe(c0);
    expect(winsData[0]?.profileId).toBe(w0);
    expect(seasonData[0]?.profileId).toBe(s0);
    expect(goatData[0]?.profileId).toBe(g0);
  });
});
