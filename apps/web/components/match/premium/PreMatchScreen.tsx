'use client';

import { computeWinProbability, getUserLineup } from '@/lib/match-data';
import type { MatchExperienceData } from '@/lib/match-experience';
import { EASE, SPRING } from '@/lib/motion-tokens';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

type Props = {
  data: MatchExperienceData;
  onKickoff: () => void;
  onBack: () => void;
};

// ─── Animated team shield ─────────────────────────────────────────────────────

function TeamShield({
  name, initials, ovr, color, side, delay,
}: {
  name: string; initials: string; ovr: number;
  color: string; side: 'left' | 'right'; delay: number;
}) {
  return (
    <motion.div
      className="flex flex-col items-center gap-2"
      initial={{ opacity: 0, x: side === 'left' ? -50 : 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ ...SPRING.smooth, delay }}
    >
      {/* Hexagonal shield */}
      <motion.div
        className="relative flex items-center justify-center"
        style={{
          width: 68, height: 76,
          clipPath: 'polygon(50% 0%,100% 18%,100% 72%,50% 100%,0% 72%,0% 18%)',
          background: `linear-gradient(145deg,${color}18,${color}38)`,
          border: `2px solid ${color}55`,
        }}
        animate={{
          boxShadow: [
            `0 0 10px ${color}28`,
            `0 0 24px ${color}55`,
            `0 0 10px ${color}28`,
          ],
        }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: delay + 0.5 }}
      >
        <span
          className="font-display text-xl font-black select-none"
          style={{ color, filter: `drop-shadow(0 0 6px ${color})` }}
        >
          {initials}
        </span>
      </motion.div>

      {/* OVR */}
      <motion.p
        className="font-display text-[38px] leading-none"
        style={{ color, filter: `drop-shadow(0 0 10px ${color}80)` }}
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ ...SPRING.bouncy, delay: delay + 0.2 }}
      >
        {ovr}
      </motion.p>
      <p style={{ fontSize: 8, color: `${color}55`, letterSpacing: '0.2em' }}>OVR</p>

      <p
        className="font-bold text-center leading-tight"
        style={{ fontSize: 10, color, maxWidth: 82 }}
      >
        {name}
      </p>
    </motion.div>
  );
}

// ─── Countdown digit ──────────────────────────────────────────────────────────

