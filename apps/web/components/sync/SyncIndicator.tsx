'use client';

/**
 * components/sync/SyncIndicator.tsx — T062
 *
 * Indicador minimalista de status de Cloud Save.
 * Aparece discretamente no canto superior (dentro do MobileHeader ou GameTopBar).
 *
 * Estados:
 *   idle      → ✓ Salvo (verde, desaparece em 3s)
 *   queued    → ○ Aguardando... (branco tênue)
 *   syncing   → ↻ Salvando... (azul, spinner)
 *   retrying  → ↻ Tentando... (amarelo, spinner)
 *   offline   → 📶 Offline · N pendentes (laranja)
 *   error     → ⚠ Erro (vermelho, com retry)
 */

import { getSyncEngine } from '@/lib/sync/SyncEngine';
import { syncStatusDisplay, useSyncStatus } from '@/lib/sync/useSyncStatus';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

type Props = {
  className?: string;
  position?: 'header' | 'corner';
};

export function SyncIndicator({ className = '', position = 'header' }: Props) {
  const syncState = useSyncStatus();
  const display = syncStatusDisplay(syncState);
  const [visible, setVisible] = useState(false);

  // Mostrar indicador só quando relevante
  useEffect(() => {
    const show = syncState.status !== 'idle' || syncState.lastSaved !== null;
    setVisible(show);

    // Auto-esconder após 3s quando idle
    if (syncState.status === 'idle' && syncState.lastSaved) {
      const t = setTimeout(() => setVisible(false), 3000);
      return () => clearTimeout(t);
    }
  }, [syncState.status, syncState.lastSaved]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
          className={`flex items-center gap-1.5 ${className}`}
        >
          {/* Icon */}
          <motion.span
            className={`text-xs ${display.color}`}
            animate={display.spinning ? { rotate: 360 } : {}}
            transition={
              display.spinning
                ? { duration: 1, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }
                : {}
            }
          >
            {display.icon}
          </motion.span>

          {/* Label */}
          <span className={`text-[9px] font-medium ${display.color}`}>{display.label}</span>

          {/* Retry button (só no estado error) */}
          {syncState.status === 'error' && (
            <button
              onClick={() => getSyncEngine().forceFlush()}
              className="text-[8px] underline text-red-400/70 hover:text-red-300 transition-colors ml-1"
            >
              Tentar novamente
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Versão compacta (só ícone) ───────────────────────────────────────────────

export function SyncDot() {
  const { status } = useSyncStatus();

  const DOT_COLOR: Record<string, string> = {
    idle: 'bg-emerald-400',
    queued: 'bg-white/30',
    syncing: 'bg-blue-400',
    retrying: 'bg-yellow-400',
    offline: 'bg-orange-400',
    error: 'bg-red-400',
  };

  const pulsing = status === 'syncing' || status === 'retrying';

  return (
    <div className="relative w-2 h-2">
      <div className={`w-2 h-2 rounded-full ${DOT_COLOR[status] ?? 'bg-white/20'}`} />
      {pulsing && (
        <motion.div
          className={`absolute inset-0 rounded-full ${DOT_COLOR[status]}`}
          animate={{ scale: [1, 2.5], opacity: [0.8, 0] }}
          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
        />
      )}
    </div>
  );
}
