/**
 * Fábricas dos 7 eventos de partida — cada uma valida seus campos e
 * devolve um objeto `Object.freeze`d (imutabilidade estrutural, não
 * apenas por convenção de tipo `Readonly`). Nenhuma fábrica decide SE
 * ou QUANDO um evento deveria acontecer — isso é responsabilidade do
 * futuro módulo `match`; estas fábricas só garantem que, dado um evento
 * que JÁ deveria existir, a forma dele é válida e imutável.
 */
import { Err, Ok, type Result, type ValidationError, validationError } from '@world-legends/shared';
import type {
  AssistEvent,
  CardEvent,
  FullTimeEvent,
  GoalEvent,
  HalfTimeEvent,
  InjuryEvent,
  InjurySeverity,
  KickoffEvent,
  PenaltyContext,
  PenaltyEvent,
  PenaltyOutcome,
  RedCardReason,
  SubstitutionEvent,
  SubstitutionReason,
  TeamSide,
  WalkoverEvent,
} from './types';

function validateMinute(minute: number): ValidationError | null {
  if (!Number.isInteger(minute) || minute < 0) {
    return validationError(
      `minute deve ser um inteiro não-negativo; recebido ${minute}.`,
      'minute',
    );
  }
  return null;
}

function validateNonEmptyId(value: string, fieldName: string): ValidationError | null {
  if (value.trim().length === 0) {
    return validationError(`${fieldName} não pode ser vazio.`, fieldName);
  }
  return null;
}

export function createGoalEvent(input: {
  minute: number;
  teamSide: TeamSide;
  scorerUserCardId: string;
  assisterUserCardId?: string;
  isOwnGoal?: boolean;
  description: string;
}): Result<GoalEvent, ValidationError> {
  const error =
    validateMinute(input.minute) ?? validateNonEmptyId(input.scorerUserCardId, 'scorerUserCardId');
  if (error) return Err(error);
  return Ok(
    Object.freeze({
      type: 'goal' as const,
      minute: input.minute,
      teamSide: input.teamSide,
      scorerUserCardId: input.scorerUserCardId,
      isOwnGoal: input.isOwnGoal ?? false,
      description: input.description,
      ...(input.assisterUserCardId !== undefined
        ? { assisterUserCardId: input.assisterUserCardId }
        : {}),
    }),
  );
}

export function createAssistEvent(input: {
  minute: number;
  teamSide: TeamSide;
  assisterUserCardId: string;
  scorerUserCardId: string;
  description: string;
}): Result<AssistEvent, ValidationError> {
  const error =
    validateMinute(input.minute) ??
    validateNonEmptyId(input.assisterUserCardId, 'assisterUserCardId') ??
    validateNonEmptyId(input.scorerUserCardId, 'scorerUserCardId');
  if (error) return Err(error);
  return Ok(
    Object.freeze({
      type: 'assist' as const,
      minute: input.minute,
      teamSide: input.teamSide,
      assisterUserCardId: input.assisterUserCardId,
      scorerUserCardId: input.scorerUserCardId,
      description: input.description,
    }),
  );
}

export function createCardEvent(input: {
  minute: number;
  teamSide: TeamSide;
  playerUserCardId: string;
  cardType: 'yellow' | 'red';
  redCardReason?: RedCardReason;
  description: string;
}): Result<CardEvent, ValidationError> {
  const error =
    validateMinute(input.minute) ??
    validateNonEmptyId(input.playerUserCardId, 'playerUserCardId') ??
    (input.cardType === 'yellow' && input.redCardReason !== undefined
      ? validationError('redCardReason só é válido quando cardType é "red".', 'redCardReason')
      : null) ??
    (input.cardType === 'red' && input.redCardReason === undefined
      ? validationError('cardType "red" exige redCardReason (doc 09 §10).', 'redCardReason')
      : null);
  if (error) return Err(error);
  return Ok(
    Object.freeze({
      type: 'card' as const,
      minute: input.minute,
      teamSide: input.teamSide,
      playerUserCardId: input.playerUserCardId,
      cardType: input.cardType,
      description: input.description,
      ...(input.redCardReason !== undefined ? { redCardReason: input.redCardReason } : {}),
    }),
  );
}

const INJURY_SEVERITIES: readonly InjurySeverity[] = ['leve', 'moderada', 'grave'];

export function createInjuryEvent(input: {
  minute: number;
  teamSide: TeamSide;
  playerUserCardId: string;
  severity: InjurySeverity;
  recoveryDays: number;
  isRelapse?: boolean;
  description: string;
}): Result<InjuryEvent, ValidationError> {
  const error =
    validateMinute(input.minute) ??
    validateNonEmptyId(input.playerUserCardId, 'playerUserCardId') ??
    (!INJURY_SEVERITIES.includes(input.severity)
      ? validationError(
          `severity deve ser uma de ${INJURY_SEVERITIES.join('/')}; recebido ${input.severity}.`,
          'severity',
        )
      : null) ??
    (!Number.isFinite(input.recoveryDays) || input.recoveryDays < 0
      ? validationError(
          `recoveryDays não pode ser negativo; recebido ${input.recoveryDays}.`,
          'recoveryDays',
        )
      : null);
  if (error) return Err(error);
  return Ok(
    Object.freeze({
      type: 'injury' as const,
      minute: input.minute,
      teamSide: input.teamSide,
      playerUserCardId: input.playerUserCardId,
      severity: input.severity,
      recoveryDays: input.recoveryDays,
      isRelapse: input.isRelapse ?? false,
      description: input.description,
    }),
  );
}

