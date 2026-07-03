/**
 * Testes do Player Progression — T031
 * TC-PROG-01..40: XP curve, createProfile, gainXp, levelUp, rewardTrack
 */
import { describe, expect, it } from 'vitest';
import {
  MAX_LEVEL,
  REWARD_LEVELS,
  createProfile,
  currentXpInLevel,
  gainXp,
  getRewardsForLevel,
  getRewardsForLevelRange,
  levelFromTotalXp,
  levelUp,
  rewardTrack,
  totalXpForLevel,
  xpRequiredForNextLevel,
  xpToNextLevel,
} from '../src/index';
import type { UserProfile } from '../src/index';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  const base = createProfile('user-001');
  if (!base.ok) throw new Error('createProfile falhou');
  return Object.freeze({ ...base.value, ...overrides });
}

// ─── TC-PROG-01..08: XP Curve ────────────────────────────────────────────────

describe('TC-PROG-01..08: XP Curve', () => {
  it('TC-PROG-01: xpRequiredForNextLevel(1) = 100', () => {
    expect(xpRequiredForNextLevel(1)).toBe(100);
  });

  it('TC-PROG-02: xpRequiredForNextLevel(n) = n × 100', () => {
    expect(xpRequiredForNextLevel(2)).toBe(200);
    expect(xpRequiredForNextLevel(5)).toBe(500);
    expect(xpRequiredForNextLevel(10)).toBe(1000);
    expect(xpRequiredForNextLevel(50)).toBe(5000);
  });

  it('TC-PROG-03: xpRequiredForNextLevel(MAX_LEVEL) = 0', () => {
    expect(xpRequiredForNextLevel(MAX_LEVEL)).toBe(0);
    expect(xpRequiredForNextLevel(MAX_LEVEL + 5)).toBe(0);
  });

  it('TC-PROG-04: totalXpForLevel(1) = 0', () => {
    expect(totalXpForLevel(1)).toBe(0);
  });

  it('TC-PROG-05: totalXpForLevel(n) = 100 × n × (n-1) / 2', () => {
    expect(totalXpForLevel(2)).toBe(100); // 100×1
    expect(totalXpForLevel(3)).toBe(300); // 100+200
    expect(totalXpForLevel(5)).toBe(1000); // 100+200+300+400
    expect(totalXpForLevel(10)).toBe(4500); // sum(1..9)×100
    expect(totalXpForLevel(100)).toBe(495000); // sum(1..99)×100
  });

  it('TC-PROG-06: levelFromTotalXp — nível correto para XP total', () => {
    expect(levelFromTotalXp(0)).toBe(1);
    expect(levelFromTotalXp(99)).toBe(1);
    expect(levelFromTotalXp(100)).toBe(2);
    expect(levelFromTotalXp(299)).toBe(2);
    expect(levelFromTotalXp(300)).toBe(3);
    expect(levelFromTotalXp(4499)).toBe(9);
    expect(levelFromTotalXp(4500)).toBe(10);
    expect(levelFromTotalXp(495000)).toBe(100);
    expect(levelFromTotalXp(999999)).toBe(MAX_LEVEL);
  });

  it('TC-PROG-07: currentXpInLevel retorna XP dentro do nível atual', () => {
    expect(currentXpInLevel(0)).toBe(0); // nível 1, 0 XP no nível
    expect(currentXpInLevel(50)).toBe(50); // nível 1, 50 XP no nível
    expect(currentXpInLevel(100)).toBe(0); // acabou de subir para nível 2
    expect(currentXpInLevel(150)).toBe(50); // nível 2, 50 XP
  });

  it('TC-PROG-08: xpToNextLevel é 0 no nível máximo', () => {
    expect(xpToNextLevel(totalXpForLevel(MAX_LEVEL))).toBe(0);
    expect(xpToNextLevel(999999)).toBe(0);
  });

  it('TC-PROG-08b: xpToNextLevel é coerente com curva', () => {
    // Para nível 1 com 0 XP: falta 100 XP para nível 2
    expect(xpToNextLevel(0)).toBe(100);
    // Para nível 1 com 40 XP: falta 60 XP para nível 2
    expect(xpToNextLevel(40)).toBe(60);
    // Para nível 2 com 0 XP no nível (total=100): falta 200 XP
    expect(xpToNextLevel(100)).toBe(200);
  });
});

// ─── TC-PROG-09..12: createProfile ───────────────────────────────────────────

