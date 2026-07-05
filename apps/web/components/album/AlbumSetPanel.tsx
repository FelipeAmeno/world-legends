'use client';

import type { CollectionCard } from '@/lib/collection-data';
import type { CollectionSetDef } from '@/lib/collection-sets';
import { motion } from 'framer-motion';

type Props = {
  def: CollectionSetDef;
  ownedSet: ReadonlySet<string>;
  cardMap: Map<string, CollectionCard>;
};

const RARITY_GLOW: Record<string, string> = {
  rare: 'rgba(147,51,234,0.5)',
  elite: 'rgba(59,130,246,0.6)',
  legendary: '#c9a84c',
  ultra: '#ec4899',
  world_cup_hero: '#f1f5f9',
};

const RARITY_BG: Record<string, string> = {
  common: 'from-[#0f1017] to-[#1a1b24]',
  rare: 'from-[#0d0021] to-[#1a0038]',
  elite: 'from-[#000d1a] to-[#001a2e]',
  legendary: 'from-[#1a1000] to-[#2a1c00]',
  ultra: 'from-[#1a0020] to-[#001a30]',
  world_cup_hero: 'from-[#1a1820] to-[#0d0b12]',
};

const RARITY_BADGE_BG: Record<string, string> = {
  common: '#374151',
  rare: '#6b21a8',
  elite: '#1e40af',
  legendary: '#92400e',
  ultra: '#9d174d',
  world_cup_hero: '#334155',
};

export function AlbumSetPanel({ def, ownedSet, cardMap }: Props) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {def.requiredCardIds.map((cardId, i) => {
        const owned = ownedSet.has(cardId);
        const card = cardMap.get(cardId);
        return <AlbumSlot key={cardId} cardId={cardId} card={card} owned={owned} index={i} />;
      })}
    </div>
  );
}

// ─── Slot individual ──────────────────────────────────────────────────────────

type SlotProps = {
  cardId: string;
  card: CollectionCard | undefined;
  owned: boolean;
  index: number;
};

function AlbumSlot({ cardId, card, owned, index }: SlotProps) {
  const glow = card ? (RARITY_GLOW[card.rarityCode] ?? 'rgba(255,255,255,0.2)') : null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
      className={[
        'relative aspect-[2/3] rounded-xl overflow-hidden border transition-all',
        owned ? 'border-white/20 shadow-lg' : 'border-white/5 bg-black/40',
      ].join(' ')}
      {...(owned && glow ? { style: { boxShadow: `0 0 14px ${glow}` } } : {})}
    >
      {owned && card ? (
        /* Owned: show card */
        <div
          className={[
            'w-full h-full flex flex-col items-center justify-center p-1.5 relative',
            'bg-gradient-to-br',
            RARITY_BG[card.rarityCode] ?? RARITY_BG.common,
          ].join(' ')}
        >
          {/* Rarity badge */}
          <div
            className="absolute top-1 right-1 text-[7px] font-black px-1 py-0.5 rounded-full text-white"
            style={{ background: RARITY_BADGE_BG[card.rarityCode] ?? '#334155' }}
          >
            {card.rarityCode === 'world_cup_hero'
              ? 'WCH'
              : card.rarityCode.toUpperCase().slice(0, 3)}
          </div>

          {/* Overall */}
          <div className="absolute top-1 left-1 font-display text-[10px] font-black text-white/90">
            {card.overall}
          </div>

          {/* Player name */}
          <div className="flex-1 flex items-center justify-center">
            <span className="text-2xl" role="img" aria-label={card.displayName}>
              {card.flagEmoji}
            </span>
          </div>

          <p className="text-[8px] font-bold text-white text-center leading-tight truncate w-full">
            {card.displayName.split(' ')[0]}
          </p>
          <p className="text-[7px] text-white/60 text-center">{card.position}</p>
        </div>
      ) : (
        /* Not owned: show empty slot with silhouette */
        <div className="w-full h-full flex flex-col items-center justify-center p-1.5">
          {/* Silhouette */}
          <div className="flex-1 flex items-center justify-center opacity-15">
            <svg
              viewBox="0 0 40 60"
              fill="currentColor"
              className="w-8 h-12 text-white"
              aria-hidden="true"
            >
              <circle cx="20" cy="13" r="7" />
              <path d="M6 55 Q8 34 20 32 Q32 34 34 55 Z" />
            </svg>
          </div>

          {/* Slot number */}
          <p className="text-[8px] text-white/20 font-bold">
            #{(index + 1).toString().padStart(2, '0')}
          </p>
        </div>
      )}
    </motion.div>
  );
}
