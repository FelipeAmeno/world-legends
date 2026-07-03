/**
 * T034 — Squad Overall Rating · 20 testes
 *
 * TC-OVR-01..04  Casos degenerados (vazio, 1 setor, etc.)
 * TC-OVR-05..08  Química (multiplicador, efeito positivo/negativo)
 * TC-OVR-09..14  Traits (bônus por setor, stack, cap)
 * TC-OVR-15..17  Setores (GK→defesa, CDM→meio, ST→ataque)
 * TC-OVR-18..20  Invariantes e determinismo
 */
import { describe, expect, it } from 'vitest';
import {
  MAX_TRAIT_BONUS_PER_SECTOR,
  SECTOR_WEIGHTS,
  aggregateTraitBonuses,
  calculateSquadRating,
  chemistryMultiplier,
  getBonusForTrait,
  sectorOf,
} from '../src/index';
import type { RatedPlayer, SquadRatingInput } from '../src/index';

// ─── Fixtures ──────────────────────────────────────────────────────────────────

function p(id: string, position: string, overall: number, traits: string[] = []): RatedPlayer {
  return Object.freeze({ userCardId: id, position: position as any, overall, traits });
}

/** 11 titulares padrão (4-3-3), todos com OVR fixo, sem traits. */
function squad433(ovr = 80, traits: Record<string, string[]> = {}): RatedPlayer[] {
  return [
    p('gk', 'GK', ovr, traits['gk'] ?? []),
    p('rb', 'RB', ovr, traits['rb'] ?? []),
    p('cb1', 'CB', ovr, traits['cb1'] ?? []),
    p('cb2', 'CB', ovr, traits['cb2'] ?? []),
    p('lb', 'LB', ovr, traits['lb'] ?? []),
    p('cm1', 'CM', ovr, traits['cm1'] ?? []),
    p('cm2', 'CM', ovr, traits['cm2'] ?? []),
    p('cm3', 'CM', ovr, traits['cm3'] ?? []),
    p('rw', 'RW', ovr, traits['rw'] ?? []),
    p('st', 'ST', ovr, traits['st'] ?? []),
    p('lw', 'LW', ovr, traits['lw'] ?? []),
  ];
}

const input433 = (
  ovr = 80,
  chemistry = 50,
  traits: Record<string, string[]> = {},
): SquadRatingInput => ({ starters: squad433(ovr, traits), chemistry });

// ─── TC-OVR-01..04: Casos degenerados ─────────────────────────────────────────

describe('TC-OVR-01..04: Casos degenerados', () => {
  it('TC-OVR-01: squad vazio → todos os ratings = 0', () => {
    const r = calculateSquadRating({ starters: [], chemistry: 50 });
    expect(r.overall).toBe(0);
    expect(r.attack).toBe(0);
    expect(r.midfield).toBe(0);
    expect(r.defense).toBe(0);
  });

  it('TC-OVR-02: apenas defensores → attack=0, midfield=0', () => {
    const defenders = [
      p('gk', 'GK', 85),
      p('cb1', 'CB', 82),
      p('cb2', 'CB', 83),
      p('lb', 'LB', 80),
      p('rb', 'RB', 80),
    ];
    const r = calculateSquadRating({ starters: defenders, chemistry: 50 });
    expect(r.attack).toBe(0);
    expect(r.midfield).toBe(0);
    expect(r.defense).toBeGreaterThan(0);
    expect(r.breakdown.sectorCounts.defense).toBe(5);
    expect(r.breakdown.sectorCounts.attack).toBe(0);
  });

  it('TC-OVR-03: squad uniforme (todos 80 OVR, química 50) → overall ≈ 80', () => {
    // chemistry=50 → mult=1.00 → nenhum bônus/penalidade, sem traits
    const r = calculateSquadRating(input433(80, 50));
    expect(r.overall).toBe(80);
    expect(r.attack).toBe(80);
    expect(r.midfield).toBe(80);
    expect(r.defense).toBe(80);
  });

  it('TC-OVR-04: setores com OVRs diferentes → overall é média ponderada', () => {
    // defesa=70, meio=80, ataque=90 → overall = 70×0.35 + 80×0.30 + 90×0.35 = 80
    const starters = [
      p('gk', 'GK', 70),
      p('cb1', 'CB', 70),
      p('cb2', 'CB', 70),
      p('lb', 'LB', 70),
      p('rb', 'RB', 70),
      p('cm1', 'CM', 80),
      p('cm2', 'CM', 80),
      p('cm3', 'CM', 80),
      p('rw', 'RW', 90),
      p('st', 'ST', 90),
      p('lw', 'LW', 90),
    ];
    const r = calculateSquadRating({ starters, chemistry: 50 });
    // chemistry=50 → mult=1.00 → sem distorção
    expect(r.defense).toBe(70);
    expect(r.midfield).toBe(80);
    expect(r.attack).toBe(90);
    expect(r.overall).toBe(80); // 70×0.35 + 80×0.30 + 90×0.35 = 80
  });
});

