/**
 * T037 — Fatigue System · 25 testes
 *
 * TC-FAT-01..05  PERFORMANCE_STEPS e escadinha
 * TC-FAT-06..10  createFreshState / afterMatch / afterRest
 * TC-FAT-11..15  applyFatigue nos atributos
 * TC-FAT-16..20  Impacto diferenciado por categoria
 * TC-FAT-21..25  Invariantes, squad e determinismo
 */
import { describe, expect, it } from 'vitest';
import {
  CATEGORY_IMPACT,
  MAX_CONSECUTIVE_MATCHES,
  MAX_PERFORMANCE,
  MIN_PERFORMANCE,
  PERFORMANCE_STEPS,
  afterMatch,
  afterRest,
  applyFatigue,
  applyFatigueToSquad,
  createFreshState,
  effectiveMultiplier,
  fatigueLevel,
  getPerformanceRatio,
  impactFactorFor,
  resetFatigue,
} from '../src/index';
import type { FatigueState, PlayerAttributes } from '../src/index';

// ─── Fixtures ──────────────────────────────────────────────────────────────────

const baseAttrs: PlayerAttributes = {
  pace: 85,
  stamina: 80,
  physical: 78,
  heading: 72,
  finishing: 88,
  dribbling: 90,
  passing: 82,
  defending: 40,
  vision: 86,
  composure: 84,
  leadership: 70,
  gk_reflexes: 20,
  gk_positioning: 20,
  gk_handling: 20,
};

function stateWithConsecutive(n: number): FatigueState {
  let s = createFreshState('uc-1');
  for (let i = 0; i < n; i++) s = afterMatch(s);
  return s;
}

// ─── TC-FAT-01..05: PERFORMANCE_STEPS ─────────────────────────────────────────

describe('TC-FAT-01..05: Escadinha de performance', () => {
  it('TC-FAT-01: 1ª partida (0 consecutivas) → 100%', () => {
    expect(PERFORMANCE_STEPS[0]).toBe(1.0);
    const s = createFreshState('u1');
    expect(getPerformanceRatio(s)).toBe(1.0);
  });

  it('TC-FAT-02: 2ª partida (1 consecutiva anterior) → 95%', () => {
    expect(PERFORMANCE_STEPS[1]).toBe(0.95);
    const s = stateWithConsecutive(1);
    expect(getPerformanceRatio(s)).toBe(0.95);
  });

  it('TC-FAT-03: 3ª partida (2 consecutivas anteriores) → 90%', () => {
    expect(PERFORMANCE_STEPS[2]).toBe(0.9);
    const s = stateWithConsecutive(2);
    expect(getPerformanceRatio(s)).toBe(0.9);
  });

  it('TC-FAT-04: 4ª+ partida (3+ consecutivas) → 85%', () => {
    expect(PERFORMANCE_STEPS[3]).toBe(0.85);
    const s3 = stateWithConsecutive(3);
    const s5 = stateWithConsecutive(5); // cap em MAX
    expect(getPerformanceRatio(s3)).toBe(0.85);
    expect(getPerformanceRatio(s5)).toBe(0.85);
  });

  it('TC-FAT-05: performance é monotonicamente decrescente', () => {
    const ratios = [0, 1, 2, 3].map((n) => getPerformanceRatio(stateWithConsecutive(n)));
    for (let i = 1; i < ratios.length; i++) {
      expect(ratios[i]).toBeLessThanOrEqual(ratios[i - 1]!);
    }
    expect(ratios[0]).toBe(MAX_PERFORMANCE);
    expect(ratios[ratios.length - 1]).toBe(MIN_PERFORMANCE);
  });
});

// ─── TC-FAT-06..10: State management ─────────────────────────────────────────

