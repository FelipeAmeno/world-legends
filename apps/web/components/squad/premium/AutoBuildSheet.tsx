'use client';

import type { AutoBuildMode } from '@/lib/squad-builder';
import { AnimatePresence, motion } from 'framer-motion';

type Props = {
  open: boolean;
  hasFavorites: boolean;
  hasBrazilians: boolean;
  hasGoats: boolean;
  onBuild: (mode: AutoBuildMode) => void;
  onClose: () => void;
};

const MODES: {
  mode: AutoBuildMode;
  icon: string;
  label: string;
  desc: string;
  color: string;
}[] = [
  {
    mode: 'best',
    icon: '🏆',
    label: 'Melhor Time',
    desc: 'Maior OVR por posição',
    color: 'from-amber-900/40 to-amber-950/60 border-amber-500/30',
  },
  {
    mode: 'chemistry',
    icon: '⚡',
    label: 'Melhor Química',
    desc: 'Prioriza mesma seleção',
    color: 'from-emerald-900/40 to-emerald-950/60 border-emerald-500/30',
  },
  {
    mode: 'brazilians',
    icon: '🇧🇷',
    label: 'Só Brasileiros',
    desc: 'Apenas jogadores BR',
    color: 'from-green-900/40 to-green-950/60 border-green-500/30',
  },
  {
    mode: 'goat',
    icon: '👑',
    label: 'Só GOATs',
    desc: 'Ultra e World Cup Heroes',
    color: 'from-pink-900/40 to-pink-950/60 border-pink-500/30',
  },
  {
    mode: 'dream',
    icon: '⭐',
    label: 'Dream Team',
    desc: 'Seus favoritos primeiro',
    color: 'from-purple-900/40 to-purple-950/60 border-purple-500/30',
  },
];

export function AutoBuildSheet({
  open,
  hasFavorites,
  hasBrazilians,
  hasGoats,
  onBuild,
  onClose,
}: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="absolute inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.65)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="absolute inset-x-0 bottom-0 z-50 rounded-t-3xl overflow-hidden"
            style={{ background: '#0d0f18', borderTop: '1px solid rgba(255,255,255,0.08)' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
          >
            <div className="flex justify-center pt-2.5 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>
            <div className="px-4 pb-2">
              <p className="text-[9px] text-white/30 uppercase tracking-widest">Auto Build</p>
              <p className="text-parchment font-bold text-sm mt-0.5">Montar time automaticamente</p>
            </div>
            <div className="px-4 pb-6 space-y-2">
              {MODES.map(({ mode, icon, label, desc, color }) => {
                const disabled =
                  (mode === 'dream' && !hasFavorites) ||
                  (mode === 'brazilians' && !hasBrazilians) ||
                  (mode === 'goat' && !hasGoats);
                return (
                  <motion.button
                    key={mode}
                    type="button"
                    disabled={disabled}
                    onClick={() => {
                      onBuild(mode);
                      onClose();
                    }}
                    whileTap={{ scale: 0.97 }}
                    className={[
                      'w-full flex items-center gap-3 px-4 py-3 rounded-xl border bg-gradient-to-r transition-opacity',
                      color,
                      disabled ? 'opacity-35 cursor-not-allowed' : 'hover:opacity-90',
                    ].join(' ')}
                  >
                    <span className="text-2xl shrink-0">{icon}</span>
                    <div className="text-left">
                      <p className="text-parchment font-bold text-sm leading-tight">{label}</p>
                      <p className="text-white/40 text-[10px]">
                        {disabled ? 'Sem jogadores disponíveis' : desc}
                      </p>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
