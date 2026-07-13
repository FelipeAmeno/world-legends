'use client';

import { ResolvedWorldLegendsCard } from '@/components/cards/ResolvedWorldLegendsCard';
import type { CollectionCard } from '@/lib/collection-data';
import { compareCards } from '@/lib/collection-filters';
import { motion } from 'framer-motion';
import { useMemo } from 'react';

type Props = {
  cards: CollectionCard[];
  onClose: () => void;
};

export function CompareModal({ cards, onClose }: Props) {
  const diffs = useMemo(() => compareCards(cards), [cards]);

  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        className="fixed inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-end sm:justify-center z-[61] sm:p-4"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div
          className="w-full sm:max-w-2xl bg-midnight border border-border rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[90vh] overflow-y-auto"
          style={{ boxShadow: '0 -8px 40px rgba(0,0,0,0.6)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2 sm:hidden">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <div>
              <h2 className="font-display text-xl text-parchment tracking-wider">COMPARAR</h2>
              <p className="text-muted text-[10px]">{cards.length} cartas selecionadas</p>
            </div>
            <button
              onClick={onClose}
              className="text-muted hover:text-parchment text-sm transition-colors"
            >
              ✕ Fechar
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* Headers das cartas — Sprint 41: cada lado do comparativo
                resolve independentemente (mesmo cardId de entrada, mesma
                densidade Compact pros dois), sem afetar compareCards() —
                o cálculo de diffs é feito só com os dados numéricos de
                CollectionCard, nunca com o resultado do resolver. */}
            <div
              className={'grid gap-3'}
              style={{ gridTemplateColumns: `140px repeat(${cards.length}, 1fr)` }}
            >
              <div /> {/* label column placeholder */}
              {cards.map((card) => (
                <div key={card.cardId} className="flex justify-center">
                  <ResolvedWorldLegendsCard card={card} size="sm" density="compact" glow />
                </div>
              ))}
            </div>

            {/* Tabela de atributos */}
            <div className="space-y-1">
              {diffs.map((diff) => {
                const numVals = diff.values.map((v) => v.value as number);
                const maxVal = Math.max(...numVals);
                const minVal = Math.min(...numVals);
                const spread = maxVal - minVal;

                return (
                  <div
                    key={diff.field}
                    className="grid items-center gap-3"
                    style={{ gridTemplateColumns: `140px repeat(${cards.length}, 1fr)` }}
                  >
                    {/* Label */}
                    <p className="text-muted text-[10px] font-medium">{diff.field}</p>

                    {/* Values */}
                    {diff.values.map((v, vi) => {
                      const val = v.value as number;
                      const best = v.best;
                      const pct = maxVal > 0 ? Math.round((val / 99) * 100) : 0;
                      const isBetter = spread > 0 && best;
                      const isWorse = spread > 0 && val === minVal && !best;

                      return (
                        <div key={vi} className="space-y-0.5">
                          <div className="flex justify-between text-[10px]">
                            <span
                              className={
                                isBetter
                                  ? 'text-emerald-400 font-bold'
                                  : isWorse
                                    ? 'text-red-400'
                                    : 'text-parchment'
                              }
                            >
                              {val}
                            </span>
                            {isBetter && <span className="text-emerald-400 text-[8px]">▲</span>}
                            {isWorse && <span className="text-red-400 text-[8px]">▼</span>}
                          </div>
                          <div className="h-1 rounded-full bg-surface overflow-hidden">
                            <motion.div
                              className={`h-full rounded-full ${
                                isBetter ? 'bg-emerald-500' : isWorse ? 'bg-red-700' : 'bg-steel'
                              }`}
                              initial={{ width: '0%' }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 * vi }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* Traits em comum */}
            <TraitsOverlap cards={cards} />
          </div>
        </div>
      </motion.div>
    </>
  );
}

function TraitsOverlap({ cards }: { cards: CollectionCard[] }) {
  const allTraitNames = cards.map((c) => new Set(c.traits.map((t) => t.name)));
  const shared =
    cards[0]?.traits
      .filter((t) => allTraitNames.every((set) => set.has(t.name)))
      .map((t) => t.name) ?? [];

  if (shared.length === 0) return null;

  return (
    <div className="border-t border-border pt-3">
      <p className="text-muted text-[9px] uppercase tracking-wider mb-2">Traits em comum</p>
      <div className="flex flex-wrap gap-1.5">
        {shared.map((name) => (
          <span
            key={name}
            className="px-2 py-0.5 rounded-full border border-gold/30 text-gold text-[9px] font-semibold bg-gold/5"
          >
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}
