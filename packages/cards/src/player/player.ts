/**
 * `createPlayer` — fábrica que valida todos os invariantes de `Player`
 * (doc 17 §3) antes de produzir o agregado congelado.
 *
 * Invariantes verificados:
 * 1. era_start ≤ era_end
 * 2. primaryPosition ∈ enum Position válido
 * 3. Sem sobreposição entre posição primária e secundárias
 * 4. Todos os 19 atributos-base em [1, 99]
 * 5. knownAs não vazio (campo de exibição obrigatório)
 * 6. birthYear sensato (> 1850, < ano_corrente)
 */
import { Err, Ok, type Result, type ValidationError, validationError } from '@world-legends/shared';
import { ALL_POSITIONS } from '@world-legends/types';
import type { NationalityCode, Position, PreferredFoot } from '@world-legends/types';
import {
  type BaseAttributeSet,
  type EraRange,
  type Player,
  type PlayerId,
  type PositionSet,
  playerId,
} from './types';

const ATTRIBUTE_KEYS: readonly (keyof BaseAttributeSet)[] = [
  'pace',
  'stamina',
  'physical',
  'heading',
  'finishing',
  'shot_power',
  'passing',
  'vision',
  'dribbling',
  'penalty_kicks',
  'defending',
  'composure',
  'aggression',
  'leadership',
  'gk_reflexes',
  'gk_positioning',
  'gk_handling',
  'gk_kicking',
  'gk_penalty_save',
];

function validateAttributes(attrs: BaseAttributeSet): ValidationError | null {
  for (const key of ATTRIBUTE_KEYS) {
    const value = attrs[key];
    if (!Number.isInteger(value) || value < 1 || value > 99) {
      return validationError(
        `Atributo "${key}" deve ser inteiro em [1, 99], recebido: ${value}`,
        `baseAttributes.${key}`,
      );
    }
  }
  return null;
}

export type CreatePlayerInput = {
  readonly id: string;
  readonly fullName: string;
  readonly knownAs: string;
  readonly birthYear: number;
  readonly nationality: NationalityCode;
  readonly primaryPosition: Position;
  readonly secondaryPositions?: readonly Position[];
  readonly preferredFoot: PreferredFoot;
  readonly heightCm: number;
  readonly eraStart: number;
  readonly eraEnd: number;
  readonly baseAttributes: BaseAttributeSet;
  readonly bioShort: string;
  readonly sourceNotes: string;
};

export function createPlayer(input: CreatePlayerInput): Result<Player, ValidationError> {
  if (input.knownAs.trim().length === 0) {
    return Err(validationError('knownAs não pode ser vazio', 'knownAs'));
  }
  if (input.fullName.trim().length === 0) {
    return Err(validationError('fullName não pode ser vazio', 'fullName'));
  }
  if (input.birthYear < 1850 || input.birthYear > new Date().getFullYear()) {
    return Err(validationError(`birthYear inválido: ${input.birthYear}`, 'birthYear'));
  }
  if (input.eraStart > input.eraEnd) {
    return Err(
      validationError(`era_start (${input.eraStart}) deve ser ≤ era_end (${input.eraEnd})`, 'era'),
    );
  }
  if (!ALL_POSITIONS.includes(input.primaryPosition)) {
    return Err(
      validationError(`Posição primária inválida: "${input.primaryPosition}"`, 'primaryPosition'),
    );
  }
  const secondary = input.secondaryPositions ?? [];
  if (secondary.includes(input.primaryPosition)) {
    return Err(
      validationError(
        `Posição primária "${input.primaryPosition}" não pode aparecer também nas secundárias`,
        'secondaryPositions',
      ),
    );
  }
  for (const pos of secondary) {
    if (!ALL_POSITIONS.includes(pos)) {
      return Err(validationError(`Posição secundária inválida: "${pos}"`, 'secondaryPositions'));
    }
  }
  if (input.heightCm < 140 || input.heightCm > 220) {
    return Err(validationError(`heightCm fora de range: ${input.heightCm}`, 'heightCm'));
  }
  const attrError = validateAttributes(input.baseAttributes);
  if (attrError !== null) return Err(attrError);

  const era: EraRange = Object.freeze({ start: input.eraStart, end: input.eraEnd });
  const positions: PositionSet = Object.freeze({
    primary: input.primaryPosition,
    secondary: Object.freeze([...secondary]),
  });

  const player: Player = Object.freeze({
    id: playerId(input.id),
    fullName: input.fullName.trim(),
    knownAs: input.knownAs.trim(),
    birthYear: input.birthYear,
    nationality: input.nationality,
    positions,
    preferredFoot: input.preferredFoot,
    heightCm: input.heightCm,
    era,
    baseAttributes: Object.freeze({ ...input.baseAttributes }),
    bioShort: input.bioShort,
    sourceNotes: input.sourceNotes,
    isActive: true,
  });

  return Ok(player);
}

/** Retorna um novo Player com isActive = false (doc 17 §3: nunca deletado). */
export function deactivatePlayer(player: Player): Player {
  return Object.freeze({ ...player, isActive: false });
}

export type { BaseAttributeSet, EraRange, Player, PlayerId, PositionSet };
