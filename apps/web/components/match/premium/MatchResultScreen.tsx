'use client';

import { ResolvedWorldLegendsCard } from '@/components/cards/ResolvedWorldLegendsCard';
import type { MatchExperienceData } from '@/lib/match-experience';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ScoreDisplay } from './ScoreDisplay';

// ─── Win confetti ─────────────────────────────────────────────────────────────

const WIN_CONFETTI = Array.from({ length: 24 }, (_, i) => ({
  x: -5 + (i / 23) * 110,
  delay: i * 0.06,
  color: ['#c9a84c', '#fbbf24', '#34d399', '#60a5fa', '#ec4899', '#fff'][i % 6]!,
  rotate: -45 + (i % 5) * 22,
  size: 6 + (i % 3) * 4,
}));

function WinConfetti() {
  return (
    <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
      {WIN_CONFETTI.map((c, i) => (
        <motion.div
          key={i}
          className="absolute top-0 rounded-sm"
          style={{
            left: `${c.x}%`,
            width: c.size,
            height: c.size * 1.8,
            background: c.color,
            rotate: c.rotate,
          }}
          initial={{ y: -30, opacity: 1 }}
          animate={{ y: '100vh', opacity: [1, 1, 0], rotate: c.rotate + 360 }}
          transition={{
            duration: 2.8 + (i % 4) * 0.3,
            delay: c.delay,
            ease: 'easeIn',
            repeat: 2,
            repeatDelay: 1.5,
          }}
        />
      ))}
    </div>
  );
}

type Props = {
  data: MatchExperienceData;
  onRematch: () => void;
  onBack: () => void;
};

type ResultTab = 'stats' | 'events' | 'mvp';

