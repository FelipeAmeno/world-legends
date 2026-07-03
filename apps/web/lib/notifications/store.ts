/**
 * lib/notifications/store.ts — T066
 *
 * Store de notificações — padrão Observer puro (sem React).
 *
 * Características:
 *   - Persistência em localStorage (até 50 notificações)
 *   - Subscriber pattern (React hooks se inscrevem aqui)
 *   - Factory functions para cada tipo de notificação
 *   - Auto-dismiss de notificações urgentes após 10s
 *   - Deduplicação por kind + 30min (evitar spam)
 *
 * Para LiveOps/WebSocket:
 *   Substituir o polling em triggerMockNotifications()
 *   por um WebSocket que chama notify()
 */

import type { Notification, NotificationKind, NotificationPriority, NotificationAction } from './types';
import { KIND_CONFIG, NOTIFICATIONS_LS_KEY, MAX_STORED } from './types';

// ─── ID e timestamp ───────────────────────────────────────────────────────────

let _seq = 0;
const genId = () => `notif-${Date.now()}-${++_seq}`;
const nowIso = () => new Date().toISOString();

// ─── NotificationStore ────────────────────────────────────────────────────────

type Subscriber = (notifications: Notification[]) => void;

class NotificationStore {
  private items:       Notification[]   = [];
  private subscribers: Set<Subscriber> = new Set();
  private timers:      Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.load();
  }

  // ── Persistência ────────────────────────────────────────────────────────────

  private load(): void {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(NOTIFICATIONS_LS_KEY);
      this.items = raw ? JSON.parse(raw) : [];
    } catch {
      this.items = [];
    }
  }

  private persist(): void {
    if (typeof window === 'undefined') return;
    const toStore = this.items.slice(-MAX_STORED);
    try {
      localStorage.setItem(NOTIFICATIONS_LS_KEY, JSON.stringify(toStore));
    } catch {}
  }

  // ── Deduplicação ────────────────────────────────────────────────────────────

  private isDuplicate(kind: NotificationKind): boolean {
    const DEDUP_MS = 30 * 60 * 1000; // 30 min
    const cutoff   = Date.now() - DEDUP_MS;
    return this.items.some(
      n => n.kind === kind && new Date(n.createdAt).getTime() > cutoff,
    );
  }

  // ── Emitir ──────────────────────────────────────────────────────────────────

  private emit(): void {
    const snapshot = [...this.items];
    for (const sub of this.subscribers) sub(snapshot);
  }

  // ── API pública ─────────────────────────────────────────────────────────────

  subscribe(fn: Subscriber): () => void {
    this.subscribers.add(fn);
    fn([...this.items]); // snapshot inicial
    return () => this.subscribers.delete(fn);
  }

  getAll(): Notification[] {
    return [...this.items];
  }

  getUnreadCount(): number {
    return this.items.filter(n => !n.read && !n.dismissed).length;
  }

  notify(partial: Omit<Notification, 'id' | 'createdAt' | 'read' | 'dismissed'>): string | null {
    // Deduplicar notificações de baixa prioridade
    if (partial.priority !== 'urgent' && this.isDuplicate(partial.kind)) return null;

    const notif: Notification = {
      ...partial,
      id:        genId(),
      createdAt: nowIso(),
      read:      false,
      dismissed: false,
    };

    this.items = [notif, ...this.items].slice(0, MAX_STORED);
    this.persist();
    this.emit();

    // Auto-dismiss urgentes após 10s
    if (partial.priority === 'urgent') {
      const t = setTimeout(() => this.dismiss(notif.id), 10_000);
      this.timers.set(notif.id, t);
    }

    return notif.id;
  }

  markRead(id: string): void {
    const n = this.items.find(n => n.id === id);
    if (n) { (n as any).read = true; this.persist(); this.emit(); }
  }

  markAllRead(): void {
    this.items.forEach(n => (n as any).read = true);
    this.persist();
    this.emit();
  }

  dismiss(id: string): void {
    const n = this.items.find(n => n.id === id);
    if (n) {
      (n as any).dismissed = true;
      (n as any).read      = true;
      clearTimeout(this.timers.get(id));
      this.timers.delete(id);
      this.persist();
      this.emit();
    }
  }

  dismissAll(): void {
    this.items.forEach(n => {
      (n as any).dismissed = true;
      (n as any).read      = true;
    });
    for (const t of this.timers.values()) clearTimeout(t);
    this.timers.clear();
    this.persist();
    this.emit();
  }

  clearAll(): void {
    for (const t of this.timers.values()) clearTimeout(t);
    this.timers.clear();
    this.items = [];
    this.persist();
    this.emit();
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────

let _store: NotificationStore | null = null;

export function getNotificationStore(): NotificationStore {
  if (!_store) _store = new NotificationStore();
  return _store;
}

// ─── Factory functions ────────────────────────────────────────────────────────

function cfg(kind: NotificationKind) { return KIND_CONFIG[kind]; }

export const notify = {
  packReceived(packName: string, packCount = 1): void {
    const s = getNotificationStore();
    s.notify({
      kind:'pack_received', priority:'high',
      title:`${packCount} ${packName} recebido${packCount > 1 ? 's' : ''}!`,
      body: 'Abra agora para descobrir suas cartas.',
      icon: cfg('pack_received').icon,
      color:cfg('pack_received').color,
      action: { label:'Abrir packs', href:'/packs', style:'primary' },
    });
  },

  eventStarted(eventTitle: string, eventId: string): void {
    const s = getNotificationStore();
    s.notify({
      kind:'event_started', priority:'high',
      title:`${eventTitle} começou!`,
      body: 'Participe agora e concorra às recompensas exclusivas.',
      icon: cfg('event_started').icon,
      color:cfg('event_started').color,
      action: { label:'Participar', href:'/events', style:'primary' },
      metadata:{ eventId },
    });
  },

  eventEnding(eventTitle: string, timeLeft: string): void {
    const s = getNotificationStore();
    s.notify({
      kind:'event_ending', priority:'urgent',
      title:`${eventTitle} termina ${timeLeft}!`,
      body: 'Última chance de participar e ganhar recompensas.',
      icon: cfg('event_ending').icon,
      color:cfg('event_ending').color,
      action: { label:'Participar agora', href:'/events', style:'primary' },
    });
  },

  missionComplete(missionTitle: string, reward: string): void {
    const s = getNotificationStore();
    s.notify({
      kind:'mission_complete', priority:'normal',
      title:'Missão completa!',
      body: `"${missionTitle}" — Colete: ${reward}`,
      icon: cfg('mission_complete').icon,
      color:cfg('mission_complete').color,
      action: { label:'Coletar', href:'/missions', style:'primary' },
    });
  },

  missionReset(type: 'daily' | 'weekly'): void {
    const s = getNotificationStore();
    s.notify({
      kind:'mission_reset', priority:'low',
      title:`Missões ${type === 'daily' ? 'diárias' : 'semanais'} reiniciadas!`,
      body: 'Novas missões disponíveis. Complete para ganhar XP e créditos.',
      icon: cfg('mission_reset').icon,
      color:cfg('mission_reset').color,
      action: { label:'Ver missões', href:'/missions', style:'primary' },
    });
  },

  energyFull(): void {
    const s = getNotificationStore();
    s.notify({
      kind:'energy_full', priority:'normal',
      title:'Energia totalmente restaurada!',
      body: 'Você está pronto para mais partidas.',
      icon: cfg('energy_full').icon,
      color:cfg('energy_full').color,
      action: { label:'Jogar agora', href:'/match', style:'primary' },
    });
  },

  friendRequest(fromUser: string): void {
    const s = getNotificationStore();
    s.notify({
      kind:'friend_request', priority:'normal',
      title:'Pedido de amizade!',
      body: `${fromUser} quer ser seu amigo no World Legends.`,
      icon: cfg('friend_request').icon,
      color:cfg('friend_request').color,
      action:  { label:'Aceitar',  href:'/profile', style:'primary' },
      action2: { label:'Recusar',  href:'/profile', style:'secondary' },
      metadata:{ fromUser },
    });
  },

  friendAccepted(friendName: string): void {
    const s = getNotificationStore();
    s.notify({
      kind:'friend_accepted', priority:'low',
      title:'Amizade aceita!',
      body: `${friendName} aceitou seu pedido de amizade.`,
      icon: cfg('friend_accepted').icon,
      color:cfg('friend_accepted').color,
    });
  },

  levelUp(newLevel: number, title: string): void {
    const s = getNotificationStore();
    s.notify({
      kind:'level_up', priority:'high',
      title:`⬆ Nível ${newLevel} desbloqueado!`,
      body: `Você é agora um "${title}". Recompensas liberadas!`,
      icon: cfg('level_up').icon,
      color:cfg('level_up').color,
      action: { label:'Ver perfil', href:'/profile', style:'primary' },
      metadata:{ newLevel, title },
    });
  },

  achievement(achievementName: string, reward: string): void {
    const s = getNotificationStore();
    s.notify({
      kind:'achievement', priority:'normal',
      title:`Conquista desbloqueada!`,
      body: `"${achievementName}" — ${reward}`,
      icon: cfg('achievement').icon,
      color:cfg('achievement').color,
      action: { label:'Ver conquistas', href:'/profile', style:'primary' },
    });
  },

  rewardReady(source: string): void {
    const s = getNotificationStore();
    s.notify({
      kind:'reward_ready', priority:'normal',
      title:'Recompensa disponível!',
      body: `${source} — clique para coletar.`,
      icon: cfg('reward_ready').icon,
      color:cfg('reward_ready').color,
      action: { label:'Coletar', href:'/rewards', style:'primary' },
    });
  },

  seasonEnding(daysLeft: number): void {
    const s = getNotificationStore();
    s.notify({
      kind:'season_ending', priority:'high',
      title:`Temporada encerra em ${daysLeft} dia${daysLeft > 1 ? 's' : ''}!`,
      body: 'Melhore seu ranking antes de acabar para ganhar recompensas maiores.',
      icon: cfg('season_ending').icon,
      color:cfg('season_ending').color,
      action: { label:'Ver ranking', href:'/ranking', style:'primary' },
    });
  },

  system(title: string, body: string, href?: string): void {
    const s = getNotificationStore();
    s.notify({
      kind:'system', priority:'low',
      title, body,
      icon: cfg('system').icon,
      color:cfg('system').color,
      action: href ? { label:'Saiba mais', href, style:'secondary' } : undefined,
    });
  },
};

// ─── Demo: gerar notificações simuladas ──────────────────────────────────────

export function triggerDemoNotifications(): void {
  const s = getNotificationStore();
  if (s.getAll().length > 0) return; // já populado

  // Gerar notificações iniciais para demonstração
  setTimeout(() => notify.levelUp(13, 'Estrela'),           0);
  setTimeout(() => notify.missionComplete('Jogador Dedicado', '+50c +50 XP'), 100);
  setTimeout(() => notify.packReceived('Classic Pack', 2),  200);
  setTimeout(() => notify.eventStarted('Copa do Mundo 2026', 'wc-2026'), 300);
  setTimeout(() => notify.friendRequest('CarlosFC'),         400);
  setTimeout(() => notify.achievement('Caçador de Lendas',  '+Classic Pack'), 500);
  setTimeout(() => notify.missionReset('daily'),             600);
  setTimeout(() => notify.seasonEnding(3),                   700);
  setTimeout(() => notify.rewardReady('Partida vencida'),    800);
  setTimeout(() => notify.system('Bem-vindo ao World Legends!', 'Explore e colete as maiores lendas do futebol.', '/'), 900);
}
