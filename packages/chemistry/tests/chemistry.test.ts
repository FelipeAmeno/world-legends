/**
 * T033 — Chemistry System · 30 testes
 *
 * TC-CHEM-01..10  Regras de link (link-rules)
 * TC-CHEM-11..22  ChemistryCalculator
 * TC-CHEM-23..27  SquadChemistry (propriedades e invariantes)
 * TC-CHEM-28..30  Modos de adjacência (todos os pares vs pares customizados)
 */
import { describe, expect, it } from 'vitest';
import {
  COMPETITION_BONUS,
  ERA_BONUS,
  MAX_LINK_BONUS,
  MAX_SQUAD_CHEMISTRY,
  NATIONALITY_BONUS,
  buildLink,
  calculateChemistry,
  competitionBonus,
  eraBonus,
  nationalityBonus,
} from '../src/index';
import type { PlayerChemistryInput } from '../src/index';

// ─── Fixtures ──────────────────────────────────────────────────────────────────

function p(
  overrides: Partial<PlayerChemistryInput> & { userCardId: string },
): PlayerChemistryInput {
  return Object.freeze({
    nationality: 'BR',
    competition: 'brasileirao',
    era: '1990s',
    ...overrides,
  });
}

// Dois jogadores que compartilham tudo
const A = p({ userCardId: 'A', nationality: 'BR', competition: 'laliga', era: '1990s' });
const B = p({ userCardId: 'B', nationality: 'BR', competition: 'laliga', era: '1990s' });
// Dois jogadores que compartilham nada
const C = p({ userCardId: 'C', nationality: 'AR', competition: 'bundesliga', era: '1980s' });
const D = p({ userCardId: 'D', nationality: 'DE', competition: 'premier_league', era: '2000s' });
// Compartilha apenas competição
const E = p({ userCardId: 'E', nationality: 'ES', competition: 'laliga', era: '2010s' });
// Compartilha apenas era
const F = p({ userCardId: 'F', nationality: 'PT', competition: 'brasileirao', era: '1990s' });

// Squad perfeito (todos BR, laliga, 1990s)
function perfectSquad(n: number): PlayerChemistryInput[] {
  return Array.from({ length: n }, (_, i) =>
    p({ userCardId: `p${i}`, nationality: 'BR', competition: 'laliga', era: '1990s' }),
  );
}

// ─── TC-CHEM-01..10: Regras de link ───────────────────────────────────────────

describe('TC-CHEM-01..10: Regras de link', () => {
  it('TC-CHEM-01: mesma nacionalidade → nationalityBonus = 2', () => {
    expect(nationalityBonus(A, B)).toBe(NATIONALITY_BONUS); // 2
    expect(nationalityBonus(A, B)).toBe(2);
  });

  it('TC-CHEM-02: nacionalidades diferentes → nationalityBonus = 0', () => {
    expect(nationalityBonus(A, C)).toBe(0);
    expect(nationalityBonus(C, D)).toBe(0);
  });

  it('TC-CHEM-03: mesma competição → competitionBonus = 1', () => {
    expect(competitionBonus(A, B)).toBe(COMPETITION_BONUS); // 1
    expect(competitionBonus(A, E)).toBe(1); // ambos na laliga
  });

  it('TC-CHEM-04: competições diferentes → competitionBonus = 0', () => {
    expect(competitionBonus(A, C)).toBe(0);
    expect(competitionBonus(C, D)).toBe(0);
  });

  it('TC-CHEM-05: mesma era → eraBonus = 1', () => {
    expect(eraBonus(A, B)).toBe(ERA_BONUS); // 1
    expect(eraBonus(A, F)).toBe(1); // ambos 1990s
  });

  it('TC-CHEM-06: eras diferentes → eraBonus = 0', () => {
    expect(eraBonus(A, C)).toBe(0);
    expect(eraBonus(A, D)).toBe(0);
  });

  it('TC-CHEM-07: link perfeito (tudo igual) → total = 4', () => {
    const link = buildLink(A, B);
    expect(link.total).toBe(MAX_LINK_BONUS); // 4
    expect(link.isPerfect).toBe(true);
    expect(link.nationalityBonus).toBe(2);
    expect(link.competitionBonus).toBe(1);
    expect(link.eraBonus).toBe(1);
  });

  it('TC-CHEM-08: link sem nada em comum → total = 0', () => {
    const link = buildLink(C, D);
    expect(link.total).toBe(0);
    expect(link.isPerfect).toBe(false);
    expect(link.shared.nationality).toBe(false);
    expect(link.shared.competition).toBe(false);
    expect(link.shared.era).toBe(false);
  });

  it('TC-CHEM-09: nat + comp (sem era) → total = 3', () => {
    // A e B_noEra: mesma nat, mesma comp, era diferente
    const aNoEra = p({ userCardId: 'a2', nationality: 'BR', competition: 'laliga', era: '2010s' });
    const link = buildLink(A, aNoEra);
    expect(link.nationalityBonus).toBe(2);
    expect(link.competitionBonus).toBe(1);
    expect(link.eraBonus).toBe(0);
    expect(link.total).toBe(3);
  });

  it('TC-CHEM-10: nat + era (sem comp) → total = 3', () => {
    // G: mesma nat (BR) e mesma era (1990s) que A, mas competição diferente
    const G = p({ userCardId: 'G', nationality: 'BR', competition: 'serie_a', era: '1990s' });
    const link = buildLink(A, G); // BR=BR (+2), laliga≠serie_a (0), 1990s=1990s (+1)
    expect(link.nationalityBonus).toBe(2);
    expect(link.competitionBonus).toBe(0);
    expect(link.eraBonus).toBe(1);
    expect(link.total).toBe(3);
    expect(link.shared.nationality).toBe(true);
    expect(link.shared.era).toBe(true);
    expect(link.shared.competition).toBe(false);
  });
});

