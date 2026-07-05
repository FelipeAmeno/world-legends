/**
 * lib/rewards-data.ts — T056
 *
 * Tipos e utilitários da tela de recompensas.
 * Agnóstico de fonte (match, pack, evento, etc.).
 */

import type { CollectionCard } from './collection-data';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type BonusItem = {
  label: string;
  icon: string;
  credits?: number;
  xp?: number;
};

export type PackReward = {
  id: string;
  name: string;
  icon: string;
  count: number;
  color: string; // glow color
};

export type RewardData = {
  // Contexto
  source: 'match' | 'pack' | 'daily' | 'event' | 'achievement';
  title: string;

  // Estado anterior
  prevLevel: number;
  prevXp: number;
  prevXpForNext: number;
  prevCredits: number;

  // Ganhos brutos
  xpGained: number;
  creditsGained: number;
  bonuses: BonusItem[];
  packs: PackReward[];
  newCards: CollectionCard[];

  // Estado final (após level-ups)
  newLevel: number;
  newXp: number;
  newXpForNext: number;
  newCredits: number;
  leveledUp: boolean;
  levelsGained: number; // pode subir mais de um nível
};

// ─── Calcular nível após XP ganho ────────────────────────────────────────────

export function xpForLevel(level: number): number {
  return level * 100 + Math.floor(level * level * 5);
}

export function applyXp(
  currentLevel: number,
  currentXp: number,
  xpGained: number,
): { level: number; xp: number; xpForNext: number; leveledUp: boolean; levelsGained: number } {
  let level = currentLevel;
  let xp = currentXp + xpGained;
  let levelsGained = 0;

  let xpForNext = xpForLevel(level + 1);

  while (xp >= xpForNext) {
    xp -= xpForNext;
    level++;
    levelsGained++;
    xpForNext = xpForLevel(level + 1);
  }

  return { level, xp, xpForNext, leveledUp: levelsGained > 0, levelsGained };
}

// ─── Demo reward (match win) ──────────────────────────────────────────────────

export function buildDemoReward(): RewardData {
  const prevLevel = 12;
  const prevXp = 840;
  const prevXpForNext = 1300;
  const prevCredits = 4250;
  const xpGained = 220;
  const creditsGained = 320;

  const after = applyXp(prevLevel, prevXp, xpGained);

  return {
    source: 'match',
    title: 'Vitória!',
    prevLevel,
    prevXp,
    prevXpForNext,
    prevCredits,
    xpGained,
    creditsGained,
    bonuses: [
      { label: 'Vitória', icon: '🏆', credits: 200, xp: 150 },
      { label: 'Jogo limpo', icon: '⚖️', credits: 25, xp: 20 },
      { label: '3 gols', icon: '⚽', credits: 45, xp: 30 },
      { label: 'Domínio total', icon: '🎮', credits: 50, xp: 20 },
    ],
    packs: [],
    newCards: [],
    newLevel: after.level,
    newXp: after.xp,
    newXpForNext: after.xpForNext,
    newCredits: prevCredits + creditsGained,
    leveledUp: after.leveledUp,
    levelsGained: after.levelsGained,
  };
}

/** Demo com level-up para demonstrar a tela completa */
export function buildLevelUpDemo(): RewardData {
  const prevLevel = 12;
  const prevXp = 1100;
  const prevXpForNext = 1300;
  const prevCredits = 4250;
  const xpGained = 550;
  const creditsGained = 450;

  const after = applyXp(prevLevel, prevXp, xpGained);

  return {
    source: 'match',
    title: 'Partida incrível!',
    prevLevel,
    prevXp,
    prevXpForNext,
    prevCredits,
    xpGained,
    creditsGained,
    bonuses: [
      { label: 'Vitória por 4+', icon: '🏆', credits: 250, xp: 180 },
      { label: 'Sem levar gols', icon: '🧤', credits: 100, xp: 80 },
      { label: '5 gols marcados', icon: '⚽', credits: 75, xp: 50 },
      { label: 'MVP Ronaldo', icon: '⭐', credits: 100, xp: 60 },
    ],
    packs: [
      { id: 'classic', name: 'Classic Pack', icon: '📦', count: 1, color: 'rgba(147,51,234,0.6)' },
    ],
    newCards: [],
    newLevel: after.level,
    newXp: after.xp,
    newXpForNext: after.xpForNext,
    newCredits: prevCredits + creditsGained,
    leveledUp: after.leveledUp,
    levelsGained: after.levelsGained,
  };
}
