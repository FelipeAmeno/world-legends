'use client';

/**
 * MissionsPage — T72 / T73 / T74
 *
 * Daily, Weekly (inclui missões épicas T73) e Achievements (T74).
 * Todo o progresso é real — persistido no Supabase.
 * Claims creditam créditos/fragmentos diretamente no banco.
 */

import { claimMissionRewardAction, getMissionsAction } from '@/lib/actions/missions';
import type { MissionReward, MissionType, MissionView } from '@/lib/mission-system';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { ClaimToast } from './ClaimToast';
import { MissionCard } from './MissionCard';

type Tab = MissionType;

const TABS: Array<{ id: Tab; label: string; icon: string }> = [
  { id: 'daily', label: 'Diárias', icon: '📅' },
  { id: 'weekly', label: 'Semanais', icon: '🗓️' },
  { id: 'lifetime', label: 'Conquistas', icon: '🏆' },
];

export function MissionsPage() {
  const [tab, setTab] = useState<Tab>('daily');
  const [views, setViews] = useState<MissionView[]>([]);
  const [periodKeys, setPeriodKeys] = useState({ daily: '', weekly: '' });
  const [toast, setToast] = useState<MissionReward[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startT] = useTransition();

  // Carregar dados reais do servidor
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getMissionsAction().then((data) => {
      if (cancelled) return;
      setViews(data.views);
      setPeriodKeys(data.periodKeys);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Views filtradas pela aba
  const tabViews = useMemo(() => {
    const type = tab === 'lifetime' ? 'lifetime' : tab;
    const filtered = views.filter((v) => v.def.type === type);
    return [...filtered].sort((a, b) => {
      if (a.claimable !== b.claimable) return a.claimable ? -1 : 1;
      if (a.allDone !== b.allDone) return a.allDone ? 1 : -1;
      return a.def.priority - b.def.priority;
    });
  }, [views, tab]);

  // Stats da aba
  const tabStats = useMemo(() => {
    const total = tabViews.length;
    const done = tabViews.filter((v) => v.allDone).length;
    const claimable = tabViews.filter((v) => v.claimable).length;
    return { total, done, claimable };
  }, [tabViews]);

  // Badges de claimable por tab (para o dot de notificação)
  const claimablePerTab = useMemo(() => {
    const counts: Record<Tab, number> = { daily: 0, weekly: 0, lifetime: 0 };
    for (const v of views) {
      if (v.claimable) counts[v.def.type as Tab] = (counts[v.def.type as Tab] ?? 0) + 1;
    }
    return counts;
  }, [views]);

  // Coletar recompensa
  const handleClaim = useCallback(
    (missionId: string, stage: number) => {
      const def = views.find((v) => v.def.id === missionId)?.def;
      if (!def) return;

      const periodKey =
        def.type === 'daily'
          ? periodKeys.daily
          : def.type === 'weekly'
            ? periodKeys.weekly
            : 'lifetime';

      startT(async () => {
        const result = await claimMissionRewardAction(missionId, stage, periodKey);
        if (!result.ok) return;

        // Atualizar views localmente (otimista)
        setViews((prev) =>
          prev.map((v) => {
            if (v.def.id !== missionId) return v;
            return {
              ...v,
              claimable: false,
              allDone: stage >= v.def.stages.length,
              progress: { ...v.progress, stageClaimed: stage },
            };
          }),
        );

        setToast([...result.rewards]);
      });
    },
    [views, periodKeys],
  );

  // Timer de reset
  const [countdown, setCountdown] = useState('');
  useEffect(() => {
    const update = () => {
      const now = new Date();
      if (tab === 'daily') {
        const next = new Date(now);
        next.setDate(next.getDate() + 1);
        next.setHours(0, 0, 0, 0);
        const diff = next.getTime() - now.getTime();
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        setCountdown(`${h}h ${m}m`);
      } else if (tab === 'weekly') {
        const day = now.getDay();
        const daysLeft = (8 - (day || 7)) % 7 || 7;
        setCountdown(`${daysLeft}d`);
      } else {
        setCountdown('');
      }
    };
    update();
    const t = setInterval(update, 30000);
    return () => clearInterval(t);
  }, [tab]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="font-display text-3xl gold-text tracking-wider">MISSÕES</h1>
          </div>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-2xl bg-surface border border-border animate-pulse"
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="font-display text-3xl gold-text tracking-wider">MISSÕES</h1>
          <p className="text-muted text-xs mt-0.5">
            {tabStats.claimable > 0 ? (
              <span className="text-gold font-bold">{tabStats.claimable} para coletar!</span>
            ) : (
              <span>
                {tabStats.done}/{tabStats.total} concluídas
              </span>
            )}
          </p>
        </div>
        {countdown && (
          <div className="text-right">
            <p className="text-muted text-[9px] uppercase tracking-wider">Reinício em</p>
            <p className="font-display text-lg text-steel">{countdown}</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 mb-5">
        {TABS.map((t) => {
          const badge = claimablePerTab[t.id] ?? 0;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={[
                'flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-sm font-medium transition-all',
                tab === t.id
                  ? 'bg-gold/10 border-gold/40 text-gold'
                  : 'bg-surface border-border text-muted hover:text-parchment',
              ].join(' ')}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
              {badge > 0 && tab !== t.id && (
                <motion.span
                  className="w-4 h-4 rounded-full bg-gold text-obsidian text-[8px] font-black flex items-center justify-center"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.2, repeat: Number.POSITIVE_INFINITY }}
                >
                  {badge}
                </motion.span>
              )}
            </button>
          );
        })}
      </div>

      {/* Progress bar da aba */}
      <div className="h-1.5 bg-surface rounded-full overflow-hidden mb-5 border border-white/5">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-gold-dim to-gold"
          animate={{
            width: `${tabStats.total > 0 ? Math.round((tabStats.done / tabStats.total) * 100) : 0}%`,
          }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>

      {/* Lista de missões */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-3"
        >
          {tabViews.length === 0 ? (
            <div className="text-center py-12 text-muted text-sm">Nenhuma missão disponível.</div>
          ) : (
            tabViews.map((view, i) => (
              <motion.div
                key={view.def.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <MissionCard view={view} onClaim={handleClaim} disabled={isPending} />
              </motion.div>
            ))
          )}
        </motion.div>
      </AnimatePresence>

      {/* Achievements: painel de estatísticas */}
      {tab === 'lifetime' && (
        <motion.div
          className="mt-6 glass rounded-2xl p-4 border border-white/5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-muted text-[10px] uppercase tracking-wider mb-3">Progresso Geral</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Completas', value: tabStats.done, icon: '✅' },
              { label: 'Em andamento', value: tabStats.total - tabStats.done, icon: '⏳' },
              {
                label: 'Para coletar',
                value: tabViews.filter((v) => v.claimable).length,
                icon: '🎁',
              },
            ].map((s) => (
              <div key={s.label} className="bg-black/20 rounded-xl p-2.5 text-center">
                <span className="text-lg">{s.icon}</span>
                <p className="font-display text-xl text-parchment mt-0.5">{s.value}</p>
                <p className="text-muted text-[9px]">{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Toast de recompensa */}
      <ClaimToast rewards={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
