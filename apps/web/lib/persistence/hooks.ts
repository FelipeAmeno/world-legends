'use client';

/**
 * apps/web/lib/persistence/hooks.ts — T061
 *
 * Hooks React para sincronização do estado do jogo com o banco de dados.
 *
 * useUserSync     → sincroniza user ao fazer login
 * useCollection   → carrega/persiste coleção de cartas
 * usePersistence  → provider + utilitários centralizados
 *
 * Todos operam em modo otimista:
 *   1. Atualiza UI imediatamente (estado local)
 *   2. Persiste em background (fire-and-forget)
 *   3. Erro → loga, não bloqueia
 */

import { useAuth } from '@/lib/auth-context';
import type { UserRecord } from '@world-legends/persistence';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  type MatchResult,
  type PackOpenResult,
  type SquadState,
  loadAchievementSummary,
  loadOrCreateUser,
  persistAchievementClaim,
  persistMatchResult,
  persistPackOpening,
  persistReward,
  persistSquad,
} from './bridge';

// ─── useUserSync ──────────────────────────────────────────────────────────────

/**
 * Carrega o perfil do usuário do banco quando faz login.
 * Retorna { dbUser, loading, error }.
 */
export function useUserSync() {
  const { user } = useAuth();
  const [dbUser, setDbUser] = useState<UserRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const syncedId = useRef<string>('');

  useEffect(() => {
    if (!user || syncedId.current === user.id) return;

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const username = user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'Jogador';

        const profile = await loadOrCreateUser(user.id, username);
        setDbUser(profile);
        syncedId.current = user.id;
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [user]);

  // Reset ao deslogar
  useEffect(() => {
    if (!user) {
      setDbUser(null);
      syncedId.current = '';
    }
  }, [user]);

  return { dbUser, loading, error };
}

// ─── useMatchPersist ──────────────────────────────────────────────────────────

/**
 * Hook para persistir resultado de partida.
 * Retorna a função persistMatch().
 */
export function useMatchPersist() {
  const { user } = useAuth();

  const persistMatch = useCallback(
    async (result: MatchResult) => {
      if (!user) return;
      await persistMatchResult(user.id, result);
    },
    [user],
  );

  return { persistMatch };
}

// ─── usePackPersist ───────────────────────────────────────────────────────────

/**
 * Hook para persistir abertura de pack.
 */
export function usePackPersist() {
  const { user } = useAuth();

  const persistPack = useCallback(
    async (result: PackOpenResult) => {
      if (!user) return;
      await persistPackOpening(user.id, result);
    },
    [user],
  );

  return { persistPack };
}

// ─── useSquadPersist ──────────────────────────────────────────────────────────

/**
 * Hook para persistir squad com debounce (evitar saves excessivos).
 */
export function useSquadPersist() {
  const { user } = useAuth();
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const saveSquad = useCallback(
    (squad: SquadState) => {
      if (!user) return;
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        await persistSquad(user.id, squad);
      }, 2000); // debounce 2s
    },
    [user],
  );

  return { saveSquad };
}

// ─── useAchievementPersist ───────────────────────────────────────────────────

/**
 * Hook para registrar claims de conquistas + carregamento do sumário.
 */
export function useAchievementPersist() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [loadingSummary, setLoadingSummary] = useState(false);

  // Carregar sumário ao fazer login
  useEffect(() => {
    if (!user) {
      setSummary({});
      return;
    }
    setLoadingSummary(true);
    loadAchievementSummary(user.id)
      .then(setSummary)
      .finally(() => setLoadingSummary(false));
  }, [user]);

  const claimAchievement = useCallback(
    async (achievementId: string, stage: number) => {
      if (!user) return;
      await persistAchievementClaim(user.id, achievementId, stage);
      setSummary((prev) => ({
        ...prev,
        [achievementId]: Math.max(prev[achievementId] ?? 0, stage),
      }));
    },
    [user],
  );

  return { summary, loadingSummary, claimAchievement };
}

// ─── useRewardPersist ────────────────────────────────────────────────────────

/**
 * Hook para persistir recompensas de XP + créditos.
 */
export function useRewardPersist() {
  const { user } = useAuth();

  const addReward = useCallback(
    async (credits: number, xp: number) => {
      if (!user) return;
      await persistReward(user.id, credits, xp);
    },
    [user],
  );

  return { addReward };
}