describe('TC-FAT-06..10: State management', () => {
  it('TC-FAT-06: createFreshState → consecutiveMatches=0, level=fresh', () => {
    const s = createFreshState('uc-test');
    expect(s.userCardId).toBe('uc-test');
    expect(s.consecutiveMatches).toBe(0);
    expect(s.performanceMultiplier).toBe(1.0);
    expect(s.fatigueLevel).toBe('fresh');
  });

  it('TC-FAT-07: afterMatch incrementa consecutiveMatches', () => {
    const s0 = createFreshState('u1');
    const s1 = afterMatch(s0);
    const s2 = afterMatch(s1);
    expect(s1.consecutiveMatches).toBe(1);
    expect(s2.consecutiveMatches).toBe(2);
  });

  it('TC-FAT-08: afterMatch limita ao máximo (MAX_CONSECUTIVE_MATCHES=3)', () => {
    let s = createFreshState('u1');
    for (let i = 0; i < 10; i++) s = afterMatch(s);
    expect(s.consecutiveMatches).toBe(MAX_CONSECUTIVE_MATCHES);
    expect(s.performanceMultiplier).toBe(MIN_PERFORMANCE);
  });

  it('TC-FAT-09: afterRest(1) reduz consecutiveMatches', () => {
    const tired = stateWithConsecutive(3);
    const rested = afterRest(tired, 1);
    expect(rested.consecutiveMatches).toBeLessThan(tired.consecutiveMatches);
  });

  it('TC-FAT-10: resetFatigue → fresco completo', () => {
    const tired = stateWithConsecutive(3);
    const fresh = resetFatigue(tired);
    expect(fresh.consecutiveMatches).toBe(0);
    expect(fresh.performanceMultiplier).toBe(1.0);
    expect(fresh.fatigueLevel).toBe('fresh');
    expect(fresh.userCardId).toBe(tired.userCardId);
  });
});

// ─── TC-FAT-11..15: applyFatigue ─────────────────────────────────────────────

describe('TC-FAT-11..15: applyFatigue', () => {
  it('TC-FAT-11: ratio=1.00 (fresh) → atributos inalterados', () => {
    const state = createFreshState('u1');
    const result = applyFatigue(baseAttrs, state);
    expect(result.multiplier).toBe(1.0);
    for (const [attr, base] of Object.entries(baseAttrs)) {
      expect(result.attributes[attr]).toBe(base);
    }
  });

  it('TC-FAT-12: ratio=0.85 (heavy) → atributos físicos reduzidos', () => {
    const state = stateWithConsecutive(3); // ratio=0.85
    const result = applyFatigue({ pace: 80 }, state);
    expect(result.multiplier).toBe(0.85);
    // pace é physical (fator 1.0): 80 × 0.85 = 68
    expect(result.attributes['pace']).toBe(68);
    expect(result.deltas['pace']).toBe(-12);
  });

  it('TC-FAT-13: atributos nunca vão abaixo de 1', () => {
    const state = stateWithConsecutive(3); // worst case
    const tiny = { pace: 1, stamina: 1, finishing: 1, vision: 1 };
    const result = applyFatigue(tiny, state);
    for (const v of Object.values(result.attributes)) {
      expect(v).toBeGreaterThanOrEqual(1);
    }
  });

  it('TC-FAT-14: deltas são negativos (fadiga reduz atributos)', () => {
    const state = stateWithConsecutive(3);
    const result = applyFatigue(baseAttrs, state);
    // Pelo menos os atributos físicos devem ter delta negativo
    expect(result.deltas['pace']).toBeLessThan(0);
    expect(result.deltas['stamina']).toBeLessThan(0);
  });

  it('TC-FAT-15: FatiguedAttributes é imutável (frozen)', () => {
    const state = stateWithConsecutive(2);
    const result = applyFatigue(baseAttrs, state);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.attributes)).toBe(true);
    expect(Object.isFrozen(result.deltas)).toBe(true);
  });
});

// ─── TC-FAT-16..20: Impacto diferenciado ─────────────────────────────────────

