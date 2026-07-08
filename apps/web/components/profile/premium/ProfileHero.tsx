'use client';

import { useAuth } from '@/lib/auth-context';
import { motion } from 'framer-motion';

function levelTitle(lv: number): string {
  if (lv >= 50) return 'GOAT';
  if (lv >= 30) return 'Imortal';
  if (lv >= 20) return 'Lenda';
  if (lv >= 15) return 'Superestrela';
  if (lv >= 12) return 'Estrela';
  if (lv >= 10) return 'Ídolo';
  if (lv >= 8) return 'Internacional';
  if (lv >= 5) return 'Profissional';
  return 'Recruta';
}

type Props = {
  wins: number;
  draws: number;
  losses: number;
  winRate: number;
  username?: string | undefined;
  credits?: number;
  fragments?: number;
  level?: number;
  xp?: number;
  xpForNext?: number;
};

export function ProfileHero({
  wins,
  draws,
  losses,
  winRate,
  username,
  credits = 0,
  fragments = 0,
  level = 1,
  xp = 0,
  xpForNext = 100,
}: Props) {
  const { user } = useAuth();

  const guestName =
    (user?.user_metadata?.name as string | undefined) ?? user?.email?.split('@')[0] ?? 'Jogador';

  const name = username ?? guestName;
  const xpCur = xp;
  const xpNext = xpForNext;
  const frags = fragments;
  const title = levelTitle(level);
  const xpPct = Math.round((xpCur / Math.max(1, xpNext)) * 100);
  const initial = name.charAt(0).toUpperCase();
  const total = wins + draws + losses;

  return (
    <div className="relative overflow-hidden">
      {/* Banner background */}
      <div
        className="h-32 w-full relative"
        style={{
          background: 'linear-gradient(135deg, #0d1a33 0%, #07080f 40%, #1a1200 70%, #0d0a00 100%)',
        }}
      >
        {/* Decorative grid */}
        <div
          className="absolute inset-0 opacity-8"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, transparent, transparent 30px, rgba(201,168,76,0.2) 30px, rgba(201,168,76,0.2) 31px)',
          }}
        />
        {/* Glow blobs */}
        <div
          className="absolute top-0 left-1/4 w-48 h-48 rounded-full blur-3xl"
          style={{ background: 'rgba(201,168,76,0.08)' }}
        />
        <div
          className="absolute top-0 right-1/4 w-32 h-32 rounded-full blur-3xl"
          style={{ background: 'rgba(59,130,246,0.06)' }}
        />
        {/* WL watermark */}
        <p className="absolute right-6 top-4 font-display text-[80px] leading-none text-white/4 select-none">
          WL
        </p>
      </div>

      {/* Content */}
      <div className="px-5 pb-5">
        <div className="flex items-end gap-4 -mt-10 relative z-10">
          {/* Avatar */}
          <motion.div
            className="relative shrink-0"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 14 }}
          >
            <div
              className="w-24 h-24 rounded-3xl flex items-center justify-center text-obsidian font-black border-4 border-obsidian"
              style={{
                background: 'linear-gradient(135deg, #c9a84c, #e6c85a)',
                boxShadow: '0 0 30px rgba(201,168,76,0.5), 0 8px 24px rgba(0,0,0,0.5)',
                fontSize: 36,
                fontFamily: '"Bebas Neue", Impact, sans-serif',
              }}
            >
              {initial}
            </div>
            {/* Level ring */}
            <div
              className="absolute -bottom-1.5 -right-1.5 w-9 h-9 rounded-full border-3 border-obsidian
                         flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #c9a84c, #e6c85a)',
                boxShadow: '0 0 12px rgba(201,168,76,0.7)',
                border: '3px solid #07080f',
              }}
            >
              <span className="font-display text-sm text-obsidian font-black leading-none">
                {level}
              </span>
            </div>
          </motion.div>

          {/* Name + title */}
          <motion.div
            className="pb-1 min-w-0 flex-1"
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h1 className="font-display text-3xl text-parchment tracking-wider truncate">
              {name.toUpperCase()}
            </h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span
                className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full"
                style={{
                  background: 'rgba(201,168,76,0.12)',
                  border: '1px solid rgba(201,168,76,0.3)',
                  color: '#c9a84c',
                }}
              >
                {title}
              </span>
              <span className="text-white/30 text-[10px]">{total} partidas</span>
            </div>
          </motion.div>
        </div>

        {/* XP bar */}
        <motion.div
          className="mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex justify-between text-[10px] mb-1.5">
            <span className="text-muted">
              Nível {level} → {level + 1}
            </span>
            <span className="text-gold font-bold">
              {xpCur.toLocaleString('pt-BR')} / {xpNext.toLocaleString('pt-BR')} XP
            </span>
          </div>
          <div className="h-2 bg-surface rounded-full overflow-hidden border border-white/5">
            <motion.div
              className="h-full rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: `${xpPct}%` }}
              transition={{ duration: 1.2, delay: 0.4, ease: 'easeOut' }}
              style={{
                background: 'linear-gradient(90deg, #8c6f27, #c9a84c, #e6c85a)',
                boxShadow: '0 0 8px rgba(201,168,76,0.5)',
              }}
            />
          </div>
        </motion.div>

        {/* Resource pills */}
        <motion.div
          className="flex gap-2 mt-3 flex-wrap"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <ResPill icon="💰" value={credits.toLocaleString('pt-BR')} label="c" color="#c9a84c" />
          <ResPill icon="💎" value={frags.toLocaleString('pt-BR')} label="gemas" color="#60a5fa" />
          <ResPill icon="🏆" value={`${winRate}%`} label="vitórias" color="#10b981" />
          <ResPill icon="⚽" value={wins} label="vitórias" color="#34d399" small />
          <ResPill icon="⚖️" value={draws} label="empates" color="#facc15" small />
          <ResPill icon="💔" value={losses} label="derrotas" color="#f87171" small />
        </motion.div>
      </div>
    </div>
  );
}

function ResPill({
  icon,
  value,
  label,
  color,
  small = false,
}: {
  icon: string;
  value: string | number;
  label: string;
  color: string;
  small?: boolean;
}) {
  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full"
      style={{
        background: `rgba(${hexRgb(color)}, 0.08)`,
        border: `1px solid rgba(${hexRgb(color)}, 0.2)`,
      }}
    >
      <span className={small ? 'text-xs' : 'text-base'}>{icon}</span>
      <span className={`font-display ${small ? 'text-sm' : 'text-lg'}`} style={{ color }}>
        {value}
      </span>
      {!small && (
        <span className="text-[9px]" style={{ color: `rgba(${hexRgb(color)},0.6)` }}>
          {label}
        </span>
      )}
    </div>
  );
}

function hexRgb(hex: string): string {
  const NAMED: Record<string, string> = {
    '#c9a84c': '201,168,76',
    '#60a5fa': '96,165,250',
    '#10b981': '16,185,129',
    '#34d399': '52,211,153',
    '#facc15': '250,204,21',
    '#f87171': '248,113,113',
  };
  return NAMED[hex] ?? '200,200,200';
}