describe('TC-PROG-09..12: createProfile', () => {
  it('TC-PROG-09: cria perfil no nível 1 com XP zero', () => {
    const r = createProfile('user-test');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.level).toBe(1);
    expect(r.value.currentXp).toBe(0);
    expect(r.value.totalXpEarned).toBe(0);
    expect(r.value.userId).toBe('user-test');
  });

  it('TC-PROG-10: createProfile com userId vazio → erro', () => {
    expect(createProfile('').ok).toBe(false);
    expect(createProfile('   ').ok).toBe(false);
  });

  it('TC-PROG-11: createProfile retorna Date válida', () => {
    const r = createProfile('user-test');
    if (!r.ok) return;
    expect(r.value.createdAt).toBeInstanceOf(Date);
    expect(r.value.updatedAt).toBeInstanceOf(Date);
  });

  it('TC-PROG-12: UserProfile é imutável (frozen)', () => {
    const r = createProfile('user-test');
    if (!r.ok) return;
    // Tentativa de mutação não deve funcionar em strict mode
    expect(() => {
      (r.value as any).level = 99;
    }).toThrow();
  });
});

// ─── TC-PROG-13..20: gainXp ──────────────────────────────────────────────────

describe('TC-PROG-13..20: gainXp', () => {
  it('TC-PROG-13: ganhar 50 XP sem level-up', () => {
    const r = gainXp(makeProfile(), 50);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.profile.level).toBe(1);
    expect(r.value.profile.currentXp).toBe(50);
    expect(r.value.profile.totalXpEarned).toBe(50);
    expect(r.value.xpGained).toBe(50);
    expect(r.value.levelsGained).toBe(0);
    expect(r.value.levelUpEvents).toHaveLength(0);
  });

  it('TC-PROG-14: ganhar exatamente o XP de 1 nível → sobe para 2', () => {
    const r = gainXp(makeProfile(), 100);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.profile.level).toBe(2);
    expect(r.value.profile.currentXp).toBe(0);
    expect(r.value.levelsGained).toBe(1);
    expect(r.value.levelUpEvents).toHaveLength(1);
    expect(r.value.levelUpEvents[0]!.fromLevel).toBe(1);
    expect(r.value.levelUpEvents[0]!.toLevel).toBe(2);
  });

  it('TC-PROG-15: XP excedente fica no nível seguinte', () => {
    const r = gainXp(makeProfile(), 150); // 100 para subir + 50 no nível 2
    if (!r.ok) return;
    expect(r.value.profile.level).toBe(2);
    expect(r.value.profile.currentXp).toBe(50);
  });

  it('TC-PROG-16: multi-level-up em uma operação', () => {
    // Nível 1→2→3→4: precisa 100+200+300 = 600 XP
    const r = gainXp(makeProfile(), 600);
    if (!r.ok) return;
    expect(r.value.profile.level).toBe(4);
    expect(r.value.levelsGained).toBe(3);
    expect(r.value.levelUpEvents).toHaveLength(3);
  });

  it('TC-PROG-17: ganhar XP muito grande → salta até nível máximo', () => {
    // XP para nível 100 = 495.000
    const r = gainXp(makeProfile(), 999_999);
    if (!r.ok) return;
    expect(r.value.profile.level).toBe(MAX_LEVEL);
    expect(r.value.levelsGained).toBe(MAX_LEVEL - 1);
  });

  it('TC-PROG-18: XP zero ou negativo → erro InvalidXpAmount', () => {
    expect(gainXp(makeProfile(), 0).ok).toBe(false);
    expect(gainXp(makeProfile(), -10).ok).toBe(false);
    const err = gainXp(makeProfile(), 0);
    if (err.ok) return;
    expect(err.error).toMatchObject({ kind: 'InvalidXpAmount' });
  });

  it('TC-PROG-19: perfil no nível máximo → wasAlreadyMaxLevel=true', () => {
    const maxProfile = makeProfile({ level: MAX_LEVEL, currentXp: 0 });
    const r = gainXp(maxProfile, 1000);
    if (!r.ok) return;
    expect(r.value.wasAlreadyMaxLevel).toBe(true);
    expect(r.value.xpGained).toBe(0);
    expect(r.value.profile.level).toBe(MAX_LEVEL);
    expect(r.value.profile.totalXpEarned).toBe(0); // não alterado
  });

  it('TC-PROG-20: totalXpEarned acumula corretamente em múltiplas operações', () => {
    let profile = makeProfile();
    const r1 = gainXp(profile, 50);
    if (!r1.ok) return;
    profile = r1.value.profile;
    const r2 = gainXp(profile, 80);
    if (!r2.ok) return;
    expect(r2.value.profile.totalXpEarned).toBe(130);
  });

  it('TC-PROG-20b: XP fracionário é arredondado para baixo', () => {
    const r = gainXp(makeProfile(), 99.9);
    if (!r.ok) return;
    expect(r.value.xpGained).toBe(99);
    expect(r.value.profile.currentXp).toBe(99);
  });
});