export function MatchResultScreen({ data, onRematch, onBack }: Props) {
  const { display, opponent, rich } = data;
  const [tab, setTab] = useState<ResultTab>('stats');
  const [mvpPhase, setMvpPhase] = useState<'hidden' | 'reveal' | 'shown'>('hidden');
  const router = useRouter();

  useEffect(() => {
    if (tab === 'mvp') {
      const t1 = setTimeout(() => setMvpPhase('reveal'), 500);
      const t2 = setTimeout(() => setMvpPhase('shown'), 2200);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
    setMvpPhase('hidden');
  }, [tab]);

  const w = display.winner;
  const outcomeStyle = {
    home: {
      text: 'VITÓRIA!',
      color: 'text-emerald-400',
      border: 'border-emerald-800',
      bg: 'rgba(6,78,59,0.2)',
    },
    draw: {
      text: 'EMPATE',
      color: 'text-yellow-400',
      border: 'border-yellow-800',
      bg: 'rgba(78,63,6,0.2)',
    },
    away: {
      text: 'DERROTA',
      color: 'text-red-400',
      border: 'border-red-900',
      bg: 'rgba(78,6,6,0.15)',
    },
  }[w];

  return (
    <div className="min-h-screen flex flex-col overflow-hidden">
      {/* Win confetti */}
      {w === 'home' && <WinConfetti />}

      {/* Resultado */}
      <div className="px-4 pt-6 pb-3" style={{ background: outcomeStyle.bg }}>
        <motion.p
          className={`font-display text-4xl tracking-wider text-center ${outcomeStyle.color}`}
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        >
          {outcomeStyle.text}
        </motion.p>

        {/* Placar final */}
        <div className="mt-3">
          <ScoreDisplay
            homeScore={display.homeScore}
            awayScore={display.awayScore}
            minute={90}
            homeName="🇧🇷 Seleção BR"
            awayName={`${opponent.flag} ${opponent.name}`}
            isGoalAnim={false}
            winner={display.winner}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5 bg-black/30">
        {(['stats', 'events', 'mvp'] as ResultTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-all ${
              tab === t ? 'text-gold border-b-2 border-gold' : 'text-white/30 hover:text-white/60'
            }`}
          >
            {t === 'stats' ? 'Estatísticas' : t === 'events' ? 'Eventos' : '⭐ MVP'}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <AnimatePresence mode="wait">
          {/* STATS */}
          {tab === 'stats' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-2.5"
            >
              <StatRow
                label="Posse"
                home={display.stats.possession[0]}
                away={display.stats.possession[1]}
                unit="%"
              />
              <StatRow
                label="Finalizações"
                home={display.stats.shots[0]}
                away={display.stats.shots[1]}
              />
              <StatRow
                label="No alvo"
                home={display.stats.shotsOnTarget[0]}
                away={display.stats.shotsOnTarget[1]}
              />
              <StatRow label="xG" home={display.stats.xg[0]} away={display.stats.xg[1]} decimal />
              <StatRow
                label="Faltas"
                home={display.stats.fouls[0]}
                away={display.stats.fouls[1]}
                reverse
              />
              <StatRow
                label="Escanteios"
                home={display.stats.corners[0]}
                away={display.stats.corners[1]}
              />
              <StatRow
                label="Amarelos"
                home={display.stats.yellowCards[0]}
                away={display.stats.yellowCards[1]}
                reverse
              />
              <StatRow
                label="Vermelhos"
                home={display.stats.redCards[0]}
                away={display.stats.redCards[1]}
                reverse
              />

              {/* Recompensas */}
              <div className="mt-4 glass rounded-xl p-4">
                <p className="text-muted text-[9px] uppercase tracking-wider mb-3">Recompensas</p>
                <div className="grid grid-cols-2 gap-3">
                  <RewardBox
                    icon="💰"
                    label="Créditos"
                    value={`+${display.rewards.credits.toLocaleString()}c`}
                    color="text-gold"
                  />
                  <RewardBox
                    icon="⭐"
                    label="XP"
                    value={`+${display.rewards.xp} XP`}
                    color="text-blue-400"
                  />
                </div>
                {display.rewards.bonuses.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {display.rewards.bonuses.map((b, i) => (
                      <div key={i} className="flex justify-between text-[10px]">
                        <span className="text-muted">{b.label}</span>
                        <span className="text-gold">+{b.credits}c</span>
                      </div>
                    ))}
                  </div>
                )}
                {data.newBalance !== undefined && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-center text-[10px] text-muted mt-3 pt-3 border-t border-white/5"
                  >
                    Saldo atual:{' '}
                    <span className="text-gold font-bold">{data.newBalance.toLocaleString()}c</span>
                  </motion.p>
                )}
              </div>
            </motion.div>
          )}

          {/* EVENTS */}
          {tab === 'events' && (
            <motion.div
              key="events"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-1.5"
            >
              {rich
                .filter((e) => e.kind !== 'kickoff')
                .map((ev) => (
                  <div
                    key={ev.id}
                    className="flex items-start gap-3 px-3 py-2 rounded-xl"
                    style={{ background: ev.bgColor }}
                  >
                    <span className="text-[9px] font-mono text-white/30 w-6 shrink-0 pt-0.5">
                      {ev.minute}'
                    </span>
                    <span className="text-base shrink-0">{ev.iconText}</span>
                    <p className="text-[10px] text-white/70 leading-snug">{ev.commentary}</p>
                  </div>
                ))}
            </motion.div>
          )}

          {/* MVP */}
          {tab === 'mvp' && (
            <motion.div
              key="mvp"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center py-6 gap-6"
            >
              {display.mvp ? (
                <>
                  <motion.p
                    className="text-white/30 text-[10px] uppercase tracking-[0.4em]"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                  >
                    MVP da Partida
                  </motion.p>

                  <AnimatePresence>
                    {mvpPhase !== 'hidden' && (
                      <motion.div
                        initial={{ scale: 0.5, opacity: 0, rotateY: -45 }}
                        animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                        transition={{ type: 'spring', stiffness: 120, damping: 14 }}
                        className="relative"
                      >
                        {/* Glow rings */}
                        {mvpPhase === 'shown' &&
                          [0, 1].map((i) => (
                            <motion.div
                              key={i}
                              className="absolute rounded-full border border-gold/30"
                              style={{ inset: -(40 + i * 30) }}
                              animate={{ opacity: [0.6, 0], scale: [1, 1.5] }}
                              transition={{
                                duration: 2,
                                delay: i * 0.5,
                                repeat: Number.POSITIVE_INFINITY,
                              }}
                            />
                          ))}

                        {/* Sprint 41 — reveal do MVP é uma apresentação hero
                            pontual (só monta quando mvpPhase !== 'hidden' e a
                            aba MVP está aberta), igual ao GoatReveal da
                            Sprint 38 — Showcase explícito é justificado aqui,
                            não é uma grade. */}
                        <ResolvedWorldLegendsCard
                          card={display.mvp}
                          size="lg"
                          density="showcase"
                          glow
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {mvpPhase === 'shown' && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center"
                    >
                      <p className="font-display text-2xl gold-text tracking-wider">
                        {display.mvp.displayName.toUpperCase()}
                      </p>
                      <p className="text-muted text-xs mt-1">
                        {display.mvp.position} · {display.mvp.overall} OVR
                      </p>
                      <p className="text-gold text-xs mt-0.5 font-bold">+100c bônus MVP</p>
                    </motion.div>
                  )}
                </>
              ) : (
                <p className="text-muted text-sm text-center py-8">Nenhum MVP desta vez…</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Missão diária */}
      <div className="px-4 pt-3">
        <div
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
          style={{
            background: 'rgba(201,168,76,0.06)',
            border: '1px solid rgba(201,168,76,0.18)',
          }}
        >
          <span className="text-lg shrink-0">🎯</span>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-gold/80 leading-tight">Missão Diária</p>
            <p className="text-[9px] text-white/40 leading-tight mt-0.5">
              Jogue 3 partidas hoje · Recompensa: +300c
            </p>
          </div>
          <div
            className="shrink-0 text-[9px] font-bold px-2 py-1 rounded-lg"
            style={{
              background: 'rgba(201,168,76,0.12)',
              color: '#c9a84c',
              border: '1px solid rgba(201,168,76,0.25)',
            }}
          >
            1/3
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="px-4 pt-3 pb-4 border-t border-white/5 bg-black/30 space-y-2.5">
        {/* Primary: Rematch */}
        <button
          onClick={onRematch}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-gold-dim to-gold text-obsidian font-bold text-sm hover:opacity-90 transition-all"
        >
          🔄 Jogar Novamente
        </button>
        {/* Secondary row */}
        <div className="flex gap-2">
          <button
            onClick={onBack}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/40 text-xs hover:text-parchment transition-all"
          >
            ← Trocar adversário
          </button>
          <button
            onClick={() => router.push('/')}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/40 text-xs hover:text-parchment transition-all"
          >
            🏠 Home
          </button>
          <button
            onClick={() => router.push('/missions')}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/40 text-xs hover:text-parchment transition-all"
          >
            🎯 Missões
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Sub-componentes ────────────────────────────────────────────────────────────

function StatRow({
  label,
  home,
  away,
  unit = '',
  decimal = false,
  reverse = false,
}: {
  label: string;
  home: number;
  away: number;
  unit?: string;
  decimal?: boolean;
  reverse?: boolean;
}) {
  const fmt = (v: number) => (decimal ? v.toFixed(1) : String(Math.round(v)));
  const total = Math.max(1, home + away);
  const hPct = Math.round((home / total) * 100);
  const aPct = 100 - hPct;
  const hBest = reverse ? home <= away : home >= away;

  return (
    <div className="glass rounded-xl px-3 py-2">
      <div className="flex items-center justify-between text-[10px] mb-1.5">
        <span className={`font-bold w-10 ${hBest ? 'text-emerald-400' : 'text-parchment'}`}>
          {fmt(home)}
          {unit}
        </span>
        <span className="text-muted/60 text-[9px]">{label}</span>
        <span
          className={`font-bold w-10 text-right ${!hBest ? 'text-emerald-400' : 'text-parchment'}`}
        >
          {fmt(away)}
          {unit}
        </span>
      </div>
      <div className="flex gap-px h-1.5">
        <div className="flex-1 bg-black/30 rounded-l-full overflow-hidden flex justify-end">
          <div
            className={`h-full rounded-l-full ${hBest ? 'bg-emerald-600' : 'bg-blue-800'}`}
            style={{ width: `${hPct}%` }}
          />
        </div>
        <div className="w-px bg-white/10" />
        <div className="flex-1 bg-black/30 rounded-r-full overflow-hidden">
          <div
            className={`h-full rounded-r-full ${!hBest ? 'bg-emerald-600' : 'bg-red-800'}`}
            style={{ width: `${aPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function RewardBox({
  icon,
  label,
  value,
  color,
}: { icon: string; label: string; value: string; color: string }) {
  return (
    <div className="bg-black/30 rounded-xl p-3 flex items-center gap-2">
      <span className="text-xl">{icon}</span>
      <div>
        <p className="text-muted text-[9px]">{label}</p>
        <p className={`font-display text-lg ${color}`}>{value}</p>
      </div>
    </div>
  );
}

const RARITY_GLOW: Record<string, string> = {
  common: 'rgba(150,150,150,0.5)',
  rare: 'rgba(147,51,234,0.7)',
  elite: 'rgba(59,130,246,0.8)',
  legendary: 'rgba(201,168,76,0.9)',
  ultra: 'rgba(236,72,153,0.9)',
  world_cup_hero: 'rgba(240,244,255,1)',
};
