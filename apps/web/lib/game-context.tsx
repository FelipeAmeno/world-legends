'use client';

/**
 * lib/game-context.tsx
 *
 * Context global do jogo — acessível em qualquer componente client.
 * Persiste em localStorage entre recarregamentos.
 * Expõe actions de alto nível além do dispatch bruto.
 */

import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
} from 'react';
import {
  type FlowStep,
  type GameAction,
  type GameState,
  INITIAL_STATE,
  type PendingReward,
  gameReducer,
} from './game-state';

// ─── Context type ─────────────────────────────────────────────────────────────

type GameContextValue = {
  state: GameState;
  dispatch: (action: GameAction) => void;

  // Actions de alto nível
  onboard: (username: string) => void;
  openPack: (cost: number, cardIds: string[]) => void;
  playMatch: (reward: PendingReward, outcome: 'win' | 'draw' | 'loss') => void;
  collectReward: () => void;
  dismissLevelUp: () => void;
  advanceFlow: () => void;
  setFlow: (step: FlowStep) => void;
  gotoFree: () => void;
};

// ─── Context ──────────────────────────────────────────────────────────────────

const GameContext = createContext<GameContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

const LS_KEY = 'wl-game-state-v1';

function loadFromStorage(): GameState {
  if (typeof window === 'undefined') return INITIAL_STATE;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return INITIAL_STATE;
    const parsed = JSON.parse(raw) as Partial<GameState>;
    // Mesclar com INITIAL_STATE para garantir campos novos
    return { ...INITIAL_STATE, ...parsed };
  } catch {
    return INITIAL_STATE;
  }
}

function saveToStorage(state: GameState): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch {
    // storage cheio ou bloqueado
  }
}

type Props = { children: ReactNode };

export function GameProvider({ children }: Props) {
  const [state, dispatch] = useReducer(gameReducer, INITIAL_STATE, loadFromStorage);

  // Persistir em localStorage a cada mudança
  useEffect(() => {
    saveToStorage(state);
  }, [state]);

  // Actions de alto nível
  const onboard = useCallback((username: string) => dispatch({ type: 'ONBOARD', username }), []);

  const openPack = useCallback(
    (cost: number, cardIds: string[]) => dispatch({ type: 'OPEN_PACK', cost, cardIds }),
    [],
  );

  const playMatch = useCallback(
    (reward: PendingReward, outcome: 'win' | 'draw' | 'loss') =>
      dispatch({ type: 'PLAY_MATCH', reward, outcome }),
    [],
  );

  const collectReward = useCallback(() => dispatch({ type: 'COLLECT_REWARD' }), []);

  const dismissLevelUp = useCallback(() => dispatch({ type: 'DISMISS_LEVELUP' }), []);

  const advanceFlow = useCallback(() => dispatch({ type: 'ADVANCE_FLOW' }), []);

  const setFlow = useCallback((step: FlowStep) => dispatch({ type: 'SET_FLOW', step }), []);

  const gotoFree = useCallback(() => dispatch({ type: 'GOTO_FREE' }), []);

  const value: GameContextValue = {
    state,
    dispatch,
    onboard,
    openPack,
    playMatch,
    collectReward,
    dismissLevelUp,
    advanceFlow,
    setFlow,
    gotoFree,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside GameProvider');
  return ctx;
}

// ─── Hook: só o estado (sem actions — para leitura) ──────────────────────────

export function useGameState(): GameState {
  return useGame().state;
}
