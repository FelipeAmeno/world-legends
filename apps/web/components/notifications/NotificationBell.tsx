'use client';

import { useNotifications } from '@/lib/notifications/useNotifications';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { NotificationDrawer } from './NotificationDrawer';

type Props = { className?: string };

export function NotificationBell({ className = '' }: Props) {
  const { unreadCount, hasUnread } = useNotifications();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`relative flex items-center justify-center w-9 h-9 rounded-xl hover:bg-white/5 transition-colors ${className}`}
        aria-label={`Notificações ${unreadCount > 0 ? `(${unreadCount} não lidas)` : ''}`}
      >
        {/* Bell icon */}
        <motion.span
          className="text-xl"
          animate={hasUnread ? { rotate: [-8, 8, -8, 8, -4, 4, 0], scale: [1, 1.1, 1] } : {}}
          transition={
            hasUnread ? { duration: 0.6, repeat: Number.POSITIVE_INFINITY, repeatDelay: 4 } : {}
          }
        >
          🔔
        </motion.span>

        {/* Badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full
                         bg-red-500 flex items-center justify-center"
              style={{ boxShadow: '0 0 8px rgba(239,68,68,0.6)' }}
            >
              <span className="text-[9px] font-black text-white leading-none">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pulse ring (nova notificação urgente) */}
        {hasUnread && (
          <motion.div
            className="absolute inset-0 rounded-xl border border-red-400"
            animate={{ scale: [1, 1.3], opacity: [0.6, 0] }}
            transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
          />
        )}
      </button>

      {/* Drawer */}
      <AnimatePresence>
        {open && <NotificationDrawer onClose={() => setOpen(false)} />}
      </AnimatePresence>
    </>
  );
}
