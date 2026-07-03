'use client';

import type { CollectionCard } from '@/lib/collection-data';
import { RARITY_VISUAL } from '@/lib/collection-data';
import { type AdvancedStats, COUNTRY_FLAGS, COUNTRY_NAMES } from '@/lib/profile-data';
import { motion } from 'framer-motion';

// ── CountriesUnlocked ──────────────────────────────────────────────────────────

export function CountriesUnlocked({ countries }: { countries: string[] }) {
  return (
    <section>
      <h2 className="font-display text-xl text-parchment tracking-wider mb-3">
        🌍 Países Desbloqueados
        <span className="text-muted font-body font-normal text-xs ml-2">
          {countries.length} nações
        </span>
      </h2>
      <div className="flex flex-wrap gap-2">
        {countries.map((code, i) => (
          <motion.div
            key={code}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 14, delay: i * 0.06 }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl glass border border-white/8 hover:border-white/15 transition-colors"
          >
            <span className="text-xl">{COUNTRY_FLAGS[code] ?? '🌍'}</span>
            <div>
              <p className="text-parchment text-xs font-semibold">{COUNTRY_NAMES[code] ?? code}</p>
              <p className="text-muted text-[8px]">{code}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ── CollectionOverview ────────────────────────────────────────────────────────

const RARITY_ORDER = ['world_cup_hero', 'ultra', 'legendary', 'elite', 'rare', 'common'] as const;
const RARITY_LABELS: Record<string, string> = {
  world_cup_hero: 'WCH',
  ultra: 'Ultra',
  legendary: 'Lendária',
  elite: 'Elite',
  rare: 'Rara',
  common: 'Comum',
};

export function CollectionOverview({
  cards,
  stats,
}: {
  cards: CollectionCard[];
  stats: AdvancedStats;
}) {
  const counts = cards.reduce<Record<string, number>>((acc, c) => {
    acc[c.rarityCode] = (acc[c.rarityCode] ?? 0) + 1;
    return acc;
  }, {});

  const eras = [...new Set(cards.map((c) => c.era))].sort();
  const positions = [...new Set(cards.map((c) => c.position))];

  return (
    <section>
      <h2 className="font-display text-xl text-parchment tracking-wider mb-1">🃏 Coleção</h2>

      {/* Completion */}
      <div className="glass rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-muted text-[10px] uppercase tracking-wider">Completude</p>
            <div className="flex items-baseline gap-2">
              <motion.p
                className="font-display text-4xl gold-text"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {stats.completionPct}%
              </motion.p>
              <span className="text-muted text-xs">
                {cards.length}/{stats.totalPossible} cartas
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-muted text-[9px]">OVR Médio</p>
            <p className="font-display text-3xl text-steel">{stats.avgOvr}</p>
          </div>
        </div>

        {/* Completion bar */}
        <div className="h-2.5 bg-black/30 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #8c6f27, #c9a84c, #e6c85a)' }}
            initial={{ width: '0%' }}
            animate={{ width: `${stats.completionPct}%` }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Por raridade */}
      <div className="space-y-2 mb-4">
        {RARITY_ORDER.filter((r) => counts[r]).map((rarity, i) => {
          const count = counts[rarity] ?? 0;
          const pct = Math.round((count / cards.length) * 100);
          const visual = RARITY_VISUAL[rarity];
          return (
            <motion.div
              key={rarity}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07 }}
            >
              <div className="flex justify-between text-[10px] mb-1">
                <span className={`font-bold ${visual.textClass}`}>{RARITY_LABELS[rarity]}</span>
                <span className="text-muted">
                  {count} · {pct}%
                </span>
              </div>
              <div className="h-1.5 bg-black/30 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: RARITY_COLOR[rarity] }}
                  initial={{ width: '0%' }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, delay: i * 0.07, ease: 'easeOut' }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Eras + posições */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass rounded-xl p-3">
          <p className="text-muted text-[9px] uppercase tracking-wider mb-2">Eras</p>
          <div className="flex flex-wrap gap-1">
            {eras.map((era) => (
              <span
                key={era}
                className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-900/30 border border-purple-700/30 text-purple-300"
              >
                {era}
              </span>
            ))}
          </div>
        </div>
        <div className="glass rounded-xl p-3">
          <p className="text-muted text-[9px] uppercase tracking-wider mb-2">Posições</p>
          <div className="flex flex-wrap gap-1">
            {positions.map((pos) => (
              <span
                key={pos}
                className="text-[8px] px-1.5 py-0.5 rounded bg-surface border border-border text-muted"
              >
                {pos}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const RARITY_COLOR: Record<string, string> = {
  common: '#6b7280',
  rare: '#a855f7',
  elite: '#3b82f6',
  legendary: '#c9a84c',
  ultra: '#ec4899',
  world_cup_hero: '#e2e8f0',
};
