import { describe, expect, it } from 'vitest';
import {
  createShowcase, addToShowcase, removeFromShowcase,
  reorderShowcase, HOF_SHOWCASE_MAX_SLOTS,
} from '../../src/showcase/showcase';

describe('HOF_SHOWCASE_MAX_SLOTS', () => {
  it('máximo de 5 slots (TC-HOF-06)', () => {
    expect(HOF_SHOWCASE_MAX_SLOTS).toBe(5);
  });
});

describe('createShowcase', () => {
  it('cria vitrine vazia', () => {
    const s = createShowcase('p1');
    expect(s.profileId).toBe('p1');
    expect(s.slots.length).toBe(0);
  });

  it('é imutável', () => {
    expect(Object.isFrozen(createShowcase('p1'))).toBe(true);
  });
});

describe('addToShowcase — TC-HOF-06', () => {
  it('adiciona carta válida', () => {
    const s = createShowcase('p1');
    const r = addToShowcase(s, { cardId: 'card-1', userCardId: 'uc-1' });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.slots.length).toBe(1);
      expect(r.value.slots[0]?.cardId).toBe('card-1');
      expect(r.value.slots[0]?.position).toBe(0);
    }
  });

  it('TC-HOF-06: rejeita 6ª carta (limite = 5)', () => {
    let s = createShowcase('p1');
    for (let i = 0; i < 5; i++) {
      const r = addToShowcase(s, { cardId: `card-${i}`, userCardId: `uc-${i}` });
      if (r.ok) s = r.value;
    }
    expect(s.slots.length).toBe(5);
    const r6 = addToShowcase(s, { cardId: 'card-6', userCardId: 'uc-6' });
    expect(r6.ok).toBe(false);
    if (!r6.ok) expect(r6.error.kind).toBe('SlotLimitExceeded');
  });

  it('rejeita carta duplicada', () => {
    let s = createShowcase('p1');
    const r1 = addToShowcase(s, { cardId: 'card-1', userCardId: 'uc-1' });
    if (r1.ok) s = r1.value;
    const r2 = addToShowcase(s, { cardId: 'card-1', userCardId: 'uc-1b' });
    expect(r2.ok).toBe(false);
    if (!r2.ok) expect(r2.error.kind).toBe('DuplicateCard');
  });

  it('posições são incrementadas em ordem (0, 1, 2)', () => {
    let s = createShowcase('p1');
    for (let i = 0; i < 3; i++) {
      const r = addToShowcase(s, { cardId: `card-${i}`, userCardId: `uc-${i}` });
      if (r.ok) s = r.value;
    }
    expect(s.slots.map((sl) => sl.position)).toEqual([0, 1, 2]);
  });

  it('não muta a vitrine original', () => {
    const s = createShowcase('p1');
    addToShowcase(s, { cardId: 'card-1', userCardId: 'uc-1' });
    expect(s.slots.length).toBe(0);
  });

  it('resultado é imutável', () => {
    const s = createShowcase('p1');
    const r = addToShowcase(s, { cardId: 'c1', userCardId: 'uc1' });
    if (r.ok) {
      expect(Object.isFrozen(r.value)).toBe(true);
      expect(Object.isFrozen(r.value.slots)).toBe(true);
    }
  });
});

describe('removeFromShowcase', () => {
  it('remove carta e reordena posições', () => {
    let s = createShowcase('p1');
    for (let i = 0; i < 3; i++) {
      const r = addToShowcase(s, { cardId: `card-${i}`, userCardId: `uc-${i}` });
      if (r.ok) s = r.value;
    }
    // Remover card-1 (posição 1)
    const updated = removeFromShowcase(s, 'card-1');
    expect(updated.slots.length).toBe(2);
    expect(updated.slots.map((sl) => sl.position)).toEqual([0, 1]); // reordenado
    expect(updated.slots.map((sl) => sl.cardId)).toEqual(['card-0', 'card-2']);
  });

  it('remover carta inexistente não altera a vitrine', () => {
    let s = createShowcase('p1');
    const r = addToShowcase(s, { cardId: 'card-0', userCardId: 'uc-0' });
    if (r.ok) s = r.value;
    const updated = removeFromShowcase(s, 'card-inexistente');
    expect(updated.slots.length).toBe(1);
  });

  it('após remover, é possível adicionar até 5 novamente', () => {
    let s = createShowcase('p1');
    for (let i = 0; i < 5; i++) {
      const r = addToShowcase(s, { cardId: `card-${i}`, userCardId: `uc-${i}` });
      if (r.ok) s = r.value;
    }
    s = removeFromShowcase(s, 'card-0');
    const r6 = addToShowcase(s, { cardId: 'card-new', userCardId: 'uc-new' });
    expect(r6.ok).toBe(true);
  });
});

describe('reorderShowcase', () => {
  it('reordena as cartas pela nova sequência', () => {
    let s = createShowcase('p1');
    for (const id of ['card-A', 'card-B', 'card-C']) {
      const r = addToShowcase(s, { cardId: id, userCardId: `uc-${id}` });
      if (r.ok) s = r.value;
    }
    const r = reorderShowcase(s, ['card-C', 'card-A', 'card-B']);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.slots[0]?.cardId).toBe('card-C');
      expect(r.value.slots[1]?.cardId).toBe('card-A');
      expect(r.value.slots[2]?.cardId).toBe('card-B');
      expect(r.value.slots.map((sl) => sl.position)).toEqual([0, 1, 2]);
    }
  });

  it('rejeita se número de IDs não corresponde ao número de slots', () => {
    let s = createShowcase('p1');
    const r1 = addToShowcase(s, { cardId: 'c1', userCardId: 'uc1' });
    if (r1.ok) s = r1.value;
    const r = reorderShowcase(s, ['c1', 'c2']); // 2 IDs, 1 slot
    expect(r.ok).toBe(false);
  });

  it('rejeita cardId não presente na vitrine', () => {
    let s = createShowcase('p1');
    for (const id of ['c1', 'c2']) {
      const r = addToShowcase(s, { cardId: id, userCardId: `uc-${id}` });
      if (r.ok) s = r.value;
    }
    const r = reorderShowcase(s, ['c1', 'c-inexistente']);
    expect(r.ok).toBe(false);
  });
});
