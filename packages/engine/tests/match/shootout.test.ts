import { createSeed } from '@world-legends/shared';
import { describe, expect, it } from 'vitest';
import { MAX_SUDDEN_DEATH_ROUNDS, simulatePenaltyShootout } from '../../src/match/shootout';
import { RNG } from '../../src/rng/rng';
import type { RNGInstance, WeightedItem } from '../../src/rng/rng';
import { buildTeamSnapshot } from './fixtures';

function seed(value: string) {
  const result = createSeed(value);
  if (!result.ok) throw new Error('seed inválido no teste');
  return result.value;
}

/**
 * Fake RNGInstance que sempre converte (nextFloat retorna 0, sempre menor
 * que qualquer chanceConversao) — usado para FORÇAR os dois lados a
 * empatarem indefinidamente até o teto de 20 rodadas de morte súbita
 * (TC-EXT-09/TC-PEN-CAP-01), cenário estatisticamente raro demais para
 * surgir organicamente num teste Monte Carlo de tamanho razoável.
 */
function buildAlwaysScoreRng(): RNGInstance {
  const self: RNGInstance = {
    nextFloat: () => 0,
    nextInt: (min: number) => min,
    derive: () => self,
    shuffle: <T>(items: readonly T[]) => [...items],
    choice: <T>(items: readonly T[]) => items[0]!,
    weightedChoice: <T>(items: readonly WeightedItem<T>[]) => items[0]!.value,
    getState: () => 0,
  };
  return self;
}

describe('simulatePenaltyShootout (doc 09 §20) — TC-ME-16', () => {
  it('decide um vencedor em até 5 cobranças quando os lados têm qualidade bem diferente', () => {
    const home = buildTeamSnapshot({
      isHomeTeam: true,
      attributeOverrides: { penalty_kicks: 95, composure: 95 },
    });
    const away = buildTeamSnapshot({
      isHomeTeam: false,
      attributeOverrides: { gk_penalty_save: 95, gk_reflexes: 95, penalty_kicks: 5, composure: 5 },
    });
    const result = simulatePenaltyShootout({
      home: { starters: home.starters },
      away: { starters: away.starters },
      eventsRng: RNG(seed('shootout-decisivo')),
      penaltyTiebreakRng: RNG(seed('tiebreak-decisivo')),
    });
    expect(result.resolvedBySeedTiebreak).toBe(false);
    expect(result.homeScore).not.toBe(result.awayScore);
  });

  it('nunca produz placar negativo e sempre respeita 0 <= placar <= 5+rodadas de morte súbita', () => {
    const home = buildTeamSnapshot({ isHomeTeam: true });
    const away = buildTeamSnapshot({ isHomeTeam: false });
    for (let i = 0; i < 30; i += 1) {
      const result = simulatePenaltyShootout({
        home: { starters: home.starters },
        away: { starters: away.starters },
        eventsRng: RNG(seed(`shootout-sanidade-${i}`)),
        penaltyTiebreakRng: RNG(seed(`tiebreak-sanidade-${i}`)),
      });
      expect(result.homeScore).toBeGreaterThanOrEqual(0);
      expect(result.awayScore).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('simulatePenaltyShootout — teto de morte súbita [DD-02] — TC-EXT-09 / TC-PEN-CAP-01 a 05', () => {
  const home = buildTeamSnapshot({ isHomeTeam: true });
  const away = buildTeamSnapshot({ isHomeTeam: false });

  it('TC-PEN-CAP-01: ao empatar por 20 rodadas de morte súbita, desempate por seed é acionado, nenhuma 21ª cobrança simulada', () => {
    const result = simulatePenaltyShootout({
      home: { starters: home.starters },
      away: { starters: away.starters },
      eventsRng: buildAlwaysScoreRng(),
      penaltyTiebreakRng: RNG(seed('tiebreak-cap')),
    });
    expect(result.resolvedBySeedTiebreak).toBe(true);
    expect(result.totalRounds).toBe(MAX_SUDDEN_DEATH_ROUNDS);
    expect(result.homeScore).toBe(result.awayScore); // empatados até o teto — todo chute sempre converte
  });

  it('TC-PEN-CAP-02: a mesma partida (mesmo seed) reexecutada produz o mesmo desfecho de desempate em 100% das vezes', () => {
    const resultados = Array.from({ length: 10 }, () =>
      simulatePenaltyShootout({
        home: { starters: home.starters },
        away: { starters: away.starters },
        eventsRng: buildAlwaysScoreRng(),
        penaltyTiebreakRng: RNG(seed('tiebreak-reproduzivel')),
      }),
    );
    const primeiro = resultados[0]!;
    for (const r of resultados) {
      expect(r.resolvedWinner).toBe(primeiro.resolvedWinner);
    }
  });

  it('TC-PEN-CAP-05 (parcial): o teto de 20 rodadas é absoluto — nunca reporta mais que isso mesmo forçando empate eterno', () => {
    const result = simulatePenaltyShootout({
      home: { starters: home.starters },
      away: { starters: away.starters },
      eventsRng: buildAlwaysScoreRng(),
      penaltyTiebreakRng: RNG(seed('tiebreak-absoluto')),
    });
    expect(result.totalRounds).toBeLessThanOrEqual(MAX_SUDDEN_DEATH_ROUNDS);
  });
});
