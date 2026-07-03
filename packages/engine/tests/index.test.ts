import { describe, expect, it } from 'vitest';
import * as engine from '../src/index';

// Confirma que o barril público do package (src/index.ts) reexporta o
// submódulo rng — não substitui os testes de comportamento de
// tests/rng/*, apenas garante que a superfície pública está estável.
describe('superfície pública de @world-legends/engine', () => {
  it('exporta o construtor RNG', () => {
    expect(typeof engine.RNG).toBe('function');
  });

  it('exporta calculateOverall', () => {
    expect(typeof engine.calculateOverall).toBe('function');
  });

  it('exporta calculateChemistry', () => {
    expect(typeof engine.calculateChemistry).toBe('function');
  });

  it('exporta as fábricas de TraitMagnitude e o empilhamento de Leader', () => {
    expect(typeof engine.createMatadorMagnitude).toBe('function');
    expect(typeof engine.createLeaderMagnitude).toBe('function');
    expect(typeof engine.calculateLeaderStackedBonus).toBe('function');
  });

  it('exporta as fábricas dos 7 eventos de partida', () => {
    expect(typeof engine.createGoalEvent).toBe('function');
    expect(typeof engine.createAssistEvent).toBe('function');
    expect(typeof engine.createCardEvent).toBe('function');
    expect(typeof engine.createInjuryEvent).toBe('function');
    expect(typeof engine.createPenaltyEvent).toBe('function');
    expect(typeof engine.createSubstitutionEvent).toBe('function');
    expect(typeof engine.createWalkoverEvent).toBe('function');
  });

  it('exporta as funções de fatigue', () => {
    expect(typeof engine.calculateIntraMatchFatigue).toBe('function');
    expect(typeof engine.calculateCalendarFatigue).toBe('function');
    expect(typeof engine.applyFatigueToAttribute).toBe('function');
  });

  it('exporta as funções de injuries', () => {
    expect(typeof engine.rollInjurySeverity).toBe('function');
    expect(typeof engine.shouldInjuryOccur).toBe('function');
    expect(typeof engine.sampleRecoveryDays).toBe('function');
    expect(typeof engine.shouldRelapse).toBe('function');
    expect(typeof engine.determineRelapseSeverity).toBe('function');
  });
});
