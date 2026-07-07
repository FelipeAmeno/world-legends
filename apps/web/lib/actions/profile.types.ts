/**
 * Tipos do fluxo de Profile — separados de profile.ts porque um arquivo
 * 'use server' só pode exportar funções async (Next.js/Turbopack).
 */
export type ClaimStarterResult = { ok: true; cardIds: string[] } | { ok: false; error: string };

export type UpdateProfileResult = { ok: true } | { ok: false; error: string };
