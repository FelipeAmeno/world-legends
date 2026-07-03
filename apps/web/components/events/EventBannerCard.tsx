'use client';

import {
  type UserContext,
  checkRequirements,
  formatParticipants,
  getEventStatus,
  getStatusStyle,
  getTimeLeft,
} from '@/lib/events/event-utils';
import type { GameEvent } from '@/lib/events/types';
import { CATEGORY_META, DIFFICULTY_CONFIG } from '@/lib/events/types';
import { SQUAD_RATING, USER_PROFILE } from '@/lib/mock-data';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

type Props = {
  event: GameEvent;
  onSelect: (event: GameEvent) => void;
  featured?: boolean;
};

// Mock user context (real: from GameContext + squad state)
const USER_CTX: UserContext = {
  level: USER_PROFILE.level,
  squadOvr: SQUAD_RATING.overall,
  wins: USER_PROFILE.wins,
  totalCards: USER_PROFILE.totalCards,
  squadSize: 11,
  nationalities: ['BR'],
  season: 4,
};

export function EventBannerCard({ event, onSelect, featured = false }: Props) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const status = getEventStatus(event, now);
  const isEnded = status === 'ended';
  const isUpcoming = status === 'upcoming';
  const timeTarget = isUpcoming ? event.startsAt : event.endsAt;
  const timeLeft = getTimeLeft(timeTarget, isUpcoming, now);
  const statusStyle = getStatusStyle(status);
  const catMeta = CATEGORY_META[event.category];
  const difficulty = DIFFICULTY_CONFIG[event.difficulty];
  const reqCheck = checkRequirements(event.requirements, USER_CTX);
  const { from, via, to, icon, accent, badgeText, badgeColor } = event.banner;

  return (
    <motion.div
      className={[
        'relative rounded-3xl overflow-hidden cursor-pointer border',
        isEnded ? 'opacity-60 grayscale' : '',
        featured ? 'min-h-[200px]' : 'min-h-[160px]',
        event.isNew && !isEnded ? 'border-white/15' : 'border-white/6',
      ].join(' ')}
      style={{
        background: `linear-gradient(135deg, ${from} 0%, ${via} 50%, ${to} 100%)`,
        boxShadow: isEnded ? undefined : `0 8px 32px ${accent}25`,
      }}
      onClick={() => onSelect(event)}
      whileHover={!isEnded ? { scale: 1.02, y: -2 } : {}}
      whileTap={{ scale: 0.98 }}
    >
      {/* Radial glow */}
      {!isEnded && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 60% 80% at 15% 50%, ${accent}18, transparent)`,
          }}
        />
      )}

      {/* Noise texture */}
      <div className="absolute inset-0 noise pointer-events-none opacity-60" />

      {/* Content */}
      <div className={`relative z-10 flex items-center gap-4 px-5 ${featured ? 'py-6' : 'py-4'}`}>
        {/* Icon */}
        <motion.div
          className={`shrink-0 ${featured ? 'text-6xl' : 'text-4xl'}`}
          style={{ filter: `drop-shadow(0 0 20px ${accent}80)` }}
          animate={!isEnded ? { y: [0, -4, 0] } : {}}
          transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
        >
          {icon}
        </motion.div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          {/* Top badges */}
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            {/* Status badge */}
            <span
              className={[
                'text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border',
                statusStyle.bg,
                statusStyle.color,
              ].join(' ')}
            >
              {statusStyle.pulse ? '● ' : ''}
              {statusStyle.label}
            </span>

            {/* Category */}
            <span className="text-[7px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-black/30 text-white/50">
              {catMeta.icon} {catMeta.label}
            </span>

            {/* Difficulty */}
            <span
              className={`text-[7px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${difficulty.bg} ${difficulty.color}`}
            >
              {difficulty.label}
            </span>

            {/* New badge */}
            {event.isNew && !isEnded && (
              <span className="text-[7px] font-black uppercase px-1.5 py-0.5 rounded-full bg-white/10 text-white/70">
                NOVO
              </span>
            )}
          </div>

          {/* Title */}
          <h3
            className={`font-display text-white leading-tight tracking-wider ${featured ? 'text-2xl' : 'text-xl'}`}
          >
            {event.title}
          </h3>
          <p className="text-white/50 text-[10px] mt-0.5">{event.subtitle}</p>

          {/* Meta row */}
          <div className="flex items-center flex-wrap gap-3 mt-2">
            {/* Countdown */}
            {!isEnded && (
              <div className="flex items-center gap-1">
                <span
                  className={`text-[9px] font-mono font-bold ${
                    timeLeft.urgent ? 'text-red-400' : 'text-white/60'
                  }`}
                >
                  {isUpcoming ? '▶ em ' : '⏱ '}
                  {timeLeft.label}
                </span>
              </div>
            )}

            {/* Participants */}
            {event.participants > 0 && (
              <span className="text-[9px] text-white/40">
                👥 {formatParticipants(event.participants)}
              </span>
            )}

            {/* Max entries */}
            <span className="text-[9px] text-white/40">
              🎟 {event.maxEntries}× entrada{event.maxEntries > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* CTA */}
        <div className="shrink-0 flex flex-col items-end gap-2">
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(event);
            }}
            disabled={isEnded}
            className={[
              'px-3 py-2 rounded-xl text-xs font-bold transition-all',
              isEnded
                ? 'bg-white/5 text-muted cursor-not-allowed border border-white/10'
                : reqCheck.canEnter
                  ? 'text-obsidian hover:opacity-90'
                  : 'bg-white/5 border border-white/15 text-white/50',
            ].join(' ')}
            style={
              !isEnded && reqCheck.canEnter
                ? {
                    background: `linear-gradient(135deg, ${accent}cc, ${accent})`,
                    boxShadow: `0 0 12px ${accent}60`,
                  }
                : {}
            }
            whileHover={reqCheck.canEnter && !isEnded ? { scale: 1.05 } : {}}
            whileTap={{ scale: 0.97 }}
          >
            {isEnded
              ? 'Encerrado'
              : isUpcoming
                ? 'Lembrar-me'
                : reqCheck.canEnter
                  ? 'Entrar'
                  : '🔒 Bloqueado'}
          </motion.button>

          {/* Requirement fail hint */}
          {!reqCheck.canEnter && !isEnded && (
            <p className="text-[7px] text-red-400/70 text-right max-w-[100px] leading-tight">
              {reqCheck.failReason}
            </p>
          )}
        </div>
      </div>

      {/* Ended overlay */}
      {isEnded && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
          <p className="font-display text-xl text-white/30 rotate-[-15deg]">ENCERRADO</p>
        </div>
      )}
    </motion.div>
  );
}
