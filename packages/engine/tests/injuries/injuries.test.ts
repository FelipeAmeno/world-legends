import { createSeed, unwrapResult } from '@world-legends/shared';
import { describe, expect, it } from 'vitest';
import {
  INJURY_CHANCE_FOUL_VICTIM,
  INJURY_CHANCE_PHYSICAL_DUEL,
  RELAPSE_RISK_PER_MATCH,
  applyIronManRiskReduction,
  calculateInjuryDurabilityFactor,
  determineRelapseSeverity,
  rollInjurySeverity,
  sampleRecoveryDays,
  shouldInjuryOccur,
  shouldRelapse,
} from '../../src/injuries/injuries';
import { INJURY_RECOVERY_DAYS_RANGE, INJURY_SEVERITY_ORDER } from '../../src/injuries/types';
import { RNG } from '../../src/rng/rng';
import { createFastRecoveryMagnitude, createIronManMagnitude } from '../../src/traits/traits';

function rngFrom(value: string) {
  return RNG(unwrapResult(createSeed(value)));
}

describe('tipos de lesão — rollInjurySeverity (doc 09 §12)', () => {
  it('a distribuição converge para ~60% leve / ~30% moderada / ~10% grave sobre muitas amostras', () => {
    const rng = rngFrom('injury-severity-distribution');
    const N = 20000;
    const counts = { leve: 0, moderada: 0, grave: 0 };
    for (let i = 0; i < N; i += 1) {
      counts[rollInjurySeverity(rng)] += 1;
    }
    expect(counts.leve / N).toBeGreaterThan(0.57);
    expect(counts.leve / N).toBeLessThan(0.63);
    expect(counts.moderada / N).toBeGreaterThan(0.27);
    expect(counts.moderada / N).toBeLessThan(0.33);
    expect(counts.grave / N).toBeGreaterThan(0.07);
    expect(counts.grave / N).toBeLessThan(0.13);
  });

  it('o mesmo seed produz sempre a mesma severidade (determinismo)', () => {
    const a = rollInjurySeverity(rngFrom('mesmo-seed-lesao'));
    const b = rollInjurySeverity(rngFrom('mesmo-seed-lesao'));
    expect(a).toBe(b);
  });
});

describe('shouldInjuryOccur + chances-base documentadas', () => {
  it('com chance 0, lesão nunca ocorre', () => {
    const rng = rngFrom('chance-zero');
    for (let i = 0; i < 1000; i += 1) {
      expect(shouldInjuryOccur(0, rng)).toBe(false);
    }
  });

  it('com chance 1, lesão sempre ocorre', () => {
    const rng = rngFrom('chance-um');
    for (let i = 0; i < 1000; i += 1) {
      expect(shouldInjuryOccur(1, rng)).toBe(true);
    }
  });

  it('as duas chances-base documentadas têm os valores exatos de doc 09 §12', () => {
    expect(INJURY_CHANCE_FOUL_VICTIM).toBe(0.04);
    expect(INJURY_CHANCE_PHYSICAL_DUEL).toBe(0.015);
  });

  it('a chance de vítima de falta converge estatisticamente perto de 4%', () => {
    const rng = rngFrom('foul-victim-rate');
    const N = 50000;
    let occurrences = 0;
    for (let i = 0; i < N; i += 1) {
      if (shouldInjuryOccur(INJURY_CHANCE_FOUL_VICTIM, rng)) occurrences += 1;
    }
    const rate = occurrences / N;
    expect(rate).toBeGreaterThan(0.035);
    expect(rate).toBeLessThan(0.045);
  });
});

describe('Iron Man — redução de risco de lesão (doc 11 §7)', () => {
  it('sem o trait, a chance não é alterada', () => {
    expect(applyIronManRiskReduction(0.04)).toBe(0.04);
  });

  it('com 25% de redução (teto do trait, T006), a chance cai exatamente 25%', () => {
    const ironMan = unwrapResult(createIronManMagnitude(25, 20));
    const reduced = applyIronManRiskReduction(INJURY_CHANCE_FOUL_VICTIM, ironMan);
    expect(reduced).toBe(INJURY_CHANCE_FOUL_VICTIM * 0.75);
  });

  it('com um Iron Man de magnitude menor (10%), a redução é proporcionalmente menor', () => {
    const ironMan = unwrapResult(createIronManMagnitude(10, 5));
    const reduced = applyIronManRiskReduction(INJURY_CHANCE_PHYSICAL_DUEL, ironMan);
    expect(reduced).toBe(INJURY_CHANCE_PHYSICAL_DUEL * 0.9);
  });
});

