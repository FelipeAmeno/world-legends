'use client';

import type { MatchOpponent } from '@/lib/match-data';
import { useEffect, useState } from 'react';

type Props = {
  opponent: MatchOpponent;
};

const MATCH_MESSAGES = [
  'Bola rolando no Maracanã…',
  'Pressão alta desde o início…',
  'Trocando passes no meio-campo…',
  'Chance desperdiçada pelo adversário!',
  'Defesa sólida pela direita…',
  'Contra-ataque perigoso…',
  'VAR checando o lance…',
  'Falta no meio-campo…',
  'Escanteio para o time da casa…',
  'Goleiro faz grande defesa!',
  'Segundo tempo em andamento…',
  'Pressão aumenta nos minutos finais…',
  'Minutos acrescidos…',
  'Apito final iminente!',
];

export function MatchAnimation({ opponent }: Props) {
  const [msgIdx, setMsgIdx] = useState(0);
  const [minute, setMinute] = useState(0);
  const [homeGoal, setHomeGoal] = useState(false);
  const [awayGoal, setAwayGoal] = useState(false);

  useEffect(() => {
    const msgInterval = setInterval(() => {
      setMsgIdx((i) => (i + 1) % MATCH_MESSAGES.length);
    }, 850);
    const minInterval = setInterval(() => {
      setMinute((m) => Math.min(90, m + 3));
    }, 160);
    return () => {
      clearInterval(msgInterval);
      clearInterval(minInterval);
    };
  }, []);

  return (
    <div
      className="flex flex-col items-center justify-center py-10 space-y-8
                    animate-[fadeIn_0.4s_ease-out]"
    >
      {/* Placar animado */}
      <div className="bg-surface border border-border rounded-2xl px-8 py-5 text-center">
        <div className="flex items-center gap-6">
          <TeamBadge name="🇧🇷 Seleção BR" color="text-gold" />
          <div className="text-center min-w-[80px]">
            <p className="font-display text-5xl text-parchment">
              <span className={homeGoal ? 'text-gold' : ''}>?</span>
              <span className="text-muted mx-2">×</span>
              <span className={awayGoal ? opponent.color : ''}>?</span>
            </p>
            <p className="text-muted text-xs mt-1 font-mono">{minute}'</p>
          </div>
          <TeamBadge
            name={`${opponent.flag} ${opponent.name.split(' ')[0]}`}
            color={opponent.color}
          />
        </div>
      </div>

      {/* Campo animado */}
      <div className="relative w-64 h-40 pitch-bg rounded-xl border border-[#1a4a1a] overflow-hidden">
        {/* Marcações simplificadas */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 62">
          <g stroke="rgba(255,255,255,0.12)" fill="none" strokeWidth="0.8">
            <rect x="2" y="2" width="96" height="58" />
            <line x1="50" y1="2" x2="50" y2="60" />
            <circle cx="50" cy="31" r="8" />
          </g>
        </svg>
        {/* Bola animada */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-2xl animate-bounce" style={{ animationDuration: '0.5s' }}>
            ⚽
          </div>
        </div>
        {/* Jogadores simulados */}
        <PlayerDot top={75} left={50} color="#c9a84c" />
        <PlayerDot top={50} left={30} color="#c9a84c" />
        <PlayerDot top={50} left={70} color="#c9a84c" />
        <PlayerDot top={25} left={50} color="#c9a84c" />
        <PlayerDot top={25} left={30} color="#e53e3e" />
        <PlayerDot top={50} left={50} color="#e53e3e" />
      </div>

      {/* Mensagem de status */}
      <div className="text-center space-y-2">
        <p className="text-parchment text-sm font-medium transition-all duration-300">
          {MATCH_MESSAGES[msgIdx]}
        </p>
        <div className="flex items-center justify-center gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-gold animate-bounce"
              style={{ animationDelay: `${i * 150}ms`, animationDuration: '0.6s' }}
            />
          ))}
        </div>
        <p className="text-muted text-xs">Simulando via match-simulator…</p>
      </div>
    </div>
  );
}

function TeamBadge({ name, color }: { name: string; color: string }) {
  return (
    <p className={`font-semibold text-xs text-center max-w-[80px] leading-tight ${color}`}>
      {name}
    </p>
  );
}

function PlayerDot({ top, left, color }: { top: number; left: number; color: string }) {
  return (
    <div
      className="absolute w-2 h-2 rounded-full"
      style={{
        top: `${top}%`,
        left: `${left}%`,
        background: color,
        transform: 'translate(-50%,-50%)',
        boxShadow: `0 0 4px ${color}`,
      }}
    />
  );
}
