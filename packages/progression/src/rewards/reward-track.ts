/**
 * Trilha de Recompensas — T031 Player Progression.
 *
 * Define as recompensas concedidas ao atingir cada nível.
 * Filosofia de design:
 *   - Níveis baixos (1-20): muitas recompensas pequenas para reter o usuário.
 *   - Níveis médios (20-50): packs melhores e cosméticos exclusivos.
 *   - Níveis altos (50-100): packs premium e cosméticos raros.
 *
 * Tipos de recompensa:
 *   credits   — moeda do jogo (gasta em packs e customizações)
 *   pack      — pacote de cartas (classic / elite / legend)
 *   cosmetic  — item cosmético (avatar frame, card back, efeito de carta)
 */
import type { RewardTrackItem } from '../types/types';

// ─── Tabela de recompensas ────────────────────────────────────────────────────

/**
 * Recompensas por nível (1–100).
 * Níveis sem entrada = sem recompensa especial.
 */
const REWARD_TABLE: ReadonlyArray<RewardTrackItem> = [
  // ── Nível 1: início de jornada ─────────────────────────────────────────────
  { level: 1, type: 'credits', credits: 200, description: 'Bônus de boas-vindas' },
  { level: 1, type: 'pack', packId: 'classic', description: 'Pack de estreia' },

  // ── Níveis 2-9 ─────────────────────────────────────────────────────────────
  { level: 2, type: 'credits', credits: 100, description: 'Recompensa Nível 2' },
  { level: 3, type: 'credits', credits: 100, description: 'Recompensa Nível 3' },
  { level: 4, type: 'credits', credits: 150, description: 'Recompensa Nível 4' },
  { level: 5, type: 'pack', packId: 'classic', description: 'Pack Clássico — Marco 5' },
  { level: 6, type: 'credits', credits: 150, description: 'Recompensa Nível 6' },
  { level: 7, type: 'credits', credits: 200, description: 'Recompensa Nível 7' },
  { level: 8, type: 'credits', credits: 200, description: 'Recompensa Nível 8' },
  { level: 9, type: 'credits', credits: 250, description: 'Recompensa Nível 9' },

  // ── Marco 10 ───────────────────────────────────────────────────────────────
  { level: 10, type: 'pack', packId: 'elite', description: 'Pack Elite — Marco 10' },
  { level: 10, type: 'cosmetic', cosmeticId: 'avatar_frame_bronze', description: 'Avatar Bronze' },

  // ── Níveis 11-19 ──────────────────────────────────────────────────────────
  { level: 11, type: 'credits', credits: 300, description: 'Recompensa Nível 11' },
  { level: 12, type: 'credits', credits: 300, description: 'Recompensa Nível 12' },
  { level: 13, type: 'pack', packId: 'classic', description: 'Pack Clássico — Nível 13' },
  { level: 14, type: 'credits', credits: 350, description: 'Recompensa Nível 14' },
  { level: 15, type: 'credits', credits: 400, description: 'Marco 15 — Recompensa' },
  { level: 15, type: 'pack', packId: 'elite', description: 'Pack Elite — Marco 15' },
  { level: 16, type: 'credits', credits: 350, description: 'Recompensa Nível 16' },
  { level: 17, type: 'credits', credits: 350, description: 'Recompensa Nível 17' },
  { level: 18, type: 'pack', packId: 'classic', description: 'Pack Clássico — Nível 18' },
  { level: 19, type: 'credits', credits: 400, description: 'Recompensa Nível 19' },

  // ── Marco 20 ───────────────────────────────────────────────────────────────
  { level: 20, type: 'pack', packId: 'elite', description: 'Pack Elite — Marco 20' },
  { level: 20, type: 'cosmetic', cosmeticId: 'card_back_silver', description: 'Card Back Prata' },
  { level: 20, type: 'credits', credits: 500, description: 'Bônus Marco 20' },

  // ── Níveis 21-29 ──────────────────────────────────────────────────────────
  { level: 21, type: 'credits', credits: 400, description: 'Recompensa Nível 21' },
  { level: 22, type: 'credits', credits: 400, description: 'Recompensa Nível 22' },
  { level: 23, type: 'pack', packId: 'elite', description: 'Pack Elite — Nível 23' },
  { level: 24, type: 'credits', credits: 450, description: 'Recompensa Nível 24' },
  { level: 25, type: 'credits', credits: 500, description: 'Marco 25' },
  { level: 25, type: 'pack', packId: 'classic', description: 'Pack Clássico — Marco 25' },
  { level: 26, type: 'credits', credits: 450, description: 'Recompensa Nível 26' },
  { level: 27, type: 'credits', credits: 450, description: 'Recompensa Nível 27' },
  { level: 28, type: 'pack', packId: 'elite', description: 'Pack Elite — Nível 28' },
  { level: 29, type: 'credits', credits: 500, description: 'Recompensa Nível 29' },

  // ── Marco 30 ───────────────────────────────────────────────────────────────
  { level: 30, type: 'pack', packId: 'legend', description: 'Pack Lenda — Marco 30 🏆' },
  { level: 30, type: 'cosmetic', cosmeticId: 'avatar_frame_silver', description: 'Avatar Prata' },
  { level: 30, type: 'credits', credits: 600, description: 'Bônus Marco 30' },

  // ── Níveis 31-49 ──────────────────────────────────────────────────────────
  { level: 35, type: 'pack', packId: 'elite', description: 'Pack Elite — Nível 35' },
  { level: 35, type: 'credits', credits: 600, description: 'Marco 35' },
  { level: 40, type: 'pack', packId: 'legend', description: 'Pack Lenda — Marco 40' },
  { level: 40, type: 'cosmetic', cosmeticId: 'card_back_gold', description: 'Card Back Ouro' },
  { level: 40, type: 'credits', credits: 750, description: 'Bônus Marco 40' },
  { level: 45, type: 'pack', packId: 'elite', description: 'Pack Elite — Nível 45' },
  { level: 45, type: 'credits', credits: 750, description: 'Marco 45' },

  // ── Marco 50 ───────────────────────────────────────────────────────────────
  { level: 50, type: 'pack', packId: 'legend', description: 'Pack Lenda — Marco 50 👑' },
  { level: 50, type: 'pack', packId: 'legend', description: 'Pack Lenda Bônus — Marco 50' },
  { level: 50, type: 'cosmetic', cosmeticId: 'avatar_frame_gold', description: 'Avatar Ouro' },
  {
    level: 50,
    type: 'cosmetic',
    cosmeticId: 'card_back_premium',
    description: 'Card Back Premium',
  },
  { level: 50, type: 'credits', credits: 1000, description: 'Bônus Marco 50' },

  // ── Níveis 51-74 ──────────────────────────────────────────────────────────
  { level: 55, type: 'pack', packId: 'legend', description: 'Pack Lenda — Nível 55' },
  { level: 55, type: 'credits', credits: 1000, description: 'Marco 55' },
  { level: 60, type: 'pack', packId: 'legend', description: 'Pack Lenda — Marco 60' },
  {
    level: 60,
    type: 'cosmetic',
    cosmeticId: 'card_effect_glow',
    description: 'Efeito de Carta: Glow',
  },
  { level: 60, type: 'credits', credits: 1200, description: 'Bônus Marco 60' },
  { level: 65, type: 'pack', packId: 'legend', description: 'Pack Lenda — Nível 65' },
  { level: 65, type: 'credits', credits: 1200, description: 'Marco 65' },
  { level: 70, type: 'pack', packId: 'legend', description: 'Pack Lenda — Marco 70' },
  {
    level: 70,
    type: 'cosmetic',
    cosmeticId: 'avatar_frame_diamond',
    description: 'Avatar Diamante',
  },
  { level: 70, type: 'credits', credits: 1500, description: 'Bônus Marco 70' },

  // ── Marco 75 ───────────────────────────────────────────────────────────────
  { level: 75, type: 'pack', packId: 'legend', description: 'Pack Lenda — Marco 75 💎' },
  { level: 75, type: 'pack', packId: 'legend', description: 'Pack Lenda Bônus — Marco 75' },
  {
    level: 75,
    type: 'cosmetic',
    cosmeticId: 'card_effect_fire',
    description: 'Efeito de Carta: Chamas',
  },
  { level: 75, type: 'credits', credits: 2000, description: 'Bônus Marco 75' },

  // ── Níveis 76-99 ──────────────────────────────────────────────────────────
  { level: 80, type: 'pack', packId: 'legend', description: 'Pack Lenda — Marco 80' },
  { level: 80, type: 'credits', credits: 2000, description: 'Marco 80' },
  { level: 85, type: 'pack', packId: 'legend', description: 'Pack Lenda — Nível 85' },
  { level: 85, type: 'credits', credits: 2500, description: 'Marco 85' },
  { level: 90, type: 'pack', packId: 'legend', description: 'Pack Lenda — Marco 90' },
  {
    level: 90,
    type: 'cosmetic',
    cosmeticId: 'card_effect_lightning',
    description: 'Efeito: Relâmpago',
  },
  { level: 90, type: 'credits', credits: 3000, description: 'Bônus Marco 90' },
  { level: 95, type: 'pack', packId: 'legend', description: 'Pack Lenda — Nível 95' },
  { level: 95, type: 'credits', credits: 3000, description: 'Marco 95' },

  // ── Marco 100: Nível Máximo ────────────────────────────────────────────────
  { level: 100, type: 'pack', packId: 'legend', description: 'Pack Lenda × 3 — Nível Máximo 🌟' },
  { level: 100, type: 'pack', packId: 'legend', description: 'Pack Lenda #2 — Nível Máximo' },
  { level: 100, type: 'pack', packId: 'legend', description: 'Pack Lenda #3 — Nível Máximo' },
  { level: 100, type: 'cosmetic', cosmeticId: 'card_effect_goat', description: 'Efeito GOAT ✨' },
  { level: 100, type: 'cosmetic', cosmeticId: 'avatar_frame_goat', description: 'Avatar GOAT' },
  {
    level: 100,
    type: 'cosmetic',
    cosmeticId: 'profile_border_goat',
    description: 'Borda de Perfil GOAT',
  },
  { level: 100, type: 'credits', credits: 5000, description: 'Bônus Final — Nível Máximo' },
];

