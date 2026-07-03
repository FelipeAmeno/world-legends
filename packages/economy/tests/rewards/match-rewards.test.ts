import { describe, expect, it } from 'vitest';
import {
  BASE_MATCH_REWARDS,
  GOAL_DIFF_BONUS_CAP_GOALS,
  RANKED_BONUS_MULTIPLIER,
  calculateMatchRewards,
} from '../../src/rewards/match-rewards';

describe('calculateMatchRewards — invariantes básicas', () => {
  it('vitória > empate > derrota (ordenação por valor, doc 10 §18)', () => {
    const win = calculateMatchRewards({ outcome: 'win', isRanked: false });
    const draw = calculateMatchRewards({ outcome: 'draw', isRanked: false });
    const loss = calculateMatchRewards({ outcome: 'loss', isRanked: false });
    expect(win.total).toBeGreaterThan(draw.total);
    expect(draw.total).toBeGreaterThan(loss.total);
  });

  it('retorna os valores base documentados para cada outcome', () => {
    expect(calculateMatchRewards({ outcome: 'win', isRanked: false }).base).toBe(
      BASE_MATCH_REWARDS.win,
    );
    expect(calculateMatchRewards({ outcome: 'draw', isRanked: false }).base).toBe(
      BASE_MATCH_REWARDS.draw,
    );
    expect(calculateMatchRewards({ outcome: 'loss', isRanked: false }).base).toBe(
      BASE_MATCH_REWARDS.loss,
    );
  });

  it('total nunca é negativo', () => {
    for (const outcome of ['win', 'draw', 'loss'] as const) {
      const r = calculateMatchRewards({ outcome, isRanked: false, goalDiff: 0 });
      expect(r.total).toBeGreaterThan(0);
    }
  });

  it('retorna imutável (Object.freeze)', () => {
    const r = calculateMatchRewards({ outcome: 'win', isRanked: false });
    expect(Object.isFrozen(r)).toBe(true);
  });

  it('reason é sempre match_reward (doc 12 §2.7)', () => {
    expect(calculateMatchRewards({ outcome: 'win', isRanked: false }).reason).toBe('match_reward');
    expect(calculateMatchRewards({ outcome: 'loss', isRanked: true }).reason).toBe('match_reward');
  });
});

describe('calculateMatchRewards — bônus de partida ranqueada', () => {
  it('ranked dá mais créditos que casual para o mesmo resultado', () => {
    const rankedWin = calculateMatchRewards({ outcome: 'win', isRanked: true });
    const casualWin = calculateMatchRewards({ outcome: 'win', isRanked: false });
    expect(rankedWin.total).toBeGreaterThan(casualWin.total);
  });

  it('rankedBonus é zero em partidas casuais', () => {
    expect(calculateMatchRewards({ outcome: 'win', isRanked: false }).rankedBonus).toBe(0);
  });

  it('rankedBonus positivo em partidas ranqueadas', () => {
    expect(calculateMatchRewards({ outcome: 'win', isRanked: true }).rankedBonus).toBeGreaterThan(
      0,
    );
  });

  it('bônus ranked: total = base * RANKED_BONUS_MULTIPLIER (sem goalDiff)', () => {
    const r = calculateMatchRewards({ outcome: 'win', isRanked: true, goalDiff: 0 });
    const expectedTotal = Math.round(BASE_MATCH_REWARDS.win * RANKED_BONUS_MULTIPLIER);
    expect(r.total).toBe(expectedTotal);
  });
});

describe('calculateMatchRewards — bônus de diferença de gols', () => {
  it('1 gol de diferença dá bônus acima do base', () => {
    const withGoalDiff = calculateMatchRewards({ outcome: 'win', isRanked: false, goalDiff: 1 });
    const withoutGoalDiff = calculateMatchRewards({ outcome: 'win', isRanked: false, goalDiff: 0 });
    expect(withGoalDiff.goalDiffBonus).toBeGreaterThan(0);
    expect(withGoalDiff.total).toBeGreaterThan(withoutGoalDiff.total);
  });

  it(`bônus é igual para ${GOAL_DIFF_BONUS_CAP_GOALS} gols e para 10 gols (cap)`, () => {
    const atCap = calculateMatchRewards({
      outcome: 'win',
      isRanked: false,
      goalDiff: GOAL_DIFF_BONUS_CAP_GOALS,
    });
    const beyond = calculateMatchRewards({ outcome: 'win', isRanked: false, goalDiff: 10 });
    expect(atCap.goalDiffBonus).toBe(beyond.goalDiffBonus);
  });

  it('goalDiff negativo é tratado como absoluto (derrota por 3 = diferença 3)', () => {
    const neg = calculateMatchRewards({ outcome: 'loss', isRanked: false, goalDiff: -3 });
    const pos = calculateMatchRewards({ outcome: 'loss', isRanked: false, goalDiff: 3 });
    expect(neg.goalDiffBonus).toBe(pos.goalDiffBonus);
  });

  it('goalDiff = 0 não dá bônus', () => {
    expect(
      calculateMatchRewards({ outcome: 'win', isRanked: false, goalDiff: 0 }).goalDiffBonus,
    ).toBe(0);
  });

  it('goalDiff undefined não dá bônus', () => {
    expect(calculateMatchRewards({ outcome: 'win', isRanked: false }).goalDiffBonus).toBe(0);
  });
});

describe('calculateMatchRewards — calibração com âncoras documentadas', () => {
  it('vitória ranqueada (2-0) deve dar créditos suficientes para comprar Pack Bronze em ~2 sessões de 3 partidas', () => {
    // Pack Bronze = 300 créditos (doc 07 §1)
    // Meta: ~6 vitórias ranqueadas com 2 gols de diferença = 1 Pack Bronze
    const r = calculateMatchRewards({ outcome: 'win', isRanked: true, goalDiff: 2 });
    expect(r.total * 6).toBeGreaterThanOrEqual(300);
  });

  it('derrota casual dá recompensa mínima positiva (nunca punição de créditos)', () => {
    const r = calculateMatchRewards({ outcome: 'loss', isRanked: false, goalDiff: 0 });
    expect(r.total).toBeGreaterThan(0);
  });
});
