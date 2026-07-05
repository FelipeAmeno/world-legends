'use client';

import {
  type AchievementView,
  type AchievementsData,
  type NewTrophyNotice,
  claimAchievementRewardAction,
  getAchievementsAction,
} from '@/lib/actions/achievements';
import type { AchievementCategory } from '@world-legends/achievements';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { AchievementCard } from './AchievementCard';
import { AchievementUnlockToast } from './AchievementUnlockToast';

// ─── Category config ──────────────────────────────────────────────────────────

const CATEGORIES: Array<{ id: AchievementCategory; label: string; icon: string }> = [
  { id: 'collection', label: 'Coleção', icon: '📚' },
  { id: 'gameplay', label: 'Jogabilidade', icon: '⚽' },
  { id: 'seasons', label: 'Temporadas', icon: '🗓️' },
  { id: 'events', label: 'Eventos', icon: '🎯' },
  { id: 'packs', label: 'Packs', icon: '📦' },
  { id: 'legends', label: 'Lendas', icon: '🌟' },
  { id: 'goat', label: 'GOAT', icon: '🐐' },
];

// ─── Main page ────────────────────────────────────────────────────────────────

export function AchievementsPage() {
  const [data, setData] = useState<AchievementsData | null>(null);
  const [activeCategory, setActiveCategory] = useState<AchievementCategory>('collection');
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<NewTrophyNotice | null>(null);
  const [isPending, startT] = useTransition();
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    let cancelled = false;
    getAchievementsAction().then((d) => {
      if (cancelled) return;
      setData(d);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleClaim = useCallback((achievementId: string) => {
    startT(async () => {
      const result = await claimAchievementRewardAction(achievementId);
      if (!result.ok) return;

      // Optimistically mark as claimed
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          views: prev.views.map((v) =>
            v.def.id === achievementId ? { ...v, rewardClaimed: true } : v,
          ),
        };
      });
    });
  }, []);

  const viewsForCategory: readonly AchievementView[] =
    data?.views.filter((v) => v.def.category === activeCategory) ?? [];

  const unlockedInCategory = viewsForCategory.filter((v) => v.unlocked).length;

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-3 px-4">
        <div className="h-24 bg-surface rounded-2xl animate-pulse mb-6" />
        <div className="flex gap-2 overflow-x-auto pb-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-9 w-24 bg-surface rounded-full animate-pulse shrink-0" />
          ))}
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 bg-surface rounded-2xl animate-pulse"
            style={{ animationDelay: `${i * 0.08}s` }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Toast */}
      <AchievementUnlockToast notice={notice} onDismiss={() => setNotice(null)} />

      {/* Header */}
      <div
        className="rounded-2xl p-5 mb-6 border border-amber-400/20"
        style={{
          background: 'linear-gradient(135deg, rgba(140,111,39,0.15) 0%, rgba(7,8,15,0.8) 100%)',
          boxShadow: '0 0 32px rgba(201,168,76,0.1)',
        }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-amber-900/40 border border-amber-400/40 flex items-center justify-center text-2xl">
            🏆
          </div>
          <div>
            <h1 className="font-display text-2xl gold-text tracking-wider">CONQUISTAS</h1>
            <p className="text-muted text-xs">Xbox-style permanent trophies</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <StatPill label="Desbloqueadas" value={`${data?.totalUnlocked ?? 0}/42`} />
          <StatPill
            label="XP Total"
            value={`${(data?.totalXpEarned ?? 0).toLocaleString('pt-BR')}`}
          />
          <StatPill
            label="Progresso"
            value={`${Math.round(((data?.totalUnlocked ?? 0) / 42) * 100)}%`}
          />
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-5 scrollbar-hide">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id;
          const catViews = data?.views.filter((v) => v.def.category === cat.id) ?? [];
          const catUnlocked = catViews.filter((v) => v.unlocked).length;

          return (
            <motion.button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={[
                'flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold shrink-0 border transition-all',
                isActive
                  ? 'border-gold bg-gold/20 text-gold'
                  : 'border-border bg-surface text-muted hover:text-parchment',
              ].join(' ')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
              <span
                className={`text-[8px] rounded-full px-1 ${isActive ? 'bg-gold/30 text-gold' : 'bg-white/5 text-muted'}`}
              >
                {catUnlocked}/{catViews.length}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Category header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-muted text-xs">
          <span className="text-emerald-400 font-bold">{unlockedInCategory}</span>/
          {viewsForCategory.length} nesta categoria
        </p>
        {unlockedInCategory === viewsForCategory.length && viewsForCategory.length > 0 && (
          <motion.span
            className="text-[9px] font-black text-amber-400 border border-amber-400/40 bg-amber-900/30 px-2 py-0.5 rounded-full"
            animate={{ opacity: [1, 0.6, 1] }}
            transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
          >
            ⭐ COMPLETO
          </motion.span>
        )}
      </div>

      {/* Achievement grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="space-y-3"
        >
          {viewsForCategory.map((view, i) => (
            <motion.div
              key={view.def.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <AchievementCard view={view} onClaim={handleClaim} claiming={isPending} />
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─── StatPill ─────────────────────────────────────────────────────────────────

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-black/30 border border-white/5 rounded-xl p-2.5 text-center">
      <p className="text-muted text-[8px] uppercase tracking-wider">{label}</p>
      <p className="text-parchment font-display text-sm">{value}</p>
    </div>
  );
}