// ─── Índice por nível ──────────────────────────────────────────────────────────

const REWARD_INDEX: ReadonlyMap<number, readonly RewardTrackItem[]> = (() => {
  const map = new Map<number, RewardTrackItem[]>();
  for (const item of REWARD_TABLE) {
    const arr = map.get(item.level) ?? [];
    arr.push(item);
    map.set(item.level, arr);
  }
  // Congelar arrays
  for (const [k, v] of map) map.set(k, Object.freeze(v) as RewardTrackItem[]);
  return map;
})();

// ─── getRewardsForLevel ───────────────────────────────────────────────────────

/**
 * Retorna as recompensas concedidas ao atingir exatamente o `level`.
 * Retorna array vazio se não há recompensa especial neste nível.
 */
export function getRewardsForLevel(level: number): readonly RewardTrackItem[] {
  return REWARD_INDEX.get(level) ?? Object.freeze([]);
}

/**
 * Retorna todas as recompensas de um intervalo de níveis (inclusivo).
 * Útil quando o usuário sobe vários níveis de uma vez.
 */
export function getRewardsForLevelRange(
  fromLevel: number,
  toLevel: number,
): readonly RewardTrackItem[] {
  const all: RewardTrackItem[] = [];
  for (let lvl = fromLevel; lvl <= toLevel; lvl++) {
    all.push(...getRewardsForLevel(lvl));
  }
  return Object.freeze(all);
}

/** Todos os níveis que possuem recompensas definidas. */
export const REWARD_LEVELS: readonly number[] = Object.freeze(
  [...REWARD_INDEX.keys()].sort((a, b) => a - b),
);

/** Exporta a tabela completa (para documentação/UI). */
export const FULL_REWARD_TRACK: readonly RewardTrackItem[] = Object.freeze(REWARD_TABLE);
