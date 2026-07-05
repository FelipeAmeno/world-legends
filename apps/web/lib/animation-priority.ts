'use client';

/**
 * lib/animation-priority.ts — Sprint 3
 *
 * Sistema de prioridade de animações.
 *
 * Problemas que resolve:
 *  - Partículas do pack abrindo competem com partículas de recompensa
 *  - Toast aparece enquanto level-up está animando
 *  - Múltiplas animações de câmera/shake ao mesmo tempo
 *
 * Uso:
 *   const { canPlay, lock, unlock } = useAnimationPriority();
 *   if (!canPlay(PRIORITY.REWARD)) return;
 *   lock(PRIORITY.REWARD, 'pack-opening');
 *   // ... animação ...
 *   unlock('pack-opening');
 */

import { useCallback, useRef, useSyncExternalStore } from 'react';

// ─── Níveis de prioridade ─────────────────────────────────────────────────────

export const PRIORITY = {
  AMBIENT: 0, // loops de fundo (pulsos, floats)
  MICRO: 1, // hover, tap, ripple
  UI: 2, // toasts, badges, badges
  TRANSITION: 3, // transições de tela
  REWARD: 4, // recompensas, pack opening
  LEVELUP: 5, // level up (topo da hierarquia)
} as const;

export type AnimPriority = (typeof PRIORITY)[keyof typeof PRIORITY];

// ─── Store ────────────────────────────────────────────────────────────────────

type Lock = { id: string; priority: AnimPriority };

class AnimationPriorityStore {
  private locks: Lock[] = [];
  private listeners = new Set<() => void>();

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = (): Lock[] => this.locks;

  private emit() {
    for (const l of this.listeners) l();
  }

  lock(priority: AnimPriority, id: string): void {
    if (!this.locks.find((l) => l.id === id)) {
      this.locks = [...this.locks, { id, priority }];
      this.emit();
    }
  }

  unlock(id: string): void {
    this.locks = this.locks.filter((l) => l.id !== id);
    this.emit();
  }

  maxPriority(): AnimPriority {
    return this.locks.reduce<AnimPriority>(
      (max, l) => (l.priority > max ? l.priority : max),
      0 as AnimPriority,
    );
  }

  canPlay(priority: AnimPriority): boolean {
    if (this.locks.length === 0) return true;
    return priority >= this.maxPriority();
  }
}

const store = new AnimationPriorityStore();

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAnimationPriority() {
  useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);

  const lock = useCallback((priority: AnimPriority, id: string) => {
    store.lock(priority, id);
  }, []);

  const unlock = useCallback((id: string) => {
    store.unlock(id);
  }, []);

  const canPlay = useCallback((priority: AnimPriority) => {
    return store.canPlay(priority);
  }, []);

  return { lock, unlock, canPlay };
}

// ─── Utilitário imperativo (fora de componentes React) ───────────────────────

export const animPriority = {
  lock: (priority: AnimPriority, id: string) => store.lock(priority, id),
  unlock: (id: string) => store.unlock(id),
  canPlay: (priority: AnimPriority) => store.canPlay(priority),
  maxLevel: () => store.maxPriority(),
};
