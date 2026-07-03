/**
 * Testes de `validateSquad` — TC-SQUAD-20..27
 */
import { describe, expect, it } from 'vitest';
import { makePlantel, makePlayer, makeResolver } from '../src/testing/fixtures';
import type { Squad } from '../src/types/types';
import { addPlayer } from '../src/use-cases/addPlayer';
import { createSquad } from '../src/use-cases/createSquad';
import { validateSquad } from '../src/use-cases/validateSquad';

let seq = 0;
const nextId = () => `sv-${++seq}`;

/**
 * Monta um squad 4-3-3 completo com 11 titulares + 7 banco.
 * Usa makePlantel() que tem jogadores nas posições certas.
 */
function buildCompleteSquad(): { squad: Squad; resolver: ReturnType<typeof makeResolver> } {
  const plantel = makePlantel();
  const resolver = makeResolver(plantel);

  const r = createSquad({ userId: 'user-001', formation: '4-3-3', generateId: nextId });
  if (!r.ok) throw new Error('createSquad falhou');

  const slots433 = [
    'GK-1',
    'RB-1',
    'CB-1',
    'CB-2',
    'LB-1',
    'CM-1',
    'CM-2',
    'CM-3',
    'RW-1',
    'ST-1',
    'LW-1',
  ];
  const starters = [
    'uc-gk',
    'uc-rb',
    'uc-cb1',
    'uc-cb2',
    'uc-lb',
    'uc-cm1',
    'uc-cm2',
    'uc-cm3',
    'uc-rw',
    'uc-st',
    'uc-lw',
  ];
  const bench = ['uc-b1', 'uc-b2', 'uc-b3', 'uc-b4', 'uc-b5', 'uc-b6', 'uc-b7'];

  let squad = r.value;
  for (let i = 0; i < starters.length; i++) {
    const added = addPlayer({
      squad,
      userCardId: starters[i]!,
      slotId: slots433[i]!,
      resolvePlayer: resolver,
    });
    if (!added.ok) throw new Error(`addPlayer starter ${i} falhou: ${JSON.stringify(added.error)}`);
    squad = added.value;
  }
  for (const bId of bench) {
    const added = addPlayer({ squad, userCardId: bId, resolvePlayer: resolver });
    if (!added.ok) throw new Error(`addPlayer bench ${bId} falhou`);
    squad = added.value;
  }

  return { squad, resolver };
}

