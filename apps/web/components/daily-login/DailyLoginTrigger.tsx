'use client';

import { useDailyLogin } from '@/lib/hooks/useDailyLogin';
import { AnimatePresence, motion } from 'framer-motion';
import { DailyLoginModal } from './DailyLoginModal';

/**
 * DailyLoginTrigger — mounts in PremiumHome.
 * Opens the modal automatically on mount if there's an unclaimed reward.
 * Also renders a persistent badge button to reopen manually.
 */
export function DailyLoginTrigger() {
  const { view, loading, claiming, lastClaim, claim, open, dismiss, isOpen } = useDailyLogin();

  if (loading || !view) return null;

  const showBadge = view.state.canClaimToday;

  return (
    <>
      {/* Floating badge button (top-right corner) */}
      <AnimatePresence>
        {showBadge && !isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={open}
            className="fixed top-4 right-4 z-40 flex flex-col items-center gap-0.5"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center relative"
              style={{
                background: 'linear-gradient(135deg, #2a1c00, #1a1000)',
                border: '1.5px solid rgba(201,168,76,0.5)',
                boxShadow: '0 0 16px rgba(201,168,76,0.3)',
              }}
            >
              <span className="text-2xl">🎁</span>
              {/* Red dot */}
              <motion.div
                className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-[#07080f]"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
              />
            </div>
            <span className="text-[8px] font-bold text-gold">Hoje!</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <DailyLoginModal
            view={view}
            claiming={claiming}
            lastClaim={lastClaim}
            onClaim={claim}
            onClose={dismiss}
          />
        )}
      </AnimatePresence>
    </>
  );
}
