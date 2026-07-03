import { describe, expect, it } from 'vitest';
import { calculateChemistry } from '../../src/chemistry/chemistry';
import type {
  AdjacentSlotPair,
  ChemistryPlayer,
  ChemistrySquadSlot,
} from '../../src/chemistry/types';

function player(overrides: Partial<ChemistryPlayer>): ChemistryPlayer {
  return {
    nationality: 'BRA',
    eraStart: 1990,
    eraEnd: 2000,
    primaryPosition: 'CB',
    ...overrides,
  };
}

function slot(
  slotId: string,
  formationPosition: ChemistrySquadSlot['formationPosition'],
  p: ChemistryPlayer,
): ChemistrySquadSlot {
  return { slotId, formationPosition, player: p };
}

function pair(slotIdA: string, slotIdB: string): AdjacentSlotPair {
  return { slotIdA, slotIdB };
}

describe('calculateChemistry — tabela histórica de 5 níveis (doc 10 §7)', () => {
  // Em todos os casos abaixo, os dois jogadores ficam DELIBERADAMENTE
  // fora de posição (slot 'ST' com primaryPosition 'CB') para isolar o
  // componente histórico, sem o bônus de encaixe posicional somando por cima.

  it('mesma seleção e mesma Copa: link = 4 → química 100', () => {
    const a = player({ nationality: 'BRA', eraStart: 1968, eraEnd: 1974, worldCupYear: 1970 });
    const b = player({ nationality: 'BRA', eraStart: 1968, eraEnd: 1974, worldCupYear: 1970 });
    const slots = [slot('S1', 'ST', a), slot('S2', 'ST', b)];
    const result = calculateChemistry(slots, [pair('S1', 'S2')]);
    expect(result.chemistry).toBe(100); // 4/4 * 100
  });

  it('mesma seleção, eras sobrepostas, Copas diferentes: link = 2 → química 50', () => {
    const a = player({ nationality: 'BRA', eraStart: 1968, eraEnd: 1974, worldCupYear: 1970 });
    const b = player({ nationality: 'BRA', eraStart: 1970, eraEnd: 1978, worldCupYear: 1974 });
    const slots = [slot('S1', 'ST', a), slot('S2', 'ST', b)];
    const result = calculateChemistry(slots, [pair('S1', 'S2')]);
    expect(result.chemistry).toBe(50); // 2/4 * 100
  });

  it('mesma seleção, eras não sobrepostas: link = 1 → química 25', () => {
    const a = player({ nationality: 'BRA', eraStart: 1958, eraEnd: 1962 });
    const b = player({ nationality: 'BRA', eraStart: 1994, eraEnd: 1998 });
    const slots = [slot('S1', 'ST', a), slot('S2', 'ST', b)];
    const result = calculateChemistry(slots, [pair('S1', 'S2')]);
    expect(result.chemistry).toBe(25); // 1/4 * 100
  });

  it('nações diferentes, eras sobrepostas: link = 0 → química 0', () => {
    const a = player({ nationality: 'BRA', eraStart: 1990, eraEnd: 2000 });
    const b = player({ nationality: 'ARG', eraStart: 1992, eraEnd: 2002 });
    const slots = [slot('S1', 'ST', a), slot('S2', 'ST', b)];
    const result = calculateChemistry(slots, [pair('S1', 'S2')]);
    expect(result.chemistry).toBe(0); // 0/4 * 100
  });

  it('nações diferentes, eras totalmente distintas: link = -1 (penalidade) → química 0 (clamp)', () => {
    const a = player({ nationality: 'BRA', eraStart: 1958, eraEnd: 1962 });
    const b = player({ nationality: 'ARG', eraStart: 1994, eraEnd: 1998 });
    const slots = [slot('S1', 'ST', a), slot('S2', 'ST', b)];
    const result = calculateChemistry(slots, [pair('S1', 'S2')]);
    // -1/4 * 100 = -25, clamp(0,100) = 0
    expect(result.chemistry).toBe(0);
  });
});

