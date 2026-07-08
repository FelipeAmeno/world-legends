'use client';

/**
 * components/ui/AchievementPopup.tsx — Sprint 19 (Game Feel & Immersion)
 *
 * Popup de "conquista desbloqueada" — banner premium, distinto do toast
 * genérico (`toast.achievement(...)` no WLToast é para uma linha de texto;
 * isso aqui é para o momento maior, com ícone grande e descrição).
 */

import { SPRING } from '@/lib/motion-tokens';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';

type Props = {
  open: boolean;
  icon?: string;
  title: string;
  description?: string | undefined;
  onDismiss: () => void;
  autoDismissMs?: number;
};

export function AchievementPopup({
  open,
  icon = '🏅',
  title,
  description,
  onDismiss,
  autoDismissMs = 3800,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(onDismiss, autoDismissMs);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed top-safe-top left-1/2 -translate-x-1/2 z-[92] w-full max-w-[360px] px-4 pointer-events-none"
          style={{ top: 'max(16px, env(safe-area-inset-top) + 8px)' }}
          initial={{ opacity: 0, y: -24, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.94 }}
          transition={SPRING.bouncy}
        >
          <button
            type="button"
            onClick={onDismiss}
            className="pointer-events-auto w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left overflow-hidden relative"
            style={{
              background: 'linear-gradient(135deg, rgba(30,10,45,0.97), rgba(15,5,25,0.98))',
              border: '1px solid rgba(192,132,252,0.5)',
              boxShadow: '0 10px 40px rgba(0,0,0,0.6), 0 0 30px rgba(192,132,252,0.3)',
            }}
          >
            {/* Shimmer sweep */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.12) 50%, transparent 70%)',
                backgroundSize: '200% 100%',
              }}
              animate={{ backgroundPositionX: ['-100%', '200%'] }}
              transition={{ duration: 1.6, repeat: 2, ease: 'linear' }}
            />

            <span
              className="shrink-0 text-2xl w-11 h-11 rounded-xl flex items-center justify-center"
              style={{
                background: 'rgba(192,132,252,0.14)',
                border: '1px solid rgba(192,132,252,0.35)',
              }}
            >
              {icon}
            </span>

            <div className="min-w-0 relative z-10">
              <p
                className="text-[9px] font-black uppercase tracking-[0.2em] mb-0.5"
                style={{ color: '#d8b4fe' }}
              >
                Conquista desbloqueada
              </p>
              <p className="text-parchment font-bold text-sm leading-tight truncate">{title}</p>
              {description && (
                <p className="text-white/40 text-[11px] leading-snug mt-0.5 truncate">
                  {description}
                </p>
              )}
            </div>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
