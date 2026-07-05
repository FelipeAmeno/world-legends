/**
 * lib/game-state.ts
 *
 * Estado global compartilhado entre todas as telas.
 * Persiste em localStorage entre recarregamentos.
 *
 * Fluxo guiado:
 *   enter → collection → squad → packs → squad(add) → match → rewards → levelup → free
 */

// ─── Fluxo ────────────────────────────────────────────────────────────────────

export type FlowStep =
  | 'enter' // tela de entrada / onboarding
  | 'collection' // ver coleção
  | 'squad' // montar time
  | 'packs' // abrir pack
  | 'add_card' // adicionar carta nova ao squad
  | 'match' // jogar partida
  | 'rewards' // ver recompensas
  | 'levelup' // subir de nível
  | 'free'; // navegação livre

export const FLOW_STEPS: FlowStep[] = [
  'enter',
  'collection',
  'squad',
  'packs',
  'add_card',
  'match',
  'rewards',
  'levelup',
  'free',
];

export const FLOW_LABELS: Record<FlowStep, string> = {
  enter: 'Entrar',
  collection: 'Coleção',
  squad: 'Montar Time',
  packs: 'Abrir Pack',
  add_card: 'Adicionar Carta',
  match: 'Jogar',
  rewards: 'Recompensas',
  levelup: 'Subir Nível',
  free: 'Livre',
};

export const FLOW_ICONS: Record<FlowStep, string> = {
  enter: '🎮',
  collection: '🃏',
  squad: '⚽',
  packs: '📦',
  add_card: '✨',
  match: '🏟',
  rewards: '🎁',
  levelup: '⭐',
  free: '∞',
};

export const FLOW_HREF: Partial<Record<FlowStep, string>> = {
  collection: '/collection',
  squad: '/squad',
  packs: '/packs',
  add_card: '/squad',
  match: '/match',
  rewards: '/profile',
  levelup: '/profile',
  free: '/',
};

// ─── XP por nível ────────────────────────────────────────────────────────────

export function xpForLevel(level: number): number {
  return level * 100 + Math.floor(level * level * 5);
}

// ─── Recompensa pendente ──────────────────────────────────────────────────────

export type PendingReward = {
  credits: number;
  xp: number;
  label: string;
  bonuses: Array<{ label: string; credits: number; xp: number }>;
  newCardIds: string[];
};

// ─── Estado global ────────────────────────────────────────────────────────────

export type GameState = {
  // Onboarding
  isOnboarded: boolean;
  username: string;

  // Perfil
  level: number;
  currentXp: number;
  xpForNext: number;
  credits: number;
  fragments: number;

  // Partidas
  wins: number;
  draws: number;
  losses: number;

  // Cartas novas desta sessão (para highlight)
  newCardIds: string[];

  // Recompensa pendente (aparece como toast)
  pendingReward: PendingReward | null;

  // Level up pendente (aparece como overlay)
  leveledUp: boolean;
  prevLevel: number;

  // Fluxo guiado
  flowActive: boolean;
  flowStep: FlowStep;

  // Log de atividade
  activityLog: Array<{
    ts: number;
    text: string;
    type: 'info' | 'win' | 'reward' | 'pack' | 'level';
  }>;
};

// ─── Estado inicial ───────────────────────────────────────────────────────────

export const INITIAL_STATE: GameState = {
  isOnboarded: false,
  username: '',
  level: 1,
  currentXp: 0,
  xpForNext: xpForLevel(2),
  credits: 500,
  fragments: 0,
  wins: 0,
  draws: 0,
  losses: 0,
  newCardIds: [],
  pendingReward: null,
  leveledUp: false,
  prevLevel: 1,
  flowActive: true,
  flowStep: 'enter',
  activityLog: [],
};

// ─── Actions ─────────────────────────────────────────────────────────────────

export type GameAction =
  | { type: 'ONBOARD'; username: string }
  | { type: 'OPEN_PACK'; cost: number; cardIds: string[] }
  | { type: 'PLAY_MATCH'; reward: PendingReward; outcome: 'win' | 'draw' | 'loss' }
  | { type: 'COLLECT_REWARD' }
  | { type: 'DISMISS_LEVELUP' }
  | { type: 'ADVANCE_FLOW' }
  | { type: 'SET_FLOW'; step: FlowStep }
  | { type: 'GOTO_FREE' }
  | { type: 'CLEAR_NEW_CARDS' }
  | { type: 'ADD_LOG'; text: string; logType: 'info' | 'win' | 'reward' | 'pack' | 'level' }
  | { type: 'RESET' };

