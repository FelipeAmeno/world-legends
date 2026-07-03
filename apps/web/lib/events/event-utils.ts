/**
 * lib/events/event-utils.ts — T065
 *
 * Utilitários puros para o sistema de eventos:
 *   getEventStatus()    → status atual do evento
 *   getTimeRemaining()  → countdown formatado
 *   checkRequirements() → verificar se usuário pode entrar
 *   sortEvents()        → ordenação por relevância
 */

import type { GameEvent, EventStatus, EventRequirement } from './types';

// ─── Status ───────────────────────────────────────────────────────────────────

export function getEventStatus(event: GameEvent, now = Date.now()): EventStatus {
  const start = new Date(event.startsAt).getTime();
  const end   = new Date(event.endsAt).getTime();
  const remaining = end - now;

  if (now < start)            return 'upcoming';
  if (remaining <= 0)         return 'ended';
  if (remaining < 3 * 3_600_000) return 'ending_soon'; // < 3h
  return 'active';
}

// ─── Countdown ────────────────────────────────────────────────────────────────

export type TimeLeft = {
  days:    number;
  hours:   number;
  minutes: number;
  seconds: number;
  total:   number;   // ms total
  label:   string;   // "2d 4h 30m"
  short:   string;   // "2d" ou "4h 30m" ou "30m"
  urgent:  boolean;  // true se < 3h
};

export function getTimeLeft(endOrStart: string, isStart = false, now = Date.now()): TimeLeft {
  const target = new Date(endOrStart).getTime();
  const total  = Math.max(0, target - now);
  const secs   = Math.floor(total / 1000);
  const days   = Math.floor(secs / 86400);
  const hours  = Math.floor((secs % 86400) / 3600);
  const minutes= Math.floor((secs % 3600) / 60);
  const seconds= secs % 60;
  const urgent = total < 3 * 3_600_000 && total > 0;

  let label = '';
  let short = '';

  if (total === 0) {
    label = isStart ? 'Já começou' : 'Encerrado';
    short = label;
  } else if (days > 0) {
    label = `${days}d ${hours}h ${minutes}m`;
    short = `${days}d`;
  } else if (hours > 0) {
    label = `${hours}h ${minutes}m`;
    short = `${hours}h ${minutes}m`;
  } else {
    label = `${minutes}m ${seconds}s`;
    short = `${minutes}m`;
  }

  return { days, hours, minutes, seconds, total, label, short, urgent };
}

// ─── Requisitos ───────────────────────────────────────────────────────────────

export type RequirementCheck = {
  requirement: EventRequirement;
  met:         boolean;
  userValue?:  string | number;
};

export type RequirementsResult = {
  canEnter:   boolean;
  checks:     RequirementCheck[];
  failReason: string | null;
};

/** Contexto do usuário para verificação de requisitos */
export type UserContext = {
  level:       number;
  squadOvr:    number;
  wins:        number;
  totalCards:  number;
  squadSize:   number;
  nationalities:string[];   // nacionalidades no squad atual
  season:      number;
};

export function checkRequirements(
  requirements: EventRequirement[],
  user:         UserContext,
): RequirementsResult {
  if (requirements.length === 0) {
    return { canEnter:true, checks:[], failReason:null };
  }

  const checks: RequirementCheck[] = requirements.map(req => {
    switch (req.kind) {
      case 'min_ovr':
        return { requirement:req, met: user.squadOvr >= req.value, userValue: user.squadOvr };
      case 'min_level':
        return { requirement:req, met: user.level >= req.value, userValue: user.level };
      case 'min_cards':
        return { requirement:req, met: user.totalCards >= req.value, userValue: user.totalCards };
      case 'squad_size':
        return { requirement:req, met: user.squadSize >= req.value, userValue: user.squadSize };
      case 'wins':
        return { requirement:req, met: user.wins >= req.value, userValue: user.wins };
      case 'nationality':
        return { requirement:req, met: true, userValue: '✓' }; // simplificado
      case 'season':
        return { requirement:req, met: user.season >= req.number, userValue: `T${user.season}` };
      default:
        return { requirement:req, met:true };
    }
  });

  const failed     = checks.find(c => !c.met);
  const canEnter   = !failed;
  const failReason = failed ? failed.requirement.label : null;

  return { canEnter, checks, failReason };
}

// ─── Ordenação ────────────────────────────────────────────────────────────────

export function sortEvents(events: GameEvent[], now = Date.now()): GameEvent[] {
  const STATUS_ORDER: Record<EventStatus, number> = {
    ending_soon: 0,
    active:      1,
    upcoming:    2,
    ended:       3,
  };

  return [...events].sort((a, b) => {
    const sa = STATUS_ORDER[getEventStatus(a, now)];
    const sb = STATUS_ORDER[getEventStatus(b, now)];
    if (sa !== sb) return sa - sb;
    // Featured primeiro dentro do mesmo status
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    // Mais participantes = mais relevante
    return b.participants - a.participants;
  });
}

// ─── Agrupamento por categoria ────────────────────────────────────────────────

export function groupByStatus(events: GameEvent[]): {
  active:   GameEvent[];
  upcoming: GameEvent[];
  ended:    GameEvent[];
} {
  const now = Date.now();
  return {
    active:   events.filter(e => ['active','ending_soon'].includes(getEventStatus(e, now))),
    upcoming: events.filter(e => getEventStatus(e, now) === 'upcoming'),
    ended:    events.filter(e => getEventStatus(e, now) === 'ended'),
  };
}

// ─── Formatação de participantes ──────────────────────────────────────────────

export function formatParticipants(count: number): string {
  if (count >= 1_000_000) return `${(count/1_000_000).toFixed(1)}M`;
  if (count >= 1_000)     return `${(count/1_000).toFixed(1)}K`;
  return String(count);
}

// ─── Status badge style ───────────────────────────────────────────────────────

export function getStatusStyle(status: EventStatus): { label:string; color:string; bg:string; pulse:boolean } {
  switch (status) {
    case 'active':
      return { label:'ATIVO',      color:'text-emerald-400', bg:'bg-emerald-900/40 border-emerald-700/50', pulse:false };
    case 'ending_soon':
      return { label:'TERMINA EM BREVE', color:'text-red-400', bg:'bg-red-900/40 border-red-700/50', pulse:true };
    case 'upcoming':
      return { label:'EM BREVE',   color:'text-blue-400',    bg:'bg-blue-900/40    border-blue-700/50',    pulse:false };
    case 'ended':
      return { label:'ENCERRADO',  color:'text-muted',       bg:'bg-surface        border-border',          pulse:false };
  }
}
