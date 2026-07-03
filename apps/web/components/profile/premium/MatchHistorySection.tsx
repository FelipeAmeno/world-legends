'use client';

import type { MatchRecord } from '@/lib/mock-data';
import { motion } from 'framer-motion';

type Props = { matches: MatchRecord[] };

const OUTCOME_STYLE = {
  win: {
    badge: 'V',
    bg: 'bg-emerald-900/40 border-emerald-700/40',
    text: 'text-emerald-400',
    bar: 'bg-emerald-500',
  },
  draw: {
    badge: 'E',
    bg: 'bg-yellow-900/30  border-yellow-700/30',
    text: 'text-yellow-400',
    bar: 'bg-yellow-500',
  },
  loss: {
    badge: 'D',
    bg: 'bg-red-900/30     border-red-700/30',
    text: 'text-red-400',
    bar: 'bg-red-600',
  },
};

export function MatchHistorySection({ matches }: Props) {
  const winStreak = (() => {
    let streak = 0;
    for (const m of [...matches].reverse()) {
      if (m.outcome === 'win') streak++;
      else break;
    }
    return streak;
  })();

  const totalGoals = matches.reduce((s, m) => s + m.homeScore, 0);
  const totalConceded = matches.reduce((s, m) => s + m.awayScore, 0);

  return (
    <section>
      <h2 className="font-display text-xl text-parchment tracking-wider mb-3">📊 Histórico</h2>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <QuickStat
          label="Sequência"
          value={winStreak > 0 ? `${winStreak}V` : '—'}
          color="text-emerald-400"
        />
        <QuickStat label="Gols" value={totalGoals} color="text-blue-400" />
        <QuickStat label="Sofridos" value={totalConceded} color="text-red-400" />
      </div>

      {/* Forma recente */}
      <div className="flex items-center gap-1.5 mb-4">
        <span className="text-[9px] text-muted uppercase tracking-wider mr-1">Forma</span>
        {[...matches]
          .reverse()
          .slice(0, 5)
          .map((m, i) => {
            const s = OUTCOME_STYLE[m.outcome];
            return (
              <motion.div
                key={i}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.08 }}
                className={`w-8 h-8 rounded-lg border flex items-center justify-center ${s.bg}`}
                title={`${m.opponent} · ${m.homeScore}×${m.awayScore}`}
              >
                <span className={`text-[11px] font-bold ${s.text}`}>{s.badge}</span>
              </motion.div>
            );
          })}
        <span className="text-white/20 text-[9px] ml-1">← mais recente</span>
      </div>

      {/* Lista de partidas */}
      <div className="space-y-1.5">
        {matches.map((m, i) => {
          const s = OUTCOME_STYLE[m.outcome];
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${s.bg}`}
            >
              {/* Badge */}
              <div
                className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${s.bg}`}
              >
                <span className={`text-xs font-bold ${s.text}`}>{s.badge}</span>
              </div>

              {/* Placar */}
              <div className="shrink-0 w-14">
                <p className="font-display text-base text-parchment leading-none">
                  {m.homeScore}
                  <span className="text-muted mx-0.5 text-sm">×</span>
                  {m.awayScore}
                </p>
                <p className="text-muted text-[8px]">{m.isHome ? 'Casa' : 'Fora'}</p>
              </div>

              {/* Adversário */}
              <div className="flex-1 min-w-0">
                <p className="text-parchment text-xs font-medium truncate">{m.opponent}</p>
                <p className="text-muted text-[9px]">{m.date}</p>
              </div>

              {/* Recompensas */}
              <div className="shrink-0 text-right">
                <p className="text-gold text-[10px] font-bold">+{m.credits}c</p>
                <p className="text-blue-400 text-[9px]">+{m.xp}xp</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

function QuickStat({
  label,
  value,
  color,
}: { label: string; value: string | number; color: string }) {
  return (
    <div className="glass rounded-xl p-3 text-center">
      <p className={`font-display text-2xl ${color}`}>{value}</p>
      <p className="text-muted text-[9px] mt-0.5">{label}</p>
    </div>
  );
}
