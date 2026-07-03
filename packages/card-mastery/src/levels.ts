import type { MasteryLevel, MasteryLevelConfig } from './types.js';

export const MASTERY_LEVELS: readonly MasteryLevelConfig[] = [
  {
    level: 0,
    name: 'Bronze',
    xpRequired: 0,
    borderClass: 'border-amber-700',
    glowColor: '#92400e',
    icon: '🥉',
    titleUnlock: null,
    effectUnlock: null,
  },
  {
    level: 1,
    name: 'Prata',
    xpRequired: 50,
    borderClass: 'border-slate-400',
    glowColor: '#94a3b8',
    icon: '🥈',
    titleUnlock: null,
    effectUnlock: 'silver_shimmer',
  },
  {
    level: 2,
    name: 'Ouro',
    xpRequired: 150,
    borderClass: 'border-yellow-400',
    glowColor: '#facc15',
    icon: '🥇',
    titleUnlock: 'Veterano',
    effectUnlock: 'gold_glow',
  },
  {
    level: 3,
    name: 'Platina',
    xpRequired: 350,
    borderClass: 'border-cyan-400',
    glowColor: '#22d3ee',
    icon: '💠',
    titleUnlock: 'Mestre',
    effectUnlock: 'platinum_pulse',
  },
  {
    level: 4,
    name: 'Diamante',
    xpRequired: 750,
    borderClass: 'border-violet-400',
    glowColor: '#a78bfa',
    icon: '💎',
    titleUnlock: 'Elite',
    effectUnlock: 'diamond_aura',
  },
  {
    level: 5,
    name: 'World Class',
    xpRequired: 1500,
    borderClass: 'border-rose-400',
    glowColor: '#fb7185',
    icon: '🌟',
    titleUnlock: 'World Class',
    effectUnlock: 'world_class_radiance',
  },
] as const satisfies readonly MasteryLevelConfig[];

export function getLevelConfig(level: MasteryLevel): MasteryLevelConfig {
  const cfg = MASTERY_LEVELS[level];
  if (!cfg) throw new Error(`Invalid mastery level: ${level}`);
  return cfg;
}

export function getLevelForXp(xp: number): MasteryLevel {
  let result: MasteryLevel = 0;
  for (const cfg of MASTERY_LEVELS) {
    if (xp >= cfg.xpRequired) {
      result = cfg.level;
    } else {
      break;
    }
  }
  return result;
}
