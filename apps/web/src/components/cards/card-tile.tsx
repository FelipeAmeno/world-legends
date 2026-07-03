'use client';

import Image from 'next/image';
import { cn } from '../../lib/utils';
import type { RarityCode } from '@world-legends/types';

export type CardTileProps = {
  cardId:      string;
  knownAs:     string;
  position:    string;
  overall:     number;
  rarityCode:  RarityCode;
  artworkUrl?: string | null;
  form?:       number;
  isInjured?:  boolean;
  isSuspended?: boolean;
  onClick?:    () => void;
  selected?:   boolean;
  compact?:    boolean;
};

const RARITY_CLASSES: Record<RarityCode, string> = {
  common:       'card-rarity-common',
  rare:         'card-rarity-rare',
  elite:        'card-rarity-elite',
  legendary:    'card-rarity-legendary',
  ultra:        'card-rarity-ultra',
  world_cup_hero: 'card-rarity-wch',
  // goat não é RarityCode, mas defensivo
} as Record<string, string>;

const RARITY_LABELS: Record<RarityCode, string> = {
  common:       'COM',
  rare:         'RAR',
  elite:        'ELI',
  legendary:    'LEN',
  ultra:        'ULT',
  world_cup_hero: 'WCH',
} as Record<string, string>;

export function CardTile({
  knownAs, position, overall, rarityCode,
  artworkUrl, form = 0, isInjured, isSuspended,
  onClick, selected, compact,
}: CardTileProps) {
  const rarityClass = RARITY_CLASSES[rarityCode] ?? 'card-rarity-common';
  const isLegendary = ['legendary', 'ultra', 'world_cup_hero'].includes(rarityCode);

  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-lg border-2 transition-all duration-200',
        'hover:scale-105 hover:shadow-lg active:scale-95',
        rarityClass,
        compact ? 'w-16 h-20' : 'w-24 h-32',
        selected && 'ring-2 ring-primary ring-offset-1 ring-offset-background',
        (isInjured || isSuspended) && 'opacity-60',
      )}
    >
      {/* Arte da carta */}
      <div className="relative flex-1 overflow-hidden">
        {artworkUrl ? (
          <Image
            src={artworkUrl}
            alt={knownAs}
            fill
            className="object-cover object-top"
            sizes={compact ? '64px' : '96px'}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-2xl">
            ⚽
          </div>
        )}
        {/* Shimmer para lendárias */}
        {isLegendary && <div className="absolute inset-0 card-shimmer pointer-events-none" />}
        {/* Status overlay */}
        {isInjured   && <div className="absolute top-0 right-0 p-0.5 text-xs">🩹</div>}
        {isSuspended && <div className="absolute top-0 right-0 p-0.5 text-xs">🟨</div>}
      </div>

      {/* Rodapé */}
      <div className="flex items-center justify-between bg-black/60 px-1 py-0.5">
        <div className="flex flex-col leading-none">
          <span className={cn(
            'font-bold leading-none text-white',
            compact ? 'text-[9px]' : 'text-[10px]',
          )}>
            {knownAs.length > (compact ? 6 : 10)
              ? `${knownAs.slice(0, compact ? 6 : 10)}…`
              : knownAs}
          </span>
          {!compact && (
            <span className="text-[8px] text-muted-foreground">{position}</span>
          )}
        </div>
        <div className="text-right">
          <div className={cn('font-black text-white leading-none', compact ? 'text-sm' : 'text-base')}>
            {overall}
          </div>
          {!compact && (
            <div className="text-[8px] text-muted-foreground">{RARITY_LABELS[rarityCode]}</div>
          )}
        </div>
      </div>

      {/* Form indicator */}
      {form !== 0 && (
        <div className={cn(
          'absolute top-1 left-1 rounded text-[8px] font-bold px-0.5',
          form > 0 ? 'bg-green-500/80 text-white' : 'bg-red-500/80 text-white',
        )}>
          {form > 0 ? `+${form}` : form}
        </div>
      )}
    </button>
  );
}
