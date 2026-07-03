'use client';
import type { Season } from '@/lib/profile-data';
// ── SeasonsHistory ────────────────────────────────────────────────────────────
import { motion } from 'framer-motion';

const POS_MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };
const POS_COLOR: Record<number, string> = {
  1: 'text-yellow-400',
  2: 'text-slate-300',
  3: 'text-amber-600',
};

export function SeasonsHistory({ seasons }: { seasons: Season[] }) {
  return (
    <section>
      <h2 className="font-display text-xl text-parchment tracking-wider mb-3">🗓️ Temporadas</h2>
      <div className="space-y-2">
        {seasons.map((s, i) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07 }}
            className={[
              'flex items-center gap-3 p-3 rounded-xl border',
              s.isActive ? 'border-gold/30 bg-gold/5' : 'border-border bg-surface',
            ].join(' ')}
          >
            {/* Position */}
            <div className="shrink-0 w-10 text-center">
              <span className="text-xl">{POS_MEDAL[s.position] ?? '🔘'}</span>
              <p
                className={`font-display text-lg leading-none ${POS_COLOR[s.position] ?? 'text-muted'}`}
              >
                {s.position}º
              </p>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-parchment text-sm font-bold">{s.label}</p>
                {s.isActive && (
                  <span className="text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/30">
                    ATIVO
                  </span>
                )}
              </div>
              <p className="text-muted text-[10px]">
                {s.wins}V · {s.losses}D · OVR máx {s.maxOvr}
              </p>
            </div>

            {/* Reward */}
            <div className="shrink-0 text-right">
              <span className="text-sm">{s.rewardIcon}</span>
              <p className="text-gold text-[10px] font-bold">{s.reward}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
