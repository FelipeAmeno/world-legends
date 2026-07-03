'use client';

import { RARITY_VISUAL } from '@/lib/collection-data';
import { formatPrice } from '@/lib/marketplace/filters';
import type { MarketListing } from '@/lib/marketplace/types';
import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

// ─── ListingGrid ──────────────────────────────────────────────────────────────

type GridProps = {
  listings: MarketListing[];
  watchlist: ReadonlySet<string>;
  onSelect: (l: MarketListing) => void;
  onWatch: (id: string) => void;
};

export function ListingGrid({ listings, watchlist, onSelect, onWatch }: GridProps) {
  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <span className="text-5xl">🔍</span>
        <p className="text-muted text-sm">Nenhuma listagem encontrada</p>
        <p className="text-muted/50 text-xs">Tente ajustar os filtros</p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto h-full" style={{ WebkitOverflowScrolling: 'touch' }}>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4">
        {listings.map((l, i) => (
          <motion.div
            key={l.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: i < 12 ? i * 0.03 : 0 }}
          >
            <ListingCard
              listing={l}
              inWatchlist={watchlist.has(l.id)}
              onSelect={onSelect}
              onWatch={onWatch}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── ListingCard ──────────────────────────────────────────────────────────────

type CardProps = {
  listing: MarketListing;
  inWatchlist: boolean;
  onSelect: (l: MarketListing) => void;
  onWatch: (id: string) => void;
};

const RARITY_GLOW: Record<string, string> = {
  common: 'rgba(150,150,150,0.4)',
  rare: 'rgba(147,51,234,0.7)',
  elite: 'rgba(59,130,246,0.8)',
  legendary: 'rgba(201,168,76,0.9)',
  ultra: 'rgba(236,72,153,0.9)',
  world_cup_hero: 'rgba(240,244,255,1)',
};

export function ListingCard({ listing, inWatchlist, onSelect, onWatch }: CardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVis] = useState(false);
  const visual = RARITY_VISUAL[listing.rarityCode];
  const glow = RARITY_GLOW[listing.rarityCode];

  // Lazy load
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          setVis(true);
          obs.disconnect();
        }
      },
      { threshold: 0.05 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref}>
      {visible ? (
        <motion.div
          className={[
            'relative rounded-2xl border-2 overflow-hidden cursor-pointer group',
            visual.bgClass,
            visual.borderClass,
            visual.glowClass,
          ].join(' ')}
          style={{ aspectRatio: '3/4' }}
          onClick={() => onSelect(listing)}
          whileHover={{ scale: 1.03, y: -2 }}
          whileTap={{ scale: 0.97 }}
        >
          {/* Badges */}
          <div className="absolute top-1.5 left-1.5 flex flex-col gap-0.5 z-10">
            {listing.isNew && (
              <span className="text-[7px] font-black px-1 py-0.5 rounded bg-emerald-600/80 text-white uppercase">
                NOVO
              </span>
            )}
            {listing.isTrending && (
              <span className="text-[7px] font-black px-1 py-0.5 rounded bg-orange-600/80 text-white uppercase">
                🔥
              </span>
            )}
            {listing.type === 'auction' && (
              <span className="text-[7px] font-black px-1 py-0.5 rounded bg-purple-700/80 text-white uppercase">
                LEILÃO
              </span>
            )}
          </div>

          {/* Watchlist */}
          <div
            className="absolute top-1.5 right-1.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onWatch(listing.id);
            }}
          >
            <button
              className="w-6 h-6 rounded-full text-xs flex items-center justify-center"
              style={{ background: 'rgba(0,0,0,0.7)' }}
            >
              {inWatchlist ? '❤️' : '🤍'}
            </button>
          </div>

          {/* Card art / OVR */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="absolute inset-0 opacity-20"
              style={{
                background: `radial-gradient(ellipse at 50% 25%, ${glow}, transparent 70%)`,
              }}
            />
            <p
              className="font-display leading-none relative z-10"
              style={{
                fontSize: 42,
                background: `linear-gradient(180deg, #ffffff, ${glow})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: `drop-shadow(0 0 8px ${glow})`,
              }}
            >
              {listing.cardOvr}
            </p>
          </div>

          {/* Bottom info */}
          <div
            className="absolute bottom-0 left-0 right-0 px-2 pb-2 pt-4"
            style={{ background: 'linear-gradient(0deg, rgba(0,0,0,0.9), transparent)' }}
          >
            <p className="text-parchment text-[9px] font-bold truncate">{listing.cardName}</p>
            <p className="text-white/30 text-[7px]">
              {listing.position} · {listing.flagEmoji}
            </p>

            {/* Preço */}
            <div className="flex items-center justify-between mt-1">
              <p className="font-display text-sm gold-text leading-none">
                {listing.type === 'auction'
                  ? listing.auction?.currentBid.label
                  : listing.price.label}
              </p>
              {listing.type === 'auction' && listing.auction && (
                <span className="text-[7px] text-purple-300">{listing.auction.timeLeft}</span>
              )}
            </div>

            {/* Desconto */}
            {listing.originalPrice && (
              <p className="text-[7px] text-muted line-through">{listing.originalPrice.label}</p>
            )}
          </div>

          {/* Hover overlay: "Ver detalhes" */}
          <div
            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: 'rgba(0,0,0,0.3)' }}
          >
            <span className="text-white/80 text-[9px] font-bold bg-black/50 px-2 py-1 rounded-full">
              Ver detalhes →
            </span>
          </div>
        </motion.div>
      ) : (
        <div
          className={`rounded-2xl border ${visual.borderClass} bg-surface/20 animate-pulse`}
          style={{ aspectRatio: '3/4' }}
        />
      )}
    </div>
  );
}
