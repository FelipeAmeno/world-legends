'use client';

/**
 * lib/sync/useAutoSave.ts — T062
 *
 * Hook principal do Cloud Save.
 *
 * Conecta o GameContext ao SyncEngine:
 *   - Observa mudanças no estado do jogo
 *   - Enfileira mudanças automaticamente no SyncEngine
 *   - Gerencia o userId (auth context)
 *   - Expõe funções de enqueue tipadas para uso nos componentes
 *
 * Sem botão salvar. Sem intervenção do usuário.
 */

import { useAuth } from '@/lib/auth-context';
import { useCallback, useEffect, useRef } from 'react';
import { getSyncEngine } from './SyncEngine';
import type {
  AchievementPayload,
  MatchPayload,
  PackPayload,
  SquadPayload,
  UserProgressPayload,
} from './types';

// ─── Hook principal ───────────────────────────────────────────────────────────

/**
 * Inicializa o SyncEngine com o usuário atual.
 * Deve ser chamado UMA VEZ no topo da árvore de componentes
 * (ex: dentro do AppShell ou do GameProvider).
 */
export function useAutoSave() {
  const { user } = useAuth();
  const engine = getSyncEngine();
  const prevUser = useRef<string | null>(null);

  // Sincronizar userId com o engine
  useEffect(() => {
    const userId = user?.id ?? null;
    if (userId !== prevUser.current) {
      engine.setUser(userId);
      prevUser.current = userId;
    }
  }, [user, engine]);

  // Registrar listener de beforeunload para flush forçado
  useEffect(() => {
    const handler = () => engine.forceFlush();
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') engine.forceFlush();
    });
    return () => window.removeEventListener('visibilitychange', handler);
  }, [engine]);

  return { engine };
}

// ─── Hooks de enqueue tipados ────────────────────────────────────────────────

/**
 * Hook para salvar progresso do usuário (XP, créditos, level).
 * Chamado automaticamente quando o GameContext atualiza.
 *
 * Uso:
 *   const { saveUserProgress } = useSaveUserProgress()
 *   saveUserProgress({ level, current_xp, xp_for_next, credits, fragments })
 */
export function useSaveUserProgress() {
  const engine = getSyncEngine();

  const saveUserProgress = useCallback(
    (payload: UserProgressPayload) => {
      engine.enqueue('user_progress', payload);
    },
    [engine],
  );

  return { saveUserProgress };
}

/**
 * Hook para salvar resultado de partida.
 */
export function useSaveMatchResult() {
  const engine = getSyncEngine();

  const saveMatchResult = useCallback(
    (payload: MatchPayload) => {
      // 1. Registrar partida
      engine.enqueue('match_result', payload);
      // 2. Atualizar stats do usuário
      engine.enqueue('user_stats', { outcome: payload.outcome });
    },
    [engine],
  );

  return { saveMatchResult };
}

/**
 * Hook para salvar abertura de pack.
 */
export function useSavePackOpening() {
  const engine = getSyncEngine();

  const savePackOpening = useCallback(
    (payload: PackPayload) => {
      engine.enqueue('pack_opening', payload);
    },
    [engine],
  );

  return { savePackOpening };
}

/**
 * Hook para salvar squad (debounced pelo engine).
 */
export function useSaveSquad() {
  const engine = getSyncEngine();

  const saveSquad = useCallback(
    (payload: SquadPayload) => {
      engine.enqueue('squad', payload);
    },
    [engine],
  );

  return { saveSquad };
}

/**
 * Hook para reivindicar conquista/missão.
 */
export function useSaveAchievement() {
  const engine = getSyncEngine();

  const saveAchievement = useCallback(
    (achievementId: string, stage: number) => {
      const payload: AchievementPayload = { achievementId, stage };
      engine.enqueue('achievement', payload);
    },
    [engine],
  );

  return { saveAchievement };
}

// ─── Auto-sync de estado (watchers) ──────────────────────────────────────────

/**
 * Observa um valor e o salva automaticamente quando muda.
 *
 * Uso:
 *   useSyncOnChange(
 *     { level, currentXp, credits },
 *     (v) => saveUserProgress(v),
 *     500  // debounce adicional
 *   )
 */
export function useSyncOnChange<T>(value: T, onSave: (value: T) => void, debounce = 0): void {
  const isFirstRender = useRef(true);
  const savedValue = useRef(value);
  const timer = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    // Ignorar render inicial
    if (isFirstRender.current) {
      isFirstRender.current = false;
      savedValue.current = value;
      return;
    }

    // Ignorar se valor não mudou (shallow)
    if (JSON.stringify(value) === JSON.stringify(savedValue.current)) return;
    savedValue.current = value;

    if (debounce > 0) {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => onSave(value), debounce);
    } else {
      onSave(value);
    }
  }, [value, onSave, debounce]);
}
