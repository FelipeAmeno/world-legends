'use client';

import type { SwapSuggestion } from '@/lib/squad-builder';
import { AnimatePresence, motion } from 'framer-motion';

type Props = {
  open: boolean;
  suggestions: SwapSuggestion[];
  onApply: (slotId: string, cardId: string) => void;
  onClose: () => void;
};

const RARITY_GLOW: Record<string, string> = {
  common: 'rgba(150,150,150,0.5)',
  rare: 'rgba(147,51,234,0.7)',
  elite: 'rgba(59,130,246,0.8)',
  legendary: 'rgba(201,168,76,0.9)',
  ultra: 'rgba(236,72,153,0.9)',
  world_cup_hero: 'rgba(240,244,255,1)',
};

export function SwapSuggestionsSheet({ open, suggestions, onApply, onClose }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          {/* biome-ignore lint/a11y/useKeyWithClickEvents: backdrop dismiss */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl overflow-hidden"
            style={{ background: 'rgba(6,8,16,0.97)', border: '1px solid rgba(255,255,255,0.08)' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            {/* Header */}
            <div className="px-4 pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg text-parchment tracking-wider">
                  💡 Sugestões de Química
                </h3>
                <p className="text-muted text-[10px] mt-0.5">
                  Trocas que melhoram a química ou o OVR do seu time
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center text-muted hover:text-white transition-colors text-xs"
              >
                ✕
              </button>
            </div>

            <div className="px-4 pb-6 space-y-3 max-h-[60vh] overflow-y-auto">
              {suggestions.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-white/30 text-sm">Nenhuma sugestão disponível</p>
                  <p className="text-muted text-xs mt-1">
                    Seu time já está otimizado ou você não tem cartas no pool
                  </p>
                </div>
              ) : (
                suggestions.map((s, i) => (
                  <SwapCard key={`${s.slotId}-${s.suggestedCard.cardId}`} suggestion={s} index={i} onApply={onApply} />
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function SwapCard({
  suggestion: s,
  index,
  onApply,
}: {
  suggestion: SwapSuggestion;
  index: number;
  onApply: (slotId: string, cardId: string) => void;
}) {
  const chemColor =
    s.chemDelta > 0
      ? '#22c55e'
      : s.chemDelta === 0
        ? '#60a5fa'
        : '#ef4444';

  const ovrColor = s.ovrDelta > 0 ? '#22c55e' : s.ovrDelta === 0 ? '#9ca3af' : '#ef4444';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, type: 'spring', stiffness: 300, damping: 28 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <div className="p-3 flex items-center gap-3">
        {/* Current card */}
        <div className="flex-1 min-w-0">
          <p className="text-[9px] text-muted uppercase tracking-wider mb-1">Atual</p>
          <div
            className="rounded-xl px-3 py-2"
            style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
            }}
          >
            <p className="font-bold text-[11px] text-parchment truncate">{s.currentCard.displayName}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[9px] text-muted">{s.slotPosition}</span>
              <span className="text-[9px] text-white/50">·</span>
              <span className="font-display text-[11px] text-white/70">{s.currentCard.overall}</span>
              <span className="text-[8px]">{s.currentCard.flagEmoji}</span>
            </div>
          </div>
        </div>

        {/* Arrow + deltas */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <span className="text-white/30 text-sm">→</span>
          {s.chemDelta !== 0 && (
            <div
              className="flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold"
              style={{
                background: s.chemDelta > 0 ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                border: `1px solid ${chemColor}40`,
                color: chemColor,
              }}
            >
              ⚗ {s.chemDelta > 0 ? '+' : ''}{s.chemDelta}
            </div>
          )}
          {s.ovrDelta !== 0 && (
            <div
              className="flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold"
              style={{
                background: s.ovrDelta > 0 ? 'rgba(34,197,94,0.10)' : 'rgba(239,68,68,0.10)',
                border: `1px solid ${ovrColor}35`,
                color: ovrColor,
              }}
            >
              ↑ {s.ovrDelta > 0 ? '+' : ''}{s.ovrDelta}
            </div>
          )}
        </div>

        {/* Suggested card */}
        <div className="flex-1 min-w-0">
          <p className="text-[9px] text-muted uppercase tracking-wider mb-1">Sugerido</p>
          <div
            className="rounded-xl px-3 py-2"
            style={{
              background: 'rgba(34,197,94,0.08)',
              border: '1px solid rgba(34,197,94,0.22)',
              boxShadow: `0 0 12px ${RARITY_GLOW[s.suggestedCard.rarityCode]}20`,
            }}
          >
            <p className="font-bold text-[11px] text-parchment truncate">
              {s.suggestedCard.displayName}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[9px] text-muted">{s.suggestedCard.position}</span>
              <span className="text-[9px] text-white/50">·</span>
              <span className="font-display text-[11px] text-white/70">{s.suggestedCard.overall}</span>
              <span className="text-[8px]">{s.suggestedCard.flagEmoji}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Apply button */}
      <button
        type="button"
        onClick={() => onApply(s.slotId, s.suggestedCard.cardId)}
        className="w-full py-2.5 text-[11px] font-bold tracking-wider transition-all"
        style={{
          background: 'linear-gradient(90deg, rgba(201,168,76,0.15), rgba(201,168,76,0.08))',
          borderTop: '1px solid rgba(201,168,76,0.18)',
          color: '#c9a84c',
        }}
      >
        Aplicar Troca
      </button>
    </motion.div>
  );
}