// ─── TC-PROG-21..26: levelUp ─────────────────────────────────────────────────

describe('TC-PROG-21..26: levelUp', () => {
  it('TC-PROG-21: perfil com XP < necessário → null (sem level-up)', () => {
    const p = makeProfile({ level: 1, currentXp: 99 }); // precisa 100
    expect(levelUp(p)).toBeNull();
  });

  it('TC-PROG-22: perfil com XP = necessário → sobe de nível', () => {
    const p = makeProfile({ level: 1, currentXp: 100 });
    const result = levelUp(p);
    expect(result).not.toBeNull();
    expect(result!.updatedProfile.level).toBe(2);
    expect(result!.updatedProfile.currentXp).toBe(0);
  });

  it('TC-PROG-23: perfil com XP > necessário → sobe e mantém excedente', () => {
    const p = makeProfile({ level: 2, currentXp: 250 }); // precisa 200
    const result = levelUp(p);
    expect(result!.updatedProfile.level).toBe(3);
    expect(result!.updatedProfile.currentXp).toBe(50);
  });

  it('TC-PROG-24: perfil no MAX_LEVEL → null (sem level-up)', () => {
    const p = makeProfile({ level: MAX_LEVEL, currentXp: 99999 });
    expect(levelUp(p)).toBeNull();
  });

  it('TC-PROG-25: evento de level-up tem fromLevel/toLevel corretos', () => {
    const p = makeProfile({ level: 5, currentXp: 500 }); // precisa 500
    const result = levelUp(p);
    expect(result!.event.fromLevel).toBe(5);
    expect(result!.event.toLevel).toBe(6);
  });

  it('TC-PROG-26: evento inclui recompensas do nível alcançado', () => {
    // Nível 5 tem Pack Clássico
    const p = makeProfile({ level: 4, currentXp: 400 }); // precisa 400 para nível 5
    const result = levelUp(p);
    expect(result).not.toBeNull();
    const rewardTypes = result!.event.rewards.map((r) => r.type);
    expect(rewardTypes).toContain('pack');
  });
});

// ─── TC-PROG-27..34: rewardTrack ─────────────────────────────────────────────

describe('TC-PROG-27..34: rewardTrack e getRewardsForLevel', () => {
  it('TC-PROG-27: nível 1 tem créditos e pack de boas-vindas', () => {
    const rewards = rewardTrack(1);
    expect(rewards.some((r) => r.type === 'credits')).toBe(true);
    expect(rewards.some((r) => r.type === 'pack')).toBe(true);
  });

  it('TC-PROG-28: nível 10 tem Pack Elite', () => {
    const rewards = rewardTrack(10);
    const pack = rewards.find((r) => r.type === 'pack');
    expect(pack?.packId).toBe('elite');
  });

  it('TC-PROG-29: nível 10 tem cosmético (avatar_frame_bronze)', () => {
    const rewards = rewardTrack(10);
    const cos = rewards.find((r) => r.type === 'cosmetic');
    expect(cos?.cosmeticId).toBe('avatar_frame_bronze');
  });

  it('TC-PROG-30: nível 30 tem Pack Lenda', () => {
    const rewards = rewardTrack(30);
    const pack = rewards.find((r) => r.type === 'pack' && r.packId === 'legend');
    expect(pack).toBeDefined();
  });

  it('TC-PROG-31: nível 50 tem 2 Legend Packs + 2 cosméticos', () => {
    const rewards = rewardTrack(50);
    const packs = rewards.filter((r) => r.type === 'pack');
    const cosmetics = rewards.filter((r) => r.type === 'cosmetic');
    expect(packs).toHaveLength(2);
    expect(cosmetics).toHaveLength(2);
  });

  it('TC-PROG-32: nível 100 tem 3 Legend Packs + 3 cosméticos + 5000 créditos', () => {
    const rewards = rewardTrack(100);
    const packs = rewards.filter((r) => r.type === 'pack');
    const cosmetics = rewards.filter((r) => r.type === 'cosmetic');
    const credits = rewards.filter((r) => r.type === 'credits');
    expect(packs).toHaveLength(3);
    expect(cosmetics).toHaveLength(3);
    expect(credits[0]?.credits).toBe(5000);
  });

  it('TC-PROG-33: nível sem recompensa → array vazio', () => {
    // Nível 99 não tem recompensa definida
    const rewards = rewardTrack(99);
    expect(rewards).toHaveLength(0);
  });

  it('TC-PROG-34: getRewardsForLevelRange 1..5 inclui recompensas de nível 1 e 5', () => {
    const range = getRewardsForLevelRange(1, 5);
    const levels = [...new Set(range.map((r) => r.level))];
    expect(levels).toContain(1);
    expect(levels).toContain(5);
    // Não deve incluir nível 6
    expect(range.some((r) => r.level > 5)).toBe(false);
  });
});

