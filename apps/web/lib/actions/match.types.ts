/**
 * Tipos do fluxo de Match — separados de match.ts porque um arquivo
 * 'use server' só pode exportar funções async (Next.js/Turbopack).
 */
import type { MatchDisplay, MatchOpponent } from '@/lib/match-data';

export type PlayMatchResult =
  | {
      ok: true;
      display: MatchDisplay;
      opponent: MatchOpponent;
      matchId: string;
      newBalance: number;
    }
  | { ok: false; error: string };
