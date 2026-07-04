'use client';

/**
 * components/ui/Skeleton.tsx — Sprint 3
 *
 * Skeletons elegantes para estados de carregamento.
 *
 * Variantes:
 *   card         — card de coleção (portrait)
 *   card-wide    — card horizontal (lista)
 *   stat         — linha de estatística
 *   profile      — hero do perfil
 *   grid-2       — grid 2 colunas
 *   leaderboard  — linha de ranking
 *   pack         — pack de abertura
 *   text         — bloco de texto genérico
 */

import type { ReactNode } from 'react';

// ─── Base shimmer ─────────────────────────────────────────────────────────────

function Shimmer({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`relative overflow-hidden rounded-lg bg-white/[0.04] ${className}`}
      style={style}
    >
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.055) 50%, transparent 100%)',
          backgroundSize: '200% 100%',
          animation: 'skeleton-shimmer 1.8s ease-in-out infinite',
        }}
      />
    </div>
  );
}

// ─── Variantes ────────────────────────────────────────────────────────────────

export function SkeletonCard() {
  return (
    <div className="flex flex-col gap-2 p-3 rounded-2xl border border-white/5 bg-white/[0.025]">
      <Shimmer className="h-32 rounded-xl" />
      <Shimmer className="h-4 w-3/4 rounded" />
      <Shimmer className="h-3 w-1/2 rounded" />
      <div className="flex gap-2 mt-1">
        <Shimmer className="h-5 w-12 rounded-full" />
        <Shimmer className="h-5 w-16 rounded-full" />
      </div>
    </div>
  );
}

export function SkeletonCardWide() {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/[0.02]">
      <Shimmer className="w-12 h-16 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <Shimmer className="h-4 w-2/3 rounded" />
        <Shimmer className="h-3 w-1/3 rounded" />
      </div>
      <Shimmer className="w-10 h-6 rounded-full shrink-0" />
    </div>
  );
}

export function SkeletonStat() {
  return (
    <div className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-white/5 bg-white/[0.02]">
      <Shimmer className="h-3 w-20 rounded" />
      <div className="flex items-center gap-2">
        <Shimmer className="h-1.5 w-24 rounded-full" />
        <Shimmer className="h-3 w-8 rounded" />
      </div>
    </div>
  );
}

export function SkeletonProfile() {
  return (
    <div className="relative overflow-hidden">
      {/* Banner */}
      <Shimmer className="h-32 w-full rounded-none" />

      {/* Avatar area */}
      <div className="px-5 pb-5">
        <div className="flex items-end gap-4 -mt-10">
          <Shimmer className="w-24 h-24 rounded-3xl shrink-0" style={{ border: '4px solid #07080f' }} />
          <div className="flex-1 pb-1 space-y-2">
            <Shimmer className="h-7 w-40 rounded" />
            <Shimmer className="h-4 w-24 rounded-full" />
          </div>
        </div>

        {/* XP bar */}
        <div className="mt-4 space-y-1.5">
          <div className="flex justify-between">
            <Shimmer className="h-3 w-20 rounded" />
            <Shimmer className="h-3 w-24 rounded" />
          </div>
          <Shimmer className="h-2 w-full rounded-full" />
        </div>

        {/* Pills */}
        <div className="flex gap-2 mt-3">
          {[60, 72, 56, 40, 44, 40].map((w, i) => (
            <Shimmer key={i} className={`h-7 w-${w < 60 ? '10' : w < 72 ? '14' : '16'} rounded-full`} style={{ width: w }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function SkeletonLeaderboard() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
      <Shimmer className="w-6 h-4 rounded shrink-0" />
      <Shimmer className="w-9 h-9 rounded-xl shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Shimmer className="h-3.5 w-24 rounded" />
        <Shimmer className="h-2.5 w-16 rounded" />
      </div>
      <Shimmer className="w-10 h-5 rounded shrink-0" />
    </div>
  );
}

export function SkeletonPack() {
  return (
    <div className="flex flex-col items-center gap-4 p-6">
      <Shimmer className="w-48 h-64 rounded-3xl" />
      <Shimmer className="h-5 w-32 rounded" />
      <Shimmer className="h-12 w-48 rounded-2xl" />
    </div>
  );
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  const widths = [100, 85, 70, 90, 60];
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }, (_, i) => (
        <Shimmer
          key={i}
          className="h-3.5 rounded"
          style={{ width: `${widths[i % widths.length]}%` }}
        />
      ))}
    </div>
  );
}

// ─── Grid de skeletons ────────────────────────────────────────────────────────

export function SkeletonGrid2({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 px-4">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2 px-4">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCardWide key={i} />
      ))}
    </div>
  );
}

// ─── Skeleton polimórfico ─────────────────────────────────────────────────────

export type SkeletonVariant =
  | 'card'
  | 'card-wide'
  | 'stat'
  | 'profile'
  | 'grid-2'
  | 'leaderboard'
  | 'pack'
  | 'text'
  | 'list';

const SKELETON_MAP: Record<SkeletonVariant, (props?: Record<string, unknown>) => ReactNode> = {
  'card':         () => <SkeletonCard />,
  'card-wide':    () => <SkeletonCardWide />,
  'stat':         () => <SkeletonStat />,
  'profile':      () => <SkeletonProfile />,
  'grid-2':       () => <SkeletonGrid2 />,
  'leaderboard':  () => <SkeletonLeaderboard />,
  'pack':         () => <SkeletonPack />,
  'text':         () => <SkeletonText />,
  'list':         () => <SkeletonList />,
};

export function Skeleton({ variant, ...props }: { variant: SkeletonVariant } & Record<string, unknown>) {
  const Component = SKELETON_MAP[variant];
  return <>{Component(props)}</>;
}
