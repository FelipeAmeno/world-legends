/**
 * Testes de `addPlayer` e `removePlayer` — TC-SQUAD-03..16
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { makePlantel, makePlayer, makeResolver } from '../src/testing/fixtures';
import type { Squad } from '../src/types/types';
import { addPlayer } from '../src/use-cases/addPlayer';
import { createSquad } from '../src/use-cases/createSquad';
import { removePlayer } from '../src/use-cases/removePlayer';

let seq = 0;
const nextId = () => `sq-${++seq}`;

function emptySquad433(userId = 'user-001'): Squad {
  const r = createSquad({ userId, formation: '4-3-3', generateId: nextId });
  if (!r.ok) throw new Error('createSquad falhou no fixture');
  return r.value;
}

describe('addPlayer — titulares', () => {
  describe('TC-SQUAD-03: adicionar jogador na posição correta', () => {
    it('GK no slot GK-1', () => {
      const gk = makePlayer({ naturalPosition: 'GK', userCardId: 'uc-gk' });
      const squad = emptySquad433();
      const r = addPlayer({
        squad,
        userCardId: 'uc-gk',
        slotId: 'GK-1',
        resolvePlayer: makeResolver([gk]),
      });
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      const gkSlot = r.value.starters.find((s) => s.slotId === 'GK-1');
      expect(gkSlot?.userCardId).toBe('uc-gk');
    });

    it('ST no slot ST-1', () => {
      const st = makePlayer({ naturalPosition: 'ST', userCardId: 'uc-st' });
      const r = addPlayer({
        squad: emptySquad433(),
        userCardId: 'uc-st',
        slotId: 'ST-1',
        resolvePlayer: makeResolver([st]),
      });
      expect(r.ok).toBe(true);
    });

    it('CB-1 recebe CB', () => {
      const cb = makePlayer({ naturalPosition: 'CB', userCardId: 'uc-cb' });
      const r = addPlayer({
        squad: emptySquad433(),
        userCardId: 'uc-cb',
        slotId: 'CB-1',
        resolvePlayer: makeResolver([cb]),
      });
      expect(r.ok).toBe(true);
    });
  });

  describe('TC-SQUAD-04: slot não existe → erro', () => {
    it('rejeita slotId "ST-9" que não existe em 4-3-3', () => {
      const st = makePlayer({ naturalPosition: 'ST', userCardId: 'uc-st' });
      const r = addPlayer({
        squad: emptySquad433(),
        userCardId: 'uc-st',
        slotId: 'ST-9',
        resolvePlayer: makeResolver([st]),
      });
      expect(r.ok).toBe(false);
      if (r.ok) return;
      expect(r.error).toMatchObject({ kind: 'SlotNotFound', slotId: 'ST-9' });
    });
  });

  describe('TC-SQUAD-05: posição incompatível → erro', () => {
    it('GK não pode jogar no slot ST-1', () => {
      const gk = makePlayer({ naturalPosition: 'GK', userCardId: 'uc-gk' });
      const r = addPlayer({
        squad: emptySquad433(),
        userCardId: 'uc-gk',
        slotId: 'ST-1',
        resolvePlayer: makeResolver([gk]),
      });
      expect(r.ok).toBe(false);
      if (r.ok) return;
      expect(r.error).toMatchObject({ kind: 'IncompatiblePosition' });
    });

    it('ST não pode jogar no slot GK-1', () => {
      const st = makePlayer({ naturalPosition: 'ST', userCardId: 'uc-st' });
      const r = addPlayer({
        squad: emptySquad433(),
        userCardId: 'uc-st',
        slotId: 'GK-1',
        resolvePlayer: makeResolver([st]),
      });
      expect(r.ok).toBe(false);
      if (r.ok) return;
      expect(r.error).toMatchObject({ kind: 'IncompatiblePosition' });
    });

    it('CB não pode jogar no slot ST-1', () => {
      const cb = makePlayer({ naturalPosition: 'CB', userCardId: 'uc-cb' });
      const r = addPlayer({
        squad: emptySquad433(),
        userCardId: 'uc-cb',
        slotId: 'ST-1',
        resolvePlayer: makeResolver([cb]),
      });
      expect(r.ok).toBe(false);
    });
  });

  describe('Posições compatíveis (não naturais) são aceitas', () => {
    it('CM aceita no slot CDM de 4-2-3-1', () => {
      const cm = makePlayer({ naturalPosition: 'CM', userCardId: 'uc-cm' });
      const r4 = createSquad({ userId: 'user-001', formation: '4-2-3-1', generateId: nextId });
      if (!r4.ok) return;
      const r = addPlayer({
        squad: r4.value,
        userCardId: 'uc-cm',
        slotId: 'CDM-1',
        resolvePlayer: makeResolver([cm]),
      });
      expect(r.ok).toBe(true);
    });

    it('RW aceita no slot ST de 4-3-3', () => {
      const rw = makePlayer({ naturalPosition: 'RW', userCardId: 'uc-rw' });
      const r = addPlayer({
        squad: emptySquad433(),
        userCardId: 'uc-rw',
        slotId: 'ST-1',
        resolvePlayer: makeResolver([rw]),
      });
      expect(r.ok).toBe(true);
    });

    it('CF aceita no slot ST-1', () => {
      const cf = makePlayer({ naturalPosition: 'CF', userCardId: 'uc-cf' });
      const r = addPlayer({
        squad: emptySquad433(),
        userCardId: 'uc-cf',
        slotId: 'ST-1',
        resolvePlayer: makeResolver([cf]),
      });
      expect(r.ok).toBe(true);
    });

    it('LWB aceita no slot LB', () => {
      const lwb = makePlayer({ naturalPosition: 'LWB', userCardId: 'uc-lwb' });
      const r = addPlayer({
        squad: emptySquad433(),
        userCardId: 'uc-lwb',
        slotId: 'LB-1',
        resolvePlayer: makeResolver([lwb]),
      });
      expect(r.ok).toBe(true);
    });
  });

  describe('TC-SQUAD-06: slot ocupado → erro', () => {
    it('não pode ocupar slot já preenchido', () => {
      const gk1 = makePlayer({ naturalPosition: 'GK', userCardId: 'uc-gk1' });
      const gk2 = makePlayer({ naturalPosition: 'GK', userCardId: 'uc-gk2' });
      const res = makeResolver([gk1, gk2]);
      let squad = emptySquad433();
      const r1 = addPlayer({ squad, userCardId: 'uc-gk1', slotId: 'GK-1', resolvePlayer: res });
      if (!r1.ok) throw new Error();
      squad = r1.value;
      const r2 = addPlayer({ squad, userCardId: 'uc-gk2', slotId: 'GK-1', resolvePlayer: res });
      expect(r2.ok).toBe(false);
      if (r2.ok) return;
      expect(r2.error).toMatchObject({ kind: 'SlotOccupied', slotId: 'GK-1' });
    });
  });

  describe('TC-SQUAD-07: jogador já no squad → erro', () => {
    it('mesmo userCardId não pode estar em dois slots', () => {
      const gk = makePlayer({ naturalPosition: 'GK', userCardId: 'uc-gk' });
      let squad = emptySquad433();
      const r1 = addPlayer({
        squad,
        userCardId: 'uc-gk',
        slotId: 'GK-1',
        resolvePlayer: makeResolver([gk]),
      });
      if (!r1.ok) throw new Error();
      squad = r1.value;
      const r2 = addPlayer({
        squad,
        userCardId: 'uc-gk',
        slotId: 'RB-1',
        resolvePlayer: makeResolver([gk]),
      });
      expect(r2.ok).toBe(false);
      if (r2.ok) return;
      expect(r2.error).toMatchObject({ kind: 'PlayerAlreadyInSquad' });
    });

    it('titular não pode ser adicionado ao banco', () => {
      const gk = makePlayer({ naturalPosition: 'GK', userCardId: 'uc-gk' });
      let squad = emptySquad433();
      const r1 = addPlayer({
        squad,
        userCardId: 'uc-gk',
        slotId: 'GK-1',
        resolvePlayer: makeResolver([gk]),
      });
      if (!r1.ok) throw new Error();
      squad = r1.value;
      const r2 = addPlayer({ squad, userCardId: 'uc-gk', resolvePlayer: makeResolver([gk]) });
      expect(r2.ok).toBe(false);
      if (r2.ok) return;
      expect(r2.error).toMatchObject({ kind: 'PlayerAlreadyInSquad' });
    });
  });

  describe('TC-SQUAD-08/09: lesionado e suspenso não podem ser titulares', () => {
    it('jogador lesionado → erro PlayerInjured', () => {
      const injured = makePlayer({ naturalPosition: 'ST', userCardId: 'uc-inj', isInjured: true });
      const r = addPlayer({
        squad: emptySquad433(),
        userCardId: 'uc-inj',
        slotId: 'ST-1',
        resolvePlayer: makeResolver([injured]),
      });
      expect(r.ok).toBe(false);
      if (r.ok) return;
      expect(r.error).toMatchObject({ kind: 'PlayerInjured' });
    });

    it('jogador suspenso → erro PlayerSuspended', () => {
      const susp = makePlayer({
        naturalPosition: 'CM',
        userCardId: 'uc-susp',
        suspendedMatches: 2,
      });
      const r = addPlayer({
        squad: emptySquad433(),
        userCardId: 'uc-susp',
        slotId: 'CM-1',
        resolvePlayer: makeResolver([susp]),
      });
      expect(r.ok).toBe(false);
      if (r.ok) return;
      expect(r.error).toMatchObject({ kind: 'PlayerSuspended', matches: 2 });
    });
  });

  describe('TC-SQUAD-10: ownership mismatch → erro', () => {
    it('jogador de outro userId é rejeitado', () => {
      const alien = makePlayer({
        naturalPosition: 'ST',
        userCardId: 'uc-alien',
        userId: 'user-999',
      });
      const r = addPlayer({
        squad: emptySquad433('user-001'),
        userCardId: 'uc-alien',
        slotId: 'ST-1',
        resolvePlayer: makeResolver([alien]),
      });
      expect(r.ok).toBe(false);
      if (r.ok) return;
      expect(r.error).toMatchObject({ kind: 'PlayerOwnershipMismatch' });
    });
  });

  describe('TC-SQUAD-11: jogador não encontrado → erro', () => {
    it('userCardId inexistente retorna PlayerNotFound', () => {
      const r = addPlayer({
        squad: emptySquad433(),
        userCardId: 'uc-ghost',
        slotId: 'ST-1',
        resolvePlayer: () => null,
      });
      expect(r.ok).toBe(false);
      if (r.ok) return;
      expect(r.error).toMatchObject({ kind: 'PlayerNotFound', userCardId: 'uc-ghost' });
    });
  });
});

describe('addPlayer — banco', () => {
  describe('TC-SQUAD-12: adicionar ao banco', () => {
    it('adiciona jogador ao banco sem slotId', () => {
      const cb = makePlayer({ naturalPosition: 'CB', userCardId: 'uc-bench-cb' });
      const r = addPlayer({
        squad: emptySquad433(),
        userCardId: 'uc-bench-cb',
        resolvePlayer: makeResolver([cb]),
      });
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      expect(r.value.bench).toContain('uc-bench-cb');
    });

    it('lesionado pode entrar no banco', () => {
      const inj = makePlayer({ naturalPosition: 'ST', userCardId: 'uc-inj', isInjured: true });
      const r = addPlayer({
        squad: emptySquad433(),
        userCardId: 'uc-inj',
        resolvePlayer: makeResolver([inj]),
      });
      expect(r.ok).toBe(true);
    });

    it('suspenso pode entrar no banco', () => {
      const susp = makePlayer({
        naturalPosition: 'CM',
        userCardId: 'uc-susp',
        suspendedMatches: 1,
      });
      const r = addPlayer({
        squad: emptySquad433(),
        userCardId: 'uc-susp',
        resolvePlayer: makeResolver([susp]),
      });
      expect(r.ok).toBe(true);
    });
  });

  describe('TC-SQUAD-13: banco cheio (7) → erro BenchFull', () => {
    it('rejeita 8º jogador no banco', () => {
      const players = Array.from({ length: 8 }, (_, i) =>
        makePlayer({ naturalPosition: 'CM', userCardId: `uc-b${i + 1}` }),
      );
      const resolver = makeResolver(players);
      let squad = emptySquad433();
      for (let i = 0; i < 7; i++) {
        const r = addPlayer({ squad, userCardId: `uc-b${i + 1}`, resolvePlayer: resolver });
        if (!r.ok) throw new Error(`Banco ${i + 1} falhou`);
        squad = r.value;
      }
      expect(squad.bench).toHaveLength(7);
      const r8 = addPlayer({ squad, userCardId: 'uc-b8', resolvePlayer: resolver });
      expect(r8.ok).toBe(false);
      if (r8.ok) return;
      expect(r8.error).toMatchObject({ kind: 'BenchFull' });
    });
  });
});

describe('removePlayer', () => {
  describe('TC-SQUAD-14: remover titular por slotId', () => {
    it('libera o slot', () => {
      const gk = makePlayer({ naturalPosition: 'GK', userCardId: 'uc-gk' });
      let squad = emptySquad433();
      const added = addPlayer({
        squad,
        userCardId: 'uc-gk',
        slotId: 'GK-1',
        resolvePlayer: makeResolver([gk]),
      });
      if (!added.ok) throw new Error();
      squad = added.value;
      const removed = removePlayer({ squad, slotId: 'GK-1' });
      expect(removed.ok).toBe(true);
      if (!removed.ok) return;
      const gkSlot = removed.value.starters.find((s) => s.slotId === 'GK-1');
      expect(gkSlot?.userCardId).toBeNull();
    });

    it('remover slot já vazio é idempotente (retorna squad igual)', () => {
      const r = removePlayer({ squad: emptySquad433(), slotId: 'GK-1' });
      expect(r.ok).toBe(true);
    });

    it('slotId inexistente → SlotNotFound', () => {
      const r = removePlayer({ squad: emptySquad433(), slotId: 'ST-99' });
      expect(r.ok).toBe(false);
      if (r.ok) return;
      expect(r.error).toMatchObject({ kind: 'SlotNotFound' });
    });
  });

  describe('TC-SQUAD-15: remover por userCardId', () => {
    it('remove titular pelo userCardId', () => {
      const gk = makePlayer({ naturalPosition: 'GK', userCardId: 'uc-gk' });
      let squad = emptySquad433();
      const added = addPlayer({
        squad,
        userCardId: 'uc-gk',
        slotId: 'GK-1',
        resolvePlayer: makeResolver([gk]),
      });
      if (!added.ok) throw new Error();
      squad = added.value;
      const r = removePlayer({ squad, userCardId: 'uc-gk' });
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      const gkSlot = r.value.starters.find((s) => s.slotId === 'GK-1');
      expect(gkSlot?.userCardId).toBeNull();
    });

    it('remove jogador do banco pelo userCardId', () => {
      const cb = makePlayer({ naturalPosition: 'CB', userCardId: 'uc-bench' });
      let squad = emptySquad433();
      const a = addPlayer({ squad, userCardId: 'uc-bench', resolvePlayer: makeResolver([cb]) });
      if (!a.ok) throw new Error();
      squad = a.value;
      const r = removePlayer({ squad, userCardId: 'uc-bench' });
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      expect(r.value.bench).not.toContain('uc-bench');
    });

    it('userCardId não encontrado → PlayerNotFound', () => {
      const r = removePlayer({ squad: emptySquad433(), userCardId: 'uc-ghost' });
      expect(r.ok).toBe(false);
      if (r.ok) return;
      expect(r.error).toMatchObject({ kind: 'PlayerNotFound' });
    });
  });

  describe('TC-SQUAD-16: sem slotId nem userCardId → ValidationError', () => {
    it('retorna erro de validação', () => {
      const r = removePlayer({ squad: emptySquad433() });
      expect(r.ok).toBe(false);
    });
  });
});
