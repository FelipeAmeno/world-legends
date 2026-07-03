/**
 * lib/notifications/types.ts — T066
 *
 * Sistema de notificações internas do World Legends.
 *
 * Tipos:
 *   NotificationKind   → categoria da notificação
 *   Notification       → estrutura de cada notificação
 *   NotificationAction → botão de ação (CTA) opcional
 *
 * Preparado para:
 *   - WebSocket push (substituir polling por conexão live)
 *   - Push notifications via Web Push API
 *   - Sincronização com Supabase Realtime
 */

// ─── Categorias ───────────────────────────────────────────────────────────────

export type NotificationKind =
  | 'pack_received'       // novo pack recebido (compra, recompensa)
  | 'event_started'       // evento começou
  | 'event_ending'        // evento termina em breve
  | 'mission_complete'    // missão disponível para coletar
  | 'mission_reset'       // missões diárias/semanais reiniciadas
  | 'energy_full'         // energia (futuro) completamente restaurada
  | 'friend_request'      // pedido de amizade
  | 'friend_accepted'     // amizade aceita
  | 'level_up'            // subiu de nível
  | 'achievement'         // conquista desbloqueada
  | 'reward_ready'        // recompensa pronta para coletar
  | 'season_ending'       // temporada termina em breve
  | 'market_sale'         // carta vendida no mercado (futuro)
  | 'system';             // mensagem do sistema / manutenção

// ─── Prioridade ──────────────────────────────────────────────────────────────

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

// ─── Ação (CTA) ───────────────────────────────────────────────────────────────

export type NotificationAction = {
  readonly label: string;
  readonly href:  string;   // rota interna
  readonly style: 'primary' | 'secondary';
};

// ─── Notificação ─────────────────────────────────────────────────────────────

export type Notification = {
  readonly id:         string;
  readonly kind:       NotificationKind;
  readonly priority:   NotificationPriority;
  readonly title:      string;
  readonly body:       string;
  readonly icon:       string;       // emoji
  readonly color:      string;       // cor de destaque (hex)
  readonly createdAt:  string;       // ISO
  readonly expiresAt?: string;       // ISO (opcional)
  readonly action?:    NotificationAction;
  readonly action2?:   NotificationAction;
  readonly metadata?:  Record<string, string | number>;
  read:                boolean;
  dismissed:           boolean;
};

// ─── Configs visuais por tipo ─────────────────────────────────────────────────

export type KindConfig = {
  readonly icon:    string;
  readonly color:   string;
  readonly bg:      string;
  readonly border:  string;
  readonly label:   string;
};

export const KIND_CONFIG: Record<NotificationKind, KindConfig> = {
  pack_received:  { icon:'📦', color:'#a855f7', bg:'rgba(168,85,247,0.08)', border:'rgba(168,85,247,0.25)', label:'Pack' },
  event_started:  { icon:'⚡', color:'#f59e0b', bg:'rgba(245,158,11,0.08)', border:'rgba(245,158,11,0.25)', label:'Evento' },
  event_ending:   { icon:'⏱', color:'#ef4444', bg:'rgba(239,68,68,0.10)',  border:'rgba(239,68,68,0.30)',  label:'Urgente' },
  mission_complete:{ icon:'🎯',color:'#10b981', bg:'rgba(16,185,129,0.08)',border:'rgba(16,185,129,0.25)',label:'Missão' },
  mission_reset:  { icon:'🔄', color:'#3b82f6', bg:'rgba(59,130,246,0.08)', border:'rgba(59,130,246,0.25)', label:'Missões' },
  energy_full:    { icon:'⚡', color:'#22d3ee', bg:'rgba(34,211,238,0.08)', border:'rgba(34,211,238,0.25)', label:'Energia' },
  friend_request: { icon:'👥', color:'#60a5fa', bg:'rgba(96,165,250,0.08)', border:'rgba(96,165,250,0.25)', label:'Amigo' },
  friend_accepted:{ icon:'✅', color:'#34d399', bg:'rgba(52,211,153,0.08)', border:'rgba(52,211,153,0.25)', label:'Amizade' },
  level_up:       { icon:'⭐', color:'#c9a84c', bg:'rgba(201,168,76,0.10)', border:'rgba(201,168,76,0.35)', label:'Level Up' },
  achievement:    { icon:'🏆', color:'#c9a84c', bg:'rgba(201,168,76,0.08)', border:'rgba(201,168,76,0.25)', label:'Conquista' },
  reward_ready:   { icon:'🎁', color:'#a855f7', bg:'rgba(168,85,247,0.08)', border:'rgba(168,85,247,0.25)', label:'Recompensa' },
  season_ending:  { icon:'🗓️', color:'#ef4444', bg:'rgba(239,68,68,0.08)', border:'rgba(239,68,68,0.25)', label:'Temporada' },
  market_sale:    { icon:'💰', color:'#c9a84c', bg:'rgba(201,168,76,0.08)', border:'rgba(201,168,76,0.25)', label:'Venda' },
  system:         { icon:'🔔', color:'#6b7280', bg:'rgba(107,114,128,0.06)', border:'rgba(107,114,128,0.20)', label:'Sistema' },
};

// ─── Store (localStorage) ─────────────────────────────────────────────────────

export const NOTIFICATIONS_LS_KEY = 'wl-notifications-v1';
export const MAX_STORED            = 50;