describe('calculateInjuryDurabilityFactor (doc 09 §12: 1 - physical/198)', () => {
  it('físico no teto (99) produz o menor fator de duração possível (recuperação mais rápida)', () => {
    expect(calculateInjuryDurabilityFactor(99)).toBe(0.5);
  });

  it('físico no piso (1) produz o maior fator (quase nenhuma redução de duração)', () => {
    const factor = calculateInjuryDurabilityFactor(1);
    expect(factor).toBeGreaterThan(0.99);
    expect(factor).toBeLessThan(1);
  });

  it('físico mais alto sempre produz fator menor ou igual (nunca aumenta a duração)', () => {
    expect(calculateInjuryDurabilityFactor(80)).toBeLessThan(calculateInjuryDurabilityFactor(40));
  });
});

describe('sampleRecoveryDays — tempo de recuperação (doc 09 §12)', () => {
  it('os dias sorteados para "leve" sempre caem dentro da faixa documentada, antes do fator de durabilidade', () => {
    const rng = rngFrom('recovery-days-leve');
    const [min, max] = INJURY_RECOVERY_DAYS_RANGE.leve;
    for (let i = 0; i < 200; i += 1) {
      // físico 0 hipotético isola o dia sorteado (durabilityFactor = 1 - 0/198 = 1)
      const days = sampleRecoveryDays({ severity: 'leve', physicalAttribute: 0, rng });
      expect(days).toBeGreaterThanOrEqual(min);
      expect(days).toBeLessThanOrEqual(max);
    }
  });

  it('físico mais alto reduz os dias finais de recuperação, para o mesmo sorteio de dias', () => {
    const rngA = rngFrom('mesmo-sorteio-fisico');
    const rngB = rngFrom('mesmo-sorteio-fisico');
    const baixoFisico = sampleRecoveryDays({ severity: 'grave', physicalAttribute: 1, rng: rngA });
    const altoFisico = sampleRecoveryDays({ severity: 'grave', physicalAttribute: 99, rng: rngB });
    expect(altoFisico).toBeLessThan(baixoFisico);
  });

  it('Fast Recovery (doc 11 §7) reduz a duração final em exatamente o percentual do trait', () => {
    const rngA = rngFrom('fast-recovery-comparacao');
    const rngB = rngFrom('fast-recovery-comparacao');
    const fastRecovery = unwrapResult(createFastRecoveryMagnitude(30));
    const sem = sampleRecoveryDays({ severity: 'moderada', physicalAttribute: 50, rng: rngA });
    const com = sampleRecoveryDays({
      severity: 'moderada',
      physicalAttribute: 50,
      rng: rngB,
      fastRecovery,
    });
    expect(com).toBeGreaterThan(sem * 0.69);
    expect(com).toBeLessThan(sem * 0.71);
  });

  it('lesões "grave" produzem, em média, muito mais dias de recuperação que "leve"', () => {
    const rng = rngFrom('media-recuperacao');
    let totalLeve = 0;
    let totalGrave = 0;
    const N = 500;
    for (let i = 0; i < N; i += 1) {
      totalLeve += sampleRecoveryDays({ severity: 'leve', physicalAttribute: 50, rng });
      totalGrave += sampleRecoveryDays({ severity: 'grave', physicalAttribute: 50, rng });
    }
    expect(totalGrave / N).toBeGreaterThan(totalLeve / N);
  });
});

describe('efeitos — risco de recaída (doc 09 §12: 15% por partida)', () => {
  it('a constante documentada é exatamente 0.15', () => {
    expect(RELAPSE_RISK_PER_MATCH).toBe(0.15);
  });

  it('a taxa de recaída converge estatisticamente perto de 15%', () => {
    const rng = rngFrom('relapse-rate');
    const N = 50000;
    let relapses = 0;
    for (let i = 0; i < N; i += 1) {
      if (shouldRelapse(rng)) relapses += 1;
    }
    const rate = relapses / N;
    expect(rate).toBeGreaterThan(0.13);
    expect(rate).toBeLessThan(0.17);
  });

  it('determineRelapseSeverity nunca produz severidade MENOR que a original (doc 09 §12: "igual ou maior")', () => {
    const rng = rngFrom('relapse-severity-floor');
    for (let i = 0; i < 5000; i += 1) {
      const relapsed = determineRelapseSeverity('moderada', rng);
      expect(INJURY_SEVERITY_ORDER[relapsed]).toBeGreaterThanOrEqual(
        INJURY_SEVERITY_ORDER.moderada,
      );
    }
  });

  it('partindo de "grave" (já o máximo), a recaída é sempre "grave"', () => {
    const rng = rngFrom('relapse-from-grave');
    for (let i = 0; i < 500; i += 1) {
      expect(determineRelapseSeverity('grave', rng)).toBe('grave');
    }
  });

  it('partindo de "leve" (o mínimo), a recaída pode ser qualquer uma das 3 severidades', () => {
    const rng = rngFrom('relapse-from-leve-variety');
    const seen = new Set<string>();
    for (let i = 0; i < 1000; i += 1) {
      seen.add(determineRelapseSeverity('leve', rng));
    }
    expect(seen.size).toBe(3);
  });
});
