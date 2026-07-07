'use client';

import type { ClaimDayPayload, DailyLoginView } from '@/lib/actions/daily-login.types';
import { SPRING } from '@/lib/motion-tokens';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { RewardReveal } from './RewardReveal';
import { StreakBadge } from './StreakBadge';

type Props = {
  view: DailyLoginView;
  claiming: boolean;
  lastClaim: ClaimDayPayload | null;
  onClaim: () => void;
  onClose: () => void;
};

// ─── 30-day calendar entry ────────────────────────────────────────────────────

type CalendarDay = {
  absoluteDay: number;
  icon: string;
  label: string;
  extraCount: number;
  isMilestone: boolean;
  theme: 'normal' | 'premium' | 'milestone';
};

function build30Days(view: DailyLoginView): CalendarDay[] {
  return Array.from({ length: 30 }, (_, i) => {
    const absoluteDay = i + 1;
    const entry = view.schedule[i % 7]!;
    const mainReward = entry.rewards[0]!;
    const isMilestone = absoluteDay % 7 === 0 || absoluteDay === 30;
    return {
      absoluteDay,
      icon: mainReward.icon,
      label: mainReward.label,
      extraCount: entry.rewards.length - 1,
      isMilestone,
      theme: isMilestone ? 'milestone' : entry.theme,
    };
  });
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export function DailyLoginModal({ view, claiming, lastClaim, onClaim, onClose }: Props) {
  const showReveal = lastClaim !== null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(8px)' }}
      />

      <motion.div
        className="relative z-10 w-full max-w-sm mx-4 mb-4 sm:mb-0 rounded-3xl overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #0d0e16, #07080f)',
          border: '1px solid rgba(201,168,76,0.25)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.7), 0 0 40px rgba(201,168,76,0.1)',
          maxHeight: '90vh',
        }}
        initial={{ y: 80, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 60, opacity: 0, scale: 0.95 }}
        transition={{ ...SPRING.smooth }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="h-0.5 w-full"
          style={{ background: 'linear-gradient(90deg, transparent, #c9a84c, transparent)' }}
        />

        <div className="p-5 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 4px)' }}>
          <AnimatePresence mode="wait">
            {showReveal ? (
              <motion.div
                key="reveal"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <RewardReveal payload={lastClaim} onContinue={onClose} />
              </motion.div>
            ) : (
              <motion.div
                key="calendar"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <CalendarView view={view} claiming={claiming} onClaim={onClaim} onClose={onClose} />
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
  const { state } = view;
  const claimedUpTo = state.streakBroken ? 0 : state.streakDays;
  const currentAbsoluteDay = Math.min(claimedUpTo + 1, 30);
  const days = build30Days(view);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to current day
  useEffect(() => {
    if (!scrollRef.current) return;
    const target = scrollRef.current.querySelector('[data-current="true"]') as HTMLElement | null;
    if (target) {
      const containerWidth = scrollRef.current.clientWidth;
      const targetOffset = target.offsetLeft;
      const targetWidth = target.offsetWidth;
      scrollRef.current.scrollLeft = targetOffset - containerWidth / 2 + targetWidth / 2;
    }
  }, []);

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

      {/* 30-day horizontal scroll */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[9px] uppercase tracking-wider text-muted">30 dias de sequência</p>
          <p className="text-[9px] text-gold">{Math.min(claimedUpTo, 30)}/30</p>
        </div>

        {/* Progress bar */}
        <div
          className="h-1 rounded-full overflow-hidden mb-3"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #8c6f27, #c9a84c, #e6c85a)' }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, Math.round((claimedUpTo / 30) * 100))}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>

        {/* Day scroll */}
        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto pb-2"
          style={{ scrollBehavior: 'smooth', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {days.map((day) => {
            const isPast = day.absoluteDay <= claimedUpTo;
            const isCurrent = day.absoluteDay === currentAbsoluteDay;
            const isLocked = day.absoluteDay > currentAbsoluteDay;
            const isToday = isCurrent && !state.alreadyClaimedToday;

            return (
              <DaySlot
                key={day.absoluteDay}
                day={day}
                isPast={isPast}
                isCurrent={isCurrent && !state.alreadyClaimedToday}
                isClaimedToday={isCurrent && state.alreadyClaimedToday}
                isLocked={isLocked}
                isToday={isToday}
              />
            );
          })}
        </div>
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
            <p className="text-red-400/60 text-[10px]">Recomeçando do Dia 1 — não desista!</p>
          </div>
        </motion.div>
      )}

      {/* 30-day milestone achieved */}
      {claimedUpTo >= 30 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl border border-amber-400/30 bg-amber-950/20"
        >
          <span className="text-2xl">👑</span>
          <div>
            <p className="text-amber-300 text-xs font-bold">30 dias completos!</p>
            <p className="text-amber-400/60 text-[10px]">
              Você é uma lenda. Novo ciclo em andamento.
            </p>
          </div>
        </motion.div>
      )}

      {/* Claim button */}
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
          animate={
            claiming
              ? {}
              : {
                  boxShadow: [
                    '0 0 20px rgba(201,168,76,0.4)',
                    '0 0 36px rgba(201,168,76,0.7)',
                    '0 0 20px rgba(201,168,76,0.4)',
                  ],
                }
          }
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

      {state.nextStreakMilestone && state.streakDays > 0 && (
        <p className="text-center text-muted/50 text-[9px]">
          🔥 Bônus especial em {state.nextStreakMilestone - state.streakDays} dias
        </p>
      )}
    </div>
  );
}

// ─── Day slot ─────────────────────────────────────────────────────────────────

const THEME_STYLES = {
  normal: {
    border: 'rgba(255,255,255,0.08)',
    activeBorder: '#c9a84c',
    glow: 'rgba(201,168,76,0.4)',
  },
  premium: {
    border: 'rgba(168,85,247,0.2)',
    activeBorder: '#a855f7',
    glow: 'rgba(168,85,247,0.45)',
  },
  milestone: {
    border: 'rgba(251,191,36,0.25)',
    activeBorder: '#fbbf24',
    glow: 'rgba(251,191,36,0.55)',
  },
} as const;

function DaySlot({
  day,
  isPast,
  isCurrent,
  isClaimedToday,
  isLocked,
}: {
  day: CalendarDay;
  isPast: boolean;
  isCurrent: boolean;
  isClaimedToday: boolean;
  isLocked: boolean;
  isToday: boolean;
}) {
  const t = THEME_STYLES[day.theme];
  const isActive = isCurrent || isClaimedToday;

  return (
    <motion.div
      data-current={isActive ? 'true' : undefined}
      className="flex-shrink-0 flex flex-col items-center rounded-xl border overflow-hidden relative"
      style={{
        width: day.isMilestone ? 68 : 58,
        minHeight: 84,
        background: isPast
          ? 'rgba(0,0,0,0.2)'
          : isCurrent
            ? `linear-gradient(145deg, ${t.glow.replace(/[\d.]+\)$/, '0.12)')}, rgba(0,0,0,0))`
            : 'rgba(255,255,255,0.025)',
        borderColor: isPast
          ? 'rgba(255,255,255,0.04)'
          : isCurrent
            ? t.activeBorder
            : isClaimedToday
              ? 'rgba(52,211,153,0.35)'
              : t.border,
        boxShadow: isCurrent ? `0 0 14px ${t.glow}` : 'none',
        opacity: isLocked ? 0.45 : 1,
        padding: '6px 4px',
        gap: 3,
      }}
      animate={isCurrent ? { scale: [1, 1.04, 1] } : {}}
      transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
    >
      {/* Day number */}
      <span
        className="text-[8px] font-bold uppercase tracking-wider"
        style={{
          color: isPast
            ? 'rgba(255,255,255,0.2)'
            : isCurrent
              ? t.activeBorder
              : isClaimedToday
                ? '#34d399'
                : 'rgba(255,255,255,0.3)',
        }}
      >
        {day.isMilestone ? `Dia ${day.absoluteDay} ★` : `Dia ${day.absoluteDay}`}
      </span>

      {/* Icon */}
      <div
        className="flex-1 flex items-center justify-center"
        style={{ fontSize: day.isMilestone ? 22 : 18 }}
      >
        {isPast || isClaimedToday ? (
          <motion.span
            style={{ fontSize: 14, color: '#34d399' }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          >
            ✓
          </motion.span>
        ) : (
          <span style={{ filter: isLocked ? 'grayscale(1) opacity(0.4)' : 'none' }}>
            {day.icon}
          </span>
        )}
      </div>

      {/* Label */}
      {!isPast && !isClaimedToday && (
        <p
          className="text-center leading-tight font-medium"
          style={{
            fontSize: 7,
            color: isCurrent ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.3)',
            maxWidth: 60,
          }}
        >
          {day.label}
          {day.extraCount > 0 && <span style={{ opacity: 0.5 }}> +{day.extraCount}</span>}
        </p>
      )}

      {/* Current pulse ring */}
      {isCurrent && (
        <motion.div
          className="absolute inset-0 rounded-xl border-2"
          style={{ borderColor: `${t.activeBorder}55` }}
          animate={{ opacity: [0.3, 0.9, 0.3] }}
          transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
        />
      )}
    </motion.div>
  );
}
