import { isErr } from '@world-legends/shared';
import { describe, expect, it } from 'vitest';
import {
  createAssistEvent,
  createCardEvent,
  createGoalEvent,
  createInjuryEvent,
  createPenaltyEvent,
  createSubstitutionEvent,
  createWalkoverEvent,
} from '../../src/events/events';

describe('validação comum a todos os eventos: minute', () => {
  it('rejeita minute negativo', () => {
    expect(
      isErr(
        createGoalEvent({ minute: -1, teamSide: 'home', scorerUserCardId: 'c1', description: 'x' }),
      ),
    ).toBe(true);
  });

  it('rejeita minute fracionário', () => {
    expect(
      isErr(
        createGoalEvent({
          minute: 23.5,
          teamSide: 'home',
          scorerUserCardId: 'c1',
          description: 'x',
        }),
      ),
    ).toBe(true);
  });

  it('aceita minute 0 (kickoff) e minutos altos de prorrogação', () => {
    expect(
      isErr(
        createGoalEvent({ minute: 0, teamSide: 'home', scorerUserCardId: 'c1', description: 'x' }),
      ),
    ).toBe(false);
    expect(
      isErr(
        createGoalEvent({
          minute: 119,
          teamSide: 'home',
          scorerUserCardId: 'c1',
          description: 'x',
        }),
      ),
    ).toBe(false);
  });
});

describe('validação de IDs vazios', () => {
  it('GoalEvent rejeita scorerUserCardId vazio', () => {
    expect(
      isErr(
        createGoalEvent({ minute: 1, teamSide: 'home', scorerUserCardId: '', description: 'x' }),
      ),
    ).toBe(true);
  });

  it('AssistEvent rejeita assisterUserCardId vazio', () => {
    expect(
      isErr(
        createAssistEvent({
          minute: 1,
          teamSide: 'home',
          assisterUserCardId: '',
          scorerUserCardId: 'c1',
          description: 'x',
        }),
      ),
    ).toBe(true);
  });

  it('SubstitutionEvent rejeita o mesmo jogador entrando e saindo', () => {
    expect(
      isErr(
        createSubstitutionEvent({
          minute: 70,
          teamSide: 'home',
          playerOutUserCardId: 'card-x',
          playerInUserCardId: 'card-x',
          reason: 'tactical',
          description: 'x',
        }),
      ),
    ).toBe(true);
  });
});

describe('CardEvent — combinação cardType/redCardReason', () => {
  it('rejeita cardType "yellow" com redCardReason definido', () => {
    expect(
      isErr(
        createCardEvent({
          minute: 1,
          teamSide: 'home',
          playerUserCardId: 'c1',
          cardType: 'yellow',
          redCardReason: 'direct',
          description: 'x',
        }),
      ),
    ).toBe(true);
  });

  it('rejeita cardType "red" SEM redCardReason', () => {
    expect(
      isErr(
        createCardEvent({
          minute: 1,
          teamSide: 'home',
          playerUserCardId: 'c1',
          cardType: 'red',
          description: 'x',
        }),
      ),
    ).toBe(true);
  });
});

describe('InjuryEvent — severity e recoveryDays', () => {
  it('rejeita recoveryDays negativo', () => {
    expect(
      isErr(
        createInjuryEvent({
          minute: 1,
          teamSide: 'home',
          playerUserCardId: 'c1',
          severity: 'leve',
          recoveryDays: -1,
          description: 'x',
        }),
      ),
    ).toBe(true);
  });

  it('aceita recoveryDays 0', () => {
    expect(
      isErr(
        createInjuryEvent({
          minute: 1,
          teamSide: 'home',
          playerUserCardId: 'c1',
          severity: 'leve',
          recoveryDays: 0,
          description: 'x',
        }),
      ),
    ).toBe(false);
  });
});

describe('PenaltyEvent — combinação context/shootoutRound', () => {
  it('rejeita context "in_game" com shootoutRound definido', () => {
    expect(
      isErr(
        createPenaltyEvent({
          minute: 30,
          teamSide: 'home',
          takerUserCardId: 'c1',
          goalkeeperUserCardId: 'c2',
          outcome: 'scored',
          context: 'in_game',
          shootoutRound: 1,
          description: 'x',
        }),
      ),
    ).toBe(true);
  });

  it('rejeita context "shootout" SEM shootoutRound', () => {
    expect(
      isErr(
        createPenaltyEvent({
          minute: 120,
          teamSide: 'home',
          takerUserCardId: 'c1',
          goalkeeperUserCardId: 'c2',
          outcome: 'scored',
          context: 'shootout',
          description: 'x',
        }),
      ),
    ).toBe(true);
  });

  it('rejeita shootoutRound 0 ou negativo', () => {
    expect(
      isErr(
        createPenaltyEvent({
          minute: 120,
          teamSide: 'home',
          takerUserCardId: 'c1',
          goalkeeperUserCardId: 'c2',
          outcome: 'scored',
          context: 'shootout',
          shootoutRound: 0,
          description: 'x',
        }),
      ),
    ).toBe(true);
  });
});

describe('WalkoverEvent — limite estrutural de remainingPlayers (doc 09 §12.1)', () => {
  it('rejeita remainingPlayers == 7 (o gatilho é "abaixo de 7", nunca 7 ou mais)', () => {
    expect(
      isErr(
        createWalkoverEvent({
          minute: 1,
          affectedTeamSide: 'home',
          remainingPlayers: 7,
          description: 'x',
        }),
      ),
    ).toBe(true);
  });

  it('rejeita remainingPlayers negativo', () => {
    expect(
      isErr(
        createWalkoverEvent({
          minute: 1,
          affectedTeamSide: 'home',
          remainingPlayers: -1,
          description: 'x',
        }),
      ),
    ).toBe(true);
  });

  it('rejeita remainingPlayers fracionário', () => {
    expect(
      isErr(
        createWalkoverEvent({
          minute: 1,
          affectedTeamSide: 'home',
          remainingPlayers: 3.5,
          description: 'x',
        }),
      ),
    ).toBe(true);
  });
});
