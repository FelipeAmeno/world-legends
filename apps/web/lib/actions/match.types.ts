import type { MatchDisplay, MatchOpponent } from '@/lib/match-data';
/**
 * Tipos do fluxo de Match — separados de match.ts porque um arquivo
 * 'use server' só pode exportar funções async (Next.js/Turbopack).
 *
 * Sprint 26 (Gameplay Foundation) — o fluxo síncrono de ponta a ponta
 * (`playMatchAction`) virou 4 ações menores pra sustentar o intervalo
 * jogável: `startMatchAction` roda só o 1º tempo e pausa; `applySub/
 * TacticAction` alteram o estado pausado (puro, sem persistência);
 * `continueMatchAction` roda o resto e só aí credita recompensas/
 * persiste/atualiza missões — exatamente como `playMatchAction` fazia
 * antes, só que depois da decisão do usuário no intervalo em vez de antes.
 */
import type { HalftimeDisplay } from '@/lib/match-session';
import type { MatchProgressState } from '@world-legends/engine';

export type PlayMatchResult =
  | {
      ok: true;
      display: MatchDisplay;
      opponent: MatchOpponent;
      matchId: string;
      newBalance: number;
    }
  | { ok: false; error: string };

/** Código estruturado — Prioridade 0: bloquear e mandar montar time quando não há squad válido. */
export type SquadBlockCode = 'NO_SQUAD' | 'INVALID_SQUAD';

export type StartMatchResult =
  | Readonly<{
      ok: true;
      kind: 'halftime';
      state: MatchProgressState;
      halftime: HalftimeDisplay;
      opponent: MatchOpponent;
    }>
  | Readonly<{ ok: true; kind: 'finished'; result: PlayMatchResult }>
  | Readonly<{ ok: false; code: SquadBlockCode | 'AUTH'; error: string; errors?: string[] }>;

export type HalftimeActionResult =
  | Readonly<{ ok: true; state: MatchProgressState; halftime: HalftimeDisplay }>
  | Readonly<{ ok: false; error: string }>;
