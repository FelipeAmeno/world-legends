'use client';

import { PlayerCard } from '@/components/cards/PlayerCard';
import type { CollectionCard } from '@/lib/collection-data';
import { loadFavorites } from '@/lib/collection-filters';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

type Props = { allCards: CollectionCard[] };

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
        {favCards.map((card, i) => (
          <motion.div
            key={card.cardId}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: i * 0.07 }}
            className="relative shrink-0"
          >
            <PlayerCard card={card} size="sm" glow />
            {/* Heart — canto inferior esquerdo, longe do OVR e da faixa de raridade */}
            <div className="absolute bottom-1.5 left-1.5 z-10">
              <span className="text-xs drop-shadow">❤️</span>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
