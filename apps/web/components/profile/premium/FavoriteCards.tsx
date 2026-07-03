'use client';

import type { CollectionCard } from '@/lib/collection-data';
import { RARITY_VISUAL } from '@/lib/collection-data';
import { loadFavorites } from '@/lib/collection-filters';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

type Props = { allCards: CollectionCard[] };

const RARITY_GLOW: Record<string, string> = {
  common: 'rgba(150,150,150,0.4)',
  rare: 'rgba(147,51,234,0.7)',
  elite: 'rgba(59,130,246,0.8)',
  legendary: 'rgba(201,168,76,0.9)',
  ultra: 'rgba(236,72,153,0.9)',
  world_cup_hero: 'rgba(240,244,255,1)',
};

export function FavoriteCards({ allCards }: Props) {
  const [favCards, setFavCards] = useState<CollectionCard[]>([]);

  useEffect(() => {
    const favIds = loadFavorites();
    setFavCards(allCards.filter((c) => favIds.has(c.cardId)));
  }, [allCards]);

  if (favCards.length === 0) {
    return (
      <section>
        <h2 className="font-display text-xl text-parchment tracking-wider mb-3">❤️ Favoritas</h2>
        <div className="glass rounded-xl p-5 text-center">
          <p className="text-muted text-sm">Nenhuma carta favoritada ainda.</p>
          <p className="text-muted/60 text-xs mt-1">
            Abra a Coleção e clique em ❤️ nas cartas que gostar.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="font-display text-xl text-parchment tracking-wider mb-3">
        ❤️ Favoritas{' '}
        <span className="text-muted font-body font-normal text-xs">({favCards.length})</span>
      </h2>

      <div className="flex gap-3 overflow-x-auto pb-2 scroll-x-hide">
        {favCards.map((card, i) => {
          const visual = RARITY_VISUAL[card.rarityCode];
          const glow = RARITY_GLOW[card.rarityCode];

          return (
            <motion.div
              key={card.cardId}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: i * 0.07 }}
              className={[
                'relative shrink-0 w-28 h-36 rounded-2xl border-2 flex flex-col overflow-hidden',
                visual.bgClass,
                visual.borderClass,
              ].join(' ')}
              style={{ boxShadow: `0 0 20px ${glow}` }}
            >
              {/* Rarity */}
              <div className="px-2 pt-2">
                <span className={`text-[7px] font-black uppercase ${visual.textClass}`}>
                  {card.rarityCode === 'world_cup_hero'
                    ? 'WCH'
                    : card.rarityLabel.slice(0, 3).toUpperCase()}
                </span>
              </div>

              {/* OVR */}
              <div className="flex-1 flex items-center justify-center">
                <p
                  className="font-display leading-none"
                  style={{
                    fontSize: 36,
                    background: `linear-gradient(180deg, #ffffff, ${glow})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: `drop-shadow(0 0 6px ${glow})`,
                  }}
                >
                  {card.overall}
                </p>
              </div>

              {/* Name */}
              <div
                className="px-1.5 pb-2 text-center"
                style={{ background: 'linear-gradient(0deg, rgba(0,0,0,0.85), transparent)' }}
              >
                <p className="text-parchment font-bold text-[8px] leading-tight truncate">
                  {card.displayName}
                </p>
                <p className="text-white/30 text-[7px] mt-0.5">{card.position}</p>
              </div>

              {/* Heart */}
              <div className="absolute top-1.5 right-1.5">
                <span className="text-xs drop-shadow">❤️</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