function CountdownDigit({ count }: { count: number }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={count}
        className="flex items-center justify-center"
        initial={{ scale: 2.2, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.5, opacity: 0 }}
        transition={SPRING.snappy}
      >
        {count > 0 ? (
          <span
            className="font-display text-5xl"
            style={{
              background: 'linear-gradient(180deg,#fff,#c9a84c)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 14px rgba(201,168,76,0.7))',
            }}
          >
            {count}
          </span>
        ) : (
          <span style={{ fontSize: 36, filter: 'drop-shadow(0 0 10px rgba(201,168,76,0.7))' }}>
            ⚽
          </span>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function PreMatchScreen({ data, onKickoff, onBack }: Props) {
  const { opponent } = data;
  const userLineup = getUserLineup();
  const userOvr    = data.display.userOvr || 80;
  const prob       = computeWinProbability(userOvr, opponent.avgOvr);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (countdown <= 0) { onKickoff(); return; }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, onKickoff]);

  const userInitials = 'BR';
  const oppInitials  = (opponent.name ?? '??').slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-col h-screen relative overflow-hidden">

      {/* Stadium atmosphere */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute bottom-0 left-0 right-0"
          style={{
            height: '40%',
            background: 'linear-gradient(0deg,rgba(4,18,4,0.85) 0%,rgba(8,28,8,0.35) 60%,transparent 100%)',
          }}
        />
        <div
          className="absolute top-0 left-0 right-0"
          style={{
            height: '28%',
            background: 'linear-gradient(180deg,rgba(20,20,50,0.45) 0%,transparent 100%)',
          }}
        />
        {/* Center pitch glow */}
        <motion.div
          className="absolute rounded-full blur-3xl"
          style={{
            width: 320, height: 110,
            bottom: '18%', left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(16,120,16,0.10)',
          }}
          animate={{ opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Team color glows */}
        <div className="absolute top-1/4 left-0 w-52 h-52 rounded-full blur-3xl" style={{ background: 'rgba(16,185,129,0.06)' }} />
        <div className="absolute top-1/4 right-0 w-52 h-52 rounded-full blur-3xl" style={{ background: `${opponent.color ?? 'rgba(239,68,68'}0.06)` }} />
      </div>

      {/* Back button */}
      <motion.button
        onClick={onBack}
        className="relative z-10 text-white/30 text-xs hover:text-white/60 transition-colors mx-4 mt-5 self-start"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        ← Trocar adversário
      </motion.button>

      {/* PRÉ-JOGO */}
      <motion.p
        className="relative z-10 text-center mt-3 mb-5"
        style={{ fontSize: 10, color: 'rgba(255,255,255,0.22)', letterSpacing: '0.45em', textTransform: 'uppercase' }}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        PRÉ-JOGO
      </motion.p>

      {/* Shields + VS + Countdown */}
      <div className="relative z-10 flex items-center justify-center gap-3 px-4 mb-7">
        <TeamShield name="🇧🇷 Seleção BR" initials={userInitials} ovr={userOvr} color="#10b981" side="left" delay={0.15} />

        <motion.div
          className="flex flex-col items-center gap-2 mx-1"
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ ...SPRING.bouncy, delay: 0.35 }}
        >
          <div
            className="px-3 py-1 rounded-lg font-black"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
              fontSize: 11,
              color: 'rgba(255,255,255,0.22)',
              letterSpacing: '0.15em',
            }}
          >
            VS
          </div>
          <CountdownDigit count={countdown} />
          <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.22)', letterSpacing: '0.1em' }}>
            {countdown > 0 ? 'seg' : 'bola rolando'}
          </p>
        </motion.div>

        <TeamShield
          name={`${opponent.flag} ${opponent.name}`}
          initials={oppInitials}
          ovr={opponent.avgOvr}
          color={opponent.color ?? '#ef4444'}
          side="right"
          delay={0.25}
        />
      </div>

      {/* Win probability */}
      <motion.div
        className="relative z-10 mx-4 glass rounded-2xl px-4 py-3 mb-4"
        initial={{ opacity: 0, scale: 0.93 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ ...SPRING.smooth, delay: 0.45 }}
      >
        <p className="text-center mb-2" style={{ fontSize: 9, color: 'rgba(255,255,255,0.22)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
          Probabilidade
        </p>
        <div className="flex rounded-full overflow-hidden gap-px" style={{ height: 10 }}>
          <motion.div
            className="rounded-l-full"
            style={{ background: '#10b981' }}
            initial={{ width: '33%' }}
            animate={{ width: `${prob.home}%` }}
            transition={{ duration: 1.3, delay: 0.65, ease: EASE.smooth as [number,number,number,number] }}
          />
          <motion.div
            style={{ background: 'rgba(234,179,8,0.75)' }}
            initial={{ width: '33%' }}
            animate={{ width: `${prob.draw}%` }}
            transition={{ duration: 1.3, delay: 0.65, ease: EASE.smooth as [number,number,number,number] }}
          />
          <motion.div
            className="rounded-r-full"
            style={{ background: '#ef4444' }}
            initial={{ width: '33%' }}
            animate={{ width: `${prob.away}%` }}
            transition={{ duration: 1.3, delay: 0.65, ease: EASE.smooth as [number,number,number,number] }}
          />
        </div>
        <div className="flex justify-between mt-1.5" style={{ fontSize: 9 }}>
          <span style={{ color: '#10b981', fontWeight: 700 }}>{prob.home}% vitória</span>
          <span style={{ color: '#eab308' }}>{prob.draw}% empate</span>
          <span style={{ color: '#ef4444' }}>{prob.away}% derrota</span>
        </div>
      </motion.div>

      {/* Lineups */}
      <motion.div
        className="relative z-10 grid grid-cols-2 gap-3 flex-1 min-h-0 mx-4 mb-4 overflow-hidden"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING.smooth, delay: 0.55 }}
      >
        <LineupColumn title="Seleção BR Lendas" players={userLineup} home />
        <LineupColumn
          title={opponent.name}
          players={Array.from({ length: 11 }, (_, i) => ({
            position: (['GK','RB','CB','CB','LB','CM','CM','CM','RW','ST','LW'] as string[])[i] ?? 'MID',
            name: `Jogador ${i + 1}`,
            ovr: Math.max(60, Math.min(99, opponent.avgOvr + (i % 3) - 1)),
            flag: opponent.flag,
          }))}
        />
      </motion.div>

      {/* Skip */}
      <motion.div
        className="relative z-10 text-center pb-5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.75 }}
      >
        <button
          onClick={onKickoff}
          className="px-6 py-2.5 rounded-xl font-bold text-sm transition-all"
          style={{
            background: 'linear-gradient(135deg,#8c6f27,#c9a84c,#e6c85a)',
            color: '#07080f',
            boxShadow: '0 0 16px rgba(201,168,76,0.3)',
          }}
        >
          ▶ Pular contagem
        </button>
      </motion.div>
    </div>
  );
}

function LineupColumn({
  title, players, home = false,
}: {
  title: string;
  players: Array<{ position: string; name: string; ovr: number; flag?: string }>;
  home?: boolean;
}) {
  return (
    <div className="glass rounded-xl p-2.5 overflow-y-auto">
      <p className={`font-bold truncate mb-2 ${home ? 'text-gold' : 'text-parchment'}`} style={{ fontSize: 10 }}>
        {title}
      </p>
      <div className="space-y-px">
        {players.map((p, i) => (
          <motion.div
            key={i}
            className="flex items-center gap-1.5 py-0.5"
            initial={{ opacity: 0, x: home ? -8 : 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 + i * 0.035, duration: 0.18 }}
          >
            <span className="w-6 shrink-0" style={{ fontSize: 7, color: 'rgba(255,255,255,0.35)' }}>{p.position}</span>
            <span className="text-parchment font-medium flex-1 truncate" style={{ fontSize: 9 }}>{p.name}</span>
            <span className={`font-display shrink-0 ${home ? 'text-gold' : 'text-parchment'}`} style={{ fontSize: 11 }}>{p.ovr}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
