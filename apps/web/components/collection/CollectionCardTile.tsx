'use client';

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
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className={[
            'relative rounded-xl border overflow-hidden cursor-pointer group',
            visual.bgClass,
            isComparing ? 'border-blue-400' : visual.borderClass,
            visual.glowClass,
          ].join(' ')}
          style={{ aspectRatio: '3/4' }}
          onClick={() => onSelect(card)}
          whileHover={{ scale: 1.04, y: -3 }}
          whileTap={{ scale: 0.96 }}
        >
          {/* Glow radial */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at 50% 25%, ${RARITY_GLOW[card.rarityCode]}, transparent 65%)`,
            }}
          />

          {/* Rarity */}
          <div className="absolute top-1.5 left-1.5">
            <span
              className={`text-[7px] font-black uppercase px-1 py-0.5 rounded ${visual.textClass}`}
              style={{ background: 'rgba(0,0,0,0.65)' }}
            >
              {card.rarityCode === 'world_cup_hero'
                ? 'WCH'
                : card.rarityLabel.slice(0, 3).toUpperCase()}
            </span>
          </div>

          {/* Hover actions */}
          <div
            className="absolute top-1.5 right-1.5 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => onFav(card.cardId)}
              className="w-6 h-6 rounded-full text-xs flex items-center justify-center"
              style={{ background: 'rgba(0,0,0,0.7)' }}
            >
              {isFav ? '❤️' : '🤍'}
            </button>
            <button
              onClick={() => onCompare(card)}
              className={`w-6 h-6 rounded-full text-[11px] flex items-center justify-center ${isComparing ? 'text-blue-400' : 'text-white/60'}`}
              style={{ background: 'rgba(0,0,0,0.7)' }}
            >
              ⚖
            </button>
          </div>

          {/* OVR */}
          <div className="absolute inset-0 flex items-center justify-center">
            <p
              className="font-display"
              style={{
                fontSize: '42px',
                lineHeight: 1,
                background: `linear-gradient(180deg, #ffffff 0%, ${RARITY_GLOW[card.rarityCode]} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: `drop-shadow(0 0 8px ${RARITY_GLOW[card.rarityCode]})`,
              }}
            >
              {card.overall}
            </p>
          </div>

          {/* Bottom info */}
          <div
            className="absolute bottom-0 left-0 right-0 px-1.5 pb-2 pt-6"
            style={{ background: 'linear-gradient(0deg, rgba(0,0,0,0.85), transparent)' }}
          >
            <p className="text-parchment text-[9px] font-bold leading-tight truncate text-center">
              {card.displayName}
            </p>
            <p className="text-muted text-[7px] text-center mt-0.5">
              {card.position} · {card.flagEmoji}
            </p>
          </div>

          {/* Fav indicator */}
          {isFav && !isComparing && (
            <div className="absolute top-1.5 right-1.5">
              <span className="text-xs drop-shadow">❤️</span>
            </div>
          )}

          {/* Compare border */}
          {isComparing && (
            <div className="absolute inset-0 border-2 border-blue-400 rounded-xl pointer-events-none" />
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
