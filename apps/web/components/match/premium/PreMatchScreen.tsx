'use client';

import { computeWinProbability, getUserLineup } from '@/lib/match-data';
import type { MatchExperienceData } from '@/lib/match-experience';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

type Props = {
  data: MatchExperienceData;
  onKickoff: () => void;
  onBack: () => void;
};

export function PreMatchScreen({ data, onKickoff, onBack }: Props) {
  const { opponent } = data;
  const userLineup = getUserLineup();
  const userOvr = data.display.userOvr || 80;
  const prob = computeWinProbability(userOvr, opponent.avgOvr);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (countdown <= 0) {
      onKickoff();
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, onKickoff]);

  return (
    <div className="flex flex-col h-screen px-4 py-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-0 left-1/3 w-64 h-64 rounded-full blur-3xl opacity-10"
          style={{ background: '#10b981' }}
        />
        <div
          className="absolute bottom-0 right-1/3 w-64 h-64 rounded-full blur-3xl opacity-10"
          style={{ background: '#ef4444' }}
        />
      </div>

      {/* Back */}
      <button
        onClick={onBack}
        className="text-white/30 text-xs hover:text-white/60 transition-colors mb-4 self-start"
      >
        ← Trocar adversário
      </button>

      {/* VS header */}
      <motion.div
        className="text-center mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <p className="text-white/30 text-[10px] uppercase tracking-[0.4em] mb-2">Pré-jogo</p>
        <div className="flex items-center justify-center gap-6">
          <TeamBadge name="🇧🇷 Seleção BR" ovr={userOvr} color="text-gold" />
          <div className="text-center">
            <p className="font-display text-5xl text-white/20">VS</p>
          </div>
          <TeamBadge
            name={`${opponent.flag} ${opponent.name}`}
            ovr={opponent.avgOvr}
            color={opponent.color ?? 'text-parchment'}
            right
          />
        </div>
      </motion.div>

      {/* Win probability */}
      <motion.div
        className="glass rounded-2xl px-4 py-3 mb-5"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <p className="text-white/30 text-[9px] uppercase tracking-wider text-center mb-2">
          Probabilidade
        </p>
        <div className="flex rounded-full overflow-hidden h-3 gap-0.5">
          <motion.div
            className="rounded-l-full bg-emerald-600"
            initial={{ width: '33%' }}
            animate={{ width: `${prob.home}%` }}
            transition={{ duration: 1.2, delay: 0.4, ease: 'easeOut' }}
          />
          <motion.div
            className="bg-yellow-600/70"
            initial={{ width: '33%' }}
            animate={{ width: `${prob.draw}%` }}
            transition={{ duration: 1.2, delay: 0.4, ease: 'easeOut' }}
          />
          <motion.div
            className="rounded-r-full bg-red-700"
            initial={{ width: '33%' }}
            animate={{ width: `${prob.away}%` }}
            transition={{ duration: 1.2, delay: 0.4, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between text-[9px] mt-1">
          <span className="text-emerald-400 font-bold">{prob.home}% vitória</span>
          <span className="text-yellow-400">{prob.draw}% empate</span>
          <span className="text-red-400">{prob.away}% derrota</span>
        </div>
      </motion.div>

      {/* Lineups */}
      <div className="grid grid-cols-2 gap-3 flex-1 min-h-0 mb-5">
        <LineupColumn title="Seleção BR Lendas" players={userLineup} home />
        <LineupColumn
          title={opponent.name}
          players={Array.from({ length: 11 }, (_, i) => ({
            position:
              ['GK', 'RB', 'CB', 'CB', 'LB', 'CM', 'CM', 'CM', 'RW', 'ST', 'LW'][i] ?? 'MID',
            name: `Jogador ${i + 1}`,
            ovr: Math.max(60, Math.min(99, opponent.avgOvr + (i % 3) - 1)),
            flag: opponent.flag,
          }))}
        />
      </div>

      {/* Countdown */}
      <div className="text-center">
        <motion.p
          key={countdown}
          initial={{ scale: 1.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="font-display text-4xl gold-text mb-2"
        >
          {countdown > 0 ? countdown : '⚽'}
        </motion.p>
        <p className="text-white/30 text-xs">{countdown > 0 ? 'Começando em…' : 'Bola rolando!'}</p>
        <button
          onClick={onKickoff}
          className="mt-3 px-6 py-2 rounded-xl bg-gradient-to-r from-gold-dim to-gold text-obsidian
                     font-bold text-sm hover:opacity-90 transition-all"
        >
          ▶ Pular contagem
        </button>
      </div>
    </div>
  );
}

function TeamBadge({
  name,
  ovr,
  color,
  right = false,
}: {
  name: string;
  ovr: number;
  color: string;
  right?: boolean;
}) {
  return (
    <div className={`text-center ${right ? 'items-end' : 'items-start'} flex flex-col`}>
      <p className={`font-bold text-xs mb-1 ${color}`}>{name}</p>
      <p className={`font-display text-5xl ${color}`}>{ovr}</p>
      <p className="text-white/25 text-[8px] mt-0.5">OVR</p>
    </div>
  );
}

function LineupColumn({
  title,
  players,
  home = false,
}: {
  title: string;
  players: Array<{ position: string; name: string; ovr: number; flag?: string }>;
  home?: boolean;
}) {
  return (
    <div className="glass rounded-xl p-3 overflow-y-auto">
      <p className={`font-bold text-[10px] mb-2 truncate ${home ? 'text-gold' : 'text-parchment'}`}>
        {title}
      </p>
      <div className="space-y-0.5">
        {players.map((p, i) => (
          <div key={i} className="flex items-center gap-1.5 py-0.5">
            <span className="text-[7px] text-white/40 w-6 shrink-0">{p.position}</span>
            <span className="text-parchment text-[9px] font-medium flex-1 truncate">{p.name}</span>
            <span className="font-display text-xs gold-text shrink-0">{p.ovr}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
