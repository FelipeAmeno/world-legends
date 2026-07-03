'use client';

import type { DrawnCard } from '@/lib/pack-logic';
import { useEffect, useState } from 'react';
import { FlippableCard } from './FlippableCard';

type Props = {
  cards: DrawnCard[];
  onComplete: () => void; // todos revelados
};

export function RevealGrid({ cards, onComplete }: Props) {
  const [flipped, setFlipped] = useState<Set<number>>(new Set());
  const [canRevealAll, setCanRevealAll] = useState(false);

  // Liberar "revelar todas" depois de 1.5s
  useEffect(() => {
    const t = setTimeout(() => setCanRevealAll(true), 1500);
    return () => clearTimeout(t);
  }, []);

  // Verificar se todas foram reveladas
  useEffect(() => {
    if (flipped.size === cards.length && cards.length > 0) {
      const t = setTimeout(onComplete, 800);
      return () => clearTimeout(t);
    }
  }, [flipped, cards.length, onComplete]);

  const handleFlip = (idx: number) => {
    setFlipped((prev) => new Set([...prev, idx]));
  };

  const handleRevealAll = () => {
    setFlipped(new Set(cards.map((_, i) => i)));
  };

  const remaining = cards.length - flipped.size;

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Instrução */}
      <div className="text-center animate-[fadeIn_0.4s_ease-out]">
        {remaining > 0 ? (
          <>
            <p className="text-parchment text-sm font-medium">
              {flipped.size === 0
                ? 'Toque nas cartas para revelar!'
                : `${remaining} carta${remaining > 1 ? 's' : ''} restante${remaining > 1 ? 's' : ''}…`}
            </p>
            <p className="text-muted text-xs mt-0.5">
              {flipped.size}/{cards.length} reveladas
            </p>
          </>
        ) : (
          <p className="text-gold text-sm font-semibold animate-[fadeIn_0.3s_ease-out]">
            ✨ Pack revelado!
          </p>
        )}
      </div>

      {/* Grade de cartas */}
      <div className="pack-card-grid flex flex-wrap justify-center gap-3 sm:gap-4">
        {cards.map((drawn, i) => (
          <FlippableCard
            key={drawn.card.cardId + i}
            drawn={drawn}
            flipped={flipped.has(i)}
            onFlip={() => handleFlip(i)}
            delay={i * 120} // entrada escalonada
          />
        ))}
      </div>

      {/* Barra de progresso de revelação */}
      <div className="w-64 h-1 bg-surface rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-gold-dim to-gold transition-all duration-500"
          style={{ width: `${(flipped.size / cards.length) * 100}%` }}
        />
      </div>

      {/* Botão "Revelar Todas" */}
      {canRevealAll && remaining > 1 && (
        <button
          onClick={handleRevealAll}
          className="text-muted text-xs border border-border/60 rounded-lg px-4 py-2
                     hover:text-parchment hover:border-gold-dim transition-all duration-200
                     animate-[fadeIn_0.5s_ease-out]"
        >
          Revelar todas de uma vez →
        </button>
      )}
    </div>
  );
}