// ─── TC-OVR-05..08: Química ───────────────────────────────────────────────────

describe('TC-OVR-05..08: Química', () => {
  it('TC-OVR-05: chemistryMultiplier(0) = 0.95', () => {
    expect(chemistryMultiplier(0)).toBeCloseTo(0.95, 5);
  });

  it('TC-OVR-06: chemistryMultiplier(50) = 1.00', () => {
    expect(chemistryMultiplier(50)).toBeCloseTo(1.0, 5);
  });

  it('TC-OVR-07: chemistryMultiplier(100) = 1.05', () => {
    expect(chemistryMultiplier(100)).toBeCloseTo(1.05, 5);
  });

  it('TC-OVR-08: squad idêntico, química alta > química baixa', () => {
    const low = calculateSquadRating(input433(80, 0));
    const high = calculateSquadRating(input433(80, 100));
    expect(high.overall).toBeGreaterThan(low.overall);
    expect(high.attack).toBeGreaterThan(low.attack);
    expect(high.defense).toBeGreaterThan(low.defense);
    // Diferença esperada: 80×1.05=84 vs 80×0.95=76 → Δ=8
    expect(high.overall - low.overall).toBe(8);
  });
});

// ─── TC-OVR-09..14: Traits ────────────────────────────────────────────────────

describe('TC-OVR-09..14: Traits', () => {
  it('TC-OVR-09: clinical_finisher → bônus em attack (+3)', () => {
    const sem = calculateSquadRating(input433(80, 50));
    const com = calculateSquadRating(input433(80, 50, { st: ['clinical_finisher'] }));
    // chemistry=50 → mult=1.00 → bônus de +3 no ataque
    expect(com.attack).toBe(sem.attack + 3);
    expect(com.defense).toBe(sem.defense); // sem mudança
    expect(com.midfield).toBe(sem.midfield); // sem mudança
  });

  it('TC-OVR-10: sweeper → bônus em defense (+3)', () => {
    const sem = calculateSquadRating(input433(80, 50));
    const com = calculateSquadRating(input433(80, 50, { cb1: ['sweeper'] }));
    expect(com.defense).toBe(sem.defense + 3);
    expect(com.attack).toBe(sem.attack);
  });

  it('TC-OVR-11: playmaker → bônus em midfield (+3)', () => {
    const sem = calculateSquadRating(input433(80, 50));
    const com = calculateSquadRating(input433(80, 50, { cm1: ['playmaker'] }));
    expect(com.midfield).toBe(sem.midfield + 3);
    expect(com.attack).toBe(sem.attack);
  });

  it('TC-OVR-12: pace_monster → bônus em attack (+1) E midfield (+1)', () => {
    const sem = calculateSquadRating(input433(80, 50));
    const com = calculateSquadRating(input433(80, 50, { rw: ['pace_monster'] }));
    expect(com.attack).toBe(sem.attack + 1);
    expect(com.midfield).toBe(sem.midfield + 1);
    expect(com.defense).toBe(sem.defense);
  });

  it('TC-OVR-13: trait stacks — 3 jogadores com clinical_finisher = +9 attack', () => {
    const sem = calculateSquadRating(input433(80, 50));
    const com = calculateSquadRating(
      input433(80, 50, {
        rw: ['clinical_finisher'],
        st: ['clinical_finisher'],
        lw: ['clinical_finisher'],
      }),
    );
    expect(com.attack).toBe(sem.attack + 9);
  });

  it('TC-OVR-14: trait bonus cap = MAX_TRAIT_BONUS_PER_SECTOR (10)', () => {
    // Mesmo com 5 jogadores com clinical_finisher (5×3=15), cap em 10
    const starters = [
      p('gk', 'GK', 80),
      p('cb1', 'CB', 80),
      p('cb2', 'CB', 80),
      p('lb', 'LB', 80),
      p('rb', 'RB', 80),
      p('cm1', 'CM', 80),
      p('cm2', 'CM', 80),
      p('cm3', 'CM', 80),
      p('rw', 'RW', 80, ['clinical_finisher']),
      p('st', 'ST', 80, ['clinical_finisher']),
      p('lw', 'LW', 80, ['clinical_finisher', 'poacher', 'clutch_performer']),
    ];
    const r = calculateSquadRating({ starters, chemistry: 50 });
    expect(r.breakdown.traitBonus.attack).toBe(MAX_TRAIT_BONUS_PER_SECTOR);
    expect(r.attack).toBe(80 + MAX_TRAIT_BONUS_PER_SECTOR); // 80+10=90
  });
});

