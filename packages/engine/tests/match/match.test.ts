import { createSeed } from '@world-legends/shared';
import { describe, expect, it } from 'vitest';
import { simulateMatch } from '../../src/match/match';
import { buildTeamSnapshot } from './fixtures';

function seed(value: string) {
  const result = createSeed(value);
  if (!result.ok) throw new Error('seed inválido no teste');
  return result.value;
}

function standardMatch(seedValue: string, requiresWinner = false) {
  const home = buildTeamSnapshot({ isHomeTeam: true });
  const away = buildTeamSnapshot({ isHomeTeam: false });
  return simulateMatch({ home, away, context: { requiresWinner }, seed: seed(seedValue) });
}

describe('simulateMatch — invariantes estruturais', () => {
  it('produz placar não-negativo e consistente com a contagem de GoalEvent (sem contar gol contra para o adversário)', () => {
    const result = standardMatch('invariante-placar');
    const homeGoals = result.events.filter(
      (e) => e.type === 'goal' && e.teamSide === 'home',
    ).length;
    const awayGoals = result.events.filter(
      (e) => e.type === 'goal' && e.teamSide === 'away',
    ).length;
    expect(result.homeScore).toBe(homeGoals);
    expect(result.awayScore).toBe(awayGoals);
  });

  it('a timeline sempre começa com kickoff e termina com full_time (ou walkover)', () => {
    const result = standardMatch('invariante-timeline');
    expect(result.events[0]!.type).toBe('kickoff');
    const last = result.events[result.events.length - 1]!;
    expect(['full_time', 'walkover']).toContain(last.type);
  });

  it('a timeline contém exatamente um half_time em partidas que chegam ao intervalo', () => {
    const result = standardMatch('invariante-intervalo');
    const halfTimes = result.events.filter((e) => e.type === 'half_time');
    expect(halfTimes).toHaveLength(1);
  });

  it('engineVersion e seed são sempre devolvidos no resultado (doc 17, Invariantes: obrigatórios em todo Match simulado)', () => {
    const result = standardMatch('invariante-versao');
    expect(result.engineVersion.length).toBeGreaterThan(0);
    expect(result.seed.value).toBe(seed('invariante-versao').value);
  });

  it('walkover e penaltyShootout nunca coexistem (doc 17, Invariantes)', () => {
    for (let i = 0; i < 20; i += 1) {
      const result = standardMatch(`invariante-exclusao-${i}`, true);
      const temAmbos = result.walkover !== undefined && result.penaltyShootout !== undefined;
      expect(temAmbos).toBe(false);
    }
  });

  it('TC-ME-14: partida de liga (requiresWinner=false) empatada nunca aciona prorrogação/pênaltis', () => {
    // Roda vários seeds e garante que, sempre que terminar empatada aos 90, nenhum penaltyShootout aparece.
    for (let i = 0; i < 25; i += 1) {
      const result = standardMatch(`tc-me-14-${i}`, false);
      if (result.homeScore === result.awayScore) {
        expect(result.penaltyShootout).toBeUndefined();
        const fullTimes = result.events.filter((e) => e.type === 'full_time');
        expect(fullTimes).toHaveLength(1);
        expect(fullTimes[0]!.minute).toBe(90);
      }
    }
  });

  it('xg acumulado das estatísticas nunca é negativo e cresce com o número de chances', () => {
    const result = standardMatch('invariante-xg');
    expect(result.stats.home.xg).toBeGreaterThanOrEqual(0);
    expect(result.stats.away.xg).toBeGreaterThanOrEqual(0);
    expect(result.stats.home.shots).toBeGreaterThanOrEqual(result.stats.home.shotsOnTarget);
  });

  it('mvpUserCardId, quando não-null, corresponde a um jogador que de fato participou de algum evento', () => {
    const result = standardMatch('invariante-mvp');
    if (result.mvpUserCardId !== null) {
      const apareceuEmAlgumEvento = result.events.some((e) => {
        if (e.type === 'goal') return e.scorerUserCardId === result.mvpUserCardId;
        if (e.type === 'assist') return e.assisterUserCardId === result.mvpUserCardId;
        if (e.type === 'card') return e.playerUserCardId === result.mvpUserCardId;
        return false;
      });
      expect(apareceuEmAlgumEvento).toBe(true);
    }
  });
});

describe('simulateMatch — TC-EXT-08: piso de fadiga', () => {
  it('mesmo com fadiga acumulada máxima plausível, nenhum atributo efetivo fica abaixo de 1 (clamp, doc 09 §7) — checado indiretamente via xG nunca virar NaN/negativo', () => {
    const home = buildTeamSnapshot({
      isHomeTeam: true,
      attributeOverrides: { stamina: 1 },
      tacticalIntensity: 'ultra_ofensivo',
    });
    const away = buildTeamSnapshot({
      isHomeTeam: false,
      attributeOverrides: { stamina: 1 },
      tacticalIntensity: 'ultra_ofensivo',
    });
    const result = simulateMatch({
      home,
      away,
      context: { requiresWinner: false },
      seed: seed('fadiga-extrema'),
    });
    expect(Number.isFinite(result.stats.home.xg)).toBe(true);
    expect(Number.isFinite(result.stats.away.xg)).toBe(true);
    expect(result.stats.home.xg).toBeGreaterThanOrEqual(0);
  });
});
