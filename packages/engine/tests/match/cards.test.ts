import { createSeed } from '@world-legends/shared';
import { describe, expect, it } from 'vitest';
import {
  getRefereeCardMultiplier,
  resolveFoulCardOutcome,
  rollRefereeProfile,
} from '../../src/match/cards';
import { RNG } from '../../src/rng/rng';

function seed(value: string) {
  const result = createSeed(value);
  if (!result.ok) throw new Error('seed inválido no teste');
  return result.value;
}

describe('rollRefereeProfile (doc 09 §10.1)', () => {
  it('a distribuição entre os 3 perfis ao longo de muitos seeds se aproxima dos pesos 25/50/25', () => {
    const counts = { permissivo: 0, normal: 0, rigoroso: 0 };
    const total = 6000;
    for (let i = 0; i < total; i += 1) {
      counts[rollRefereeProfile(RNG(seed(`arbitro-${i}`)))] += 1;
    }
    expect(counts.permissivo / total).toBeGreaterThan(0.18);
    expect(counts.permissivo / total).toBeLessThan(0.32);
    expect(counts.normal / total).toBeGreaterThan(0.43);
    expect(counts.normal / total).toBeLessThan(0.57);
    expect(counts.rigoroso / total).toBeGreaterThan(0.18);
    expect(counts.rigoroso / total).toBeLessThan(0.32);
  });
});

describe('getRefereeCardMultiplier (doc 09 §10.1)', () => {
  it('bate exatamente com a tabela documentada', () => {
    expect(getRefereeCardMultiplier('permissivo')).toBe(0.7);
    expect(getRefereeCardMultiplier('normal')).toBe(1.0);
    expect(getRefereeCardMultiplier('rigoroso')).toBe(1.4);
  });
});

describe('resolveFoulCardOutcome (doc 09 §10.2) — TC-ME-05', () => {
  function chanceDeQualquerCartao(
    refereeProfile: 'permissivo' | 'normal' | 'rigoroso',
    trials = 4000,
  ): number {
    let cartoes = 0;
    for (let i = 0; i < trials; i += 1) {
      const outcome = resolveFoulCardOutcome({
        aggressionAttribute: 70,
        refereeProfile,
        alreadyHasYellowThisMatch: false,
        foulsAccumulatedThisMatch: 0,
        cardLeniencyMultiplier: 1.0,
        rng: RNG(seed(`falta-${refereeProfile}-${i}`)),
      });
      if (outcome !== 'none') cartoes += 1;
    }
    return cartoes / trials;
  }

  it('a chance de cartão escala proporcionalmente aos multiplicadores 0,7x/1,0x/1,4x', () => {
    const permissivo = chanceDeQualquerCartao('permissivo');
    const normal = chanceDeQualquerCartao('normal');
    const rigoroso = chanceDeQualquerCartao('rigoroso');
    expect(permissivo).toBeLessThan(normal);
    expect(normal).toBeLessThan(rigoroso);
  });

  it('TC-ME-06: jogador já com 1 amarelo na partida nunca recebe outro amarelo nem fica sem cartão — sempre alguma forma de vermelho', () => {
    // O algoritmo (doc 09 §10.2) checa vermelho direto ANTES de checar
    // "já tem amarelo" — então red_direct ainda é estruturalmente
    // possível aqui (sem novo roll é sobre o roll de AMARELO especificamente,
    // que é pulado; o roll de vermelho direto continua valendo para todos).
    // O invariante correto a testar é: nunca 'yellow' nem 'none'.
    let segundoAmareloCount = 0;
    const trials = 2000;
    for (let i = 0; i < trials; i += 1) {
      const outcome = resolveFoulCardOutcome({
        aggressionAttribute: 10,
        refereeProfile: 'permissivo',
        alreadyHasYellowThisMatch: true,
        foulsAccumulatedThisMatch: 0,
        cardLeniencyMultiplier: 1.0,
        rng: RNG(seed(`segundo-amarelo-${i}`)),
      });
      expect(outcome === 'red_direct' || outcome === 'red_second_yellow').toBe(true);
      if (outcome === 'red_second_yellow') segundoAmareloCount += 1;
    }
    // A esmagadora maioria deve vir do caminho determinístico (red_direct é raro: ~1,2% com agressão baixa e árbitro permissivo).
    expect(segundoAmareloCount / trials).toBeGreaterThan(0.9);
  });

  it('leniência de mando (doc 09 §9, -10%) reduz a chance de cartão do mandante', () => {
    const semLeniencia = chanceDeQualquerCartao('normal');
    let cartoesComLeniencia = 0;
    const trials = 4000;
    for (let i = 0; i < trials; i += 1) {
      const outcome = resolveFoulCardOutcome({
        aggressionAttribute: 70,
        refereeProfile: 'normal',
        alreadyHasYellowThisMatch: false,
        foulsAccumulatedThisMatch: 0,
        cardLeniencyMultiplier: 0.9,
        rng: RNG(seed(`leniencia-${i}`)),
      });
      if (outcome !== 'none') cartoesComLeniencia += 1;
    }
    expect(cartoesComLeniencia / trials).toBeLessThan(semLeniencia);
  });
});
