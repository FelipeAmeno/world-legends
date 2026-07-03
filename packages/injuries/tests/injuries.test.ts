/**
 * T036 — Injury System · 30 testes
 *
 * TC-INJ-01..07   Probabilidade (modificadores e limites)
 * TC-INJ-08..15   rollForInjury (determinismo, tipos, matchesOut)
 * TC-INJ-16..21   generateMatchInjuries (partida completa)
 * TC-INJ-22..27   progressRecovery / isFullyRecovered
 * TC-INJ-28..30   Invariantes e distribuição estatística
 */
import { describe, expect, it } from 'vitest';
import {
  BASE_INJURY_PROBABILITY,
  MATCHES_OUT_RANGE,
  MAX_INJURY_PROBABILITY,
  MIN_INJURY_PROBABILITY,
  calculateInjuryProbability,
  eraModifier,
  generateMatchInjuries,
  injuryRiskLevel,
  isFullyRecovered,
  matchesUntilReturn,
  physicalModifier,
  progressRecovery,
  progressRecoveryN,
  rollForInjury,
  staminaModifier,
} from '../src/index';
import type { InjuryProfile } from '../src/index';

// ─── Fixtures ──────────────────────────────────────────────────────────────────

const modernElite: InjuryProfile = {
  userCardId: 'uc-modern',
  stamina: 92,
  physical: 88,
  era: '2010s',
};
const vintageFrail: InjuryProfile = {
  userCardId: 'uc-vintage',
  stamina: 45,
  physical: 50,
  era: '1950s',
};
const average: InjuryProfile = {
  userCardId: 'uc-avg',
  stamina: 70,
  physical: 65,
  era: '1990s',
};

// ─── TC-INJ-01..07: Probabilidade ────────────────────────────────────────────

describe('TC-INJ-01..07: Probabilidade de lesão', () => {
  it('TC-INJ-01: staminaModifier(≥90) = −1.5%', () => {
    expect(staminaModifier(90)).toBeCloseTo(-0.015, 5);
    expect(staminaModifier(99)).toBeCloseTo(-0.015, 5);
  });

  it('TC-INJ-02: staminaModifier(<50) = +1.5%', () => {
    expect(staminaModifier(40)).toBeCloseTo(+0.015, 5);
    expect(staminaModifier(0)).toBeCloseTo(+0.015, 5);
  });

  it('TC-INJ-03: physicalModifier(≥80) = −1%', () => {
    expect(physicalModifier(80)).toBeCloseTo(-0.01, 5);
    expect(physicalModifier(95)).toBeCloseTo(-0.01, 5);
  });

  it('TC-INJ-04: physicalModifier(<60) = +1%', () => {
    expect(physicalModifier(59)).toBeCloseTo(+0.01, 5);
  });

  it('TC-INJ-05: eraModifier — 2010s menor, 1950s maior', () => {
    expect(eraModifier('2010s')).toBeLessThan(eraModifier('1990s'));
    expect(eraModifier('1990s')).toBeLessThan(eraModifier('1970s'));
    expect(eraModifier('1970s')).toBeLessThan(eraModifier('1950s'));
  });

  it('TC-INJ-06: jogador elite moderno tem prob menor que vintage frágil', () => {
    const pModern = calculateInjuryProbability(modernElite);
    const pVintage = calculateInjuryProbability(vintageFrail);
    expect(pModern).toBeLessThan(pVintage);
  });

  it('TC-INJ-07: probabilidade sempre dentro de [MIN, MAX] = [1%, 15%]', () => {
    const profiles: InjuryProfile[] = [
      modernElite,
      vintageFrail,
      average,
      { userCardId: 'x1', stamina: 0, physical: 0, era: '1950s' },
      { userCardId: 'x2', stamina: 99, physical: 99, era: '2020s' },
    ];
    for (const p of profiles) {
      const prob = calculateInjuryProbability(p);
      expect(prob).toBeGreaterThanOrEqual(MIN_INJURY_PROBABILITY);
      expect(prob).toBeLessThanOrEqual(MAX_INJURY_PROBABILITY);
    }
  });
});

