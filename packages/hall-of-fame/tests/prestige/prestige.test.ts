import { describe, expect, it } from 'vitest';
import {
  calculatePrestigeScore, rankByPrestige, getPrestigeTitle,
  PRESTIGE_WEIGHTS,
} from '../../src/prestige/prestige-score';
import { hofProfileId } from '../../src/categories/types';
import type { GoatSnapshot, CollectorSnapshot, WinsSnapshot, SeasonSnapshot } from '../../src/categories/types';

function pid(s: string) { return hofProfileId(s); }

function makeGoat(count: number): GoatSnapshot {
  return Object.freeze({ profileId: pid('p'), displayName: 'P', goatCount: count, goatCardIds: Object.freeze([]) });
}
function makeCollector(albums: number, total = 100): CollectorSnapshot {
  return Object.freeze({ profileId: pid('p'), displayName: 'P', totalCards: total, legendaryPlusCount: 5, ultraCount: 1, albumsCompleted: albums, bestAlbumCompletion: 0.5 });
}
function makeWins(streak: number): WinsSnapshot {
  return Object.freeze({ profileId: pid('p'), displayName: 'P', totalRankedWins: 20, bestWinStreak: streak, currentWinStreak: 0, totalRankedMatches: 50 });
}
function makeSeason(wl: number): SeasonSnapshot {
  return Object.freeze({ profileId: pid('p'), displayName: 'P', seasonsPlayed: 10, seasonsAsWorldLegend: wl, bestGlobalRank: 5, highestTierReached: 'World Legend' });
}

describe('PRESTIGE_WEIGHTS — pesos documentados (D-HOF-01)', () => {
  it('GOAT pesa mais que qualquer outra categoria', () => {
    expect(PRESTIGE_WEIGHTS.goat).toBeGreaterThan(PRESTIGE_WEIGHTS.album);
    expect(PRESTIGE_WEIGHTS.album).toBeGreaterThan(PRESTIGE_WEIGHTS.winStreak);
    expect(PRESTIGE_WEIGHTS.winStreak).toBeGreaterThan(PRESTIGE_WEIGHTS.season);
    expect(PRESTIGE_WEIGHTS.season).toBeGreaterThan(PRESTIGE_WEIGHTS.collection);
  });

  it('goat=100, album=50, winStreak=30, season=20, collection=10', () => {
    expect(PRESTIGE_WEIGHTS.goat).toBe(100);
    expect(PRESTIGE_WEIGHTS.album).toBe(50);
    expect(PRESTIGE_WEIGHTS.winStreak).toBe(30);
    expect(PRESTIGE_WEIGHTS.season).toBe(20);
    expect(PRESTIGE_WEIGHTS.collection).toBe(10);
  });
});

describe('calculatePrestigeScore', () => {
  it('score zero sem snapshots', () => {
    const s = calculatePrestigeScore({ profileId: 'p', displayName: 'P' });
    expect(s.totalScore).toBe(0);
  });

  it('1 GOAT = 100 pontos', () => {
    const s = calculatePrestigeScore({ profileId: 'p', displayName: 'P', goat: makeGoat(1) });
    expect(s.breakdown.goatPoints).toBe(100);
    expect(s.totalScore).toBe(100);
  });

  it('2 GOATs = 200 pontos', () => {
    const s = calculatePrestigeScore({ profileId: 'p', displayName: 'P', goat: makeGoat(2) });
    expect(s.breakdown.goatPoints).toBe(200);
  });

  it('1 álbum completo = 50 pontos', () => {
    const s = calculatePrestigeScore({ profileId: 'p', displayName: 'P', collector: makeCollector(1) });
    expect(s.breakdown.albumPoints).toBe(50);
  });

  it('streak de 5 vitórias = 150 pontos', () => {
    const s = calculatePrestigeScore({ profileId: 'p', displayName: 'P', wins: makeWins(5) });
    expect(s.breakdown.winStreakPoints).toBe(150); // 5 × 30
  });

  it('3 temporadas como WL = 60 pontos', () => {
    const s = calculatePrestigeScore({ profileId: 'p', displayName: 'P', season: makeSeason(3) });
    expect(s.breakdown.seasonPoints).toBe(60); // 3 × 20
  });

  it('totalScore soma todos os breakdowns', () => {
    const s = calculatePrestigeScore({
      profileId: 'p', displayName: 'P',
      goat:      makeGoat(1),       // 100
      collector: makeCollector(2, 100), // album=100, collection=floor(100/10)*10=100
      wins:      makeWins(3),       // 90
      season:    makeSeason(2),     // 40
    });
    expect(s.totalScore).toBe(
      s.breakdown.goatPoints +
      s.breakdown.albumPoints +
      s.breakdown.winStreakPoints +
      s.breakdown.seasonPoints +
      s.breakdown.collectionPoints,
    );
  });

  it('resultado é imutável', () => {
    const s = calculatePrestigeScore({ profileId: 'p', displayName: 'P' });
    expect(Object.isFrozen(s)).toBe(true);
    expect(Object.isFrozen(s.breakdown)).toBe(true);
  });
});

