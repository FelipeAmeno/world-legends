/**
 * Testes de `createSquad` — TC-SQUAD-01..02
 */
import { describe, expect, it } from 'vitest';
import { buildSquadSlots } from '../src/formation/formation';
import type { Formation } from '../src/types/types';
import { createSquad } from '../src/use-cases/createSquad';

let seq = 0;
const nextId = () => `squad-${++seq}`;

describe('createSquad', () => {
  describe('TC-SQUAD-01: criação com formação válida', () => {
    const formations: Formation[] = [
      '4-3-3',
      '4-4-2',
      '4-2-3-1',
      '3-5-2',
      '5-3-2',
      '4-5-1',
      '4-1-4-1',
      '3-4-3',
    ];

    for (const f of formations) {
      it(`cria squad com formação ${f}`, () => {
        const result = createSquad({ userId: 'u1', formation: f, generateId: nextId });
        expect(result.ok).toBe(true);
        if (!result.ok) return;
        expect(result.value.formation).toBe(f);
        expect(result.value.starters).toHaveLength(11);
        expect(result.value.bench).toHaveLength(0);
        expect(result.value.userId).toBe('u1');
      });
    }

    it('slots gerados têm userCardId null (vazios)', () => {
      const r = createSquad({ userId: 'u1', formation: '4-3-3', generateId: nextId });
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      r.value.starters.forEach((s) => expect(s.userCardId).toBeNull());
    });

    it('slotIds são únicos dentro do squad', () => {
      const r = createSquad({ userId: 'u1', formation: '4-3-3', generateId: nextId });
      if (!r.ok) return;
      const ids = r.value.starters.map((s) => s.slotId);
      expect(new Set(ids).size).toBe(11);
    });

    it('formação 4-3-3 tem exatamente 1 GK', () => {
      const r = createSquad({ userId: 'u1', formation: '4-3-3', generateId: nextId });
      if (!r.ok) return;
      const gks = r.value.starters.filter((s) => s.requiredPosition === 'GK');
      expect(gks).toHaveLength(1);
    });

    it('formação 4-3-3 tem 4 defensores', () => {
      const r = createSquad({ userId: 'u1', formation: '4-3-3', generateId: nextId });
      if (!r.ok) return;
      const def = r.value.starters.filter((s) =>
        ['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(s.requiredPosition),
      );
      expect(def).toHaveLength(4);
    });

    it('formação 3-5-2 tem 3 CBs', () => {
      const r = createSquad({ userId: 'u1', formation: '3-5-2', generateId: nextId });
      if (!r.ok) return;
      const cbs = r.value.starters.filter((s) => s.requiredPosition === 'CB');
      expect(cbs).toHaveLength(3);
      expect(r.value.starters.filter((s) => s.requiredPosition === 'ST')).toHaveLength(2);
    });

    it('nome padrão é atribuído se não fornecido', () => {
      const r = createSquad({ userId: 'jota', formation: '4-4-2', generateId: nextId });
      if (!r.ok) return;
      expect(r.value.name).toContain('jota');
    });

    it('nome personalizado é preservado', () => {
      const r = createSquad({
        userId: 'u1',
        formation: '4-3-3',
        name: 'Meu Time',
        generateId: nextId,
      });
      if (!r.ok) return;
      expect(r.value.name).toBe('Meu Time');
    });

    it('squad tem createdAt e updatedAt', () => {
      const r = createSquad({ userId: 'u1', formation: '4-3-3', generateId: nextId });
      if (!r.ok) return;
      expect(r.value.createdAt).toBeInstanceOf(Date);
      expect(r.value.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('TC-SQUAD-02: formação inválida retorna erro', () => {
    it('rejeita formação desconhecida', () => {
      const r = createSquad({ userId: 'u1', formation: '4-6-0', generateId: nextId });
      expect(r.ok).toBe(false);
      if (r.ok) return;
      expect(r.error).toMatchObject({ kind: 'InvalidFormation', formation: '4-6-0' });
    });

    it('rejeita string vazia como formação', () => {
      const r = createSquad({ userId: 'u1', formation: '', generateId: nextId });
      expect(r.ok).toBe(false);
    });

    it('rejeita userId vazio', () => {
      const r = createSquad({ userId: '  ', formation: '4-3-3', generateId: nextId });
      expect(r.ok).toBe(false);
    });
  });

  describe('buildSquadSlots — geração de slots', () => {
    it('4-2-3-1 tem 2 CDMs', () => {
      const slots = buildSquadSlots('4-2-3-1');
      const cdms = slots.filter((s) => s.requiredPosition === 'CDM');
      expect(cdms).toHaveLength(2);
      expect(cdms[0]!.slotId).toBe('CDM-1');
      expect(cdms[1]!.slotId).toBe('CDM-2');
    });

    it('5-3-2 tem 3 CBs numerados corretamente', () => {
      const slots = buildSquadSlots('5-3-2');
      const cbs = slots.filter((s) => s.requiredPosition === 'CB');
      expect(cbs.map((s) => s.slotId)).toEqual(['CB-1', 'CB-2', 'CB-3']);
    });

    it('4-4-2 tem 2 STs', () => {
      const slots = buildSquadSlots('4-4-2');
      const sts = slots.filter((s) => s.requiredPosition === 'ST');
      expect(sts.map((s) => s.slotId)).toEqual(['ST-1', 'ST-2']);
    });
  });
});
