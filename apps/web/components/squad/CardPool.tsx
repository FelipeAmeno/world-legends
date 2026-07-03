'use client';

import { OvrDisplay } from '@/components/ui/OvrDisplay';
import { RarityBadge } from '@/components/ui/RarityBadge';
import type { CollectionCard } from '@/lib/collection-data';
import { RARITY_VISUAL, RARITY_VISUAL as RV } from '@/lib/collection-data';
import type { RarityCode } from '@world-legends/types';
import { useState } from 'react';

type Props = {
  cards: CollectionCard[];
  dragOver: boolean;
  onDragStart: (cardId: string, e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
};

export function CardPool({
  cards,
  dragOver,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
}: Props) {
  const [search, setSearch] = useState('');

  const filtered = cards.filter(
    (c) =>
      !search.trim() ||
      c.displayName.toLowerCase().includes(search.toLowerCase()) ||
      c.position.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <section
      className={[
        'bg-surface border rounded-xl transition-all',
        dragOver ? 'border-gold/60 bg-gold/5' : 'border-border',
      ].join(' ')}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <span className="font-display text-base text-parchment tracking-wider">
          DISPONÍVEIS
          <span className="text-muted font-body font-normal text-xs ml-2 tracking-normal">
            {filtered.length} cartas
          </span>
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar…"
          className="bg-obsidian border border-border rounded-lg px-2.5 py-1 text-xs
                     text-parchment placeholder:text-muted/60 focus:outline-none
                     focus:border-gold-dim w-32"
        />
      </div>

      {/* Drop area hint */}
      {dragOver && (
        <div className="mx-4 mb-2 py-2 rounded-lg border border-dashed border-gold/40 text-center">
          <p className="text-gold text-xs">Solte para devolver ao pool</p>
        </div>
      )}

      {/* Cards */}
      <div className="px-4 pb-3 flex flex-wrap gap-2 max-h-48 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-muted text-xs py-4 w-full text-center">
            {search ? 'Nenhuma carta encontrada' : 'Todos os jogadores estão escalados!'}
          </p>
        ) : (
          filtered.map((card) => (
            <PoolCard
              key={card.cardId}
              card={card}
              onDragStart={(e) => onDragStart(card.cardId, e)}
              onDragEnd={onDragEnd}
            />
          ))
        )}
      </div>
    </section>
  );
}

// ─── PoolCard ─────────────────────────────────────────────────────────────────

function PoolCard({
  card,
  onDragStart,
  onDragEnd,
}: {
  card: CollectionCard;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}) {
  const visual = RARITY_VISUAL[card.rarityCode];

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={[
        'flex items-center gap-2 px-2 py-1.5 rounded-lg border cursor-grab active:cursor-grabbing',
        'transition-all duration-150 hover:scale-[1.02] hover:z-10',
        visual.bgClass,
        visual.borderClass,
        visual.glowClass,
      ].join(' ')}
      title={`${card.displayName} · ${card.position} · ${card.overall} OVR`}
    >
      {/* OVR */}
      <div
        className={[
          'w-7 h-7 rounded-full border flex items-center justify-center shrink-0',
          'bg-obsidian/80',
          visual.borderClass,
        ].join(' ')}
      >
        <OvrDisplay value={card.overall} size="sm" />
      </div>

      {/* Info */}
      <div className="min-w-0">
        <p className="text-parchment text-[10px] font-semibold leading-tight truncate">
          {card.displayName}
        </p>
        <div className="flex items-center gap-1">
          <span className="text-muted text-[8px]">{card.position}</span>
          <span className="text-muted text-[7px]">·</span>
          <span className={`text-[8px] font-bold ${visual.textClass}`}>
            {card.rarityCode === 'world_cup_hero'
              ? 'WCH'
              : card.rarityLabel.slice(0, 3).toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
}
