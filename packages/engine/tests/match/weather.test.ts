import { createSeed } from '@world-legends/shared';
import { describe, expect, it } from 'vitest';
import {
  applyColdWeatherToFinishingAttributes,
  calculateWeatherFatigueMultiplier,
  calculateWeatherInjuryChanceBonus,
  calculateWeatherPrecisionModifier,
  rollWeather,
} from '../../src/match/weather';
import { RNG } from '../../src/rng/rng';

function seed(value: string) {
  const result = createSeed(value);
  if (!result.ok) throw new Error('seed inválido no teste');
  return result.value;
}

describe('rollWeather', () => {
  it('é determinístico para o mesmo seed', () => {
    const a = rollWeather(RNG(seed('clima-1')));
    const b = rollWeather(RNG(seed('clima-1')));
    expect(a).toBe(b);
  });

  it('produz as 5 condições documentadas ao longo de muitos seeds (doc 09 §8)', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 500; i += 1) {
      seen.add(rollWeather(RNG(seed(`clima-${i}`))));
    }
    expect(seen.size).toBe(5);
  });
});

describe('calculateWeatherPrecisionModifier (doc 09 §8 + §17, eixo "precisão")', () => {
  it('chuva reduz em exatamente 8%', () => {
    expect(calculateWeatherPrecisionModifier('chuva')).toBe(0.92);
  });
  it('demais condições não têm efeito (1.0)', () => {
    expect(calculateWeatherPrecisionModifier('ensolarado')).toBe(1.0);
    expect(calculateWeatherPrecisionModifier('calor_extremo')).toBe(1.0);
    expect(calculateWeatherPrecisionModifier('frio_intenso')).toBe(1.0);
    expect(calculateWeatherPrecisionModifier('vento_forte')).toBe(1.0);
  });
});

describe('applyColdWeatherToFinishingAttributes (doc 09 §8)', () => {
  it('frio intenso reduz shot_power e dribbling em exatamente 5%', () => {
    const result = applyColdWeatherToFinishingAttributes(80, 60, 'frio_intenso');
    expect(result.shotPower).toBe(76);
    expect(result.dribbling).toBe(57);
  });
  it('não afeta outras condições', () => {
    const result = applyColdWeatherToFinishingAttributes(80, 60, 'ensolarado');
    expect(result.shotPower).toBe(80);
    expect(result.dribbling).toBe(60);
  });
});

describe('calculateWeatherFatigueMultiplier (doc 09 §8: "+25% a partir do minuto 45")', () => {
  it('calor extremo antes do minuto 45 não tem efeito', () => {
    expect(calculateWeatherFatigueMultiplier('calor_extremo', 44)).toBe(1.0);
  });
  it('calor extremo a partir do minuto 45 multiplica por 1.25', () => {
    expect(calculateWeatherFatigueMultiplier('calor_extremo', 45)).toBe(1.25);
    expect(calculateWeatherFatigueMultiplier('calor_extremo', 90)).toBe(1.25);
  });
  it('outras condições nunca têm efeito na fadiga', () => {
    expect(calculateWeatherFatigueMultiplier('chuva', 90)).toBe(1.0);
  });
});

describe('calculateWeatherInjuryChanceBonus (doc 09 §8: "+0.5pp" sob chuva)', () => {
  it('chuva adiciona exatamente 0.005', () => {
    expect(calculateWeatherInjuryChanceBonus('chuva')).toBe(0.005);
  });
  it('demais condições não somam nada', () => {
    expect(calculateWeatherInjuryChanceBonus('ensolarado')).toBe(0);
  });
});
