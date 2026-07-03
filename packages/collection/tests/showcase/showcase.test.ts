import type { CardId } from '@world-legends/cards';
import { describe, expect, it } from 'vitest';
import {
  MAX_SHOWCASE_SLOTS,
  addToShowcase,
  createShowcase,
  removeFromShowcase,
  reorderShowcase,
} from '../../src/showcase/showcase';
import type { ProfileId, UserCardId } from '../../src/user-card/user-card';

const pid = 'profile-001' as ProfileId;
const cid = (s: string) => s as CardId;
const uid = (s: string) => s as UserCardId;

function ownedSet(...ids: string[]): ReadonlySet<CardId> {
  return new Set(ids.map((id) => cid(id)));
}

describe('Showcase — invariantes', () => {
  it('começa vazio', () => {
    const s = createShowcase(pid);
    expect(s.slots.length).toBe(0);
  });

  it('adiciona até MAX_SHOWCASE_SLOTS cartas', () => {
    let s = createShowcase(pid);
    for (let i = 0; i < MAX_SHOWCASE_SLOTS; i++) {
      const cardIdStr = `card-${i}`;
      const result = addToShowcase(
        s,
        { userCardId: uid(`uc-${i}`), cardId: cid(cardIdStr) },
        ownedSet(cardIdStr),
      );
      expect(result.ok).toBe(true);
      if (result.ok) s = result.value;
    }
    expect(s.slots.length).toBe(MAX_SHOWCASE_SLOTS);
  });

  it('rejeita a (MAX_SHOWCASE_SLOTS + 1)ª carta com SlotLimitExceeded', () => {
    let s = createShowcase(pid);
    for (let i = 0; i < MAX_SHOWCASE_SLOTS; i++) {
      const r = addToShowcase(
        s,
        { userCardId: uid(`uc-${i}`), cardId: cid(`card-${i}`) },
        ownedSet(`card-${i}`),
      );
      if (r.ok) s = r.value;
    }
    const extra = addToShowcase(
      s,
      { userCardId: uid('uc-extra'), cardId: cid('card-extra') },
      ownedSet('card-extra'),
    );
    expect(extra.ok).toBe(false);
    if (!extra.ok) expect(extra.error.kind).toBe('SlotLimitExceeded');
  });

  it('rejeita carta que o usuário não possui (CardNotOwned)', () => {
    const s = createShowcase(pid);
    const result = addToShowcase(
      s,
      { userCardId: uid('uc-1'), cardId: cid('card-pele') },
      ownedSet('card-maradona'), // não possui pele
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('CardNotOwned');
  });

  it('rejeita carta já no showcase (DuplicateCard)', () => {
    let s = createShowcase(pid);
    const r = addToShowcase(
      s,
      { userCardId: uid('uc-1'), cardId: cid('card-pele') },
      ownedSet('card-pele'),
    );
    if (r.ok) s = r.value;
    const dup = addToShowcase(
      s,
      { userCardId: uid('uc-2'), cardId: cid('card-pele') },
      ownedSet('card-pele'),
    );
    expect(dup.ok).toBe(false);
    if (!dup.ok) expect(dup.error.kind).toBe('DuplicateCard');
  });

  it('removeFromShowcase remove a carta e reordena posições', () => {
    let s = createShowcase(pid);
    const cards = ['card-a', 'card-b', 'card-c'];
    for (const c of cards) {
      const r = addToShowcase(s, { userCardId: uid(`uc-${c}`), cardId: cid(c) }, ownedSet(c));
      if (r.ok) s = r.value;
    }
    s = removeFromShowcase(s, cid('card-b'));
    expect(s.slots.length).toBe(2);
    expect(s.slots[0]?.cardId).toBe(cid('card-a'));
    expect(s.slots[0]?.position).toBe(0);
    expect(s.slots[1]?.cardId).toBe(cid('card-c'));
    expect(s.slots[1]?.position).toBe(1);
  });

  it('reorderShowcase reordena as posições', () => {
    let s = createShowcase(pid);
    for (const c of ['card-a', 'card-b', 'card-c']) {
      const r = addToShowcase(s, { userCardId: uid(`uc-${c}`), cardId: cid(c) }, ownedSet(c));
      if (r.ok) s = r.value;
    }
    const reordered = reorderShowcase(s, [cid('card-c'), cid('card-a'), cid('card-b')]);
    expect(reordered.ok).toBe(true);
    if (reordered.ok) {
      expect(reordered.value.slots[0]?.cardId).toBe(cid('card-c'));
      expect(reordered.value.slots[1]?.cardId).toBe(cid('card-a'));
      expect(reordered.value.slots[2]?.cardId).toBe(cid('card-b'));
    }
  });

  it('reorderShowcase rejeita array com tamanho diferente', () => {
    let s = createShowcase(pid);
    const r = addToShowcase(
      s,
      { userCardId: uid('uc-a'), cardId: cid('card-a') },
      ownedSet('card-a'),
    );
    if (r.ok) s = r.value;
    const result = reorderShowcase(s, [cid('card-a'), cid('card-b')]);
    expect(result.ok).toBe(false);
  });

  it('Showcase é imutável — addToShowcase não muta o original', () => {
    const s = createShowcase(pid);
    addToShowcase(s, { userCardId: uid('uc-a'), cardId: cid('card-a') }, ownedSet('card-a'));
    expect(s.slots.length).toBe(0); // original não foi alterado
  });
});