// ─── TC-PROG-35..40: integração ───────────────────────────────────────────────

describe('TC-PROG-35..40: Integração', () => {
  it('TC-PROG-35: gainXp coleta recompensas de todos os níveis subidos', () => {
    // Subir nível 1→2→3→4→5 em uma operação
    // Nível 5 tem Pack Clássico
    const xpNeeded = totalXpForLevel(5); // 1000 XP
    const r = gainXp(makeProfile(), xpNeeded);
    if (!r.ok) return;
    expect(r.value.profile.level).toBe(5);
    expect(r.value.rewardsUnlocked.some((r) => r.type === 'pack')).toBe(true);
    // Recompensas de níveis 2,3,4,5 incluídas
    const levels = [...new Set(r.value.rewardsUnlocked.map((r) => r.level))];
    expect(levels).toContain(5);
  });

  it('TC-PROG-36: subir até nível 10 em uma operação → 10 level-up events', () => {
    const xpNeeded = totalXpForLevel(10); // 4500
    const r = gainXp(makeProfile(), xpNeeded);
    if (!r.ok) return;
    expect(r.value.profile.level).toBe(10);
    expect(r.value.levelsGained).toBe(9);
    expect(r.value.levelUpEvents).toHaveLength(9);
    // Deve incluir Pack Elite (nível 10)
    const eliteReward = r.value.rewardsUnlocked.find(
      (r) => r.type === 'pack' && r.packId === 'elite',
    );
    expect(eliteReward).toBeDefined();
  });

  it('TC-PROG-37: progresso incremental é idêntico ao salto único', () => {
    // Caminho incremental: 3 operações
    let profileIncremental = makeProfile();
    const steps = [100, 200, 300]; // sobe até nível 4
    for (const xp of steps) {
      const r = gainXp(profileIncremental, xp);
      if (!r.ok) return;
      profileIncremental = r.value.profile;
    }

    // Salto único: 600 XP de uma vez
    const r = gainXp(makeProfile(), 600);
    if (!r.ok) return;

    expect(profileIncremental.level).toBe(r.value.profile.level);
    expect(profileIncremental.totalXpEarned).toBe(r.value.profile.totalXpEarned);
  });

  it('TC-PROG-38: REWARD_LEVELS contém todos os níveis com recompensa', () => {
    expect(REWARD_LEVELS).toContain(1);
    expect(REWARD_LEVELS).toContain(10);
    expect(REWARD_LEVELS).toContain(50);
    expect(REWARD_LEVELS).toContain(100);
    // Nível 99 não tem recompensa
    expect(REWARD_LEVELS).not.toContain(99);
  });

  it('TC-PROG-39: todos os RewardTrackItems têm level, type e description', () => {
    const rewards = getRewardsForLevelRange(1, 100);
    for (const r of rewards) {
      expect(r.level).toBeGreaterThanOrEqual(1);
      expect(r.level).toBeLessThanOrEqual(100);
      expect(['credits', 'pack', 'cosmetic']).toContain(r.type);
      expect(r.description).toBeTruthy();
      // Consistência por tipo
      if (r.type === 'credits') expect(r.credits).toBeGreaterThan(0);
      if (r.type === 'pack') expect(r.packId).toBeTruthy();
      if (r.type === 'cosmetic') expect(r.cosmeticId).toBeTruthy();
    }
  });

  it('TC-PROG-40: progressão de 1→100 tem créditos totais > 20.000', () => {
    // Verificar que a trilha completa oferece recompensas generosas
    const allRewards = getRewardsForLevelRange(1, 100);
    const totalCredits = allRewards
      .filter((r) => r.type === 'credits')
      .reduce((sum, r) => sum + (r.credits ?? 0), 0);
    expect(totalCredits).toBeGreaterThan(20_000);
  });
});
