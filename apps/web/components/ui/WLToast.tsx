'use client';

import { SPRING } from '@/lib/motion-tokens';
import type { ToastItem, ToastType } from '@/lib/wl-toast';
import { toastStore } from '@/lib/wl-toast';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useSyncExternalStore } from 'react';

// ─── Estilos por tipo ─────────────────────────────────────────────────────────

const STYLE: Record<ToastType, { bg: string; border: string; color: string; iconBg: string }> = {
  success: {
    bg: 'rgba(6,78,59,0.95)',
    border: 'rgba(16,185,129,0.4)',
    color: '#34d399',
    iconBg: 'rgba(16,185,129,0.15)',
  },
  error: {
    bg: 'rgba(69,10,10,0.95)',
    border: 'rgba(239,68,68,0.4)',
    color: '#f87171',
    iconBg: 'rgba(239,68,68,0.15)',
  },
  reward: {
    bg: 'rgba(30,20,0,0.96)',
    border: 'rgba(201,168,76,0.5)',
    color: '#e6c85a',
    iconBg: 'rgba(201,168,76,0.12)',
  },
  info: {
    bg: 'rgba(7,20,40,0.95)',
    border: 'rgba(59,130,246,0.4)',
    color: '#60a5fa',
    iconBg: 'rgba(59,130,246,0.12)',
  },
  warning: {
    bg: 'rgba(40,25,0,0.95)',
    border: 'rgba(251,146,60,0.4)',
    color: '#fb923c',
    iconBg: 'rgba(251,146,60,0.12)',
  },
};

// ─── WLToast (root) ───────────────────────────────────────────────────────────

export function WLToast() {
  const items = useSyncExternalStore(
    toastStore.subscribe.bind(toastStore),
    toastStore.getSnapshot.bind(toastStore),
    () => [] as ToastItem[],
  );

  const dismiss = useCallback((id: string) => toastStore.remove(id), []);

  return (
    <div
      className="fixed top-safe-top left-1/2 -translate-x-1/2 z-[90] flex flex-col gap-2 pointer-events-none w-full max-w-[380px] px-4"
      style={{ top: 'max(16px, env(safe-area-inset-top) + 8px)' }}
    >
      <AnimatePresence mode="sync">
        {items.map((item) => (
          <ToastCard key={item.id} item={item} onDismiss={() => dismiss(item.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─── ToastCard ────────────────────────────────────────────────────────────────

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const s = STYLE[item.type];

  return (
    <motion.div
      className="pointer-events-auto w-full cursor-pointer select-none"
      initial={{ opacity: 0, y: -16, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1, transition: SPRING.snappy }}
      exit={{ opacity: 0, y: -8, scale: 0.95, transition: { duration: 0.18 } }}
      onClick={onDismiss}
    >
      <div
        className="relative flex items-center gap-3 px-4 py-3 rounded-2xl overflow-hidden backdrop-blur-sm"
        style={{
          background: s.bg,
          border: `1px solid ${s.border}`,
          boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 20px ${s.border}`,
        }}
      >
        {/* Shimmer line at top */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${s.color}60, transparent)` }}
        />

        {/* Progress bar */}
        <motion.div
          className="absolute bottom-0 left-0 h-0.5 rounded-full"
          style={{ background: s.color, opacity: 0.6 }}
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: item.duration / 1000, ease: 'linear' }}
        />

        {/* Icon */}
        <div
          className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-base font-bold border"
          style={{
            background: s.iconBg,
            borderColor: s.border,
            color: s.color,
          }}
        >
          {item.icon}
        </div>

        {/* Message */}
        <p className="flex-1 text-sm font-semibold leading-tight" style={{ color: s.color }}>
          {item.message}
        </p>

        {/* Dismiss hint */}
        <span className="shrink-0 text-white/20 text-[10px] font-medium">✕</span>
      </div>
    </motion.div>
  );
}
