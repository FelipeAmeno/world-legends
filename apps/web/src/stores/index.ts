/**
 * Zustand stores de estado local (doc 18 §4 — apps/web é a camada de composição).
 *
 * Três stores independentes:
 *   authStore  — identidade do usuário (sincronizado com Supabase session)
 *   uiStore    — estado de UI transitório (modal aberto, toast, etc.)
 *   packStore  — estado de abertura de pack (reveal em andamento)
 */
import { create } from 'zustand';
import type { ApiProfile, ApiCard } from '../lib/api/mock-client';

// ─── authStore ────────────────────────────────────────────────────────────────

type AuthState = {
  profile: ApiProfile | null;
  isLoading: boolean;
  setProfile(p: ApiProfile | null): void;
  setLoading(v: boolean): void;
};

export const useAuthStore = create<AuthState>((set) => ({
  profile: null,
  isLoading: true,
  setProfile: (profile) => set({ profile }),
  setLoading: (isLoading) => set({ isLoading }),
}));

// ─── uiStore ──────────────────────────────────────────────────────────────────

type Toast = { id: string; message: string; type: 'success' | 'error' | 'info' };

type UiState = {
  toasts:     Toast[];
  sidebarOpen: boolean;
  addToast(t: Omit<Toast, 'id'>): void;
  removeToast(id: string): void;
  setSidebar(v: boolean): void;
};

export const useUiStore = create<UiState>((set) => ({
  toasts:      [],
  sidebarOpen: false,
  addToast(t) {
    const id = `toast-${Date.now()}`;
    set((s) => ({ toasts: [...s.toasts, { ...t, id }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })), 4000);
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  setSidebar:  (sidebarOpen) => set({ sidebarOpen }),
}));

// ─── packStore — estado de reveal ─────────────────────────────────────────────

type PackRevealState = {
  isRevealing: boolean;
  drawnCards:  ApiCard[];
  revealedIdx: number;   // qual carta está sendo revelada (0..4)
  startReveal(cards: ApiCard[]): void;
  nextCard(): void;
  finishReveal(): void;
};

export const usePackStore = create<PackRevealState>((set) => ({
  isRevealing: false,
  drawnCards:  [],
  revealedIdx: -1,
  startReveal: (cards) => set({ isRevealing: true, drawnCards: cards, revealedIdx: -1 }),
  nextCard:    () => set((s) => ({ revealedIdx: s.revealedIdx + 1 })),
  finishReveal: () => set({ isRevealing: false, drawnCards: [], revealedIdx: -1 }),
}));
