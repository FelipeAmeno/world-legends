/**
 * Tabela de valores de recompensa (T029, doc 11 §5).
 *
 * Fonte de verdade única: toda a lógica de calculateRewards consulta
 * estas constantes. Alterações de balanceamento acontecem AQUI.
 *
 * Estrutura:
 *   BASE_REWARDS   — créditos/XP por resultado (win/draw/loss)
 *   BONUS_REWARDS  — créditos/XP por bônus (clean sheet, hat trick, etc.)
 */

// ─── Base rewards ─────────────────────────────────────────────────────────────

export const BASE_REWARDS = {
  win: { credits: 200, xp: 150 },
  draw: { credits: 100, xp: 80 },
  loss: { credits: 50, xp: 40 },
} as const;

// ─── Bonus rewards ────────────────────────────────────────────────────────────

/** +75c / +50xp por manter o gol zerado. */
export const BONUS_CLEAN_SHEET = { credits: 75, xp: 50 } as const;

/** +100c / +75xp por hat trick de qualquer jogador do squad. */
export const BONUS_HAT_TRICK = { credits: 100, xp: 75 } as const;

/** +150c / +100xp se o MVP da partida pertence ao squad do usuário. */
export const BONUS_MVP = { credits: 150, xp: 100 } as const;

/** +20c / +15xp por gol marcado (acumulativo). */
export const BONUS_GOAL = { credits: 20, xp: 15 } as const;

// ─── Limiar de hat trick ──────────────────────────────────────────────────────

/** Mínimo de gols por jogador em uma partida para contar como hat trick. */
export const HAT_TRICK_THRESHOLD = 3;
