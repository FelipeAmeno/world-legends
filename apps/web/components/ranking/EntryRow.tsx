'use client';

import type { LeaderboardEntry } from '@/lib/leaderboard/types';
import type { CategoryConfig } from '@/lib/leaderboard/types';
import { motion } from 'framer-motion';

// ─── EntryRow ─────────────────────────────────────────────────────────────────

type RowProps = {
  entry: LeaderboardEntry;
  metricLabel: string;
  metricValue: string;
};

const RANK_COLOR: Record<number, string> = {
  1: 'text-yellow-400',
  2: 'text-slate-300',
  3: 'text-amber-600',
};

export function EntryRow({ entry, metricLabel, metricValue }: RowProps) {
  const isTop = entry.rank <= 3;

  return (
    <div
      className={[
        'flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all',
        entry.isCurrentUser
          ? 'border-gold/30 bg-gold/5'
          : 'border-border bg-surface hover:border-border/80',
      ].join(' ')}
    >
      {/* Rank */}
      <div className="w-7 text-center shrink-0">
        <span
          className={`font-display text-lg leading-none ${RANK_COLOR[entry.rank] ?? 'text-muted'}`}
        >
          {entry.rank}
        </span>
      </div>

      {/* Avatar */}
      <div className="relative shrink-0">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm border"
          style={{
            background: entry.isCurrentUser
              ? 'linear-gradient(135deg, #8c6f27, #c9a84c)'
              : 'rgba(255,255,255,0.06)',
            borderColor: entry.isCurrentUser ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.08)',
            color: entry.isCurrentUser ? '#07080f' : '#e2ddd4',
          }}
        >
          {entry.avatarInitial}
        </div>
        {/* Online dot */}
        {entry.isOnline && (
          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-obsidian" />
        )}
      </div>

      {/* Name + country */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p
            className={`text-sm font-bold truncate ${entry.isCurrentUser ? 'gold-text' : 'text-parchment'}`}
          >
            {entry.username}
            {entry.isCurrentUser && ' (você)'}
          </p>
          {entry.isFriend && (
            <span className="text-[7px] font-bold uppercase px-1 py-0.5 rounded bg-blue-900/40 border border-blue-700/40 text-blue-400 shrink-0">
              amigo
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[10px]">{entry.flagEmoji}</span>
          <span className="text-muted text-[10px]">Nv {entry.level}</span>
        </div>
      </div>

      {/* Metric */}
      <div className="shrink-0 text-right">
        <p
          className={`font-display text-lg leading-none ${
            entry.isCurrentUser ? 'gold-text' : 'text-parchment'
          }`}
        >
          {metricValue.split(' ')[0]}
        </p>
        <p className="text-muted text-[8px]">{metricLabel}</p>
      </div>
    </div>
  );
}

// ─── UserRankCard — fixo no bottom ───────────────────────────────────────────

type UserCardProps = {
  entry: LeaderboardEntry;
  cfg: CategoryConfig;
  totalPlayers: number;
};

export function UserRankCard({ entry, cfg, totalPlayers }: UserCardProps) {
  const pct = Math.round(((totalPlayers - entry.rank) / Math.max(1, totalPlayers)) * 100);

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="glass border border-gold/25 rounded-2xl overflow-hidden"
      style={{ boxShadow: '0 -4px 20px rgba(0,0,0,0.5), 0 0 20px rgba(201,168,76,0.08)' }}
    >
      {/* Progress bar top */}
      <div className="h-0.5 bg-surface">
        <motion.div
          className="h-full bg-gradient-to-r from-gold-dim to-gold"
          initial={{ width: '0%' }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
        />
      </div>

      <div className="flex items-center gap-3 px-4 py-3">
        {/* Avatar */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-base border-2 shrink-0"
          style={{
            background: 'linear-gradient(135deg, #c9a84c, #e6c85a)',
            borderColor: 'rgba(201,168,76,0.4)',
            color: '#07080f',
          }}
        >
          {entry.avatarInitial}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-parchment text-sm font-bold truncate">{entry.username}</p>
            <span className="text-[7px] font-black uppercase px-1.5 py-0.5 rounded-full bg-gold/15 border border-gold/30 text-gold">
              VOCÊ
            </span>
          </div>
          <p className="text-muted text-[9px] mt-0.5">
            Top {100 - pct}% · acima de {pct}% dos jogadores
          </p>
        </div>

        {/* Rank + metric */}
        <div className="shrink-0 text-right">
          <p className="font-display text-2xl gold-text leading-none">#{entry.rank}</p>
          <p className="text-muted text-[9px] mt-0.5">{cfg.formatter(entry)}</p>
        </div>
      </div>
    </motion.div>
  );
}
