/**
 * components/perf/Suspense.tsx — T069
 *
 * Wrappers de Suspense prontos para uso com os skeletons do World Legends.
 * Cada wrapper tem um fallback otimizado para o tipo de conteúdo.
 */

import { type ReactNode, Suspense } from 'react';

// ─── Fullscreen ───────────────────────────────────────────────────────────────

function FullscreenFallback() {
  return (
    <div className="min-h-screen bg-obsidian flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <div
          className="w-14 h-14 rounded-full border-2 border-gold/30 border-t-gold"
          style={{ animation: 'spin 1s linear infinite' }}
        />
        <div className="text-center">
          <p className="font-display text-2xl gold-text tracking-widest">WORLD</p>
          <p className="font-display text-2xl gold-text tracking-widest">LEGENDS</p>
        </div>
      </div>
    </div>
  );
}

export function FullscreenSuspense({ children }: { children: ReactNode }) {
  return <Suspense fallback={<FullscreenFallback />}>{children}</Suspense>;
}

// ─── Card Grid ────────────────────────────────────────────────────────────────

function CardGridFallback({ cols = 3 }: { cols?: number }) {
  return (
    <div
      className="grid gap-3 p-4"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: cols * 3 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl bg-surface animate-pulse"
          style={{ aspectRatio: '3/4', animationDelay: `${i * 50}ms` }}
        />
      ))}
    </div>
  );
}

export function CardGridSuspense({ children, cols }: { children: ReactNode; cols?: number }) {
  return (
    <Suspense fallback={<CardGridFallback {...(cols !== undefined ? { cols } : {})} />}>
      {children}
    </Suspense>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function ModalFallback() {
  return (
    <div className="fixed inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center z-[61] sm:p-4 pointer-events-none">
      <div
        className="w-full sm:max-w-lg bg-midnight border border-border rounded-t-3xl sm:rounded-3xl animate-pulse"
        style={{ height: 400 }}
      />
    </div>
  );
}

export function ModalSuspense({ children }: { children: ReactNode }) {
  return <Suspense fallback={<ModalFallback />}>{children}</Suspense>;
}

// ─── Section ─────────────────────────────────────────────────────────────────

function SectionFallback({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl bg-surface animate-pulse"
          style={{ height: 72, animationDelay: `${i * 80}ms` }}
        />
      ))}
    </div>
  );
}

export function SectionSuspense({ children, lines }: { children: ReactNode; lines?: number }) {
  return (
    <Suspense fallback={<SectionFallback {...(lines !== undefined ? { lines } : {})} />}>
      {children}
    </Suspense>
  );
}

// ─── Inline (text placeholder) ────────────────────────────────────────────────

function InlineFallback({ width = 120 }: { width?: number }) {
  return (
    <span className="inline-block rounded bg-surface animate-pulse" style={{ width, height: 14 }} />
  );
}

export function InlineSuspense({ children, width }: { children: ReactNode; width?: number }) {
  return (
    <Suspense fallback={<InlineFallback {...(width !== undefined ? { width } : {})} />}>
      {children}
    </Suspense>
  );
}
