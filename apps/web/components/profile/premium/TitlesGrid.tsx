'use client';
import type { Title } from '@/lib/profile-data';
import { TITLE_TIER_BG } from '@/lib/profile-data';
// ── TitlesGrid ────────────────────────────────────────────────────────────────
import { motion } from 'framer-motion';

export function TitlesGrid({ titles }: { titles: Title[] }) {
  const earned = titles.filter((t) => t.earned);
  const locked = titles.filter((t) => !t.earned);

  return (
    <section>
      <h2 className="font-display text-xl text-parchment tracking-wider mb-3">
        🏅 Títulos{' '}
        <span className="text-muted font-body font-normal text-xs">
          ({earned.length}/{titles.length})
        </span>
      </h2>

      {/* Earned */}
      <div className="flex gap-2 flex-wrap mb-3">
        {earned.map((t, i) => (
          <motion.div
            key={t.id}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 14, delay: i * 0.05 }}
            className={`relative flex flex-col items-center gap-1 px-3 py-2.5 rounded-2xl bg-gradient-to-br ${TITLE_TIER_BG[t.tier]} border border-white/10`}
            style={{ minWidth: 72 }}
            title={t.desc}
          >
            <span className="text-2xl">{t.icon}</span>
            <span className="text-[9px] font-bold text-center text-white leading-tight">
              {t.label}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Locked */}
      {locked.length > 0 && (
        <div className="flex gap-2 flex-wrap opacity-30">
          {locked.map((t) => (
            <div
              key={t.id}
              className="flex flex-col items-center gap-1 px-3 py-2.5 rounded-2xl bg-surface border border-border"
              style={{ minWidth: 72, filter: 'grayscale(1)' }}
              title={t.desc}
            >
              <span className="text-2xl opacity-40">{t.icon}</span>
              <span className="text-[9px] text-muted text-center leading-tight">{t.label}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
