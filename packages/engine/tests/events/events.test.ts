import { isOk, unwrapResult } from '@world-legends/shared';
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

describe('GoalEvent', () => {
  it('cria um gol simples, sem assistência', () => {
    const result = createGoalEvent({
      minute: 23,
      teamSide: 'home',
      scorerUserCardId: 'card-1',
      description: "23' GOL!",
    });
    expect(isOk(result)).toBe(true);
    const event = unwrapResult(result);
    expect(event.type).toBe('goal');
    expect(event.isOwnGoal).toBe(false);
    expect('assisterUserCardId' in event).toBe(false);
  });

  it('cria um gol com assistência', () => {
    const event = unwrapResult(
      createGoalEvent({
        minute: 45,
        teamSide: 'away',
        scorerUserCardId: 'card-1',
        assisterUserCardId: 'card-2',
        description: "45' GOL de assistência!",
      }),
    );
    expect(event.assisterUserCardId).toBe('card-2');
  });

  it('cria um gol contra (isOwnGoal)', () => {
    const event = unwrapResult(
      createGoalEvent({
        minute: 10,
        teamSide: 'home',
        scorerUserCardId: 'card-99',
        isOwnGoal: true,
        description: "10' Gol contra!",
      }),
    );
    expect(event.isOwnGoal).toBe(true);
  });

  it('o objeto resultante é congelado', () => {
    const event = unwrapResult(
      createGoalEvent({
        minute: 1,
        teamSide: 'home',
        scorerUserCardId: 'card-1',
        description: 'x',
      }),
    );
    expect(Object.isFrozen(event)).toBe(true);
  });
});

describe('AssistEvent', () => {
  it('cria uma assistência válida', () => {
    const event = unwrapResult(
      createAssistEvent({
        minute: 45,
        teamSide: 'away',
        assisterUserCardId: 'card-2',
        scorerUserCardId: 'card-1',
        description: "45' Bela assistência!",
      }),
    );
    expect(event.type).toBe('assist');
    expect(Object.isFrozen(event)).toBe(true);
  });
});

describe('CardEvent', () => {
  it('cria um cartão amarelo (sem motivo de vermelho)', () => {
    const event = unwrapResult(
      createCardEvent({
        minute: 30,
        teamSide: 'home',
        playerUserCardId: 'card-3',
        cardType: 'yellow',
        description: 'x',
      }),
    );
    expect(event.cardType).toBe('yellow');
    expect('redCardReason' in event).toBe(false);
  });

  it('cria um cartão vermelho direto', () => {
    const event = unwrapResult(
      createCardEvent({
        minute: 60,
        teamSide: 'away',
        playerUserCardId: 'card-4',
        cardType: 'red',
        redCardReason: 'direct',
        description: 'x',
      }),
    );
    expect(event.redCardReason).toBe('direct');
  });

  it('cria um cartão vermelho por segundo amarelo', () => {
    const event = unwrapResult(
      createCardEvent({
        minute: 80,
        teamSide: 'home',
        playerUserCardId: 'card-5',
        cardType: 'red',
        redCardReason: 'second_yellow',
        description: 'x',
      }),
    );
    expect(event.redCardReason).toBe('second_yellow');
  });
});

describe('InjuryEvent', () => {
  it('cria uma lesão leve', () => {
    const event = unwrapResult(
      createInjuryEvent({
        minute: 50,
        teamSide: 'home',
        playerUserCardId: 'card-6',
        severity: 'leve',
        recoveryDays: 5,
        description: 'x',
      }),
    );
    expect(event.severity).toBe('leve');
    expect(event.isRelapse).toBe(false);
  });

  it('cria uma recaída', () => {
    const event = unwrapResult(
      createInjuryEvent({
        minute: 20,
        teamSide: 'away',
        playerUserCardId: 'card-7',
        severity: 'grave',
        recoveryDays: 40,
        isRelapse: true,
        description: 'x',
      }),
    );
    expect(event.isRelapse).toBe(true);
  });
});

describe('PenaltyEvent', () => {
  it('cria uma cobrança em jogo (in_game), sem rodada de disputa', () => {
    const event = unwrapResult(
      createPenaltyEvent({
        minute: 70,
        teamSide: 'home',
        takerUserCardId: 'card-8',
        goalkeeperUserCardId: 'card-9',
        outcome: 'scored',
        context: 'in_game',
        description: 'x',
      }),
    );
    expect(event.outcome).toBe('scored');
    expect('shootoutRound' in event).toBe(false);
  });

  it('cria uma cobrança de disputa de pênaltis, com rodada', () => {
    const event = unwrapResult(
      createPenaltyEvent({
        minute: 120,
        teamSide: 'away',
        takerUserCardId: 'card-10',
        goalkeeperUserCardId: 'card-11',
        outcome: 'saved',
        context: 'shootout',
        shootoutRound: 3,
        description: 'x',
      }),
    );
    expect(event.shootoutRound).toBe(3);
  });

  it('cobre o desfecho "missed" (chute para fora)', () => {
    const event = unwrapResult(
      createPenaltyEvent({
        minute: 35,
        teamSide: 'home',
        takerUserCardId: 'card-12',
        goalkeeperUserCardId: 'card-13',
        outcome: 'missed',
        context: 'in_game',
        description: 'x',
      }),
    );
    expect(event.outcome).toBe('missed');
  });
});

describe('SubstitutionEvent', () => {
  it('cria uma substituição táctica', () => {
    const event = unwrapResult(
      createSubstitutionEvent({
        minute: 70,
        teamSide: 'home',
        playerOutUserCardId: 'card-14',
        playerInUserCardId: 'card-15',
        reason: 'tactical',
        description: 'x',
      }),
    );
    expect(event.reason).toBe('tactical');
  });

  it('cria uma substituição forçada por lesão', () => {
    const event = unwrapResult(
      createSubstitutionEvent({
        minute: 33,
        teamSide: 'away',
        playerOutUserCardId: 'card-16',
        playerInUserCardId: 'card-17',
        reason: 'injury',
        description: 'x',
      }),
    );
    expect(event.reason).toBe('injury');
  });
});

describe('WalkoverEvent', () => {
  it('cria um W.O. com 6 jogadores restantes (limite documentado)', () => {
    const event = unwrapResult(
      createWalkoverEvent({
        minute: 55,
        affectedTeamSide: 'away',
        remainingPlayers: 6,
        description: 'x',
      }),
    );
    expect(event.remainingPlayers).toBe(6);
    expect(event.reason).toBe('insuficiência de elenco');
  });

  it('cria um W.O. com 0 jogadores restantes', () => {
    const event = unwrapResult(
      createWalkoverEvent({
        minute: 90,
        affectedTeamSide: 'home',
        remainingPlayers: 0,
        description: 'x',
      }),
    );
    expect(event.remainingPlayers).toBe(0);
  });
});