// ─── Reducer ─────────────────────────────────────────────────────────────────

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'ONBOARD': {
      return {
        ...state,
        isOnboarded: true,
        username: action.username.trim() || 'Lenda',
        flowStep: 'collection',
        activityLog: [
          ...state.activityLog,
          { ts: Date.now(), text: `Bem-vindo, ${action.username}!`, type: 'info' },
        ],
      };
    }

    case 'OPEN_PACK': {
      const newCredits = Math.max(0, state.credits - action.cost);
      const newFrags = state.fragments + action.cardIds.length * 5;
      const nextStep: FlowStep = state.flowStep === 'packs' ? 'add_card' : state.flowStep;

      return {
        ...state,
        credits: newCredits,
        fragments: newFrags,
        newCardIds: [...new Set([...state.newCardIds, ...action.cardIds])],
        flowStep: nextStep,
        activityLog: [
          ...state.activityLog.slice(-20),
          { ts: Date.now(), text: `Pack aberto! +${action.cardIds.length} cartas`, type: 'pack' },
        ],
      };
    }

    case 'PLAY_MATCH': {
      const { reward, outcome } = action;

      // Atualizar XP com possível level-up
      let newXp = state.currentXp + reward.xp;
      let newLevel = state.level;
      let leveledUp = false;
      const prevLevel = state.level;

      while (newXp >= xpForLevel(newLevel + 1)) {
        newXp -= xpForLevel(newLevel + 1);
        newLevel++;
        leveledUp = true;
      }

      const nextStep: FlowStep =
        state.flowStep === 'match' ? (leveledUp ? 'levelup' : 'rewards') : state.flowStep;

      return {
        ...state,
        wins: state.wins + (outcome === 'win' ? 1 : 0),
        draws: state.draws + (outcome === 'draw' ? 1 : 0),
        losses: state.losses + (outcome === 'loss' ? 1 : 0),
        currentXp: newXp,
        xpForNext: xpForLevel(newLevel + 1),
        level: newLevel,
        leveledUp,
        prevLevel,
        pendingReward: reward,
        flowStep: nextStep,
        activityLog: [
          ...state.activityLog.slice(-20),
          {
            ts: Date.now(),
            text: `Partida ${outcome === 'win' ? '🏆 Vitória' : outcome === 'draw' ? '⚖️ Empate' : '💔 Derrota'} +${reward.credits}c +${reward.xp}xp`,
            type: outcome === 'win' ? 'win' : 'reward',
          },
        ],
      };
    }

    case 'COLLECT_REWARD': {
      const nextStep: FlowStep =
        state.flowStep === 'rewards' ? (state.leveledUp ? 'levelup' : 'free') : state.flowStep;

      return {
        ...state,
        credits: state.credits + (state.pendingReward?.credits ?? 0),
        pendingReward: null,
        flowStep: nextStep,
      };
    }

    case 'DISMISS_LEVELUP': {
      return {
        ...state,
        leveledUp: false,
        flowStep: state.flowStep === 'levelup' ? 'free' : state.flowStep,
        activityLog: [
          ...state.activityLog.slice(-20),
          { ts: Date.now(), text: `Nível ${state.level} alcançado!`, type: 'level' },
        ],
      };
    }

    case 'ADVANCE_FLOW': {
      const currentIdx = FLOW_STEPS.indexOf(state.flowStep);
      const nextIdx = Math.min(currentIdx + 1, FLOW_STEPS.length - 1);
      return { ...state, flowStep: FLOW_STEPS[nextIdx]! };
    }

    case 'SET_FLOW': {
      return { ...state, flowStep: action.step };
    }

    case 'GOTO_FREE': {
      return { ...state, flowStep: 'free', flowActive: false };
    }

    case 'CLEAR_NEW_CARDS': {
      return { ...state, newCardIds: [] };
    }

    case 'ADD_LOG': {
      return {
        ...state,
        activityLog: [
          ...state.activityLog.slice(-30),
          { ts: Date.now(), text: action.text, type: action.logType },
        ],
      };
    }

    case 'RESET': {
      return INITIAL_STATE;
    }

    default:
      return state;
  }
}
