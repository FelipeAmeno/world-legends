import { describe, expect, it } from 'vitest';
import { createAssistEvent, createCardEvent, createGoalEvent } from '../../src/events/events';
import type { MatchEvent } from '../../src/events/types';
import { calculateMvp } from '../../src/match/stats';

function unwrap<T>(result: { ok: boolean; value?: T }): T {
  if (!result.ok) throw new Error('fixture inválida em stats.test.ts');
  return result.value as T;
}

describe('calculateMvp (adaptado de doc 05 §5 — doc 09 nunca define `calcularMVP`)', () => {
  it('retorna null para uma partida sem nenhum evento relevante', () => {
    expect(calculateMvp([])).toBeNull();
  });

  it('elege quem tem a maior pontuação (gols×3 + assistências×2 - cartões)', () => {
    const events: MatchEvent[] = [
      unwrap(
        createGoalEvent({
          minute: 10,
          teamSide: 'home',
          scorerUserCardId: 'artilheiro',
          description: 'gol',
        }),
      ),
      unwrap(
        createGoalEvent({
          minute: 20,
          teamSide: 'home',
          scorerUserCardId: 'artilheiro',
          description: 'gol',
        }),
      ),
      unwrap(
        createAssistEvent({
          minute: 30,
          teamSide: 'away',
          assisterUserCardId: 'garcom',
          scorerUserCardId: 'outro',
          description: 'assist',
        }),
      ),
    ];
    // artilheiro: 2 gols = 6 pontos. garcom: 1 assistência = 2 pontos.
    expect(calculateMvp(events)).toBe('artilheiro');
  });

  it('um cartão vermelho pesa mais negativamente que um amarelo', () => {
    const events: MatchEvent[] = [
      unwrap(
        createGoalEvent({
          minute: 10,
          teamSide: 'home',
          scorerUserCardId: 'jogadorA',
          description: 'gol',
        }),
      ),
      unwrap(
        createCardEvent({
          minute: 80,
          teamSide: 'home',
          playerUserCardId: 'jogadorA',
          cardType: 'red',
          redCardReason: 'direct',
          description: 'vermelho',
        }),
      ),
      unwrap(
        createGoalEvent({
          minute: 15,
          teamSide: 'away',
          scorerUserCardId: 'jogadorB',
          description: 'gol',
        }),
      ),
      unwrap(
        createCardEvent({
          minute: 60,
          teamSide: 'away',
          playerUserCardId: 'jogadorB',
          cardType: 'yellow',
          description: 'amarelo',
        }),
      ),
    ];
    // jogadorA: 3 (gol) - 3 (vermelho) = 0. jogadorB: 3 (gol) - 1 (amarelo) = 2.
    expect(calculateMvp(events)).toBe('jogadorB');
  });

  it('gol contra não conta para quem o marcou', () => {
    const events: MatchEvent[] = [
      unwrap(
        createGoalEvent({
          minute: 10,
          teamSide: 'home',
          scorerUserCardId: 'infeliz',
          isOwnGoal: true,
          description: 'contra',
        }),
      ),
      unwrap(
        createGoalEvent({
          minute: 20,
          teamSide: 'away',
          scorerUserCardId: 'heroi',
          description: 'gol',
        }),
      ),
    ];
    expect(calculateMvp(events)).toBe('heroi');
  });
});