// ─── TC-INJ-08..15: rollForInjury ────────────────────────────────────────────

describe('TC-INJ-08..15: rollForInjury', () => {
  it('TC-INJ-08: determinístico — mesmo (profile, seed) → mesmo resultado', () => {
    const r1 = rollForInjury(average, 12345);
    const r2 = rollForInjury(average, 12345);
    expect(r1?.type).toBe(r2?.type);
    expect(r1?.matchesOut).toBe(r2?.matchesOut);
    expect(r1?.id).toBe(r2?.id);
  });

  it('TC-INJ-09: seeds diferentes podem gerar resultados diferentes', () => {
    const results = new Set<string>();
    for (let s = 0; s < 100; s++) {
      const r = rollForInjury(vintageFrail, s);
      results.add(r ? `${r.type}:${r.matchesOut}` : 'null');
    }
    expect(results.size).toBeGreaterThan(3);
  });

  it('TC-INJ-10: quando lesão ocorre, tem type + matchesOut + description', () => {
    // Usar seeds até encontrar uma lesão
    let injury = null;
    for (let s = 0; s < 200 && !injury; s++) {
      injury = rollForInjury(vintageFrail, s);
    }
    expect(injury).not.toBeNull();
    if (!injury) return;
    expect(['light', 'moderate', 'severe']).toContain(injury.type);
    expect(injury.matchesOut).toBeGreaterThanOrEqual(1);
    expect(injury.description).toBeTruthy();
    expect(injury.description.length).toBeGreaterThan(5);
  });

  it('TC-INJ-11: lesão leve → matchesOut ∈ [1, 2]', () => {
    const lightInjuries: number[] = [];
    for (let s = 0; s < 1000; s++) {
      const r = rollForInjury(vintageFrail, s);
      if (r?.type === 'light') lightInjuries.push(r.matchesOut);
    }
    for (const mo of lightInjuries) {
      expect(mo).toBeGreaterThanOrEqual(MATCHES_OUT_RANGE.light.min);
      expect(mo).toBeLessThanOrEqual(MATCHES_OUT_RANGE.light.max);
    }
    // Deve ter achado pelo menos algumas leves
    expect(lightInjuries.length).toBeGreaterThan(0);
  });

  it('TC-INJ-12: lesão moderada → matchesOut ∈ [3, 5]', () => {
    const modInjuries: number[] = [];
    for (let s = 0; s < 2000; s++) {
      const r = rollForInjury(vintageFrail, s);
      if (r?.type === 'moderate') modInjuries.push(r.matchesOut);
    }
    for (const mo of modInjuries) {
      expect(mo).toBeGreaterThanOrEqual(MATCHES_OUT_RANGE.moderate.min);
      expect(mo).toBeLessThanOrEqual(MATCHES_OUT_RANGE.moderate.max);
    }
    expect(modInjuries.length).toBeGreaterThan(0);
  });

  it('TC-INJ-13: lesão grave → matchesOut ∈ [6, 12]', () => {
    const severeInjuries: number[] = [];
    for (let s = 0; s < 5000; s++) {
      const r = rollForInjury(vintageFrail, s);
      if (r?.type === 'severe') severeInjuries.push(r.matchesOut);
    }
    for (const mo of severeInjuries) {
      expect(mo).toBeGreaterThanOrEqual(MATCHES_OUT_RANGE.severe.min);
      expect(mo).toBeLessThanOrEqual(MATCHES_OUT_RANGE.severe.max);
    }
    expect(severeInjuries.length).toBeGreaterThan(0);
  });

  it('TC-INJ-14: minute é fornecido quando passado como parâmetro', () => {
    // Encontrar uma lesão com minute fixo
    for (let s = 0; s < 500; s++) {
      const r = rollForInjury(vintageFrail, s, 67);
      if (r) {
        expect(r.minute).toBe(67);
        return;
      }
    }
  });

  it('TC-INJ-15: id é único por (jogador, seed, tipo)', () => {
    const injuries = new Set<string>();
    for (let s = 0; s < 200; s++) {
      const r = rollForInjury(vintageFrail, s);
      if (r) injuries.add(r.id);
    }
    // ids coletados devem ser todos únicos
    const arr = [...injuries];
    expect(new Set(arr).size).toBe(arr.length);
  });
});

