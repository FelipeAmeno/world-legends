'use client';

import { useGameState } from '@/lib/game-context';

const LOG_COLORS = {
  info: 'text-muted',
  win: 'text-emerald-400',
  reward: 'text-gold',
  pack: 'text-purple-400',
  level: 'text-amber-400',
};

const LOG_ICONS = {
  info: 'ℹ',
  win: '🏆',
  reward: '💰',
  pack: '📦',
  level: '⭐',
};

type Props = { maxItems?: number; className?: string };

export function ActivityFeed({ maxItems = 5, className = '' }: Props) {
  const state = useGameState();

  if (state.activityLog.length === 0) return null;

  const recent = [...state.activityLog].reverse().slice(0, maxItems);

  return (
    <div className={`space-y-1 ${className}`}>
      {recent.map((entry, i) => (
        <div key={i} className="flex items-start gap-2 py-1">
          <span className="text-sm shrink-0">{LOG_ICONS[entry.type]}</span>
          <p className={`text-xs leading-snug ${LOG_COLORS[entry.type]}`}>{entry.text}</p>
        </div>
      ))}
    </div>
  );
}