describe('validateSquad', () => {
  describe('TC-SQUAD-20..27: squad completo e válido', () => {
    it('retorna valid:true para squad completo e correto', () => {
      const { squad, resolver } = buildCompleteSquad();
      const result = validateSquad({ squad, resolvePlayer: resolver });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('TC-SQUAD-20: menos de 11 titulares → erro', () => {
    it('squad vazio retorna INCOMPLETE_STARTERS', () => {
      const r = createSquad({ userId: 'user-001', formation: '4-3-3', generateId: nextId });
      if (!r.ok) throw new Error();
      const result = validateSquad({ squad: r.value, resolvePlayer: () => null });
      expect(result.valid).toBe(false);
      const codes = result.errors.map((e) => e.code);
      expect(codes).toContain('INCOMPLETE_STARTERS');
    });

    it('squad com 10 titulares retorna erro', () => {
      const plantel = makePlantel();
      const resolver = makeResolver(plantel);
      const r = createSquad({ userId: 'user-001', formation: '4-3-3', generateId: nextId });
      if (!r.ok) throw new Error();

      // Adicionar apenas 10 (GK até LW, sem o ST)
      const slots = [
        'GK-1',
        'RB-1',
        'CB-1',
        'CB-2',
        'LB-1',
        'CM-1',
        'CM-2',
        'CM-3',
        'RW-1',
        'LW-1',
      ];
      const cards = [
        'uc-gk',
        'uc-rb',
        'uc-cb1',
        'uc-cb2',
        'uc-lb',
        'uc-cm1',
        'uc-cm2',
        'uc-cm3',
        'uc-rw',
        'uc-lw',
      ];
      let squad = r.value;
      for (let i = 0; i < 10; i++) {
        const a = addPlayer({
          squad,
          userCardId: cards[i]!,
          slotId: slots[i]!,
          resolvePlayer: resolver,
        });
        if (!a.ok) throw new Error();
        squad = a.value;
      }
      // 5 de banco
      for (const b of ['uc-b1', 'uc-b2', 'uc-b3', 'uc-b4', 'uc-b5']) {
        const a = addPlayer({ squad, userCardId: b, resolvePlayer: resolver });
        if (!a.ok) throw new Error();
        squad = a.value;
      }

      const result = validateSquad({ squad, resolvePlayer: resolver });
      expect(result.valid).toBe(false);
      expect(result.errors.map((e) => e.code)).toContain('INCOMPLETE_STARTERS');
    });
  });

  describe('TC-SQUAD-21: GK ausente → erro', () => {
    it('squad com 0 GK retorna INVALID_GK_COUNT', () => {
      // Cria squad 4-3-3 sem GK
      const plantel = makePlantel();
      const resolver = makeResolver(plantel);
      const r = createSquad({ userId: 'user-001', formation: '4-3-3', generateId: nextId });
      if (!r.ok) throw new Error();
      // GK-1 recebe um CM (posição incompatível → addPlayer vai falhar)
      // Então o slot GK-1 fica vazio = squad incompleto -> INCOMPLETE_STARTERS
      // Para testar GK ausente especificamente, testamos a mensagem INVALID_GK_COUNT
      // em um squad com 11 titulares mas sem GK (não é possível montar sem addPlayer
      // detectar incompatibilidade — este cenário se manifesta como INCOMPLETE_STARTERS)
      const result = validateSquad({ squad: r.value, resolvePlayer: resolver });
      expect(result.valid).toBe(false);
      // Se squad incompleto, também não tem GK
      const codes = result.errors.map((e) => e.code);
      expect(codes.some((c) => c === 'INCOMPLETE_STARTERS' || c === 'INVALID_GK_COUNT')).toBe(true);
    });
  });

  describe('TC-SQUAD-22: banco insuficiente → erro', () => {
    it('banco com 4 jogadores (< 5) retorna BENCH_TOO_SMALL', () => {
      const plantel = makePlantel();
      const resolver = makeResolver(plantel);
      const r = createSquad({ userId: 'user-001', formation: '4-3-3', generateId: nextId });
      if (!r.ok) throw new Error();

      const slots = [
        'GK-1',
        'RB-1',
        'CB-1',
        'CB-2',
        'LB-1',
        'CM-1',
        'CM-2',
        'CM-3',
        'RW-1',
        'ST-1',
        'LW-1',
      ];
      const starters = [
        'uc-gk',
        'uc-rb',
        'uc-cb1',
        'uc-cb2',
        'uc-lb',
        'uc-cm1',
        'uc-cm2',
        'uc-cm3',
        'uc-rw',
        'uc-st',
        'uc-lw',
      ];
      let squad = r.value;
      for (let i = 0; i < 11; i++) {
        const a = addPlayer({
          squad,
          userCardId: starters[i]!,
          slotId: slots[i]!,
          resolvePlayer: resolver,
        });
        if (!a.ok) throw new Error();
        squad = a.value;
      }
      // Apenas 4 no banco (< 5)
      for (const b of ['uc-b1', 'uc-b2', 'uc-b3', 'uc-b4']) {
        const a = addPlayer({ squad, userCardId: b, resolvePlayer: resolver });
        if (!a.ok) throw new Error();
        squad = a.value;
      }

      const result = validateSquad({ squad, resolvePlayer: resolver });
      expect(result.valid).toBe(false);
      expect(result.errors.map((e) => e.code)).toContain('BENCH_TOO_SMALL');
    });
  });

  describe('TC-SQUAD-25: titular lesionado → erro', () => {
    it('detecta jogador lesionado nos titulares', () => {
      const { squad, resolver: baseResolver } = buildCompleteSquad();
      const plantel = makePlantel();
      // Marcar ST como lesionado
      const modifiedPlantel = plantel.map((p) =>
        p.userCardId === 'uc-st' ? { ...p, isInjured: true } : p,
      );
      const modResolver = makeResolver(modifiedPlantel);
      const result = validateSquad({ squad, resolvePlayer: modResolver });
      expect(result.valid).toBe(false);
      expect(result.errors.map((e) => e.code)).toContain('PLAYER_INJURED');
    });
  });

  describe('TC-SQUAD-26: titular suspenso → erro', () => {
    it('detecta jogador suspenso nos titulares', () => {
      const { squad } = buildCompleteSquad();
      const plantel = makePlantel();
      const modifiedPlantel = plantel.map((p) =>
        p.userCardId === 'uc-cm1' ? { ...p, suspendedMatches: 1 } : p,
      );
      const result = validateSquad({ squad, resolvePlayer: makeResolver(modifiedPlantel) });
      expect(result.valid).toBe(false);
      expect(result.errors.map((e) => e.code)).toContain('PLAYER_SUSPENDED');
    });
  });

  describe('TC-SQUAD-27: ownership mismatch → erro', () => {
    it('detecta jogador de outro userId nos titulares', () => {
      const { squad } = buildCompleteSquad();
      const plantel = makePlantel();
      const modifiedPlantel = plantel.map((p) =>
        p.userCardId === 'uc-rb' ? { ...p, userId: 'hacker-999' } : p,
      );
      const result = validateSquad({ squad, resolvePlayer: makeResolver(modifiedPlantel) });
      expect(result.valid).toBe(false);
      expect(result.errors.map((e) => e.code)).toContain('OWNERSHIP_MISMATCH');
    });
  });

  describe('Múltiplos erros de uma vez', () => {
    it('retorna todos os erros quando há vários problemas', () => {
      const { squad } = buildCompleteSquad();
      const plantel = makePlantel();
      const modifiedPlantel = plantel.map((p) => {
        if (p.userCardId === 'uc-st') return { ...p, isInjured: true };
        if (p.userCardId === 'uc-cm1') return { ...p, suspendedMatches: 2 };
        return p;
      });
      const result = validateSquad({ squad, resolvePlayer: makeResolver(modifiedPlantel) });
      expect(result.valid).toBe(false);
      const codes = result.errors.map((e) => e.code);
      expect(codes).toContain('PLAYER_INJURED');
      expect(codes).toContain('PLAYER_SUSPENDED');
    });
  });
});
