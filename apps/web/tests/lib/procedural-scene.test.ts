import {
  candidatePoses,
  positionToPoseCategory,
  resolvePose,
} from '@/lib/pose-engine/poseResolver';
import { generateProceduralScene } from '@/lib/procedural-scene/SceneGenerator';
import { computeProceduralSeed, createRng } from '@/lib/procedural-scene/seed';
import { describe, expect, it } from 'vitest';

/**
 * Sprint 27/28 — a garantia central do brief é determinismo: "a mesma
 * carta sempre terá a mesma Scene" / pose. Estes testes provam
 * exatamente isso (mesmo input → mesmo output, byte a byte) e que
 * inputs diferentes de fato produzem cenas diferentes (senão o "seed"
 * seria decorativo).
 */

describe('generateProceduralScene (Sprint 27 — determinismo)', () => {
  it('a mesma carta sempre gera exatamente a mesma cena', () => {
    const input = {
      playerId: 'pele',
      nationality: 'BR',
      rarityCode: 'legendary' as const,
      position: 'ST' as const,
    };
    const a = generateProceduralScene(input);
    const b = generateProceduralScene(input);
    expect(a).toEqual(b);
  });

  it('cartas diferentes (playerId diferente) geram cenas diferentes', () => {
    const base = { nationality: 'BR', rarityCode: 'legendary' as const, position: 'ST' as const };
    const a = generateProceduralScene({ ...base, playerId: 'pele' });
    const b = generateProceduralScene({ ...base, playerId: 'ronaldo' });
    expect(a.seed).not.toBe(b.seed);
    expect(a.background.glowCenterYPercent).not.toBe(b.background.glowCenterYPercent);
  });

  it('o país influencia o Background e o Country Pattern com os dados reais de lib/kit-data.ts', () => {
    const scene = generateProceduralScene({
      playerId: 'maradona',
      nationality: 'AR',
      rarityCode: 'elite',
      position: 'CAM' as const,
    });
    // Argentina tem padrão "stripes" real em kit-data.ts.
    expect(scene.countryPattern.kind).toBe('stripes');
    expect(scene.background.stadiumName).toBe('El Monumental');
  });

  it('raridade mais alta aumenta a contagem de partículas e de raios de luz', () => {
    const common = generateProceduralScene({
      playerId: 'x',
      nationality: 'BR',
      rarityCode: 'common',
      position: 'ST' as const,
    });
    const goat = generateProceduralScene({
      playerId: 'x',
      nationality: 'BR',
      rarityCode: 'world_cup_hero',
      position: 'ST' as const,
    });
    expect(goat.particles.particles.length).toBeGreaterThan(common.particles.particles.length);
    expect(goat.lighting.rayCount).toBeGreaterThan(common.lighting.rayCount);
  });
});

describe('seed determinístico — computeProceduralSeed/createRng', () => {
  it('mesmo input produz o mesmo seed e o mesmo Rng gera a mesma sequência', () => {
    const input = { playerId: 'a', nationality: 'BR', rarityCode: 'rare' as const, position: 'CM' };
    const seedA = computeProceduralSeed(input);
    const seedB = computeProceduralSeed(input);
    expect(seedA).toBe(seedB);

    const rngA = createRng(seedA);
    const rngB = createRng(seedB);
    const sequenceA = Array.from({ length: 5 }, () => rngA());
    const sequenceB = Array.from({ length: 5 }, () => rngB());
    expect(sequenceA).toEqual(sequenceB);
  });

  it('inputs diferentes produzem seeds diferentes (nenhuma colisão óbvia entre campos trocados)', () => {
    const a = computeProceduralSeed({
      playerId: 'pele',
      nationality: 'BR',
      rarityCode: 'common',
      position: 'ST',
    });
    const b = computeProceduralSeed({
      playerId: 'ronaldo',
      nationality: 'BR',
      rarityCode: 'common',
      position: 'ST',
    });
    const c = computeProceduralSeed({
      playerId: 'pele',
      nationality: 'AR',
      rarityCode: 'common',
      position: 'ST',
    });
    expect(a).not.toBe(b);
    expect(a).not.toBe(c);
  });
});

describe('Pose Engine (Sprint 28)', () => {
  it('mapeia cada posição real pra exatamente uma categoria de pose', () => {
    expect(positionToPoseCategory('GK')).toBe('goalkeeper');
    expect(positionToPoseCategory('CB')).toBe('defender');
    expect(positionToPoseCategory('CDM')).toBe('defender');
    expect(positionToPoseCategory('CM')).toBe('midfielder');
    expect(positionToPoseCategory('CAM')).toBe('midfielder');
    expect(positionToPoseCategory('ST')).toBe('attacker');
    expect(positionToPoseCategory('LW')).toBe('attacker');
  });

  it('poses espetaculares (bicicleta) só aparecem pra raridade Legendary+', () => {
    const commonCandidates = candidatePoses('ST', 'common');
    const legendaryCandidates = candidatePoses('ST', 'legendary');
    expect(commonCandidates.some((p) => p.id === 'atk-bicicleta')).toBe(false);
    expect(legendaryCandidates.some((p) => p.id === 'atk-bicicleta')).toBe(true);
  });

  it('resolvePose é determinístico — mesmo Rng (mesmo seed) sempre resolve a mesma pose', () => {
    const rngA = createRng(777);
    const rngB = createRng(777);
    const poseA = resolvePose('ST', 'legendary', rngA);
    const poseB = resolvePose('ST', 'legendary', rngB);
    expect(poseA.id).toBe(poseB.id);
  });

  it('todas as posições sempre resolvem pra alguma pose (nunca lança erro)', () => {
    const positions = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST'] as const;
    for (const position of positions) {
      const rng = createRng(
        computeProceduralSeed({
          playerId: position,
          nationality: 'BR',
          rarityCode: 'common',
          position,
        }),
      );
      expect(() => resolvePose(position, 'common', rng)).not.toThrow();
    }
  });
});
