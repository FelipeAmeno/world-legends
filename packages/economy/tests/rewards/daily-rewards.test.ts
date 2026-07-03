import { describe, expect, it } from 'vitest';
import {
  OBJECTIVE_REWARDS,
  calculateMaxWeeklyObjectiveCredits,
  calculateObjectiveReward,
} from '../../src/rewards/daily-rewards';

describe('calculateObjectiveReward — invariantes', () => {
  it('objetivo não concluído retorna completed=false e créditos/fragmentos=0', () => {
    const r = calculateObjectiveReward({
      objectiveType: 'daily_win',
      currentProgress: 0,
      requiredProgress: 1,
    });
    expect(r.completed).toBe(false);
    expect(r.credits).toBe(0);
    expect(r.fragments).toBe(0);
  });

  it('objetivo concluído retorna completed=true e valores positivos', () => {
    const r = calculateObjectiveReward({
      objectiveType: 'daily_win',
      currentProgress: 1,
      requiredProgress: 1,
    });
    expect(r.completed).toBe(true);
    expect(r.credits).toBeGreaterThan(0);
  });

  it('retorna imutável (Object.freeze)', () => {
    const r = calculateObjectiveReward({
      objectiveType: 'daily_login',
      currentProgress: 1,
      requiredProgress: 1,
    });
    expect(Object.isFrozen(r)).toBe(true);
  });

  it('objectiveType é preservado no resultado', () => {
    const r = calculateObjectiveReward({
      objectiveType: 'weekly_three_wins',
      currentProgress: 3,
      requiredProgress: 3,
    });
    expect(r.objectiveType).toBe('weekly_three_wins');
  });
});

describe('calculateObjectiveReward — LedgerReason correto por tipo', () => {
  it('objetivos daily_* usam reason daily_objective', () => {
    for (const type of ['daily_login', 'daily_first_match', 'daily_win'] as const) {
      const r = calculateObjectiveReward({
        objectiveType: type,
        currentProgress: 1,
        requiredProgress: 1,
      });
      expect(r.reason).toBe('daily_objective');
    }
  });

  it('objetivos weekly_* usam reason weekly_objective', () => {
    for (const type of ['weekly_three_wins', 'weekly_ten_matches'] as const) {
      const r = calculateObjectiveReward({
        objectiveType: type,
        currentProgress: 3,
        requiredProgress: 3,
      });
      expect(r.reason).toBe('weekly_objective');
    }
  });
});

describe('calculateObjectiveReward — valores de OBJECTIVE_REWARDS', () => {
  it('todos os tipos têm credits ≥ 0 e fragments ≥ 0', () => {
    for (const [, spec] of Object.entries(OBJECTIVE_REWARDS)) {
      expect(spec.credits).toBeGreaterThanOrEqual(0);
      expect(spec.fragments).toBeGreaterThanOrEqual(0);
    }
  });

  it('objetivos semanais valem mais que diários', () => {
    expect(OBJECTIVE_REWARDS.weekly_three_wins.credits).toBeGreaterThan(
      OBJECTIVE_REWARDS.daily_win.credits,
    );
    expect(OBJECTIVE_REWARDS.weekly_ten_matches.credits).toBeGreaterThan(
      OBJECTIVE_REWARDS.weekly_three_wins.credits,
    );
  });

  it('objetivos de win valem mais que de login (incentivo a jogar)', () => {
    expect(OBJECTIVE_REWARDS.daily_win.credits).toBeGreaterThan(
      OBJECTIVE_REWARDS.daily_login.credits,
    );
  });
});

describe('calculateObjectiveReward — progresso parcial', () => {
  it('currentProgress > requiredProgress ainda retorna completed=true', () => {
    const r = calculateObjectiveReward({
      objectiveType: 'weekly_ten_matches',
      currentProgress: 15,
      requiredProgress: 10,
    });
    expect(r.completed).toBe(true);
    expect(r.credits).toBe(OBJECTIVE_REWARDS.weekly_ten_matches.credits);
  });

  it('currentProgress = requiredProgress - 1 retorna incompleto', () => {
    const r = calculateObjectiveReward({
      objectiveType: 'weekly_three_wins',
      currentProgress: 2,
      requiredProgress: 3,
    });
    expect(r.completed).toBe(false);
    expect(r.credits).toBe(0);
  });
});

describe('calculateMaxWeeklyObjectiveCredits — teto inflacionário', () => {
  it('retorna valor positivo e finito', () => {
    const max = calculateMaxWeeklyObjectiveCredits();
    expect(max).toBeGreaterThan(0);
    expect(Number.isFinite(max)).toBe(true);
  });

  it('teto semanal deve ser menor que 2× o custo de Pack Ouro (anti-inflação)', () => {
    // Pack Ouro = 2000 (doc 07 §1). Teto semanal < 4000 mantém senso de valor.
    const max = calculateMaxWeeklyObjectiveCredits();
    expect(max).toBeLessThan(4_000);
  });

  it('teto semanal deve ser maior que o custo de 1 Pack Bronze (incentivo mínimo)', () => {
    // Pack Bronze = 300 (doc 07 §1). Um jogador diligente deve poder abrir ≥ 1 Bronze/semana só com objetivos.
    const max = calculateMaxWeeklyObjectiveCredits();
    expect(max).toBeGreaterThan(300);
  });
});
