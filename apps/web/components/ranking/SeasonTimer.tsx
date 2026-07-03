'use client';

import type { SeasonInfo } from '@/lib/leaderboard/types';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

type Props = { season: SeasonInfo };

function formatDuration(ms: number): { days: number; hours: number; mins: number } {
  const totalSecs = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSecs / 86400);
  const hours = Math.floor((totalSecs % 86400) / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  return { days, hours, mins };
}

export function SeasonTimer({ season }: Props) {
  const [remaining, setRemaining] = useState(() => new Date(season.endsAt).getTime() - Date.now());

  useEffect(() => {
    const t = setInterval(() => {
      setRemaining(new Date(season.endsAt).getTime() - Date.now());
    }, 60_000);
    return () => clearInterval(t);
  }, [season.endsAt]);

  const { days, hours, mins } = formatDuration(remaining);
  const totalDuration = new Date(season.endsAt).getTime() - new Date(season.startsAt).getTime();
  const elapsed = totalDuration - remaining;
  const progressPct = Math.min(100, Math.round((elapsed / totalDuration) * 100));

  return (
    <div className="glass rounded-2xl border border-white/5 overflow-hidden">
      {/* Progress */}
      <div className="h-1 bg-black/30">
        <motion.div
          className="h-full bg-gradient-to-r from-gold-dim to-gold"
          initial={{ width: '0%' }}
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </div>

      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Season info */}
          <div>
            <p className="text-gold text-xs font-bold">{season.name}</p>
            <p className="text-muted text-[9px] mt-0.5">Temporada {season.number}</p>
          </div>

          {/* Countdown */}
          <div className="flex items-center gap-1.5">
            <div className="text-center">
              <p className="font-display text-xl text-parchment leading-none">{days}</p>
              <p className="text-muted text-[7px]">dias</p>
            </div>
            <span className="text-white/20 text-sm">:</span>
            <div className="text-center">
              <p className="font-display text-xl text-parchment leading-none">
                {String(hours).padStart(2, '0')}
              </p>
              <p className="text-muted text-[7px]">hrs</p>
            </div>
            <span className="text-white/20 text-sm">:</span>
            <div className="text-center">
              <p className="font-display text-xl text-parchment leading-none">
                {String(mins).padStart(2, '0')}
              </p>
              <p className="text-muted text-[7px]">min</p>
            </div>
          </div>
        </div>

        {/* Rewards */}
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/5">
          <p className="text-muted text-[9px] uppercase tracking-wider shrink-0">Recompensas</p>
          {[
            { medal: '🥇', reward: season.reward1st },
            { medal: '🥈', reward: season.reward2nd },
            { medal: '🥉', reward: season.reward3rd },
          ].map(({ medal, reward }) => (
            <div key={medal} className="flex items-center gap-1 text-[9px]">
              <span>{medal}</span>
              <span className="text-white/50 truncate max-w-[70px]">{reward}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
