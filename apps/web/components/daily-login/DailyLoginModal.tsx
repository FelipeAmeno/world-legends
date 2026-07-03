'use client';

import type { ClaimDayPayload, DailyLoginView } from '@/lib/actions/daily-login';
import { AnimatePresence, motion } from 'framer-motion';
import { DayCard } from './DayCard';
import { RewardReveal } from './RewardReveal';
import { StreakBadge } from './StreakBadge';

type Props = {
  view: DailyLoginView;
  claiming: boolean;
  lastClaim: ClaimDayPayload | null;
  onClaim: () => void;
  onClose: () => void;
};

export function DailyLoginModal({ view, claiming, lastClaim, onClaim, onClose }: Props) {
  const { state, schedule } = view;

  // In reward-reveal phase, show the animated reveal instead of the calendar
  const showReveal = lastClaim !== null;

  return (
    // Backdrop
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      />

      {/* Modal panel */}
      <motion.div
        className="relative z-10 w-full max-w-sm mx-4 mb-4 sm:mb-0 rounded-3xl overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #0d0e16, #07080f)',
          border: '1px solid rgba(201,168,76,0.25)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.7), 0 0 40px rgba(201,168,76,0.1)',
        }}
        initial={{ y: 80, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 60, opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 280, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gold top accent */}
        <div
          className="h-0.5 w-full"
          style={{ background: 'linear-gradient(90deg, transparent, #c9a84c, transparent)' }}
        />

        <div className="p-5">
          <AnimatePresence mode="wait">
            {showReveal ? (
              <motion.div key="reveal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <RewardReveal payload={lastClaim} onContinue={onClose} />
              </motion.div>
            ) : (
              <motion.div key="calendar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <CalendarView
                  view={view}
                  claiming={claiming}
                  onClaim={onClaim}
                  onClose={onClose}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Calendar view ────────────────────────────────────────────────────────────

function CalendarView({
  view,
  claiming,
  onClaim,
  onClose,
}: {
  view: DailyLoginView;
  claiming: boolean;
  onClaim: () => void;
  onClose: () => void;
}) {
  const { state, schedule } = view;
  const effectiveDay = state.streakBroken ? 1 : state.currentDay;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-2xl gold-text tracking-wider">LOGIN DIÁRIO</h2>
          <p className="text-muted text-xs mt-0.5">
            {state.alreadyClaimedToday
              ? 'Volte amanhã para continuar!'
              : 'Colete sua recompensa de hoje!'}
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-muted hover:text-parchment transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Streak badge */}
      <StreakBadge streakDays={state.streakDays} nextMilestone={state.nextStreakMilestone} />

      {/* 7-day grid */}
      <div className="grid grid-cols-4 gap-1.5">
        {schedule.slice(0, 4).map((config) => {
          const isPast =
            state.alreadyClaimedToday
              ? config.day < effectiveDay
              : config.day < effectiveDay;
          const isCurrent = config.day === effectiveDay;
          const isLocked = config.day > effectiveDay;
          return (
            <DayCard
              key={config.day}
              config={config}
              isCurrent={isCurrent && !state.alreadyClaimedToday}
              isPast={isPast}
              isLocked={isLocked}
            />
          );
        })}
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {schedule.slice(4).map((config) => {
          const isPast =
            state.alreadyClaimedToday
              ? config.day < effectiveDay
              : config.day < effectiveDay;
          const isCurrent = config.day === effectiveDay;
          const isLocked = config.day > effectiveDay;
          return (
            <DayCard
              key={config.day}
              config={config}
              isCurrent={isCurrent && !state.alreadyClaimedToday}
              isPast={isPast}
              isLocked={isLocked}
            />
          );
        })}
      </div>

      {/* Streak broken notice */}
      {state.streakBroken && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-950/30 border border-red-500/20"
        >
          <span className="text-lg">💔</span>
          <div>
            <p className="text-red-400 text-xs font-bold">Sequência interrompida</p>
            <p className="text-red-400/60 text-[10px]">Recomeçando do Dia 1</p>
          </div>
        </motion.div>
      )}

      {/* Claim / status */}
      {state.canClaimToday ? (
        <motion.button
          onClick={onClaim}
          disabled={claiming}
          className="w-full py-3.5 rounded-xl font-display text-sm tracking-wider transition-all disabled:opacity-60"
          style={{
            background: claiming
              ? 'rgba(201,168,76,0.3)'
              : 'linear-gradient(135deg, #8c6f27, #c9a84c, #e6c85a)',
            boxShadow: claiming ? 'none' : '0 0 24px rgba(201,168,76,0.45)',
            color: '#07080f',
          }}
          whileHover={claiming ? {} : { scale: 1.02 }}
          whileTap={claiming ? {} : { scale: 0.98 }}
          animate={claiming ? {} : { boxShadow: ['0 0 20px rgba(201,168,76,0.4)', '0 0 36px rgba(201,168,76,0.7)', '0 0 20px rgba(201,168,76,0.4)'] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
        >
          {claiming ? '✨ Coletando...' : '🎁 COLETAR RECOMPENSA'}
        </motion.button>
      ) : (
        <div className="flex items-center justify-center gap-2 py-3.5 rounded-xl border border-white/5 bg-surface/50">
          <span className="text-emerald-400">✓</span>
          <p className="text-muted text-sm">Recompensa coletada — volte amanhã!</p>
        </div>
      )}

      {/* Next milestone hint */}
      {state.nextStreakMilestone && state.streakDays > 0 && (
        <p className="text-center text-muted/50 text-[9px]">
          🔥 Bônus especial em {state.nextStreakMilestone - state.streakDays} dias
        </p>
      )}
    </div>
  );
}
