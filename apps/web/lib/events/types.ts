/**
 * lib/events/types.ts — T065
 *
 * Tipos do sistema de Live Events do World Legends.
 *
 * Preparado para:
 *   - Copa do Mundo (world_cup)
 *   - UEFA Champions League (champions_league)
 *   - CONMEBOL Libertadores (libertadores)
 *   - Desafios semanais/diários
 *   - Eventos especiais de temporada
 *   - LiveOps via API
 */

// ─── Categorias ───────────────────────────────────────────────────────────────

export type EventCategory =
  | 'world_cup'           // Copa do Mundo
  | 'champions_league'    // UEFA Champions League
  | 'libertadores'        // CONMEBOL Libertadores
  | 'copa_america'        // Copa América
  | 'euro'                // Eurocopa
  | 'weekly_challenge'    // Desafio Semanal
  | 'daily_challenge'     // Desafio Diário
  | 'seasonal'            // Evento de Temporada
  | 'special';            // Evento Especial

// ─── Dificuldade ──────────────────────────────────────────────────────────────

export type EventDifficulty = 'beginner' | 'amateur' | 'professional' | 'elite' | 'legendary';

// ─── Status ──────────────────────────────────────────────────────────────────

export type EventStatus = 'upcoming' | 'active' | 'ending_soon' | 'ended';

// ─── Requisitos de entrada ────────────────────────────────────────────────────

export type EventRequirement =
  | { kind:'min_ovr';    value:  number;  label: string }
  | { kind:'min_level';  value:  number;  label: string }
  | { kind:'min_cards';  value:  number;  label: string }
  | { kind:'nationality';code:   string;  flag:  string; label: string }
  | { kind:'rarity';     rarity: string;  label: string }
  | { kind:'squad_size'; value:  number;  label: string }
  | { kind:'wins';       value:  number;  label: string }
  | { kind:'season';     number: number;  label: string };

// ─── Recompensas ──────────────────────────────────────────────────────────────

export type RewardTierLabel = 'Participação' | 'Top 50%' | 'Top 25%' | 'Top 10%' | 'Top 3' | 'Campeão';

export type EventRewardItem = {
  readonly kind:   'xp' | 'credits' | 'fragments' | 'pack' | 'exclusive_card' | 'title' | 'badge';
  readonly amount: number;
  readonly label:  string;
  readonly icon:   string;
  readonly packId?:string;          // se kind === 'pack'
  readonly cardId?:string;          // se kind === 'exclusive_card'
};

export type EventRewardTier = {
  readonly tier:     RewardTierLabel;
  readonly icon:     string;
  readonly color:    string;
  readonly items:    EventRewardItem[];
  readonly minRank?: number;        // posição mínima
  readonly maxRank?: number;        // posição máxima
};

// ─── Evento principal ─────────────────────────────────────────────────────────

export type GameEvent = {
  readonly id:           string;
  readonly category:     EventCategory;
  readonly title:        string;
  readonly subtitle:     string;
  readonly description:  string;

  // Visual
  readonly banner:       EventBanner;
  readonly difficulty:   EventDifficulty;

  // Tempo
  readonly startsAt:     string;   // ISO
  readonly endsAt:       string;   // ISO

  // Requisitos
  readonly requirements: EventRewardRequirement[];

  // Recompensas por tier
  readonly rewardTiers:  EventRewardTier[];

  // Mecânica
  readonly maxEntries:   number;   // tentativas por dia/período
  readonly format:       EventFormat;
  readonly rewards:      EventRewardItem[];  // recompensas de participação (flat)

  // Meta
  readonly participants: number;   // total inscrito (para hype)
  readonly featured:     boolean;  // destaque na home
  readonly isNew:        boolean;
  readonly tags:         string[];
};

export type EventFormat =
  | 'single_match'   // 1 partida
  | 'best_of_3'      // melhor de 3
  | 'tournament'     // torneio eliminatório
  | 'accumulate'     // acumular pontos/vitórias
  | 'challenge';     // objetivo específico (ex: marcar 5 gols)

// Banner visual
export type EventBanner = {
  readonly from:    string;   // gradient start
  readonly via:     string;   // gradient mid
  readonly to:      string;   // gradient end
  readonly icon:    string;   // emoji ou URL futura
  readonly accent:  string;   // cor de destaque
  readonly badgeText:string;
  readonly badgeColor:string;
};

// Alias conveniente
export type EventRewardRequirement = EventRequirement;

// ─── Progresso do usuário no evento ──────────────────────────────────────────

export type EventUserProgress = {
  readonly eventId:       string;
  readonly userId:        string;
  readonly enrolled:      boolean;
  readonly entriesUsed:   number;
  readonly wins:          number;
  readonly losses:        number;
  readonly points:        number;
  readonly currentRank?:  number;
  readonly bestRank?:     number;
  readonly claimedTiers:  RewardTierLabel[];
  readonly lastEntry:     string | null;  // ISO
};

// ─── Configs de categoria (visuais/labels) ────────────────────────────────────

export type CategoryMeta = {
  readonly label:    string;
  readonly icon:     string;
  readonly color:    string;
  readonly from:     string;
  readonly to:       string;
};

export const CATEGORY_META: Record<EventCategory, CategoryMeta> = {
  world_cup: {
    label:'Copa do Mundo',    icon:'🌍', color:'#f59e0b',
    from:'#1a0800', to:'#78350f',
  },
  champions_league: {
    label:'Champions League', icon:'⭐', color:'#3b82f6',
    from:'#000d2a', to:'#1e3a8a',
  },
  libertadores: {
    label:'Libertadores',     icon:'🏆', color:'#eab308',
    from:'#0d1a00', to:'#365314',
  },
  copa_america: {
    label:'Copa América',     icon:'🌎', color:'#10b981',
    from:'#001a0f', to:'#065f46',
  },
  euro: {
    label:'Eurocopa',         icon:'⚽', color:'#60a5fa',
    from:'#001240', to:'#1e3a8a',
  },
  weekly_challenge: {
    label:'Desafio Semanal',  icon:'⚡', color:'#a855f7',
    from:'#1a0040', to:'#4c1d95',
  },
  daily_challenge: {
    label:'Desafio Diário',   icon:'🎯', color:'#ec4899',
    from:'#1a0020', to:'#7c1d5a',
  },
  seasonal: {
    label:'Temporada',        icon:'🗓️', color:'#c9a84c',
    from:'#1a1000', to:'#78460f',
  },
  special: {
    label:'Especial',         icon:'✨', color:'#e2e8f0',
    from:'#04040a', to:'#0f0f1a',
  },
};

export const DIFFICULTY_CONFIG: Record<EventDifficulty, { label:string; color:string; bg:string }> = {
  beginner:     { label:'Iniciante',    color:'text-emerald-400', bg:'bg-emerald-900/30 border-emerald-700/40' },
  amateur:      { label:'Amador',       color:'text-blue-400',    bg:'bg-blue-900/30    border-blue-700/40'    },
  professional: { label:'Profissional', color:'text-yellow-400',  bg:'bg-yellow-900/30  border-yellow-700/40'  },
  elite:        { label:'Elite',        color:'text-orange-400',  bg:'bg-orange-900/30  border-orange-700/40'  },
  legendary:    { label:'Lendário',     color:'text-red-400',     bg:'bg-red-900/30     border-red-700/40'     },
};
