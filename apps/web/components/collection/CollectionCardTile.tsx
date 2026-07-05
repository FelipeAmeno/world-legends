'use client';

import { PlayerCard } from '@/components/cards/PlayerCard';
import type { CollectionCard } from '@/lib/collection-data';
import { RARITY_VISUAL } from '@/lib/collection-data';
import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

type Props = {
  card: CollectionCard;
  mode: 'grid' | 'list';
  isFav: boolean;
  isComparing: boolean;
  onSelect: (card: CollectionCard) => void;
  onFav: (cardId: string) => void;
  onCompare: (card: CollectionCard) => void;
};

function useInView() {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold: 0.05 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, inView };
}

const RARITY_GLOW: Record<string, string> = {
  common: 'rgba(150,150,150,0.4)',
  rare: 'rgba(147,51,234,0.6)',
  elite: 'rgba(59,130,246,0.7)',
  legendary: '#c9a84c',
  ultra: '#ec4899',
  world_cup_hero: '#e2e8f0',
};

export function CollectionCardTile({
  card,
  mode,
  isFav,
  isComparing,
  onSelect,
  onFav,
  onCompare,
}: Props) {
  const { ref, inView } = useInView();
  const visual = RARITY_VISUAL[card.rarityCode];

  if (mode === 'list') {
    return (
      <div
        ref={ref}
        className={[
          'flex items-center gap-3 rounded-xl border px-3 py-2 cursor-pointer transition-all',
          'hover:border-gold-dim/50 hover:bg-white/[0.02]',
          isComparing
            ? 'border-blue-500/50 bg-blue-900/10'
            : `${visual.borderClass} ${visual.bgClass}`,
        ].join(' ')}
        onClick={() => onSelect(card)}
      >
        <div
          className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 ${visual.borderClass}`}
          style={{ background: 'rgba(0,0,0,0.4)' }}
        >
          <span className={`font-display text-lg leading-none ${visual.textClass}`}>
            {card.overall}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-parchment text-sm font-semibold truncate">{card.displayName}</p>
          <div className="flex items-center gap-1.5 text-[9px] text-muted">
            <span>{card.position}</span>
            <span>·</span>
            <span>
              {card.flagEmoji} {card.nationality}
            </span>
            <span>·</span>
            <span>{card.era}</span>
          </div>
        </div>
        <span className={`text-[8px] font-bold uppercase shrink-0 ${visual.textClass}`}>
          {card.rarityCode === 'world_cup_hero' ? 'WCH' : card.rarityLabel.slice(0, 3)}
        </span>
        <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onFav(card.cardId)}
            className="w-6 h-6 text-xs flex items-center justify-center"
          >
            {isFav ? '❤️' : '🤍'}
          </button>
          <button
            onClick={() => onCompare(card)}
            className={`w-6 h-6 text-xs flex items-center justify-center rounded ${isComparing ? 'text-blue-400' : 'text-muted'}`}
          >
            ⚖
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={ref}>
      {inView ? (
        <motion.div
          className="relative cursor-pointer group"
          onClick={() => onSelect(card)}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          whileHover={{ scale: 1.04, y: -3 }}
          whileTap={{ scale: 0.96 }}
          style={{ display: 'inline-block', width: '100%' }}
        >
          <PlayerCard card={card} size="md" glow />

          {/* Hover actions — overlay on top of card */}
          <div
            className="absolute top-1 right-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => onFav(card.cardId)}
              className="w-6 h-6 rounded-full text-xs flex items-center justify-center"
              style={{ background: 'rgba(0,0,0,0.75)' }}
            >
              {isFav ? '❤️' : '🤍'}
            </button>
            <button
              onClick={() => onCompare(card)}
              className={`w-6 h-6 rounded-full text-[11px] flex items-center justify-center ${isComparing ? 'text-blue-400' : 'text-white/60'}`}
              style={{ background: 'rgba(0,0,0,0.75)' }}
            >
              ⚖
            </button>
          </div>

          {/* Fav indicator when not hovering */}
          {isFav && (
            <div className="absolute top-1.5 right-1.5 group-hover:opacity-0 transition-opacity z-20">
              <span className="text-xs drop-shadow">❤️</span>
            </div>
          )}

          {/* Compare border */}
          {isComparing && (
            <div className="absolute inset-0 border-2 border-blue-400 rounded-[10px] pointer-events-none z-20" />
          )}
        </motion.div>
      ) : (
        <div
          className={`rounded-xl border ${visual.borderClass} bg-surface/20 animate-pulse`}
          style={{ aspectRatio: '3/4' }}
        />
      )}
    </div>
  );
}
