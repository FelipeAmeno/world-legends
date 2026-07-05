'use client';

import type { MatchExperienceData, RichEvent } from '@/lib/match-experience';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CommentaryBox } from './CommentaryBox';
import { EventFeed } from './EventFeed';
import { MomentumBar } from './MomentumBar';
import { ScoreDisplay } from './ScoreDisplay';

type Props = {
  data: MatchExperienceData;
  paused: boolean; // true durante o HT
  onHalfTime: () => void;
  onFullTime: () => void;
};

const TICK_MS = 120; // ms por minuto simulado (90min → ~11s)
const GOAL_PAUSE = 2500; // pausa em ms após um gol

export function LiveMatchView({ data, paused, onHalfTime, onFullTime }: Props) {
  const { rich, momentum, display, opponent } = data;

  const [liveMinute, setLiveMinute] = useState(0);
  const [visibleEvents, setVisibleEvents] = useState<RichEvent[]>([]);
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [latestEvent, setLatestEvent] = useState<RichEvent | null>(null);
  const [momentumHome, setMomentumHome] = useState(50);
  const [isGoalAnim, setIsGoalAnim] = useState(false);
  const [halftimeSeen, setHalftimeSeen] = useState(false);

  const pausedRef = useRef(paused);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  // Avançar o relógio e emitir eventos
  useEffect(() => {
    let ht = false;
    let ft = false;

    const tick = () => {
      if (pausedRef.current) return;

      setLiveMinute((m) => {
        const next = m + 1;

        // Eventos deste minuto
        const eventsAtMinute = rich.filter((e) => e.minute === next);
        if (eventsAtMinute.length > 0) {
          setVisibleEvents((prev) => [...prev, ...eventsAtMinute]);
          const last = eventsAtMinute[eventsAtMinute.length - 1]!;
          setLatestEvent(last);

          // Atualizar placar
          for (const ev of eventsAtMinute) {
            if (ev.kind === 'goal_home') setHomeScore((s) => s + 1);
            if (ev.kind === 'goal_away') setAwayScore((s) => s + 1);

            // Momentum
            setMomentumHome((mom) => Math.max(10, Math.min(90, mom + ev.momentum)));
          }

          // Gol: pausar brevemente
          const hasGoal = eventsAtMinute.some(
            (e) => e.kind === 'goal_home' || e.kind === 'goal_away' || e.kind === 'own_goal',
          );
          if (hasGoal) {
            setIsGoalAnim(true);
            setTimeout(() => setIsGoalAnim(false), GOAL_PAUSE);
          }

          // Intervalo
          const hasHT = eventsAtMinute.some((e) => e.kind === 'half_time');
          if (hasHT && !ht) {
            ht = true;
            setHalftimeSeen(true);
            setTimeout(onHalfTime, 800);
          }

          // Fim de jogo
          const hasFT = eventsAtMinute.some((e) => e.kind === 'full_time');
          if (hasFT && !ft) {
            ft = true;
            setTimeout(onFullTime, 1200);
          }
        }

        return next > 95 ? 95 : next;
      });
    };

    const interval = setInterval(tick, TICK_MS);
    return () => clearInterval(interval);
  }, [rich, onHalfTime, onFullTime]);

  // Momentum do minuto atual
  const currentMom = momentum.find((m) => m.minute >= liveMinute)?.home ?? momentumHome;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Score + relógio */}
      <div className="shrink-0">
        <ScoreDisplay
          homeScore={homeScore}
          awayScore={awayScore}
          minute={liveMinute}
          homeName="🇧🇷 Seleção BR"
          awayName={`${opponent.flag} ${opponent.name}`}
          isGoalAnim={isGoalAnim}
          winner={null} // ainda em jogo
        />
      </div>

      {/* Momentum bar */}
      <div className="shrink-0 px-4 py-2">
        <MomentumBar home={momentumHome} homeName="BR" awayName={opponent.flag} />
      </div>

      {/* Commentary (último evento em destaque) */}
      <div className="shrink-0 px-4">
        <CommentaryBox event={latestEvent} />
      </div>

      {/* Event feed (scrollable) */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <EventFeed events={visibleEvents} />
      </div>

      {/* Gol animation overlay */}
      <AnimatePresence>{isGoalAnim && <GoalCelebration />}</AnimatePresence>
    </div>
  );
}

// ─── Goal celebration overlay ─────────────────────────────────────────────────

const GOAL_SPARKS = Array.from({ length: 18 }, (_, i) => ({
  angle: (i / 18) * 360,
  distance: 60 + (i % 4) * 22,
  size: 4 + (i % 3) * 2,
  delay: i * 0.02,
}));

function GoalCelebration() {
  return (
    <motion.div
      className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Stadium lights flash */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.45, 0.1, 0.35, 0] }}
        transition={{ duration: 1.0, times: [0, 0.15, 0.35, 0.5, 1] }}
        style={{
          background:
            'radial-gradient(ellipse 100% 80% at 50% 30%, rgba(255,248,200,0.18), transparent 70%)',
        }}
      />

      {/* Green pitch glow */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.5, 0] }}
        transition={{ duration: 1.2 }}
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% 60%, rgba(16,185,129,0.35), transparent 65%)',
        }}
      />

      {/* Spark particles */}
      <div className="absolute inset-0 flex items-center justify-center">
        {GOAL_SPARKS.map((p, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: p.size,
              height: p.size,
              background: i % 3 === 0 ? '#10b981' : i % 3 === 1 ? '#c9a84c' : '#fff',
              top: '50%',
              left: '50%',
            }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{
              x: Math.cos((p.angle * Math.PI) / 180) * p.distance,
              y: Math.sin((p.angle * Math.PI) / 180) * p.distance,
              opacity: 0,
              scale: 0,
            }}
            transition={{ duration: 0.85, delay: p.delay, ease: 'easeOut' }}
          />
        ))}
      </div>

      {/* GOOOOL text */}
      <motion.div className="relative z-10 flex flex-col items-center gap-2">
        <motion.p
          className="font-display text-6xl sm:text-8xl text-emerald-400"
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: [0.4, 1.3, 1], opacity: [0, 1, 1] }}
          exit={{ scale: 1.6, opacity: 0 }}
          transition={{ duration: 0.55, ease: [0.34, 1.56, 0.64, 1] }}
          style={{ textShadow: '0 0 50px rgba(16,185,129,0.9), 0 0 100px rgba(16,185,129,0.4)' }}
        >
          GOOOOL!
        </motion.p>
        <motion.p
          className="text-[9px] font-bold tracking-[0.35em] uppercase"
          style={{ color: 'rgba(255,255,255,0.4)' }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          ⚽ A torcida vai à loucura!
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