export function createPenaltyEvent(input: {
  minute: number;
  teamSide: TeamSide;
  takerUserCardId: string;
  goalkeeperUserCardId: string;
  outcome: PenaltyOutcome;
  context: PenaltyContext;
  shootoutRound?: number;
  description: string;
}): Result<PenaltyEvent, ValidationError> {
  const error =
    validateMinute(input.minute) ??
    validateNonEmptyId(input.takerUserCardId, 'takerUserCardId') ??
    validateNonEmptyId(input.goalkeeperUserCardId, 'goalkeeperUserCardId') ??
    (input.context === 'in_game' && input.shootoutRound !== undefined
      ? validationError('shootoutRound só é válido quando context é "shootout".', 'shootoutRound')
      : null) ??
    (input.context === 'shootout' &&
    (input.shootoutRound === undefined ||
      !Number.isInteger(input.shootoutRound) ||
      input.shootoutRound < 1)
      ? validationError(
          'context "shootout" exige shootoutRound inteiro >= 1 (doc 09 §20).',
          'shootoutRound',
        )
      : null);
  if (error) return Err(error);
  return Ok(
    Object.freeze({
      type: 'penalty' as const,
      minute: input.minute,
      teamSide: input.teamSide,
      takerUserCardId: input.takerUserCardId,
      goalkeeperUserCardId: input.goalkeeperUserCardId,
      outcome: input.outcome,
      context: input.context,
      description: input.description,
      ...(input.shootoutRound !== undefined ? { shootoutRound: input.shootoutRound } : {}),
    }),
  );
}

export function createSubstitutionEvent(input: {
  minute: number;
  teamSide: TeamSide;
  playerOutUserCardId: string;
  playerInUserCardId: string;
  reason: SubstitutionReason;
  description: string;
}): Result<SubstitutionEvent, ValidationError> {
  const error =
    validateMinute(input.minute) ??
    validateNonEmptyId(input.playerOutUserCardId, 'playerOutUserCardId') ??
    validateNonEmptyId(input.playerInUserCardId, 'playerInUserCardId') ??
    (input.playerOutUserCardId === input.playerInUserCardId
      ? validationError(
          'playerOutUserCardId e playerInUserCardId não podem ser o mesmo jogador.',
          'playerInUserCardId',
        )
      : null);
  if (error) return Err(error);
  return Ok(
    Object.freeze({
      type: 'substitution' as const,
      minute: input.minute,
      teamSide: input.teamSide,
      playerOutUserCardId: input.playerOutUserCardId,
      playerInUserCardId: input.playerInUserCardId,
      reason: input.reason,
      description: input.description,
    }),
  );
}

/** doc 09 §12.1 (DD-01): o gatilho do W.O. é a contagem cair ABAIXO de 7 — por isso 0–6, nunca 7+. */
const WALKOVER_MAX_REMAINING_PLAYERS = 6;

export function createWalkoverEvent(input: {
  minute: number;
  affectedTeamSide: TeamSide;
  remainingPlayers: number;
  description: string;
}): Result<WalkoverEvent, ValidationError> {
  const error =
    validateMinute(input.minute) ??
    (!Number.isInteger(input.remainingPlayers) ||
    input.remainingPlayers < 0 ||
    input.remainingPlayers > WALKOVER_MAX_REMAINING_PLAYERS
      ? validationError(
          `remainingPlayers deve ser um inteiro entre 0 e ${WALKOVER_MAX_REMAINING_PLAYERS} (doc 09 §12.1); recebido ${input.remainingPlayers}.`,
          'remainingPlayers',
        )
      : null);
  if (error) return Err(error);
  return Ok(
    Object.freeze({
      type: 'walkover' as const,
      minute: input.minute,
      affectedTeamSide: input.affectedTeamSide,
      remainingPlayers: input.remainingPlayers,
      reason: 'insuficiência de elenco' as const,
      description: input.description,
    }),
  );
}

export function createKickoffEvent(description: string): KickoffEvent {
  return Object.freeze({ type: 'kickoff' as const, minute: 0 as const, description });
}

export function createHalfTimeEvent(minute: number, description: string): HalfTimeEvent {
  return Object.freeze({ type: 'half_time' as const, minute, description });
}

export function createFullTimeEvent(minute: number, description: string): FullTimeEvent {
  return Object.freeze({ type: 'full_time' as const, minute, description });
}
