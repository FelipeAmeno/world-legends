import type { AttributeSet } from '@world-legends/engine';
import type { Position } from '@world-legends/types';
import type { CardAttributeResolver } from '../lineups/build-team-snapshot';
/**
 * Fixtures para os testes de packages/match.
 * Produzem lineups válidas com atributos reais (todos os 19 campos de AttributeSet).
 */
import type { LineupInput, LineupSlot } from '../lineups/validate-lineup';

export function makeAttributes(overrides: Partial<AttributeSet> = {}): AttributeSet {
  return {
    pace: 65,
    stamina: 65,
    physical: 65,
    heading: 60,
    finishing: 60,
    shot_power: 60,
    passing: 60,
    vision: 60,
    dribbling: 60,
    penalty_kicks: 60,
    defending: 60,
    composure: 60,
    aggression: 50,
    leadership: 50,
    gk_reflexes: 40,
    gk_positioning: 40,
    gk_handling: 40,
    gk_kicking: 40,
    gk_penalty_save: 40,
    ...overrides,
  };
}

export function makeGkAttributes(): AttributeSet {
  return makeAttributes({
    gk_reflexes: 80,
    gk_positioning: 78,
    gk_handling: 76,
    gk_kicking: 70,
    gk_penalty_save: 75,
  });
}

/** Cria uma lineup válida com 11 titulares (1 GK + 10 outfield) e 5 reservas. */
export function makeValidLineup(prefix: string): LineupInput {
  const positions: Position[] = [
    'GK',
    'CB',
    'CB',
    'LB',
    'RB',
    'CDM',
    'CM',
    'CAM',
    'LW',
    'RW',
    'ST',
  ];

  const starters: LineupSlot[] = positions.map((pos, i) => ({
    slotId: `${prefix}-s${i}`,
    userCardId: `${prefix}-card-${i}`,
    formationPosition: pos,
  }));

  const bench: LineupSlot[] = ['GK', 'CB', 'CM', 'LW', 'ST'].map((pos, i) => ({
    slotId: `${prefix}-b${i}`,
    userCardId: `${prefix}-bench-card-${i}`,
    formationPosition: pos as Position,
  }));

  return { starters, bench };
}

/**
 * CardAttributeResolver que retorna atributos fictícios para qualquer userCardId.
 * Útil para testes de integração que precisam chegar até o engine.
 */
export function makeSimpleResolver(prefixes: string[] = ['home', 'away']): CardAttributeResolver {
  return (userCardId: string) => {
    // Goleiro
    if (userCardId.includes('card-0') || userCardId.includes('bench-card-0')) {
      return { attributes: makeGkAttributes(), primaryPosition: 'GK' as Position, traits: [] };
    }
    return { attributes: makeAttributes(), primaryPosition: 'ST' as Position, traits: [] };
  };
}
