'use client';

import { useGameState } from '@/lib/game-context';
import { USER_PROFILE } from '@/lib/mock-data';
import Link from 'next/link';

function getTitle(level: number): string {
  if (level >= 50) return 'GOAT';
  if (level >= 30) return 'Imortal';
  if (level >= 20) return 'Lenda';
  if (level >= 15) return 'Superestrela';
  if (level >= 12) return 'Estrela';
  if (level >= 10) return 'Ídolo';
  if (level >= 8) return 'Internacional';
  if (level >= 5) return 'Profissional';
  return 'Recruta';
}

export function PlayerHeader() {
  const state = useGameState();

  const name = state.isOnboarded ? state.username : USER_PROFILE.username;
  const level = state.isOnboarded ? state.level : USER_PROFILE.level;
  const xpCur = state.isOnboarded ? state.currentXp : USER_PROFILE.currentXp;
  const xpNext = state.isOnboarded ? state.xpForNext : USER_PROFILE.xpForNext;
  const credits = state.isOnboarded ? state.credits : USER_PROFILE.credits;
  const frags = state.isOnboarded ? state.fragments : USER_PROFILE.fragments;
  const initial = name.charAt(0).toUpperCase();
  const title = getTitle(level);
  const xpPct = Math.round((xpCur / Math.max(1, xpNext)) * 100);

  return (
    <header className="relative px-4 pt-4 pb-3 stagger-1">
      <div
        className="relative rounded-2xl px-4 py-4 overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.025)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(201,168,76,0.14)',
        }}
      >
        {/* Background glow */}
        <div
          className="absolute -top-12 -right-12 w-40 h-40 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle,rgba(201,168,76,0.18) 0%,transparent 70%)',
            animation: 'glowBreathe 4s ease-in-out infinite',
          }}
        />

        {/* Row 1: avatar + info + settings */}
        <div className="flex items-center gap-3 relative z-10">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div
              className="w-[54px] h-[54px] rounded-[14px] flex items-center justify-center font-display text-[28px] text-obsidian"
              style={{
                background: 'linear-gradient(135deg,#c9a84c 0%,#e6c85a 55%,#c9a84c 100%)',
                boxShadow: '0 0 0 2px rgba(201,168,76,0.35), 0 6px 20px rgba(201,168,76,0.28)',
                animation: 'floatY 5s ease-in-out infinite',
              }}
            >
              {initial}
            </div>
            {/* Level badge */}
            <div
              className="absolute -bottom-1.5 -right-1.5 w-[22px] h-[22px] rounded-full flex items-center justify-center font-display text-[10px] text-obsidian"
              style={{
                background: 'linear-gradient(135deg,#c9a84c,#e6c85a)',
                boxShadow: '0 0 8px rgba(201,168,76,0.55)',
              }}
            >
              {level}
            </div>
          </div>

          {/* Name + title + XP */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 mb-1.5">
              <h1 className="font-display text-[20px] leading-none tracking-wider text-parchment truncate">
                {name.toUpperCase()}
              </h1>
              <span
                className="text-[8px] font-black uppercase tracking-widest shrink-0"
                style={{
                  background: 'linear-gradient(90deg,#c9a84c,#e6c85a)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {title}
              </span>
            </div>

            {/* XP bar */}
            <div
              className="h-[5px] rounded-full overflow-hidden mb-1"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            >
              <div className="xp-bar" style={{ width: `${xpPct}%` }} />
            </div>
            <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
              {xpCur.toLocaleString('pt-BR')} / {xpNext.toLocaleString('pt-BR')} XP
            </p>
          </div>

          {/* Settings link */}
          <Link
            href="/settings"
            className="shrink-0 w-8 h-8 rounded-[8px] flex items-center justify-center transition-all hover:bg-white/5 active:scale-90"
            style={{ border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(106,112,144,1)"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
          </Link>
        </div>

        {/* Row 2: resource pills */}
        <div className="flex gap-2 mt-3 relative z-10">
          <ResourcePill
            icon={
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#c9a84c"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <circle cx="12" cy="12" r="8" />
                <path d="M12 6v6l4 2" />
              </svg>
            }
            value={credits.toLocaleString('pt-BR')}
            label="Créditos"
            color="#c9a84c"
          />
          <ResourcePill
            icon={
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#60a5fa"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            }
            value={frags.toLocaleString('pt-BR')}
            label="Gems"
            color="#60a5fa"
          />
        </div>
      </div>
    </header>
  );
}

function ResourcePill({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  color: string;
}) {
  return (
    <div
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
      style={{
        background: `${color}12`,
        border: `1px solid ${color}28`,
      }}
    >
      {icon}
      <span className="font-display text-[13px] leading-none" style={{ color }}>
        {value}
      </span>
      <span className="text-[9px]" style={{ color: `${color}88` }}>
        {label}
      </span>
    </div>
  );
}