describe('TC-FAT-16..20: Impacto diferenciado por categoria', () => {
  it('TC-FAT-16: atributos físicos sofrem mais que mentais', () => {
    const state = stateWithConsecutive(3); // ratio=0.85
    const attrs = { pace: 80, composure: 80 };
    const result = applyFatigue(attrs, state);
    // pace (physical, fator 1.0) cai mais que composure (mental, fator 0.3)
    expect(Math.abs(result.deltas['pace']!)).toBeGreaterThan(Math.abs(result.deltas['composure']!));
  });

  it('TC-FAT-17: impactFactorFor categorias corretas', () => {
    expect(impactFactorFor('pace')).toBe(CATEGORY_IMPACT.physical); // 1.0
    expect(impactFactorFor('finishing')).toBe(CATEGORY_IMPACT.technical); // 0.7
    expect(impactFactorFor('vision')).toBe(CATEGORY_IMPACT.mental); // 0.3
    expect(impactFactorFor('gk_reflexes')).toBe(CATEGORY_IMPACT.gk); // 0.6
  });

  it('TC-FAT-18: ordem de impacto: physical > gk > technical > mental', () => {
    expect(CATEGORY_IMPACT.physical).toBeGreaterThan(CATEGORY_IMPACT.gk);
    expect(CATEGORY_IMPACT.gk).toBeGreaterThan(CATEGORY_IMPACT.technical);
    expect(CATEGORY_IMPACT.technical).toBeGreaterThan(CATEGORY_IMPACT.mental);
  });

  it('TC-FAT-19: effectiveMultiplier(0.85, pace) = 0.85 (impacto total)', () => {
    // reduction=0.15, factor=1.0 → 1 - 0.15×1.0 = 0.85
    expect(effectiveMultiplier(0.85, 'pace')).toBeCloseTo(0.85, 5);
  });

  it('TC-FAT-20: effectiveMultiplier(0.85, vision) > 0.85 (impacto parcial)', () => {
    // reduction=0.15, factor=0.3 → 1 - 0.15×0.3 = 0.955
    const mult = effectiveMultiplier(0.85, 'vision');
    expect(mult).toBeCloseTo(0.955, 5);
    expect(mult).toBeGreaterThan(0.85);
  });
});

// ─── TC-FAT-21..25: Invariantes, squad e determinismo ─────────────────────────

describe('TC-FAT-21..25: Invariantes', () => {
  it('TC-FAT-21: fatigueLevel correto por consecutiveMatches', () => {
    expect(fatigueLevel(0)).toBe('fresh');
    expect(fatigueLevel(1)).toBe('light');
    expect(fatigueLevel(2)).toBe('moderate');
    expect(fatigueLevel(3)).toBe('heavy');
    expect(fatigueLevel(10)).toBe('heavy');
  });

  it('TC-FAT-22: sequência completa de estados', () => {
    const s0 = createFreshState('u1');
    const s1 = afterMatch(s0);
    const s2 = afterMatch(s1);
    const s3 = afterMatch(s2);
    const sR = resetFatigue(s3);

    expect(s0.fatigueLevel).toBe('fresh');
    expect(s1.fatigueLevel).toBe('light');
    expect(s2.fatigueLevel).toBe('moderate');
    expect(s3.fatigueLevel).toBe('heavy');
    expect(sR.fatigueLevel).toBe('fresh');

    // Multiplicadores
    expect(getPerformanceRatio(s0)).toBe(1.0);
    expect(getPerformanceRatio(s1)).toBe(0.95);
    expect(getPerformanceRatio(s2)).toBe(0.9);
    expect(getPerformanceRatio(s3)).toBe(0.85);
    expect(getPerformanceRatio(sR)).toBe(1.0);
  });

  it('TC-FAT-23: applyFatigueToSquad processa múltiplos jogadores', () => {
    const players = [
      { userCardId: 'u1', attributes: { pace: 80 }, state: createFreshState('u1') },
      { userCardId: 'u2', attributes: { pace: 80 }, state: stateWithConsecutive(3) },
    ];
    const results = applyFatigueToSquad(players);
    expect(results).toHaveLength(2);
    expect(results[0]!.performanceRatio).toBe(1.0);
    expect(results[1]!.performanceRatio).toBe(0.85);
    // u2 (tired) tem pace menor que u1 (fresh)
    expect(results[1]!.fatigued.attributes['pace']).toBeLessThan(
      results[0]!.fatigued.attributes['pace']!,
    );
  });

  it('TC-FAT-24: operações são determinísticas', () => {
    const s = stateWithConsecutive(2);
    const r1 = applyFatigue(baseAttrs, s);
    const r2 = applyFatigue(baseAttrs, s);
    expect(r1.multiplier).toBe(r2.multiplier);
    for (const attr of Object.keys(baseAttrs)) {
      expect(r1.attributes[attr]).toBe(r2.attributes[attr]);
    }
  });

  it('TC-FAT-25: jogadores diferentes têm estados independentes', () => {
    const s1 = stateWithConsecutive(3); // heavy (u1)
    const s2 = createFreshState('u2'); // fresh (u2)

    // Modificar u1 não afeta u2
    const s1After = afterMatch(s1);
    expect(s1After.consecutiveMatches).toBe(MAX_CONSECUTIVE_MATCHES);
    expect(s2.consecutiveMatches).toBe(0);
    expect(s1.userCardId).not.toBe(s2.userCardId);
  });
});
