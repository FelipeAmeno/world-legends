'use client';

import type { Achievement } from '@/lib/profile-data';
import { TITLE_TIER_BG } from '@/lib/profile-data';
import { motion } from 'framer-motion';

const TIER_BAR: Record<string, string> = {
  bronze: 'from-amber-700 to-amber-500',
  silver: 'from-slate-600 to-slate-400',
  gold: 'from-amber-600 to-yellow-400',
  platinum: 'from-cyan-700 to-cyan-400',
  legendary: 'from-purple-700 to-gold-dim',
};

export function AchievementsGrid({ achievements }: { achievements: Achievement[] }) {
  const done = achievements.filter((a) => a.done).length;
  const total = achievements.length;
  const pct = Math.round((done / total) * 100);

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-xl text-parchment tracking-wider">🎯 Conquistas</h2>
        <span className="text-muted text-xs">
          {done}/{total} · {pct}%
        </span>
      </div>

      {/* Overall progress */}
      <div className="h-1.5 bg-surface rounded-full overflow-hidden mb-4">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-gold-dim to-gold"
          initial={{ width: '0%' }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {achievements.map((a, i) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className={[
              'relative rounded-xl border overflow-hidden',
              a.done
                ? `bg-gradient-to-br ${TITLE_TIER_BG[a.tier]} border-white/10`
                : 'bg-surface border-border',
            ].join(' ')}
          >
            <div className="flex items-center gap-3 p-3">
              <span className={`text-2xl ${!a.done ? 'grayscale opacity-40' : ''}`}>{a.icon}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-bold ${a.done ? 'text-parchment' : 'text-muted'}`}>
                  {a.label}
                </p>
                <p className="text-[9px] text-white/30">{a.desc}</p>

                {!a.done && (
                  <div className="mt-1.5">
                    <div className="h-1 bg-black/30 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full bg-gradient-to-r ${TIER_BAR[a.tier]}`}
                        initial={{ width: '0%' }}
                        animate={{ width: `${a.progress}%` }}
                        transition={{ duration: 0.8, delay: i * 0.04 }}
                      />
                    </div>
                    <p className="text-[8px] text-white/25 mt-0.5">
                      {a.current}/{a.target}
                    </p>
                  </div>
                )}
              </div>
              {a.done && <span className="text-emerald-400 text-sm shrink-0">✓</span>}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