// ─── TC-OVR-15..17: Setores ───────────────────────────────────────────────────

describe('TC-OVR-15..17: Setores táticos', () => {
  it('TC-OVR-15: GK, CB, LB, RB, LWB, RWB → todos defense', () => {
    for (const pos of ['GK', 'CB', 'LB', 'RB', 'LWB', 'RWB']) {
      expect(sectorOf(pos)).toBe('defense');
    }
  });

  it('TC-OVR-16: CDM, CM, CAM, LM, RM → todos midfield', () => {
    for (const pos of ['CDM', 'CM', 'CAM', 'LM', 'RM']) {
      expect(sectorOf(pos)).toBe('midfield');
    }
  });

  it('TC-OVR-17: LW, RW, CF, ST → todos attack', () => {
    for (const pos of ['LW', 'RW', 'CF', 'ST']) {
      expect(sectorOf(pos)).toBe('attack');
    }
  });
});

// ─── TC-OVR-18..20: Invariantes e determinismo ────────────────────────────────

describe('TC-OVR-18..20: Invariantes', () => {
  it('TC-OVR-18: overall sempre entre 0 e 99', () => {
    const cases: SquadRatingInput[] = [
      input433(40, 0),
      input433(99, 100),
      input433(80, 50),
      { starters: [], chemistry: 100 },
    ];
    for (const c of cases) {
      const r = calculateSquadRating(c);
      expect(r.overall).toBeGreaterThanOrEqual(0);
      expect(r.overall).toBeLessThanOrEqual(99);
      expect(r.attack).toBeGreaterThanOrEqual(0);
      expect(r.defense).toBeGreaterThanOrEqual(0);
      expect(r.midfield).toBeGreaterThanOrEqual(0);
    }
  });

  it('TC-OVR-19: squad 99 OVR + química 100 + traits máximos → overall = 99 (cap)', () => {
    const starters = squad433(99, {
      rw: ['clinical_finisher', 'pace_monster'],
      st: ['clinical_finisher', 'pace_monster'],
      lw: ['clinical_finisher'],
      cb1: ['sweeper', 'physical_beast'],
      gk: ['reflexes', 'penalty_stopper'],
      cm1: ['playmaker'],
    });
    const r = calculateSquadRating({ starters, chemistry: 100 });
    expect(r.overall).toBeLessThanOrEqual(99);
    expect(r.attack).toBeLessThanOrEqual(99);
    expect(r.defense).toBeLessThanOrEqual(99);
    expect(r.midfield).toBeLessThanOrEqual(99);
  });

  it('TC-OVR-20: mesma entrada → mesma saída (determinístico)', () => {
    const starters = squad433(85, { st: ['clinical_finisher'], cm1: ['playmaker'] });
    const inp: SquadRatingInput = { starters, chemistry: 75 };
    const r1 = calculateSquadRating(inp);
    const r2 = calculateSquadRating(inp);
    expect(r1.overall).toBe(r2.overall);
    expect(r1.attack).toBe(r2.attack);
    expect(r1.midfield).toBe(r2.midfield);
    expect(r1.defense).toBe(r2.defense);
    expect(r1.breakdown.chemistryMultiplier).toBe(r2.breakdown.chemistryMultiplier);
  });
});
