'use client';

import { groupByStatus, sortEvents } from '@/lib/events/event-utils';
import type { EventCategory, GameEvent } from '@/lib/events/types';
import { CATEGORY_META } from '@/lib/events/types';
import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';

import { EventBannerCard } from './EventBannerCard';
import { EventDetailModal } from './EventDetailModal';

// Filtros por categoria
const ALL_CATEGORIES: Array<EventCategory | 'all'> = [
  'all',
  'world_cup',
  'champions_league',
  'libertadores',
  'weekly_challenge',
  'daily_challenge',
  'seasonal',
  'special',
];

const CATEGORY_FILTER_LABELS: Record<EventCategory | 'all', string> = {
  all: 'Todos',
  world_cup: '🌍 Copa',
  champions_league: '⭐ Champions',
  libertadores: '🏆 Liberta',
  copa_america: '🌎 Copa Am.',
  euro: '⚽ Euro',
  weekly_challenge: '⚡ Semanal',
  daily_challenge: '🎯 Diário',
  seasonal: '🗓️ Temporada',
  special: '✨ Especial',
};

type Props = { events: GameEvent[] };

export function EventsExperience({ events }: Props) {
  const [selected, setSelected] = useState<GameEvent | null>(null);
  const [category, setCategory] = useState<EventCategory | 'all'>('all');

  const sorted = useMemo(() => sortEvents(events), [events]);

  const filtered = useMemo(
    () => (category === 'all' ? sorted : sorted.filter((e) => e.category === category)),
    [sorted, category],
  );

  const { active, upcoming, ended } = useMemo(() => groupByStatus(filtered), [filtered]);

  const featured = active.filter((e) => e.featured);

  return (
    <div className="min-h-full">
      {/* Featured events (top) */}
      {featured.length > 0 && category === 'all' && (
        <div className="px-4 pt-2 pb-4">
          <p className="text-[9px] text-muted uppercase tracking-widest mb-2.5">⭐ Destaque</p>
          <div className="space-y-3">
            {featured.map((ev, i) => (
              <motion.div
                key={ev.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <EventBannerCard event={ev} onSelect={setSelected} featured />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Category filter tabs */}
      <div className="flex overflow-x-auto px-4 pb-3 gap-1.5 scroll-x-hide sticky top-0 bg-obsidian/90 backdrop-blur-sm pt-1 z-10">
        {ALL_CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={[
              'flex items-center gap-1 px-3 py-1.5 rounded-xl border text-[10px] font-bold shrink-0 transition-all',
              category === c
                ? 'bg-gold/10 border-gold/40 text-gold'
                : 'bg-surface border-border text-muted hover:text-parchment',
            ].join(' ')}
          >
            {CATEGORY_FILTER_LABELS[c]}
          </button>
        ))}
      </div>

      <div className="px-4 pb-10 space-y-6">
        {/* Active */}
        {active.length > 0 && (
          <section>
            <SectionHeader
              title="Eventos Ativos"
              badge={`${active.length} ativo${active.length > 1 ? 's' : ''}`}
              badgeColor="text-emerald-400"
            />
            <div className="space-y-3">
              {active
                .filter((e) => !e.featured || category !== 'all')
                .map((ev, i) => (
                  <motion.div
                    key={ev.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                  >
                    <EventBannerCard event={ev} onSelect={setSelected} />
                  </motion.div>
                ))}
            </div>
          </section>
        )}

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <section>
            <SectionHeader
              title="Em Breve"
              badge={`${upcoming.length} evento${upcoming.length > 1 ? 's' : ''}`}
              badgeColor="text-blue-400"
            />
            <div className="space-y-3">
              {upcoming.map((ev, i) => (
                <motion.div
                  key={ev.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <EventBannerCard event={ev} onSelect={setSelected} />
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Empty */}
        {active.length === 0 && upcoming.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <span className="text-5xl">📅</span>
            <p className="text-muted text-sm">Nenhum evento nesta categoria</p>
            <button
              onClick={() => setCategory('all')}
              className="text-gold text-xs hover:underline"
            >
              Ver todos os eventos
            </button>
          </div>
        )}

        {/* Ended */}
        {ended.length > 0 && (
          <section>
            <SectionHeader title="Encerrados" badgeColor="text-muted" />
            <div className="space-y-2 opacity-60">
              {ended.map((ev, i) => (
                <motion.div
                  key={ev.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <EventBannerCard event={ev} onSelect={setSelected} />
                </motion.div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Detail modal */}
      <AnimatePresence>
        {selected && <EventDetailModal event={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  );
}

function SectionHeader({
  title,
  badge,
  badgeColor = 'text-muted',
}: {
  title: string;
  badge?: string;
  badgeColor?: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <h2 className="font-display text-xl text-parchment tracking-wider">{title}</h2>
      {badge && <span className={`text-[10px] font-bold ${badgeColor}`}>{badge}</span>}
      <div className="flex-1 h-px bg-border/40" />
    </div>
  );
}
