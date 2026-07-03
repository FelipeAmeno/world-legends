'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';

type Toast = { name: string; credits: number };

type Props = {
  toast: Toast | null;
  onDismiss: () => void;
};

export function AlbumClaimToast({ toast, onDismiss }: Props) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [toast, onDismiss]);

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
        >
          <div
            className="rounded-2xl px-6 py-4 text-center min-w-[220px]"
            style={{
              background: 'linear-gradient(135deg, #1a1200, #2a1e00)',
              border: '1px solid rgba(201,168,76,0.5)',
              boxShadow: '0 0 32px rgba(201,168,76,0.4)',
            }}
          >
            <p className="text-gold font-display text-lg tracking-wider">ÁLBUM COMPLETO!</p>
            <p className="text-parchment/80 text-xs mt-0.5">{toast.name}</p>
            <p className="text-amber-300 font-bold text-sm mt-2">
              +{toast.credits.toLocaleString('pt-BR')} 💰
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