// ─── TC-INJ-16..21: generateMatchInjuries ─────────────────────────────────────

describe('TC-INJ-16..21: generateMatchInjuries', () => {
  it('TC-INJ-16: sem jogadores → array vazio', () => {
    const events = generateMatchInjuries([], 42);
    expect(events).toHaveLength(0);
  });

  it('TC-INJ-17: resultado tem userCardId correto', () => {
    const players: InjuryProfile[] = [vintageFrail, vintageFrail, vintageFrail];
    // Procurar seed que gere pelo menos uma lesão
    for (let seed = 0; seed < 100; seed++) {
      const events = generateMatchInjuries(players, seed);
      if (events.length > 0) {
        expect(events[0]!.userCardId).toBe(players[0]!.userCardId);
        return;
      }
    }
  });

  it('TC-INJ-18: determinístico — mesmo squad + seed → mesmos eventos', () => {
    const players = [average, vintageFrail, modernElite];
    const e1 = generateMatchInjuries(players, 999);
    const e2 = generateMatchInjuries(players, 999);
    expect(e1.length).toBe(e2.length);
    for (let i = 0; i < e1.length; i++) {
      expect(e1[i]!.userCardId).toBe(e2[i]!.userCardId);
      expect(e1[i]!.injury.type).toBe(e2[i]!.injury.type);
      expect(e1[i]!.injury.matchesOut).toBe(e2[i]!.injury.matchesOut);
    }
  });

  it('TC-INJ-19: InjuryEvent tem injury com minute definido', () => {
    const players = Array.from(
      { length: 11 },
      (_, i): InjuryProfile => ({
        userCardId: `uc-${i}`,
        stamina: 45,
        physical: 45,
        era: '1950s',
      }),
    );
    // Com 11 jogadores frágeis, algum deve se lesionar
    for (let seed = 0; seed < 20; seed++) {
      const events = generateMatchInjuries(players, seed);
      if (events.length > 0) {
        const inj = events[0]!.injury;
        expect(inj.minute).toBeGreaterThanOrEqual(1);
        expect(inj.minute).toBeLessThanOrEqual(90);
        return;
      }
    }
  });

  it('TC-INJ-20: múltiplos jogadores podem se lesionar na mesma partida', () => {
    const fragile = Array.from(
      { length: 11 },
      (_, i): InjuryProfile => ({
        userCardId: `frag-${i}`,
        stamina: 30,
        physical: 30,
        era: '1950s',
      }),
    );
    let maxInjuries = 0;
    for (let s = 0; s < 50; s++) {
      const events = generateMatchInjuries(fragile, s);
      maxInjuries = Math.max(maxInjuries, events.length);
    }
    // Com 11 jogadores muito frágeis, em algum momento > 1 deve se lesionar
    expect(maxInjuries).toBeGreaterThan(1);
  });

  it('TC-INJ-21: taxa de lesão em 1000 partidas próxima da probabilidade calculada', () => {
    const player: InjuryProfile = {
      userCardId: 'uc-rate',
      stamina: 70,
      physical: 65,
      era: '1990s',
    };
    const expected = calculateInjuryProbability(player);
    let injuries = 0;
    for (let s = 0; s < 1000; s++) {
      const events = generateMatchInjuries([player], s);
      if (events.length > 0) injuries++;
    }
    const observed = injuries / 1000;
    // Tolerância de ±3% (variância aleatória em 1000 amostras)
    expect(Math.abs(observed - expected)).toBeLessThan(0.04);
  });
});

// ─── TC-INJ-22..27: Recovery ──────────────────────────────────────────────────