describe('calculateChemistry — bônus de encaixe posicional (doc 09 §4)', () => {
  it('os dois jogadores em posição correta somam +2, elevando a química', () => {
    // Mesmo par "nações diferentes, eras sobrepostas" do teste acima
    // (link histórico = 0), mas agora AMBOS na posição correta.
    const a = player({ nationality: 'BRA', eraStart: 1990, eraEnd: 2000, primaryPosition: 'CB' });
    const b = player({ nationality: 'ARG', eraStart: 1992, eraEnd: 2002, primaryPosition: 'CB' });
    const slots = [slot('S1', 'CB', a), slot('S2', 'CB', b)];
    const result = calculateChemistry(slots, [pair('S1', 'S2')]);
    // 0 (histórico) + 1 + 1 (encaixe) = 2 → 2/4*100 = 50
    expect(result.chemistry).toBe(50);
  });

  it('o teto por par permanece 4, mesmo quando histórico (4) + encaixe (+2) ultrapassaria isso', () => {
    const a = player({
      nationality: 'BRA',
      eraStart: 1968,
      eraEnd: 1974,
      worldCupYear: 1970,
      primaryPosition: 'CB',
    });
    const b = player({
      nationality: 'BRA',
      eraStart: 1968,
      eraEnd: 1974,
      worldCupYear: 1970,
      primaryPosition: 'CB',
    });
    const slots = [slot('S1', 'CB', a), slot('S2', 'CB', b)];
    const result = calculateChemistry(slots, [pair('S1', 'S2')]);
    // histórico=4, encaixe=+1+1=2, soma=6, clamp(.,-1,4)=4 → 4/4*100=100
    expect(result.chemistry).toBe(100);
  });

  it('apenas um dos dois jogadores em posição correta soma só +1', () => {
    const a = player({ nationality: 'BRA', eraStart: 1990, eraEnd: 2000, primaryPosition: 'CB' });
    const b = player({ nationality: 'ARG', eraStart: 1992, eraEnd: 2002, primaryPosition: 'ST' }); // fora de posição no slot CB
    const slots = [slot('S1', 'CB', a), slot('S2', 'CB', b)];
    const result = calculateChemistry(slots, [pair('S1', 'S2')]);
    // 0 (histórico) + 1 (só A no slot certo) = 1 → 1/4*100 = 25
    expect(result.chemistry).toBe(25);
  });
});

describe('calculateChemistry — agregação no elenco (3 slots, 2 pares)', () => {
  it('reproduz o cálculo feito à mão para um elenco heterogêneo', () => {
    // P1/P2: mesma seleção e mesma Copa, ambos na posição correta → link CB1-CB2 = 4 (clampado de 6)
    // P2/P3: nações diferentes, eras não sobrepostas → histórico -1; ambos na posição correta → +1+1 → link CB2-ST1 = 1
    const p1 = player({
      nationality: 'BRA',
      eraStart: 1968,
      eraEnd: 1974,
      worldCupYear: 1970,
      primaryPosition: 'CB',
    });
    const p2 = player({
      nationality: 'BRA',
      eraStart: 1968,
      eraEnd: 1974,
      worldCupYear: 1970,
      primaryPosition: 'CB',
    });
    const p3 = player({ nationality: 'ARG', eraStart: 1985, eraEnd: 1990, primaryPosition: 'ST' });

    const slots = [slot('CB1', 'CB', p1), slot('CB2', 'CB', p2), slot('ST1', 'ST', p3)];
    const pairs = [pair('CB1', 'CB2'), pair('CB2', 'ST1')];

    const result = calculateChemistry(slots, pairs);
    // total = 4 + 1 = 5; maxPossible = 2*4 = 8; 5/8*100 = 62.5 → round → 63
    expect(result.chemistry).toBe(63);
    expect(result.isCompleteHistoricalSquad).toBe(false); // P3 é de outra seleção
  });
});

