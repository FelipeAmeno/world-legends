/**
 * lib/perf/lazy.tsx — T069
 *
 * Dynamic imports para componentes pesados.
 * Reduz o bundle inicial carregando módulos sob demanda.
 *
 * Componentes lazy:
 *   - PackExperience  (Framer Motion + pack logic)
 *   - GoatReveal      (usado <5% das aberturas de pack)
 *   - CompareModal    (só quando usuário clica em comparar)
 *   - EventDetailModal
 *   - ListingDetailModal
 *   - NotificationDrawer
 *   - SyncEngine      (não crítico no primeiro render)
 *
 * Cada componente tem um skeleton fallback otimizado.
 */

import dynamic         from 'next/dynamic';
import { Suspense }    from 'react';

// ─── Skeletons ────────────────────────────────────────────────────────────────

export function CardGridSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-3 p-4">
      {Array.from({ length:9 }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-surface animate-pulse" style={{ aspectRatio:'3/4' }} />
      ))}
    </div>
  );
}

export function ModalSkeleton() {
  return (
    <div className="fixed inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center z-[61] sm:p-4">
      <div className="w-full sm:max-w-lg bg-midnight border border-border rounded-t-3xl sm:rounded-3xl h-96 animate-pulse" />
    </div>
  );
}

export function FullscreenSkeleton() {
  return (
    <div className="min-h-screen bg-obsidian flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-surface animate-pulse" />
        <div className="w-32 h-4 rounded bg-surface animate-pulse" />
      </div>
    </div>
  );
}

export function PanelSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length:3 }).map((_,i) => (
        <div key={i} className="h-20 rounded-2xl bg-surface animate-pulse" />
      ))}
    </div>
  );
}

// ─── Dynamic imports ──────────────────────────────────────────────────────────

/** PackExperience — Framer Motion pesado + pack logic */
export const PackExperienceLazy = dynamic(
  () => import('@/components/packs/PackExperience').then(m => ({ default:m.PackExperience })),
  { ssr:false, loading:() => <FullscreenSkeleton /> },
);

/** GoatReveal — só usado quando carta WCH é revelada (<5% das aberturas) */
export const GoatRevealLazy = dynamic(
  () => import('@/components/packs/GoatReveal').then(m => ({ default:m.GoatReveal })),
  { ssr:false, loading:() => null },
);

/** CompareModal — só ao clicar em "Comparar" */
export const CompareModalLazy = dynamic(
  () => import('@/components/collection/CompareModal').then(m => ({ default:m.CompareModal })),
  { ssr:false, loading:() => <ModalSkeleton /> },
);

/** CardDetailModal — ao clicar em uma carta */
export const CardDetailModalLazy = dynamic(
  () => import('@/components/collection/CardDetailModal').then(m => ({ default:m.CardDetailModal })),
  { ssr:false, loading:() => <ModalSkeleton /> },
);

/** VirtualCardGrid — carregamento sob demanda na coleção */
export const VirtualCardGridLazy = dynamic(
  () => import('@/components/collection/VirtualCardGrid').then(m => ({ default:m.VirtualCardGrid })),
  { ssr:false, loading:() => <CardGridSkeleton /> },
);

/** MatchExperience — partida (só quando usuário navega para /match) */
export const MatchExperienceLazy = dynamic(
  () => import('@/components/match/premium/MatchExperience').then(m => ({ default:m.MatchExperience })),
  { ssr:false, loading:() => <FullscreenSkeleton /> },
);

/** ListingDetailModal — marketplace */
export const ListingDetailModalLazy = dynamic(
  () => import('@/components/market/ListingDetailModal').then(m => ({ default:m.ListingDetailModal })),
  { ssr:false, loading:() => <ModalSkeleton /> },
);

/** EventDetailModal — só ao clicar em evento */
export const EventDetailModalLazy = dynamic(
  () => import('@/components/events/EventDetailModal').then(m => ({ default:m.EventDetailModal })),
  { ssr:false, loading:() => <ModalSkeleton /> },
);

/** NotificationDrawer — ao abrir sino */
export const NotificationDrawerLazy = dynamic(
  () => import('@/components/notifications/NotificationDrawer').then(m => ({ default:m.NotificationDrawer })),
  { ssr:false, loading:() => null },
);

/** PitchBuilder — Squad Builder complexo */
export const PitchBuilderLazy = dynamic(
  () => import('@/components/squad/premium/PitchBuilder').then(m => ({ default:m.PitchBuilder })),
  { ssr:false, loading:() => <PanelSkeleton /> },
);

/** RewardScreen — só após partida/pack */
export const RewardScreenLazy = dynamic(
  () => import('@/components/rewards/RewardScreen').then(m => ({ default:m.RewardScreen })),
  { ssr:false, loading:() => <FullscreenSkeleton /> },
);

/** Charts (heavy — Recharts) */
export const LeaderboardExperienceLazy = dynamic(
  () => import('@/components/ranking/LeaderboardExperience').then(m => ({ default:m.LeaderboardExperience })),
  { ssr:false, loading:() => <PanelSkeleton /> },
);
