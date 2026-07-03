'use client';

import type { RichEvent } from '@/lib/match-experience';
import { AnimatePresence, motion } from 'framer-motion';

type Props = { event: RichEvent | null };

export function CommentaryBox({ event }: Props) {
  if (!event || event.kind === 'kickoff') return null;

  const isGoal = event.kind === 'goal_home' || event.kind === 'goal_away';
  const isSave = event.kind === 'save';

  const borderColor =
    isGoal && event.kind === 'goal_home'
      ? 'rgba(16,185,129,0.5)'
      : isGoal
        ? 'rgba(239,68,68,0.4)'
        : isSave
          ? 'rgba(34,211,238,0.5)'
          : 'rgba(255,255,255,0.07)';

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={event.id}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-xl px-3 py-2.5 mb-2 border"
        style={{ background: event.bgColor, borderColor }}
      >
        <div className="flex items-center gap-2">
          <span className={isGoal ? 'text-xl' : 'text-base'}>{event.iconText}</span>
          <div className="flex-1 min-w-0">
            {isGoal && (
              <p
                className={`font-display text-sm font-bold ${
                  event.kind === 'goal_home' ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {event.headline}
              </p>
            )}
            <p
              className={`text-[10px] leading-snug ${isGoal ? 'text-parchment' : 'text-white/60'}`}
            >
              {event.commentary}
            </p>
          </div>
          <span className="text-white/20 text-[9px] font-mono shrink-0">{event.minute}'</span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
