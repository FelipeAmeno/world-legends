import { describe, expect, it } from 'vitest';
import { ELO_INITIAL } from '../../src/elo/calculate-rating';
import { eloRating } from '../../src/elo/calculate-rating';
import {
  REGRESSION_FACTOR,
  applySeasonReset,
  closeSeason,
  createPlayerRanking,
  createSeason,
  openSeason,
  seasonId,
  seasonReset,
  updatePlayerRanking,
} from '../../src/season/season-reset';

const SID = seasonId('season-2025-01');
const SID2 = seasonId('season-2025-02');

const FUTURE = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
const END = new Date(Date.now() + 1000 * 60 * 60 * 24 * 42);

describe('createSeason — invariantes (doc 17 §14)', () => {
  it('cria season com status baseado nas datas', () => {
    const r = createSeason({ id: 'szn', name: 'Temporada 1', startDate: FUTURE, endDate: END });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.status).toBe('upcoming');
  });

  it('rejeita endDate <= startDate', () => {
    const r = createSeason({ id: 'szn', name: 'X', startDate: END, endDate: FUTURE });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe('InvalidDateRange');
  });

  it('rejeita name vazio', () => {
    const r = createSeason({ id: 'szn', name: '', startDate: FUTURE, endDate: END });
    expect(r.ok).toBe(false);
  });

  it('season ativa quando agora está entre start e end', () => {
    const past = new Date(Date.now() - 1000 * 60);
    const future = new Date(Date.now() + 1000 * 60);
    const r = createSeason({ id: 'szn', name: 'X', startDate: past, endDate: future });
    if (r.ok) expect(r.value.status).toBe('active');
  });
});

describe('openSeason / closeSeason', () => {
  it('openSeason ativa uma season upcoming', () => {
    const s = createSeason({ id: 'szn', name: 'X', startDate: FUTURE, endDate: END });
    if (!s.ok) throw new Error();
    const r = openSeason(s.value);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.status).toBe('active');
  });

  it('closeSeason encerra uma season', () => {
    const s = createSeason({ id: 'szn', name: 'X', startDate: FUTURE, endDate: END });
    if (!s.ok) throw new Error();
    const opened = openSeason(s.value);
    if (!opened.ok) throw new Error();
    const r = closeSeason(opened.value);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.status).toBe('closed');
  });

  it('rejeita closeSeason de season já encerrada', () => {
    const s = createSeason({ id: 'szn', name: 'X', startDate: FUTURE, endDate: END });
    if (!s.ok) throw new Error();
    const opened = openSeason(s.value);
    if (!opened.ok) throw new Error();
    const closed = closeSeason(opened.value);
    if (!closed.ok) throw new Error();
    expect(closeSeason(closed.value).ok).toBe(false);
  });
});

describe('createPlayerRanking', () => {
  it('começa com ELO_INITIAL (Prata)', () => {
    const r = createPlayerRanking({ id: 'r1', profileId: 'p1', seasonId: SID });
    expect(r.eloRating).toBe(ELO_INITIAL);
    expect(r.tier).toBe('Prata');
    expect(r.wins).toBe(0);
    expect(r.totalMatches).toBe(0);
  });

  it('aceita rating inicial customizado', () => {
    const r = createPlayerRanking({
      id: 'r1',
      profileId: 'p1',
      seasonId: SID,
      initialRating: 2500,
    });
    expect(r.tier).toBe('Lenda');
  });

  it('é imutável', () => {
    const r = createPlayerRanking({ id: 'r1', profileId: 'p1', seasonId: SID });
    expect(Object.isFrozen(r)).toBe(true);
  });
});

describe('updatePlayerRanking', () => {
  it('atualiza eloRating, tier e contadores corretamente', () => {
    const r = createPlayerRanking({ id: 'r1', profileId: 'p1', seasonId: SID });
    const updated = updatePlayerRanking(r, eloRating(1500), 'win');
    expect(updated.eloRating).toBe(1500);
    expect(updated.tier).toBe('Ouro');
    expect(updated.wins).toBe(1);
    expect(updated.totalMatches).toBe(1);
  });

  it('não muta o ranking original', () => {
    const r = createPlayerRanking({ id: 'r1', profileId: 'p1', seasonId: SID });
    updatePlayerRanking(r, eloRating(1500), 'win');
    expect(r.wins).toBe(0);
  });
});

describe('seasonReset — regressão à média (doc 06 §3.2)', () => {
  it('REGRESSION_FACTOR = 20%', () => {
    expect(REGRESSION_FACTOR).toBe(0.2);
  });

  it('jogador com ELO_INITIAL não perde nem ganha no reset', () => {
    const r = createPlayerRanking({ id: 'r1', profileId: 'p1', seasonId: SID });
    const reset = seasonReset(r);
    // 1000 - 0.20 × (1000-1000) = 1000 → sem mudança
    expect(reset.newRating).toBe(ELO_INITIAL);
    expect(reset.delta).toBe(0);
  });

  it('Lenda (2500) volta ~20% em direção ao inicial após reset', () => {
    const r = createPlayerRanking({
      id: 'r1',
      profileId: 'p1',
      seasonId: SID,
      initialRating: 2500,
    });
    const reset = seasonReset(r);
    // 2500 - 0.20 × (2500 - 1000) = 2500 - 300 = 2200
    expect(reset.newRating).toBe(2200);
    expect(reset.newTier).toBe('Elite');
    expect(reset.oldTier).toBe('Lenda');
  });

  it('World Legend (3000) regride para Lenda', () => {
    const r = createPlayerRanking({
      id: 'r1',
      profileId: 'p1',
      seasonId: SID,
      initialRating: 3000,
    });
    const reset = seasonReset(r);
    // 3000 - 0.20 × (3000 - 1000) = 3000 - 400 = 2600 → Lenda
    expect(reset.newRating).toBe(2600);
    expect(reset.newTier).toBe('Lenda');
  });

  it('jogador abaixo do inicial cresce levemente no reset', () => {
    const r = createPlayerRanking({ id: 'r1', profileId: 'p1', seasonId: SID, initialRating: 800 });
    const reset = seasonReset(r);
    // 800 - 0.20 × (800 - 1000) = 800 + 40 = 840
    expect(reset.newRating).toBe(840);
    expect(reset.delta).toBeGreaterThan(0);
  });

  it('resultado do reset é imutável', () => {
    const r = createPlayerRanking({ id: 'r1', profileId: 'p1', seasonId: SID });
    expect(Object.isFrozen(seasonReset(r))).toBe(true);
  });
});

describe('applySeasonReset — batch reset para nova temporada', () => {
  it('retorna novos rankings para a nova season com ratings ajustados', () => {
    const rankings = [
      createPlayerRanking({ id: 'r1', profileId: 'p1', seasonId: SID, initialRating: 2500 }),
      createPlayerRanking({ id: 'r2', profileId: 'p2', seasonId: SID, initialRating: 1000 }),
    ];
    const newRankings = applySeasonReset(rankings, SID2);
    expect(newRankings.length).toBe(2);
    // Todos zerados em wins/draws/losses
    newRankings.forEach((r) => {
      expect(r.seasonId).toBe(SID2);
      expect(r.wins).toBe(0);
      expect(r.totalMatches).toBe(0);
    });
    // p1 (2500) → 2200
    const p1 = newRankings.find((r) => r.profileId === 'p1');
    expect(p1?.eloRating).toBe(2200);
  });
});
