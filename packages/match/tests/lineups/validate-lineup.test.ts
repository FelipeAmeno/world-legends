import { describe, expect, it } from 'vitest';
import {
  MIN_BENCH_SIZE,
  REQUIRED_STARTERS,
  validateLineup,
} from '../../src/lineups/validate-lineup';
import type { LineupSlot } from '../../src/lineups/validate-lineup';
import { makeValidLineup } from '../../src/testing/fixtures';

describe('validateLineup — lineup válida', () => {
  it('aceita uma lineup completa com 11 titulares e 5 reservas', () => {
    const r = validateLineup(makeValidLineup('test'));
    expect(r.ok).toBe(true);
  });
});

describe('validateLineup — número de titulares', () => {
  it(`rejeita com ${REQUIRED_STARTERS - 1} titulares`, () => {
    const lineup = makeValidLineup('test');
    const r = validateLineup({ ...lineup, starters: lineup.starters.slice(0, 10) });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.field).toBe('starters');
  });

  it('rejeita com 12 titulares', () => {
    const lineup = makeValidLineup('test');
    const extra: LineupSlot = {
      slotId: 'extra',
      userCardId: 'extra-card',
      formationPosition: 'ST',
    };
    const r = validateLineup({ ...lineup, starters: [...lineup.starters, extra] });
    expect(r.ok).toBe(false);
  });
});

describe('validateLineup — goleiro', () => {
  it('rejeita sem goleiro (GK)', () => {
    const lineup = makeValidLineup('test');
    const noGk = lineup.starters.map((s: LineupSlot) =>
      s.formationPosition === 'GK' ? { ...s, formationPosition: 'CB' as const } : s,
    );
    const r = validateLineup({ ...lineup, starters: noGk });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message.toLowerCase()).toContain('goleiro');
  });

  it('rejeita com 2 goleiros', () => {
    const lineup = makeValidLineup('test');
    const twoGk = lineup.starters.map((s: LineupSlot, i: number) =>
      i === 1 ? { ...s, formationPosition: 'GK' as const } : s,
    );
    const r = validateLineup({ ...lineup, starters: twoGk });
    expect(r.ok).toBe(false);
  });
});

describe('validateLineup — posições', () => {
  it('rejeita posição inválida', () => {
    const lineup = makeValidLineup('test');
    const badPos = (lineup.starters as LineupSlot[]).map((s: LineupSlot, i: number) =>
      i === 5 ? { ...s, formationPosition: 'XX' as never } : s,
    );
    const r = validateLineup({ ...lineup, starters: badPos });
    expect(r.ok).toBe(false);
  });
});

describe('validateLineup — unicidade', () => {
  it('rejeita slotId duplicado', () => {
    const lineup = makeValidLineup('test');
    const dupSlot = lineup.starters.map((s: LineupSlot, i: number) =>
      i === 5 ? { ...s, slotId: lineup.starters[0]!.slotId } : s,
    );
    const r = validateLineup({ ...lineup, starters: dupSlot });
    expect(r.ok).toBe(false);
  });

  it('rejeita userCardId duplicado entre titulares e reservas', () => {
    const lineup = makeValidLineup('test');
    const dupCard: LineupSlot[] = lineup.bench.map((s: LineupSlot, i: number) =>
      i === 0 ? { ...s, userCardId: lineup.starters[3]!.userCardId } : s,
    );
    const r = validateLineup({ ...lineup, bench: dupCard });
    expect(r.ok).toBe(false);
  });
});

describe('validateLineup — banco mínimo', () => {
  it(`rejeita banco com menos de ${MIN_BENCH_SIZE} jogadores`, () => {
    const lineup = makeValidLineup('test');
    const r = validateLineup({ ...lineup, bench: lineup.bench.slice(0, 4) });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.field).toBe('bench');
  });
});