// ─── TC-CHEM-11..22: ChemistryCalculator ──────────────────────────────────────

describe('TC-CHEM-11..22: ChemistryCalculator', () => {
  it('TC-CHEM-11: 0 jogadores → total = 0', () => {
    const r = calculateChemistry({ players: [] });
    expect(r.total).toBe(0);
    expect(r.links).toHaveLength(0);
  });

  it('TC-CHEM-12: 1 jogador → total = 0 (sem links)', () => {
    const r = calculateChemistry({ players: [A] });
    expect(r.total).toBe(0);
    expect(r.links).toHaveLength(0);
    expect(r.perPlayer['A']).toBe(0);
  });

  it('TC-CHEM-13: 2 jogadores iguais → link perfeito → total = 100', () => {
    const r = calculateChemistry({ players: [A, B] });
    expect(r.total).toBe(100);
    expect(r.links).toHaveLength(1);
    expect(r.links[0]!.isPerfect).toBe(true);
    expect(r.breakdown.perfectLinks).toBe(1);
  });

  it('TC-CHEM-14: 2 jogadores diferentes → total = 0', () => {
    const r = calculateChemistry({ players: [C, D] });
    expect(r.total).toBe(0);
    expect(r.breakdown.totalLinkBonus).toBe(0);
  });

  it('TC-CHEM-15: 11 jogadores perfeitos → total = 100', () => {
    const r = calculateChemistry({ players: perfectSquad(11) });
    expect(r.total).toBe(100);
    expect(r.breakdown.perfectLinks).toBe(r.breakdown.totalLinks);
  });

  it('TC-CHEM-16: jogadores todos únicos → total = 0', () => {
    // 8 jogadores com nats/comps/eras completamente distintos (8 eras únicas disponíveis)
    const uniquePlayers: PlayerChemistryInput[] = [
      p({ userCardId: 'u0', nationality: 'BR', competition: 'laliga', era: '1950s' }),
      p({ userCardId: 'u1', nationality: 'AR', competition: 'bundesliga', era: '1960s' }),
      p({ userCardId: 'u2', nationality: 'DE', competition: 'premier_league', era: '1970s' }),
      p({ userCardId: 'u3', nationality: 'ES', competition: 'serie_a', era: '1980s' }),
      p({ userCardId: 'u4', nationality: 'FR', competition: 'ligue_1', era: '1990s' }),
      p({ userCardId: 'u5', nationality: 'PT', competition: 'brasileirao', era: '2000s' }),
      p({ userCardId: 'u6', nationality: 'IT', competition: 'eredivisie', era: '2010s' }),
      p({ userCardId: 'u7', nationality: 'NL', competition: 'mls', era: '2020s' }),
    ];
    const r = calculateChemistry({ players: uniquePlayers });
    expect(r.total).toBe(0);
    expect(r.breakdown.totalLinkBonus).toBe(0);
  });

  it('TC-CHEM-17: links = C(N,2) = N×(N-1)/2', () => {
    for (const n of [2, 3, 5, 11]) {
      const r = calculateChemistry({ players: perfectSquad(n) });
      expect(r.links).toHaveLength((n * (n - 1)) / 2);
    }
  });

  it('TC-CHEM-18: perPlayer tem entrada para cada jogador', () => {
    const players = perfectSquad(11);
    const r = calculateChemistry({ players });
    for (const p of players) {
      expect(r.perPlayer[p.userCardId]).toBeDefined();
    }
    expect(Object.keys(r.perPlayer)).toHaveLength(11);
  });

  it('TC-CHEM-19: breakdown.nationalityLinks é a contagem correta', () => {
    // A e B: mesma nat. A e C: nat diferente. B e C: nat diferente.
    const r = calculateChemistry({ players: [A, B, C] });
    // Links: AB (nat=BR=BR ✓), AC (BR≠AR ✗), BC (BR≠AR ✗)
    expect(r.breakdown.nationalityLinks).toBe(1);
  });

  it('TC-CHEM-20: breakdown.competitionLinks é correto', () => {
    // A: laliga, B: laliga, E: laliga, C: bundesliga
    const r = calculateChemistry({ players: [A, B, E, C] });
    // Pares com mesma comp (laliga): AB, AE, BE = 3 links
    expect(r.breakdown.competitionLinks).toBe(3);
  });

  it('TC-CHEM-21: breakdown.eraLinks é correto', () => {
    // A: 1990s, B: 1990s, F: 1990s, C: 1980s
    const r = calculateChemistry({ players: [A, B, F, C] });
    // Pares com mesma era (1990s): AB, AF, BF = 3 links
    expect(r.breakdown.eraLinks).toBe(3);
  });

  it('TC-CHEM-22: breakdown.totalLinkBonus = soma de todos link.total', () => {
    const players = [A, B, C, D];
    const r = calculateChemistry({ players });
    const manual = r.links.reduce((s, l) => s + l.total, 0);
    expect(r.breakdown.totalLinkBonus).toBe(manual);
  });
});

