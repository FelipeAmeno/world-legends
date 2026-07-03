'use client';
import type { RichEvent } from '@/lib/match-experience';
import { AnimatePresence, motion } from 'framer-motion';
// EventFeed.tsx
import { useEffect, useRef } from 'react';

type FeedProps = { events: RichEvent[] };

export function EventFeed({ events }: FeedProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll para o último evento
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [events.length]);

  return (
    <div
      className="overflow-y-auto h-full px-4 py-2 space-y-1.5 scroll-x-hide"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      <AnimatePresence initial={false}>
        {events.map((ev) => (
          <motion.div
            key={ev.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 250, damping: 22 }}
            className={`rounded-xl overflow-hidden ${ev.isKey ? 'my-3' : ''}`}
            style={{ background: ev.bgColor }}
          >
            <EventRow ev={ev} />
          </motion.div>
        ))}
      </AnimatePresence>

      <div ref={bottomRef} />
    </div>
  );
}

function EventRow({ ev }: { ev: RichEvent }) {
  const isGoal = ev.kind === 'goal_home' || ev.kind === 'goal_away' || ev.kind === 'own_goal';
  const isPhase = ev.kind === 'half_time' || ev.kind === 'full_time';

  if (isPhase) {
    return (
      <div className="flex items-center gap-3 px-3 py-2">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-white/40 text-[9px] uppercase tracking-wider font-bold">
          {ev.iconText} {ev.headline}
        </span>
        <div className="flex-1 h-px bg-white/10" />
      </div>
    );
  }

  return (
    <div className={`flex items-start gap-3 px-3 ${isGoal ? 'py-3' : 'py-2'}`}>
      {/* Minute */}
      <span className="text-white/30 text-[10px] font-mono w-8 shrink-0 pt-0.5 text-right">
        {ev.minute}'
      </span>

      {/* Icon */}
      <span className={`shrink-0 ${isGoal ? 'text-xl' : 'text-base'}`}>{ev.iconText}</span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {isGoal && (
          <p
            className={`font-display text-lg leading-tight mb-0.5 ${
              ev.kind === 'goal_home'
                ? 'text-emerald-400'
                : ev.kind === 'own_goal'
                  ? 'text-orange-400'
                  : 'text-red-400'
            }`}
          >
            {ev.headline}
          </p>
        )}
        <p
          className={`leading-snug ${isGoal ? 'text-parchment text-xs' : 'text-white/60 text-[10px]'}`}
        >
          {ev.commentary}
        </p>
      </div>

      {/* Side tag */}
      {ev.side !== 'neutral' && !isGoal && (
        <span
          className={`text-[7px] font-bold shrink-0 border rounded px-1 py-0.5 ${
            ev.side === 'home'
              ? 'border-emerald-700/50 text-emerald-400'
              : 'border-red-700/50 text-red-400'
          }`}
        >
          {ev.side === 'home' ? 'CASA' : 'FORA'}
        </span>
      )}
    </div>
  );
}
