'use client';

import { useGameState } from '@/lib/game-context';

type Props = {
  fallbackName: string;
  winRate: number;
  wins: number;
  draws: number;
  losses: number;
  totalXp: number;
};

export function HomeHero({ fallbackName, winRate, wins, draws, losses, totalXp }: Props) {
  const state = useGameState();
  const name = state.isOnboarded ? state.username : fallbackName;
  const rate =
    state.isOnboarded && state.wins + state.draws + state.losses > 0
      ? Math.round((state.wins / (state.wins + state.draws + state.losses)) * 100)
      : winRate;
  const w = state.isOnboarded ? state.wins : wins;
  const d = state.isOnboarded ? state.draws : draws;
  const l = state.isOnboarded ? state.losses : losses;

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 flex items-center justify-between">
      <div>
        <p className="text-muted text-sm">Bem-vindo de volta</p>
        <h1 className="font-display text-4xl gold-text tracking-wider mt-0.5">
          {name.toUpperCase()}
        </h1>
        <p className="text-muted text-sm mt-1">
          {state.isOnboarded ? `Nível ${state.level}` : `Nível ${12}`} ·{' '}
          {totalXp.toLocaleString('pt-BR')} XP total
        </p>
      </div>
      <div className="hidden sm:flex flex-col items-end gap-1 text-right">
        <span className="text-4xl font-display gold-text">{rate}%</span>
        <span className="text-muted text-xs">Taxa de vitória</span>
        <span className="text-muted text-[10px]">
          {w}V · {d}E · {l}D
        </span>
      </div>
    </div>
  );
}
