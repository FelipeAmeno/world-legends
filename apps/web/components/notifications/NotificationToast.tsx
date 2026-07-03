'use client';

import { KIND_CONFIG } from '@/lib/notifications/types';
import type { Notification } from '@/lib/notifications/types';
import { useNotifications } from '@/lib/notifications/useNotifications';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

/**
 * NotificationToast
 *
 * Exibe um toast animado para notificações de alta prioridade.
 * Aparece no topo da tela e desaparece automaticamente após 5s.
 * Máximo de 3 toasts simultâneos (queue FIFO).
 */

const TOAST_DURATION = 5000;
const MAX_TOASTS = 3;

export function NotificationToast() {
  const { notifications, dismiss } = useNotifications();
  const [toasts, setToasts] = useState<Notification[]>([]);
  const seenIds = useRef(new Set<string>());

  // Monitorar novas notificações não lidas de alta prioridade
  useEffect(() => {
    const newHigh = notifications.filter(
      (n) =>
        !n.read &&
        !n.dismissed &&
        (n.priority === 'high' || n.priority === 'urgent') &&
        !seenIds.current.has(n.id),
    );

    for (const n of newHigh) {
      seenIds.current.add(n.id);
      setToasts((prev) => {
        const next = [n, ...prev].slice(0, MAX_TOASTS);
        return next;
      });

      // Auto-remove após 5s
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== n.id));
      }, TOAST_DURATION);
    }
  }, [notifications]);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[80] flex flex-col gap-2 pointer-events-none w-full max-w-sm px-4">
      <AnimatePresence>
        {toasts.map((toast, i) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            index={i}
            onDismiss={() => {
              dismiss(toast.id);
              setToasts((prev) => prev.filter((t) => t.id !== toast.id));
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({
  toast,
  index,
  onDismiss,
}: {
  toast: Notification;
  index: number;
  onDismiss: () => void;
}) {
  const cfg = KIND_CONFIG[toast.kind];
  const isUrgent = toast.priority === 'urgent';

  return (
    <motion.div
      className="pointer-events-auto w-full"
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 280, damping: 25 }}
      style={{ zIndex: 80 - index }}
    >
      <div
        className={[
          'relative flex items-start gap-3 px-4 py-3 rounded-2xl border overflow-hidden',
          isUrgent ? 'border-red-500/40' : '',
        ].join(' ')}
        style={{
          background: `linear-gradient(135deg, ${cfg.bg}, rgba(7,8,15,0.98))`,
          borderColor: isUrgent ? 'rgba(239,68,68,0.5)' : cfg.border,
          boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 20px ${cfg.color}20`,
        }}
      >
        {/* Progress bar */}
        <motion.div
          className="absolute bottom-0 left-0 h-0.5 rounded-full"
          style={{ background: cfg.color }}
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: TOAST_DURATION / 1000, ease: 'linear' }}
        />

        {/* Icon */}
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center text-lg shrink-0 border"
          style={{ background: cfg.bg, borderColor: cfg.border }}
        >
          {toast.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-parchment text-xs font-bold leading-tight">{toast.title}</p>
          <p className="text-muted text-[10px] mt-0.5 leading-snug">{toast.body}</p>
          {toast.action && (
            <Link
              href={toast.action.href}
              onClick={onDismiss}
              className="inline-block mt-1.5 px-2.5 py-0.5 rounded-lg text-[9px] font-bold text-obsidian"
              style={{ background: `linear-gradient(135deg, ${cfg.color}cc, ${cfg.color})` }}
            >
              {toast.action.label} →
            </Link>
          )}
        </div>

        {/* Dismiss */}
        <button
          onClick={onDismiss}
          className="shrink-0 text-muted hover:text-parchment text-xs transition-colors mt-0.5"
        >
          ✕
        </button>
      </div>
    </motion.div>
  );
}
