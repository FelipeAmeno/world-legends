import { createSeed } from '@world-legends/shared';
import { describe, expect, it } from 'vitest';
import { ENGINE_VERSION, simulateMatch } from '../../src/match/match';
import { buildTeamSnapshot } from './fixtures';

function seed(value: string) {
  const result = createSeed(value);
  if (!result.ok) throw new Error('seed inválido no teste');
  return result.value;
}

describe('Replay idêntico com mesmo seed — TC-REPRO-01, TC-REPRO-04, TC-REPRO-05', () => {
  function runTwice(seedValue: string, requiresWinner: boolean) {
    const home = buildTeamSnapshot({ isHomeTeam: true });
    const away = buildTeamSnapshot({ isHomeTeam: false });
    const context = { requiresWinner };
    const a = simulateMatch({ home, away, context, seed: seed(seedValue) });
    const b = simulateMatch({ home, away, context, seed: seed(seedValue) });
    return { a, b };
  }

  it('TC-REPRO-01: mesmo seed, executado 2x, produz resultado idêntico byte a byte — placar, eventos, estatísticas, MVP', () => {
    const { a, b } = runTwice('replay-padrao', false);
    expect(a).toEqual(b);
  });

  it('o mesmo vale em cenário de prorrogação + disputa de pênaltis (mais streams de RNG em jogo)', () => {
    const { a, b } = runTwice('replay-prorrogacao', true);
    expect(a).toEqual(b);
  });

  it('TC-REPRO-01, repetido 20x consecutivas (não só 2x) — 100% das execuções idênticas', () => {
    const home = buildTeamSnapshot({ isHomeTeam: true });
    const away = buildTeamSnapshot({ isHomeTeam: false });
    const context = { requiresWinner: true };
    const primeiro = simulateMatch({ home, away, context, seed: seed('replay-20x') });
    for (let i = 0; i < 20; i += 1) {
      const repeticao = simulateMatch({ home, away, context, seed: seed('replay-20x') });
      expect(repeticao).toEqual(primeiro);
    }
  });

  it('TC-REPRO-02: seeds DIFERENTES, mesmos squads, podem (e devem, ao longo de várias tentativas) produzir resultados diferentes', () => {
    const home = buildTeamSnapshot({ isHomeTeam: true });
    const away = buildTeamSnapshot({ isHomeTeam: false });
    const placares = new Set<string>();
    for (let i = 0; i < 15; i += 1) {
      const result = simulateMatch({
        home,
        away,
        context: { requiresWinner: false },
        seed: seed(`repro-02-${i}`),
      });
      placares.add(`${result.homeScore}-${result.awayScore}`);
    }
    expect(placares.size).toBeGreaterThan(1);
  });

  it('TC-REPRO-05 (simulado): reexecutar com o seed gravado reproduz exatamente o resultado original, "anos depois" — não há nenhum estado externo (relógio, contador global) que possa alterar o resultado', () => {
    const home = buildTeamSnapshot({ isHomeTeam: true });
    const away = buildTeamSnapshot({ isHomeTeam: false });
    const gravadoOriginalmente = simulateMatch({
      home,
      away,
      context: { requiresWinner: false },
      seed: seed('auditoria-futura'),
    });
    // simula "passagem de tempo" — nada no engine deveria depender disso
    const depoisDeUmaPausaArtificial = simulateMatch({
      home,
      away,
      context: { requiresWinner: false },
      seed: seed('auditoria-futura'),
    });
    expect(depoisDeUmaPausaArtificial).toEqual(gravadoOriginalmente);
    expect(gravadoOriginalmente.engineVersion).toBe(ENGINE_VERSION);
  });

  it('simulateMatch não muta os objetos de entrada (função pura) — outro pré-requisito da reprodutibilidade', () => {
    const home = buildTeamSnapshot({ isHomeTeam: true });
    const away = buildTeamSnapshot({ isHomeTeam: false });
    const homeAntes = JSON.parse(JSON.stringify(home));
    const awayAntes = JSON.parse(JSON.stringify(away));
    simulateMatch({ home, away, context: { requiresWinner: true }, seed: seed('pureza') });
    expect(JSON.parse(JSON.stringify(home))).toEqual(homeAntes);
    expect(JSON.parse(JSON.stringify(away))).toEqual(awayAntes);
  });
});