describe('calculateChemistry — "Time Histórico Completo" (doc 10 §7)', () => {
  it('detecta a condição quando TODOS os slots compartilham nação e Copa', () => {
    const p1 = player({ nationality: 'BRA', worldCupYear: 1970 });
    const p2 = player({ nationality: 'BRA', worldCupYear: 1970 });
    const p3 = player({ nationality: 'BRA', worldCupYear: 1970 });
    const slots = [slot('S1', 'CB', p1), slot('S2', 'CB', p2), slot('S3', 'CB', p3)];
    const result = calculateChemistry(slots, [pair('S1', 'S2'), pair('S2', 'S3')]);
    expect(result.isCompleteHistoricalSquad).toBe(true);
  });

  it('NÃO detecta a condição se um único jogador tiver nação diferente', () => {
    const p1 = player({ nationality: 'BRA', worldCupYear: 1970 });
    const p2 = player({ nationality: 'BRA', worldCupYear: 1970 });
    const p3 = player({ nationality: 'ARG', worldCupYear: 1970 });
    const slots = [slot('S1', 'CB', p1), slot('S2', 'CB', p2), slot('S3', 'CB', p3)];
    const result = calculateChemistry(slots, [pair('S1', 'S2'), pair('S2', 'S3')]);
    expect(result.isCompleteHistoricalSquad).toBe(false);
  });

  it('NÃO detecta a condição se um único jogador tiver edição de Copa diferente', () => {
    const p1 = player({ nationality: 'BRA', worldCupYear: 1970 });
    const p2 = player({ nationality: 'BRA', worldCupYear: 1970 });
    const p3 = player({ nationality: 'BRA', worldCupYear: 1958 });
    const slots = [slot('S1', 'CB', p1), slot('S2', 'CB', p2), slot('S3', 'CB', p3)];
    const result = calculateChemistry(slots, [pair('S1', 'S2'), pair('S2', 'S3')]);
    expect(result.isCompleteHistoricalSquad).toBe(false);
  });

  it('NÃO detecta a condição se algum jogador não tiver worldCupYear definido', () => {
    const p1 = player({ nationality: 'BRA', worldCupYear: 1970 });
    const p2 = player({ nationality: 'BRA' }); // sem worldCupYear
    const slots = [slot('S1', 'CB', p1), slot('S2', 'CB', p2)];
    const result = calculateChemistry(slots, [pair('S1', 'S2')]);
    expect(result.isCompleteHistoricalSquad).toBe(false);
  });

  it('um elenco vazio nunca qualifica', () => {
    expect(calculateChemistry([], []).isCompleteHistoricalSquad).toBe(false);
  });

  it('a condição implica matematicamente química 100 — confirmando por que o bônus não é somado aqui', () => {
    const p1 = player({ nationality: 'BRA', worldCupYear: 1970, primaryPosition: 'ST' }); // fora de posição
    const p2 = player({ nationality: 'BRA', worldCupYear: 1970, primaryPosition: 'ST' }); // fora de posição
    const slots = [slot('S1', 'CB', p1), slot('S2', 'CB', p2)];
    const result = calculateChemistry(slots, [pair('S1', 'S2')]);
    // mesmo SEM nenhum bônus de encaixe posicional, histórico=4 já satura o teto.
    expect(result.chemistry).toBe(100);
    expect(result.isCompleteHistoricalSquad).toBe(true);
  });
});

describe('calculateChemistry — casos extremos', () => {
  it('sem pares adjacentes, a química é 0', () => {
    const result = calculateChemistry([], []);
    expect(result.chemistry).toBe(0);
  });

  it('lança uma exceção quando um par referencia um slotId inexistente', () => {
    const a = player({});
    const slots = [slot('S1', 'CB', a)];
    expect(() => calculateChemistry(slots, [pair('S1', 'inexistente')])).toThrow(/inexistente/);
  });

  it('a química nunca fica abaixo de 0, mesmo com todos os pares na pior penalidade', () => {
    const a = player({ nationality: 'BRA', eraStart: 1958, eraEnd: 1962, primaryPosition: 'ST' });
    const b = player({ nationality: 'ARG', eraStart: 1994, eraEnd: 1998, primaryPosition: 'ST' });
    const slots = [slot('S1', 'CB', a), slot('S2', 'CB', b)];
    const result = calculateChemistry(slots, [pair('S1', 'S2')]);
    expect(result.chemistry).toBeGreaterThanOrEqual(0);
  });

  it('a química nunca ultrapassa 100', () => {
    const a = player({
      nationality: 'BRA',
      eraStart: 1968,
      eraEnd: 1974,
      worldCupYear: 1970,
      primaryPosition: 'CB',
    });
    const b = player({
      nationality: 'BRA',
      eraStart: 1968,
      eraEnd: 1974,
      worldCupYear: 1970,
      primaryPosition: 'CB',
    });
    const slots = [slot('S1', 'CB', a), slot('S2', 'CB', b)];
    const result = calculateChemistry(slots, [pair('S1', 'S2')]);
    expect(result.chemistry <= 100).toBe(true);
  });
});