// ─── TC-CHEM-23..27: SquadChemistry — invariantes ────────────────────────────

describe('TC-CHEM-23..27: SquadChemistry — invariantes', () => {
  it('TC-CHEM-23: total sempre entre 0 e 100', () => {
    const cases = [perfectSquad(2), perfectSquad(11), [A, C, D], [C, D], []];
    for (const players of cases) {
      const r = calculateChemistry({ players });
      expect(r.total).toBeGreaterThanOrEqual(0);
      expect(r.total).toBeLessThanOrEqual(MAX_SQUAD_CHEMISTRY);
    }
  });

  it('TC-CHEM-24: perPlayer valores sempre entre 0 e 10', () => {
    const players = [...perfectSquad(5), C, D];
    const r = calculateChemistry({ players });
    for (const score of Object.values(r.perPlayer)) {
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(10);
    }
  });

  it('TC-CHEM-25: jogador isolado (sem adjacências) → perPlayer = 0', () => {
    // D não compartilha nada com A e B
    const r = calculateChemistry({ players: [A, B, D] });
    // D participa de links AD e BD, mas com 0 bonus cada
    expect(r.perPlayer['D']).toBe(0);
  });

  it('TC-CHEM-26: squad misto → chemistry entre 0 e 100 exclusivo', () => {
    // 5 BR + 6 AR (dois grupos distintos, sem link perfeito inter-grupo)
    const players = [
      ...Array.from({ length: 5 }, (_, i) =>
        p({ userCardId: `br${i}`, nationality: 'BR', competition: 'brasileirao', era: '1990s' }),
      ),
      ...Array.from({ length: 6 }, (_, i) =>
        p({ userCardId: `ar${i}`, nationality: 'AR', competition: 'laliga', era: '1980s' }),
      ),
    ];
    const r = calculateChemistry({ players });
    expect(r.total).toBeGreaterThan(0);
    expect(r.total).toBeLessThan(100);
  });

  it('TC-CHEM-27: perfectLinks = 0 quando não há links perfeitos', () => {
    // A e C: nat(BR≠AR), comp(laliga≠bundesliga), era(1990s≠1980s) = 0 bonus
    const r = calculateChemistry({ players: [A, C] });
    expect(r.breakdown.perfectLinks).toBe(0);
    expect(r.total).toBe(0);
  });
});

// ─── TC-CHEM-28..30: Modos de adjacência ─────────────────────────────────────

describe('TC-CHEM-28..30: Adjacência customizada', () => {
  it('TC-CHEM-28: adjacentPairs limita quais pares são avaliados', () => {
    // Com 3 jogadores, sem adjacência: 3 links (AB, AC, BC)
    // Com adjacência [A-B]: apenas 1 link
    const full = calculateChemistry({ players: [A, B, C] });
    const limited = calculateChemistry({
      players: [A, B, C],
      adjacentPairs: [{ idA: 'A', idB: 'B' }],
    });
    expect(full.links.length).toBeGreaterThan(limited.links.length);
    expect(limited.links).toHaveLength(1);
  });

  it('TC-CHEM-29: adjacentPairs com par perfeito → total = 100', () => {
    // Mesmo com C no squad, o link avaliado é só AB (perfeito)
    const r = calculateChemistry({
      players: [A, B, C],
      adjacentPairs: [{ idA: 'A', idB: 'B' }],
    });
    expect(r.total).toBe(100);
    expect(r.breakdown.perfectLinks).toBe(1);
  });

  it('TC-CHEM-30: adjacentPairs inválidos (ids não encontrados) → ignorados', () => {
    const r = calculateChemistry({
      players: [A, B],
      adjacentPairs: [
        { idA: 'A', idB: 'B' }, // válido
        { idA: 'GHOST', idB: 'B' }, // inválido, ignorado
        { idA: 'A', idB: 'PHANTOM' }, // inválido, ignorado
      ],
    });
    // Apenas o link AB deve ser calculado
    expect(r.links).toHaveLength(1);
    expect(r.total).toBe(100);
  });
});