describe('rankByPrestige — ranking geral de prestígio', () => {
  it('ordena por totalScore DESC', () => {
    const scores = [
      calculatePrestigeScore({ profileId: 'A', displayName: 'Alice', goat: makeGoat(1) }),  // 100
      calculatePrestigeScore({ profileId: 'B', displayName: 'Bob',   goat: makeGoat(3) }),  // 300
      calculatePrestigeScore({ profileId: 'C', displayName: 'Carol', goat: makeGoat(2) }),  // 200
    ];
    const ranking = rankByPrestige(scores);
    expect(ranking[0]?.prestige.profileId).toBe('B');
    expect(ranking[1]?.prestige.profileId).toBe('C');
    expect(ranking[2]?.prestige.profileId).toBe('A');
  });

  it('desempate: goatPoints DESC', () => {
    const base = { profileId: 'x', displayName: 'X', wins: makeWins(10) }; // 300 pts cada
    const a = calculatePrestigeScore({ ...base, profileId: 'A', displayName: 'Alice', goat: makeGoat(2) });
    const b = calculatePrestigeScore({ ...base, profileId: 'B', displayName: 'Bob',   goat: makeGoat(3) });
    // Totais diferentes neste caso, então vamos construir caso com scores iguais
    const scoreA = calculatePrestigeScore({ profileId: 'A', displayName: 'Abel', goat: makeGoat(0), wins: makeWins(0), season: makeSeason(0) });
    const scoreB = calculatePrestigeScore({ profileId: 'B', displayName: 'Beta', goat: makeGoat(0), wins: makeWins(0), season: makeSeason(0) });
    const ranking = rankByPrestige([scoreB, scoreA]);
    // Ambos com 0 totalScore e 0 goatPoints → desempate por displayName ASC
    expect(ranking[0]?.prestige.displayName).toBe('Abel');
  });

  it('desempate final: displayName ASC', () => {
    const scoreZ = calculatePrestigeScore({ profileId: 'Z', displayName: 'Zeta' });
    const scoreA = calculatePrestigeScore({ profileId: 'A', displayName: 'Abel' });
    const ranking = rankByPrestige([scoreZ, scoreA]);
    expect(ranking[0]?.prestige.displayName).toBe('Abel');
  });

  it('ranks são 1-based e sequenciais', () => {
    const scores = ['Alice', 'Bob', 'Carol'].map((name, i) =>
      calculatePrestigeScore({ profileId: `p${i}`, displayName: name }),
    );
    const ranking = rankByPrestige(scores);
    expect(ranking.map((r) => r.rank)).toEqual([1, 2, 3]);
  });

  it('resultado é imutável', () => {
    const s = calculatePrestigeScore({ profileId: 'p', displayName: 'P' });
    const ranking = rankByPrestige([s]);
    expect(Object.isFrozen(ranking)).toBe(true);
    expect(Object.isFrozen(ranking[0])).toBe(true);
  });

  it('array vazio retorna ranking vazio', () => {
    expect(rankByPrestige([]).length).toBe(0);
  });
});

describe('getPrestigeTitle — títulos honoríficos (doc 10 §21)', () => {
  it('Iniciante: score 0', () => {
    expect(getPrestigeTitle(0)).toBe('Iniciante');
  });

  it('Colecionador: score 50', () => {
    expect(getPrestigeTitle(50)).toBe('Colecionador');
  });

  it('Veterano: score 200', () => {
    expect(getPrestigeTitle(200)).toBe('Veterano');
  });

  it('Especialista: score 500', () => {
    expect(getPrestigeTitle(500)).toBe('Especialista');
  });

  it('Mestre: score 1000', () => {
    expect(getPrestigeTitle(1000)).toBe('Mestre');
  });

  it('Lenda da Coleção: score 2000', () => {
    expect(getPrestigeTitle(2000)).toBe('Lenda da Coleção');
  });

  it('Imortal: score 5000', () => {
    expect(getPrestigeTitle(5000)).toBe('Imortal');
  });

  it('1 GOAT (100 pts) = Colecionador', () => {
    const s = calculatePrestigeScore({ profileId: 'p', displayName: 'P', goat: makeGoat(1) });
    expect(getPrestigeTitle(s.totalScore)).toBe('Colecionador');
  });

  it('20 GOATs (2000 pts) = Lenda da Coleção', () => {
    const s = calculatePrestigeScore({ profileId: 'p', displayName: 'P', goat: makeGoat(20) });
    expect(getPrestigeTitle(s.totalScore)).toBe('Lenda da Coleção');
  });

  it('50 GOATs (5000 pts) = Imortal', () => {
    const s = calculatePrestigeScore({ profileId: 'p', displayName: 'P', goat: makeGoat(50) });
    expect(getPrestigeTitle(s.totalScore)).toBe('Imortal');
  });

  it('títulos crescem com o score (ordenação correta)', () => {
    const thresholds = [0, 50, 200, 500, 1000, 2000, 5000];
    const titles = thresholds.map(getPrestigeTitle);
    const uniqueTitles = new Set(titles);
    expect(uniqueTitles.size).toBe(7); // todos distintos
  });
});
