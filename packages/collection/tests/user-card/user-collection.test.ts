import type { CardId } from '@world-legends/cards';
import { describe, expect, it } from 'vitest';
import { applyInjury } from '../../src/user-card/user-card';
import type { ProfileId } from '../../src/user-card/user-card';
import { createUserCollection } from '../../src/user-card/user-collection';

const pid = 'profile-001' as ProfileId;
const cid = (s: string) => s as CardId;

describe('UserCollection — unicidade (profileId, cardId) (doc 17 §6)', () => {
  it('adiciona primeira cópia como UserCard', () => {
    const col = createUserCollection(pid);
    const result = col.addCard({
      id: 'uc-1',
      cardId: cid('card-pele-legendary'),
      rarityCode: 'legendary',
      editionCode: 'base',
      source: 'pack',
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.outcome).toBe('added');
    expect(col.size()).toBe(1);
  });

  it('segunda cópia da mesma carta → fragmentos, não novo UserCard (doc 10 §16)', () => {
    const col = createUserCollection(pid);
    col.addCard({
      id: 'uc-1',
      cardId: cid('card-pele-legendary'),
      rarityCode: 'legendary',
      editionCode: 'base',
      source: 'pack',
    });
    const dup = col.addCard({
      id: 'uc-2',
      cardId: cid('card-pele-legendary'),
      rarityCode: 'legendary',
      editionCode: 'base',
      source: 'pack',
    });
    expect(dup.ok).toBe(true);
    if (dup.ok) {
      expect(dup.value.outcome).toBe('duplicate_converted');
      if (dup.value.outcome === 'duplicate_converted') {
        expect(dup.value.fragmentsAwarded).toBe(150); // legendary = 150
      }
    }
    // Collection não cresceu
    expect(col.size()).toBe(1);
    // Saldo de fragmentos atualizado
    expect(col.fragmentBalance()).toBe(150);
  });

  it('fragmentsAwarded escala com a raridade da carta duplicada', () => {
    const col = createUserCollection(pid);
    // Adicionar e duplicar um common
    col.addCard({
      id: 'uc-c1',
      cardId: cid('card-common'),
      rarityCode: 'common',
      editionCode: 'base',
      source: 'pack',
    });
    const dup = col.addCard({
      id: 'uc-c2',
      cardId: cid('card-common'),
      rarityCode: 'common',
      editionCode: 'base',
      source: 'pack',
    });
    if (dup.ok && dup.value.outcome === 'duplicate_converted') {
      expect(dup.value.fragmentsAwarded).toBe(10); // common = 10
    }
    // Ultra duplicata
    const col2 = createUserCollection(pid);
    col2.addCard({
      id: 'uc-u1',
      cardId: cid('card-ultra'),
      rarityCode: 'ultra',
      editionCode: 'base',
      source: 'pack',
    });
    const dup2 = col2.addCard({
      id: 'uc-u2',
      cardId: cid('card-ultra'),
      rarityCode: 'ultra',
      editionCode: 'base',
      source: 'pack',
    });
    if (dup2.ok && dup2.value.outcome === 'duplicate_converted') {
      expect(dup2.value.fragmentsAwarded).toBe(400); // ultra = 400
    }
  });

  it('findByCardId retorna o UserCard correto', () => {
    const col = createUserCollection(pid);
    const id = cid('card-pele-legendary');
    col.addCard({
      id: 'uc-1',
      cardId: id,
      rarityCode: 'legendary',
      editionCode: 'base',
      source: 'pack',
    });
    const found = col.findByCardId(id);
    expect(found).not.toBeNull();
    if (found !== null) expect(found.cardId).toBe(id);
  });

  it('listEligibleStarters exclui lesionados e suspensos', () => {
    const col = createUserCollection(pid);
    col.addCard({
      id: 'uc-a',
      cardId: cid('card-a'),
      rarityCode: 'legendary',
      editionCode: 'base',
      source: 'pack',
    });
    col.addCard({
      id: 'uc-b',
      cardId: cid('card-b'),
      rarityCode: 'rare',
      editionCode: 'base',
      source: 'pack',
    });

    // Lesiona a carta-a
    const ucA = col.findByCardId(cid('card-a'));
    if (ucA) {
      const injured = applyInjury(ucA, 10);
      col.updateCard(injured);
    }

    const eligible = col.listEligibleStarters();
    expect(eligible.length).toBe(1);
    if (eligible[0]) expect(eligible[0].cardId).toBe(cid('card-b'));
  });
});

describe('UserCollection — removeCard', () => {
  it('remove uma carta existente com sucesso', () => {
    const col = createUserCollection(pid);
    col.addCard({
      id: 'uc-1',
      cardId: cid('card-a'),
      rarityCode: 'rare',
      editionCode: 'base',
      source: 'pack',
    });
    const uc = col.findByCardId(cid('card-a'));
    if (!uc) throw new Error('não encontrou');
    const result = col.removeCard(uc.id);
    expect(result.ok).toBe(true);
    expect(col.size()).toBe(0);
    // Após remoção, pode adicionar novamente (não é mais duplicata)
    const re = col.addCard({
      id: 'uc-2',
      cardId: cid('card-a'),
      rarityCode: 'rare',
      editionCode: 'base',
      source: 'pack',
    });
    if (re.ok) expect(re.value.outcome).toBe('added');
  });

  it('removeCard retorna erro para ID inexistente', () => {
    const col = createUserCollection(pid);
    // biome-ignore lint/suspicious/noExplicitAny: testing with invalid UserCardId
    const result = col.removeCard('inexistente' as any);
    expect(result.ok).toBe(false);
  });
});
