import type { MatchPlayer, StartingSlot, TeamSnapshot } from '../../src/match/types';
import type { AttributeSet } from '../../src/overall/types';
import type { Position } from '../../src/position';
import type { TraitMagnitude } from '../../src/traits/types';

let idCounter = 0;
function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

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

export function makePlayer(input: {
  primaryPosition: Position;
  attributes?: Partial<AttributeSet>;
  traits?: readonly TraitMagnitude[];
  userCardId?: string;
}): MatchPlayer {
  return {
    userCardId: input.userCardId ?? nextId('card'),
    attributes: makeAttributes(input.attributes),
    primaryPosition: input.primaryPosition,
    traits: input.traits ?? [],
  };
}

const DEFAULT_FORMATION: readonly Position[] = [
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

/** Time completo de 11 titulares + 5 reservas, em todas as posições, atributos médios uniformes (ajustáveis via `attributeOverrides`). */
export function buildTeamSnapshot(input: {
  isHomeTeam: boolean;
  attributeOverrides?: Partial<AttributeSet>;
  traitsByPosition?: Partial<Record<Position, readonly TraitMagnitude[]>>;
  tacticalIntensity?: TeamSnapshot['tacticalIntensity'];
}): TeamSnapshot {
  const starters: StartingSlot[] = DEFAULT_FORMATION.map((position, index) => {
    const traitsForPosition = input.traitsByPosition?.[position];
    return {
      slotId: `slot-${index}`,
      formationPosition: position,
      player: makePlayer({
        primaryPosition: position,
        ...(input.attributeOverrides !== undefined ? { attributes: input.attributeOverrides } : {}),
        ...(traitsForPosition !== undefined ? { traits: traitsForPosition } : {}),
      }),
    };
  });

  const bench: MatchPlayer[] = (['GK', 'CB', 'LB', 'CM', 'RW', 'ST'] as const).map((position) =>
    makePlayer({
      primaryPosition: position,
      ...(input.attributeOverrides !== undefined ? { attributes: input.attributeOverrides } : {}),
    }),
  );

  return {
    starters,
    bench,
    adjacentPairs: [],
    tacticalIntensity: input.tacticalIntensity ?? 'equilibrado',
    isHomeTeam: input.isHomeTeam,
  };
}
