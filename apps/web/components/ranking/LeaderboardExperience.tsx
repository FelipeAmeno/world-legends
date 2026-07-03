'use client';

/**
 * LeaderboardExperience — T064
 *
 * Rankings do World Legends:
 *   🏆 Global Vitórias
 *   ⚽ Global OVR
 *   🃏 Maior Coleção
 *   🌍 Por País
 *   👥 Amigos
 *   🗓️ Temporada
 *
 * Usuário atual sempre visível (card fixo no bottom).
 * Posição do usuário em destaque na lista.
 * Timer de temporada no header.
 */

import { AVAILABLE_COUNTRIES, getLeaderboard } from '@/lib/leaderboard/mock-data';
import type { LeaderboardCategory, LeaderboardEntry } from '@/lib/leaderboard/types';
import { CATEGORY_CONFIGS } from '@/lib/leaderboard/types';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useMemo, useState, useTransition } from 'react';

import { EntryRow, UserRankCard } from './EntryRow';
import { SeasonTimer } from './SeasonTimer';

const CATEGORIES = Object.values(CATEGORY_CONFIGS);

export function LeaderboardExperience() {
  const [category, setCategory] = useState<LeaderboardCategory>('global_wins');
  const [country, setCountry] = useState('BR');
  const [showCountryPicker, setShowCP] = useState(false);
  const [isPending, startTransition] = useTransition();

  const data = useMemo(() => getLeaderboard(category, country), [category, country]);

  const handleTab = useCallback((c: LeaderboardCategory) => {
    startTransition(() => setCategory(c));
  }, []);

  const cfg = CATEGORY_CONFIGS[category];
  const userEntry = data.currentUser;
  const top3 = data.entries.slice(0, 3);
  const rest = data.entries.slice(3);

  return (
    <div className="flex flex-col h-full">
      {/* Season timer */}
      {data.season && (
        <div className="px-4 pt-2 pb-1 shrink-0">
          <SeasonTimer season={data.season} />
        </div>
      )}

      {/* Category tabs */}
      <div className="flex overflow-x-auto px-4 py-2 gap-1.5 scroll-x-hide shrink-0">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => handleTab(c.id)}
            className={[
              'flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[11px] font-bold shrink-0 transition-all',
              category === c.id
                ? 'bg-gold/10 border-gold/40 text-gold'
                : 'bg-surface border-border text-muted hover:text-parchment',
            ].join(' ')}
          >
            <span>{c.icon}</span>
            <span>{c.label}</span>
          </button>
        ))}
      </div>

      {/* Country picker (só para country tab) */}
      <AnimatePresence>
        {category === 'country_wins' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden shrink-0"
          >
            <div className="px-4 pb-2">
              <div className="flex gap-2 overflow-x-auto scroll-x-hide pb-1">
                {AVAILABLE_COUNTRIES.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => setCountry(c.code)}
                    className={[
                      'flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[10px] font-bold shrink-0 transition-all',
                      country === c.code
                        ? 'border-gold/40 bg-gold/10 text-gold'
                        : 'border-border text-muted hover:text-parchment',
                    ].join(' ')}
                  >
                    <span>{c.flag}</span>
                    <span>{c.code}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header de categoria */}
      <div className="px-4 pb-2 shrink-0">
        <div className="flex items-center justify-between">
          <p className="text-muted text-[10px]">{cfg.description}</p>
          <p className="text-muted text-[9px]">
            {data.totalPlayers.toLocaleString('pt-BR')} jogadores
          </p>
        </div>
      </div>

      {/* Lista */}
      <AnimatePresence mode="wait">
        <motion.div
          key={category + country}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="flex-1 min-h-0 overflow-y-auto pb-32"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {data.entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2">
              <span className="text-4xl">🔍</span>
              <p className="text-muted text-sm">Nenhum jogador encontrado</p>
            </div>
          ) : (
            <>
              {/* Pódio (top 3) */}
              <div className="px-4 pt-2 pb-4">
                <Podium entries={top3} cfg={cfg} />
              </div>

              {/* Rest */}
              <div className="px-4 space-y-1.5">
                {rest.map((entry, i) => (
                  <motion.div
                    key={entry.userId}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(i * 0.025, 0.4) }}
                  >
                    <EntryRow
                      entry={entry}
                      metricLabel={cfg.metricLabel}
                      metricValue={cfg.formatter(entry)}
                    />
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Usuário atual — fixo no bottom */}
      {userEntry && (
        <div
          className="fixed bottom-0 left-0 right-0 z-30 px-4 pb-safe"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 8px)' }}
        >
          <UserRankCard entry={userEntry} cfg={cfg} totalPlayers={data.totalPlayers} />
        </div>
      )}
    </div>
  );
}

// ─── Pódio (top 3) ────────────────────────────────────────────────────────────

function Podium({
  entries,
  cfg,
}: {
  entries: LeaderboardEntry[];
  cfg: ReturnType<
    typeof Object.values<(typeof CATEGORY_CONFIGS)[keyof typeof CATEGORY_CONFIGS]>
  >[number];
}) {
  if (entries.length === 0) return null;

  const [first, second, third] = entries;
  if (!first) return null;

  const MEDAL = ['🥇', '🥈', '🥉'];
  const HEIGHTS = ['h-24', 'h-20', 'h-16'];
  const ORDER = second ? [second, first, third].filter(Boolean) : [first];

  return (
    <div className="flex items-end justify-center gap-2">
      {ORDER.map((entry, i) => {
        if (!entry) return null;
        const realIdx = entry.rank - 1;
        const isFirst = entry.rank === 1;

        return (
          <motion.div
            key={entry.userId}
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 16, delay: i * 0.1 }}
            className={'flex-1 max-w-[120px]'}
          >
            <div
              className={[
                'relative flex flex-col items-center pt-3 pb-2 rounded-2xl border',
                isFirst
                  ? 'bg-gradient-to-b from-amber-900/40 to-amber-800/20 border-amber-600/50'
                  : 'bg-surface/50 border-border',
              ].join(' ')}
            >
              {/* Crown (1st only) */}
              {isFirst && (
                <motion.div
                  className="absolute -top-3 text-xl"
                  animate={{ rotate: [-5, 5, -5], y: [-1, 1, -1] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                >
                  👑
                </motion.div>
              )}

              {/* Avatar */}
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black border-2"
                style={{
                  background: isFirst
                    ? 'linear-gradient(135deg, #c9a84c, #e6c85a)'
                    : 'rgba(255,255,255,0.08)',
                  borderColor: isFirst ? '#c9a84c' : 'rgba(255,255,255,0.12)',
                  color: isFirst ? '#07080f' : '#e2ddd4',
                }}
              >
                {entry.avatarInitial}
              </div>

              {/* Online dot */}
              {entry.isOnline && (
                <div
                  className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-400
                                ring-2 ring-obsidian"
                />
              )}

              {/* Medal */}
              <span className="text-xl mt-1">{MEDAL[realIdx]}</span>

              {/* Name */}
              <p
                className={`text-[9px] font-bold text-center px-1 leading-tight mt-0.5 ${
                  entry.isCurrentUser ? 'text-gold' : 'text-parchment'
                }`}
              >
                {entry.username.slice(0, 10)}
              </p>

              {/* Flag */}
              <span className="text-[10px] mt-0.5">{entry.flagEmoji}</span>

              {/* Metric */}
              <p
                className={`font-display text-base mt-1 leading-none ${
                  isFirst ? 'gold-text' : 'text-parchment'
                }`}
              >
                {cfg.formatter(entry)}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
