import { describe, expect, it } from 'vitest';
import {
  MARADONA,
  MARADONA_WORLD_CUP_HERO,
  PELE,
  PELE_LEGENDARY,
  PELE_PRIME,
  PELE_ULTRA,
  PELE_WORLD_CUP_HERO,
  RONALDO,
  RONALDO_ELITE,
  RONALDO_EVENT_2002,
  ZIDANE,
  ZIDANE_WORLD_CUP_HERO,
} from '../../fixtures/historical-cards';
import { WC_1970_CONTEXT } from '../../fixtures/historical-players';
import { createCard } from '../../src/card/card';
import { calculateOverall } from '../../src/card/formula';

describe('createCard — invariantes (doc 17 §5)', () => {
  it('World Cup Hero sem TournamentContext é rejeitado', () => {
    const result = createCard({
      id: 'test-wch-no-ctx',
      playerId: PELE.id,
      playerPosition: 'ST',
      rarityCode: 'world_cup_hero',
      editionCode: 'base',
      editionMetadata: { kind: 'base' },
      baseAttributes: PELE.baseAttributes,
      traits: [{ trait: 'Matador', tier: 1 }],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.field).toBe('tournamentContext');
  });

  it('World Cup Hero COM TournamentContext é aceito', () => {
    expect(PELE_WORLD_CUP_HERO.rarityCode).toBe('world_cup_hero');
    expect(PELE_WORLD_CUP_HERO.tournamentContext).not.toBeNull();
    if (PELE_WORLD_CUP_HERO.tournamentContext !== null) {
      expect(PELE_WORLD_CUP_HERO.tournamentContext.year).toBe(1970);
    }
  });

  it('edição prime em world_cup_hero é rejeitada (doc 10 §3)', () => {
    const result = createCard({
      id: 'test-wch-prime',
      playerId: PELE.id,
      playerPosition: 'ST',
      rarityCode: 'world_cup_hero',
      editionCode: 'prime',
      editionMetadata: { kind: 'prime', attributeBonus: 3, primePeriod: '1970' },
      tournamentContext: WC_1970_CONTEXT,
      baseAttributes: PELE.baseAttributes,
      traits: [{ trait: 'Matador', tier: 1 }],
    });
    expect(result.ok).toBe(false);
  });

  it('edição prime em common é rejeitada — só Rare/Elite/Legendary (doc 10 §9)', () => {
    const result = createCard({
      id: 'test-common-prime',
      playerId: PELE.id,
      playerPosition: 'ST',
      rarityCode: 'common',
      editionCode: 'prime',
      editionMetadata: { kind: 'prime', attributeBonus: 2, primePeriod: '1960' },
      baseAttributes: PELE.baseAttributes,
      traits: [{ trait: 'Matador', tier: 1 }],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.field).toBe('edition');
  });

  it('edição goat em non-ultra é rejeitada (doc 10 §11)', () => {
    const result = createCard({
      id: 'test-goat-legendary',
      playerId: PELE.id,
      playerPosition: 'ST',
      rarityCode: 'legendary',
      editionCode: 'goat',
      editionMetadata: { kind: 'goat' },
      baseAttributes: PELE.baseAttributes,
      traits: [{ trait: 'Matador', tier: 1 }],
    });
    expect(result.ok).toBe(false);
  });

  it('attributeBonus Prime fora de [2,4] é rejeitado (doc 10 §9)', () => {
    const result = createCard({
      id: 'test-prime-bonus',
      playerId: PELE.id,
      playerPosition: 'ST',
      rarityCode: 'rare',
      editionCode: 'prime',
      editionMetadata: { kind: 'prime', attributeBonus: 5, primePeriod: '1970' },
      baseAttributes: PELE.baseAttributes,
      traits: [{ trait: 'Matador', tier: 1 }],
    });
    expect(result.ok).toBe(false);
  });

  it('Overall calculado está dentro da faixa da raridade (invariante central)', () => {
    expect(PELE_LEGENDARY.overall).toBeGreaterThanOrEqual(88);
    expect(PELE_LEGENDARY.overall).toBeLessThanOrEqual(92);
    expect(PELE_WORLD_CUP_HERO.overall).toBeGreaterThanOrEqual(95);
    expect(PELE_WORLD_CUP_HERO.overall).toBeLessThanOrEqual(99);
  });

  it('Overall cresce com a raridade (para o mesmo jogador)', () => {
    expect(PELE_ULTRA.overall).toBeGreaterThan(PELE_LEGENDARY.overall);
    expect(PELE_WORLD_CUP_HERO.overall).toBeGreaterThanOrEqual(PELE_ULTRA.overall);
  });

  it('PrimeEdition tem Overall maior ou igual à versão base da mesma raridade', () => {
    // PELE_PRIME é legendary com prime (+3 bônus); PELE_LEGENDARY é legendary base
    expect(PELE_PRIME.overall).toBeGreaterThanOrEqual(PELE_LEGENDARY.overall);
  });

  it('EventEdition tem EditionMetadata corretos (sem tournamentContext — é temática, não recorte)', () => {
    expect(RONALDO_EVENT_2002.editionCode).toBe('event');
    expect(RONALDO_EVENT_2002.editionMetadata.kind).toBe('event');
    // Carta Event temática não usa fórmula de Momento — tournamentContext é null
    expect(RONALDO_EVENT_2002.tournamentContext).toBeNull();
    if (RONALDO_EVENT_2002.editionMetadata.kind === 'event') {
      expect(RONALDO_EVENT_2002.editionMetadata.eventName).toBe('Aniversário Copa 2002');
      expect(RONALDO_EVENT_2002.editionMetadata.mayReturn).toBe(true);
    }
  });

  it('WorldCupHero de Maradona tem performanceIndicator=99 (Copa 1986)', () => {
    const ctx = MARADONA_WORLD_CUP_HERO.tournamentContext;
    expect(ctx).not.toBeNull();
    if (ctx !== null) {
      expect(ctx.performanceIndicator).toBe(99);
      expect(ctx.year).toBe(1986);
    }
  });

  it('fórmula de Momento (doc 10 §6): 70% do performanceIndicator + 30% do base', () => {
    // Zidane WCH (1998): ctx.performanceIndicator=98, base.passing=79
    // AttrMomento = 98*0.7 + 79*0.3 = 68.6 + 23.7 = 92.3 → round=92
    // AttrFinal = round(92 * 1.30) = round(119.6) = 120 → clamped a 99
    expect(ZIDANE_WORLD_CUP_HERO.finalAttributes.passing).toBe(99);
  });

  it('Card é imutável (Object.freeze)', () => {
    expect(Object.isFrozen(PELE_LEGENDARY)).toBe(true);
    expect(Object.isFrozen(PELE_LEGENDARY.finalAttributes)).toBe(true);
    expect(Object.isFrozen(PELE_LEGENDARY.traits)).toBe(true);
  });

  it('traits: rejeita carta sem nenhum trait', () => {
    const result = createCard({
      id: 'test-no-traits',
      playerId: PELE.id,
      playerPosition: 'ST',
      rarityCode: 'legendary',
      editionCode: 'base',
      editionMetadata: { kind: 'base' },
      baseAttributes: PELE.baseAttributes,
      traits: [],
    });
    expect(result.ok).toBe(false);
  });

  it('traits: rejeita carta com mais de 3 traits', () => {
    const result = createCard({
      id: 'test-too-many-traits',
      playerId: PELE.id,
      playerPosition: 'ST',
      rarityCode: 'legendary',
      editionCode: 'base',
      editionMetadata: { kind: 'base' },
      baseAttributes: PELE.baseAttributes,
      traits: [
        { trait: 'Matador', tier: 1 },
        { trait: 'Maestro', tier: 1 },
        { trait: 'Capitão', tier: 1 },
        { trait: 'Iron Man', tier: 1 },
      ],
    });
    expect(result.ok).toBe(false);
  });

  it('traits: rejeita trait duplicado na mesma carta', () => {
    const result = createCard({
      id: 'test-dup-trait',
      playerId: PELE.id,
      playerPosition: 'ST',
      rarityCode: 'legendary',
      editionCode: 'base',
      editionMetadata: { kind: 'base' },
      baseAttributes: PELE.baseAttributes,
      traits: [
        { trait: 'Matador', tier: 1 },
        { trait: 'Matador', tier: 2 },
      ],
    });
    expect(result.ok).toBe(false);
  });

  it('Ronaldo Elite tem overall na faixa correta [82,87]', () => {
    expect(RONALDO_ELITE.overall).toBeGreaterThanOrEqual(82);
    expect(RONALDO_ELITE.overall).toBeLessThanOrEqual(87);
  });
});

describe('calculateOverall — fórmula de média ponderada por posição (doc 09 §2)', () => {
  it('GK pesado em atributos de goleiro', () => {
    const attrs = {
      pace: 50,
      stamina: 70,
      physical: 70,
      heading: 60,
      finishing: 20,
      shot_power: 30,
      passing: 50,
      vision: 60,
      dribbling: 30,
      penalty_kicks: 30,
      defending: 60,
      composure: 75,
      aggression: 45,
      leadership: 55,
      gk_reflexes: 90,
      gk_positioning: 88,
      gk_handling: 85,
      gk_kicking: 70,
      gk_penalty_save: 82,
    };
    const overall = calculateOverall(attrs, 'GK');
    expect(overall).toBeGreaterThanOrEqual(75);
  });

  it('Overall sempre está em [40, 99]', () => {
    const min_attrs = {
      pace: 1,
      stamina: 1,
      physical: 1,
      heading: 1,
      finishing: 1,
      shot_power: 1,
      passing: 1,
      vision: 1,
      dribbling: 1,
      penalty_kicks: 1,
      defending: 1,
      composure: 1,
      aggression: 1,
      leadership: 1,
      gk_reflexes: 1,
      gk_positioning: 1,
      gk_handling: 1,
      gk_kicking: 1,
      gk_penalty_save: 1,
    };
    const low = calculateOverall(min_attrs, 'ST');
    expect(low).toBeGreaterThanOrEqual(40);

    const max_attrs = { ...min_attrs };
    Object.keys(max_attrs).forEach((k) => {
      (max_attrs as Record<string, number>)[k] = 99;
    });
    const high = calculateOverall(max_attrs, 'ST');
    expect(high).toBeLessThanOrEqual(99);
  });
});
