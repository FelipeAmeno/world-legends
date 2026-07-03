/**
 * `match.regression.test.ts` — valores travados a partir da execução
 * real de `simulateMatch` com seeds fixos, conferidos manualmente uma
 * vez (ver histórico desta tarefa). Qualquer mudança de comportamento
 * futura que altere esses números precisa ser uma mudança INTENCIONAL
 * (e, em produção, incrementaria `ENGINE_VERSION` — doc 09 §21) — não
 * uma regressão silenciosa.
 *
 * IMPORTANTE: `buildTeamSnapshot` (fixtures.ts) usa um contador global
 * de IDs (`card-N`) que avança a cada chamada dentro do MESMO processo.
 * Por isso os dois times deste arquivo são construídos uma ÚNICA vez,
 * no topo, antes de qualquer outro teste — exatamente a mesma ordem
 * usada para gerar os valores travados abaixo. Não adicionar nenhuma
 * chamada a `buildTeamSnapshot`/`makePlayer` ANTES destas duas linhas
 * neste arquivo, ou os `userCardId` esperados (e portanto o MVP)
 * deixam de bater.
 */
import { createSeed } from '@world-legends/shared';
import { describe, expect, it } from 'vitest';
import { simulateMatch } from '../../src/match/match';
import { buildTeamSnapshot } from './fixtures';

function seed(value: string) {
  const result = createSeed(value);
  if (!result.ok) throw new Error('seed inválido no teste');
  return result.value;
}

const home = buildTeamSnapshot({ isHomeTeam: true });
const away = buildTeamSnapshot({ isHomeTeam: false });

describe('Regressão — seed "regressao-liga-01" (liga, requiresWinner=false)', () => {
  const result = simulateMatch({
    home,
    away,
    context: { requiresWinner: false },
    seed: seed('regressao-liga-01'),
  });

  it('placar travado: 2-0', () => {
    expect(result.homeScore).toBe(2);
    expect(result.awayScore).toBe(0);
  });

  it('sequência de tipos de evento travada', () => {
    expect(result.events.map((e) => e.type)).toEqual([
      'kickoff',
      'half_time',
      'goal',
      'assist',
      'goal',
      'full_time',
    ]);
  });

  it('clima e árbitro sorteados travados (determinísticos a partir do seed)', () => {
    expect(result.weather).toBe('calor_extremo');
    expect(result.refereeProfile).toBe('rigoroso');
  });

  it('MVP travado', () => {
    expect(result.mvpUserCardId).toBe('card-7');
  });

  it('sem prorrogação nem disputa de pênaltis (liga não exige vencedor)', () => {
    expect(result.penaltyShootout).toBeUndefined();
    expect(result.walkover).toBeUndefined();
  });
});

describe('Regressão — seed "regressao-mata-mata-01" (mata-mata, requiresWinner=true)', () => {
  const result = simulateMatch({
    home,
    away,
    context: { requiresWinner: true },
    seed: seed('regressao-mata-mata-01'),
  });

  it('placar travado: 0-3', () => {
    expect(result.homeScore).toBe(0);
    expect(result.awayScore).toBe(3);
  });

  it('sequência de tipos de evento travada', () => {
    expect(result.events.map((e) => e.type)).toEqual([
      'kickoff',
      'card',
      'half_time',
      'goal',
      'goal',
      'goal',
      'assist',
      'full_time',
    ]);
  });

  it('decidida nos 90 minutos — prorrogação nunca chega a ser acionada', () => {
    expect(result.penaltyShootout).toBeUndefined();
  });

  it('MVP travado', () => {
    expect(result.mvpUserCardId).toBe('card-28');
  });

  it('estatísticas de faltas/cartões travadas', () => {
    expect(result.stats.home.fouls).toBe(3);
    expect(result.stats.home.yellowCards).toBe(1);
    expect(result.stats.away.fouls).toBe(0);
  });
});