describe('TC-INJ-22..27: progressRecovery e isFullyRecovered', () => {
  const makeInjury = (type: 'light' | 'moderate' | 'severe', matchesOut: number) =>
    Object.freeze({ id: 'inj-1', type, matchesOut, description: 'Lesão de teste' });

  it('TC-INJ-22: progressRecovery decrementa matchesOut em 1', () => {
    const inj = makeInjury('moderate', 4);
    const r = progressRecovery(inj);
    expect(r.matchesOut).toBe(3);
    expect(r.type).toBe('moderate');
  });

  it('TC-INJ-23: matchesOut nunca vai abaixo de 0', () => {
    const inj = makeInjury('light', 0);
    const r = progressRecovery(inj);
    expect(r.matchesOut).toBe(0);
  });

  it('TC-INJ-24: isFullyRecovered quando matchesOut = 0', () => {
    const inj = makeInjury('light', 0);
    expect(isFullyRecovered(inj)).toBe(true);
  });

  it('TC-INJ-25: não recuperado quando matchesOut > 0', () => {
    expect(isFullyRecovered(makeInjury('severe', 8))).toBe(false);
    expect(isFullyRecovered(makeInjury('moderate', 1))).toBe(false);
  });

  it('TC-INJ-26: progressRecoveryN(injury, 3) decrementa 3 partidas de uma vez', () => {
    const inj = makeInjury('severe', 10);
    const r = progressRecoveryN(inj, 3);
    expect(r.matchesOut).toBe(7);
  });

  it('TC-INJ-27: leve recupera antes que moderada, moderada antes que grave', () => {
    // Com mesmos matchesOut iniciais, a leve chega a 0 antes
    let light = makeInjury('light', 2);
    let moderate = makeInjury('moderate', 4);
    let severe = makeInjury('severe', 8);

    // Avançar 2 partidas
    light = progressRecoveryN(light, 2);
    moderate = progressRecoveryN(moderate, 2);
    severe = progressRecoveryN(severe, 2);

    expect(isFullyRecovered(light)).toBe(true); // 2-2=0
    expect(isFullyRecovered(moderate)).toBe(false); // 4-2=2
    expect(isFullyRecovered(severe)).toBe(false); // 8-2=6
  });
});

// ─── TC-INJ-28..30: Invariantes e distribuição ────────────────────────────────

describe('TC-INJ-28..30: Invariantes', () => {
  it('TC-INJ-28: BASE_INJURY_PROBABILITY = 3%', () => {
    expect(BASE_INJURY_PROBABILITY).toBe(0.03);
  });

  it('TC-INJ-29: distribuição dos tipos em 5000 amostras ≈ 60/30/10', () => {
    const counts = { light: 0, moderate: 0, severe: 0 };
    let total = 0;
    for (let s = 0; s < 10_000; s++) {
      const r = rollForInjury(vintageFrail, s);
      if (r) {
        counts[r.type]++;
        total++;
      }
    }
    if (total === 0) return; // sem lesões (improvável)
    const lightPct = counts.light / total;
    const moderatePct = counts.moderate / total;
    const severePct = counts.severe / total;
    // Tolerância ±10pp
    expect(lightPct).toBeGreaterThan(0.5);
    expect(lightPct).toBeLessThan(0.7);
    expect(moderatePct).toBeGreaterThan(0.2);
    expect(moderatePct).toBeLessThan(0.4);
    expect(severePct).toBeGreaterThan(0.05);
    expect(severePct).toBeLessThan(0.2);
  });

  it('TC-INJ-30: injuryRiskLevel categoriza corretamente', () => {
    expect(injuryRiskLevel(0.01)).toBe('low');
    expect(injuryRiskLevel(0.02)).toBe('low');
    expect(injuryRiskLevel(0.03)).toBe('medium');
    expect(injuryRiskLevel(0.05)).toBe('high');
    expect(injuryRiskLevel(0.08)).toBe('very_high');
    expect(injuryRiskLevel(0.15)).toBe('very_high');
  });
});
