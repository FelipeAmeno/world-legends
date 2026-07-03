'use client';
import { Badge } from '@/components/ui';
import type { RarityCode } from '@world-legends/types';

const LABELS: Record<string, string> = {
  common: 'Comum', rare: 'Rara', elite: 'Elite',
  legendary: 'Lendária', ultra: 'Ultra', world_cup_hero: 'World Cup Hero', goat: 'GOAT',
};
const VARIANTS: Record<string, 'common' | 'rare' | 'elite' | 'legendary' | 'ultra' | 'wch' | 'goat'> = {
  common: 'common', rare: 'rare', elite: 'elite',
  legendary: 'legendary', ultra: 'ultra', world_cup_hero: 'wch', goat: 'goat',
};

export function RarityBadge({ rarityCode }: { rarityCode: string }) {
  return (
    <Badge variant={VARIANTS[rarityCode] ?? 'secondary'}>
      {LABELS[rarityCode] ?? rarityCode}
    </Badge>
  );
}
