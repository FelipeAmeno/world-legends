import type { CardId } from '@world-legends/cards';
import { describe, expect, it } from 'vitest';
import {
  addYellowCard,
  applyFormDelta,
  applyInjury,
  createUserCard,
  isEligibleAsStarter,
  recoverFromInjury,
  serveSuspension,
} from '../../src/user-card/user-card';

const cardId = (s: string) => s as CardId;

// biome-ignore lint/suspicious/noExplicitAny: test helper needs to accept invalid values
function makeUserCard(overrides: { rarityCode?: any; editionCode?: any; source?: any } = {}) {
  return createUserCard({
    id: 'uc-001',
    profileId: 'profile-001',
    cardId: cardId('card-pele-legendary'),
    source: overrides.source ?? 'pack',
    rarityCode: overrides.rarityCode ?? 'legendary',
    editionCode: overrides.editionCode ?? 'base',
  });
}

describe('createUserCard — invariantes (doc 17 §6)', () => {
  it('cria UserCard válido com source=pack', () => {
    const result = makeUserCard();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.form).toBe(0);
      expect(result.value.injury.isInjured).toBe(false);
      expect(result.value.suspension.suspendedMatches).toBe(0);
    }
  });

  it('World Cup Hero só pode ser adquirido via achievement (doc 17 §6)', () => {
    const packResult = createUserCard({
      id: 'uc-wch',
      profileId: 'p1',
      cardId: cardId('card-pele-wch'),
      source: 'pack',
      rarityCode: 'world_cup_hero',
      editionCode: 'base',
    });
    expect(packResult.ok).toBe(false);
    if (!packResult.ok) {
      expect(packResult.error.field).toBe('source');
    }
  });

  it('World Cup Hero via achievement é aceito', () => {
    const result = createUserCard({
      id: 'uc-wch-ok',
      profileId: 'p1',
      cardId: cardId('card-pele-wch'),
      source: 'achievement',
      rarityCode: 'world_cup_hero',
      editionCode: 'base',
    });
    expect(result.ok).toBe(true);
  });

  it('Edição GOAT só pode ser adquirida via achievement (doc 10 §11)', () => {
    const result = createUserCard({
      id: 'uc-goat-pack',
      profileId: 'p1',
      cardId: cardId('card-pele-goat'),
      source: 'pack',
      rarityCode: 'ultra',
      editionCode: 'goat',
    });
    expect(result.ok).toBe(false);
  });

  it('UserCard é imutável', () => {
    const result = makeUserCard();
    if (!result.ok) throw new Error('fixture inválida');
    expect(Object.isFrozen(result.value)).toBe(true);
    expect(Object.isFrozen(result.value.injury)).toBe(true);
    expect(Object.isFrozen(result.value.suspension)).toBe(true);
  });
});

describe('applyFormDelta — Form em [-2, +2] (doc 17 §6)', () => {
  it('aplica delta positivo corretamente', () => {
    const base = makeUserCard();
    if (!base.ok) throw new Error();
    const updated = applyFormDelta(base.value, 2);
    expect(updated.form).toBe(2);
  });

  it('clampeia para +2 no máximo', () => {
    const base = makeUserCard();
    if (!base.ok) throw new Error();
    const updated = applyFormDelta(base.value, 10);
    expect(updated.form).toBe(2);
  });

  it('clampeia para -2 no mínimo', () => {
    const base = makeUserCard();
    if (!base.ok) throw new Error();
    const updated = applyFormDelta(base.value, -10);
    expect(updated.form).toBe(-2);
  });

  it('não muta o UserCard original', () => {
    const base = makeUserCard();
    if (!base.ok) throw new Error();
    applyFormDelta(base.value, 2);
    expect(base.value.form).toBe(0);
  });
});

describe('Lesão e suspensão (doc 17 §6, doc 02 DDL)', () => {
  it('applyInjury marca como lesionado e define rodada de retorno', () => {
    const base = makeUserCard();
    if (!base.ok) throw new Error();
    const injured = applyInjury(base.value, 15);
    expect(injured.injury.isInjured).toBe(true);
    expect(injured.injury.returnsAtRound).toBe(15);
    expect(isEligibleAsStarter(injured)).toBe(false);
  });

  it('recoverFromInjury remove a lesão', () => {
    const base = makeUserCard();
    if (!base.ok) throw new Error();
    const injured = applyInjury(base.value, 15);
    const recovered = recoverFromInjury(injured);
    expect(recovered.injury.isInjured).toBe(false);
    expect(recovered.injury.returnsAtRound).toBeNull();
    expect(isEligibleAsStarter(recovered)).toBe(true);
  });

  it('3 cartões amarelos geram 1 partida de suspensão automática', () => {
    const base = makeUserCard();
    if (!base.ok) throw new Error();
    let uc = base.value;
    uc = addYellowCard(uc); // 1
    uc = addYellowCard(uc); // 2
    expect(uc.suspension.suspendedMatches).toBe(0);
    uc = addYellowCard(uc); // 3 → suspensão
    expect(uc.suspension.suspendedMatches).toBe(1);
    expect(isEligibleAsStarter(uc)).toBe(false);
  });

  it('serveSuspension desconta 1 partida de suspensão', () => {
    const base = makeUserCard();
    if (!base.ok) throw new Error();
    let uc = addYellowCard(addYellowCard(addYellowCard(base.value)));
    expect(uc.suspension.suspendedMatches).toBe(1);
    uc = serveSuspension(uc);
    expect(uc.suspension.suspendedMatches).toBe(0);
    expect(isEligibleAsStarter(uc)).toBe(true);
  });

  it('serveSuspension sem suspensão é no-op', () => {
    const base = makeUserCard();
    if (!base.ok) throw new Error();
    const same = serveSuspension(base.value);
    expect(same.suspension.suspendedMatches).toBe(0);
  });
});
