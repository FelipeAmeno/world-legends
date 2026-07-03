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

function GoalCelebration() {
  return (
    <motion.div
      className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Green flash */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.3, 0] }}
        transition={{ duration: 0.8 }}
        style={{ background: 'radial-gradient(ellipse, rgba(16,185,129,0.4), transparent 60%)' }}
      />

      {/* GOOOOL text */}
      <motion.p
        className="font-display text-6xl sm:text-8xl text-emerald-400 relative z-10"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: [0.5, 1.2, 1], opacity: [0, 1, 1] }}
        exit={{ scale: 1.5, opacity: 0 }}
        transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
        style={{ textShadow: '0 0 40px rgba(16,185,129,0.8), 0 0 80px rgba(16,185,129,0.4)' }}
      >
        GOOOOL!
      </motion.p>
    </motion.div>
  );
}
