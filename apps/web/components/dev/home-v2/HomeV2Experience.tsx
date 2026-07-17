'use client';

/**
 * components/dev/home-v2/HomeV2Experience.tsx — Sprint 43F (Home V2
 * Prototype Behind an Internal Route) + Sprint 43F.1 (Visual Hierarchy
 * and Game Identity)
 *
 * Sprint 43F.1 — refino visual pedido pelo QA do dono: cartas em
 * destaque pequenas demais, painel parecendo relatório de texto,
 * navegação genérica, header apertado. Nada de arquitetura mudou (as
 * mesmas 5 áreas, 1 painel por vez, dado real, sem mock) — só
 * hierarquia visual, reusando tokens/ícones/glow já existentes no
 * projeto (Sidebar.tsx pros ícones, utilitários glass e glow de
 * globals.css) — nunca um sistema de design novo, nunca tão intenso
 * quanto a tela de abertura de pack.
 */

import { ResolvedWorldLegendsCard } from '@/components/cards/ResolvedWorldLegendsCard';
import type { CollectionCard } from '@/lib/collection-data';
import { selectHeroPresentation } from '@/lib/home-v2/select-hero-presentation';
import type { HomeV2ViewModel } from '@/lib/home-v2/view-model';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { HomeV2ContextPanel } from './HomeV2ContextPanel';

export type PrimaryArea = 'jogar' | 'squad' | 'collection' | 'market' | 'packs';

// ─── Ícones — reusados de Sidebar.tsx/PremiumBottomNav.tsx, nunca reinventados ─

/** Mesmo path do ícone "Jogar" da nav (círculo + play) — Sprint 43F.2 reusa isto no botão "Jogar agora" do painel contextual, nunca mais o emoji ⚽. */
export const PLAY_ICON_PATH = [
  'M12 22c5.52 0 10-4.48 10-10S17.52 2 12 2 2 6.48 2 12s4.48 10 10 10z',
  'M10 8l6 4-6 4V8z',
] as const;

export function NavIcon({ d, size = 20 }: { d: string | readonly string[]; size?: number }) {
  const paths = Array.isArray(d) ? d : [d];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths.map((p) => (
        <path key={p} d={p} />
      ))}
    </svg>
  );
}

export const PRIMARY_AREAS: Array<{
  id: PrimaryArea;
  label: string;
  icon: string | readonly string[];
  accent: string;
}> = [
  {
    id: 'jogar',
    label: 'Jogar',
    icon: PLAY_ICON_PATH,
    accent: '#10b981',
  },
  {
    id: 'squad',
    label: 'Meu Squad',
    icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
    accent: '#3b82f6',
  },
  {
    id: 'collection',
    label: 'Coleção',
    icon: ['M4 6h16M4 12h16M4 18h16', 'M8 3l4 3 4-3'],
    accent: '#f59e0b',
  },
  {
    id: 'market',
    label: 'Mercado',
    icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z',
    accent: '#c084fc',
  },
  {
    id: 'packs',
    label: 'Packs',
    icon: 'M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12',
    accent: '#e6c85a',
  },
];

export function HomeV2Experience({ viewModel }: { viewModel: HomeV2ViewModel }) {
  const [activeArea, setActiveArea] = useState<PrimaryArea>('jogar');
  const presentation = useMemo(
    () => selectHeroPresentation(viewModel.highlightedCards),
    [viewModel.highlightedCards],
  );

  return (
    <div className="min-h-screen bg-obsidian text-parchment">
      <div className="mx-auto max-w-5xl px-4 py-4 lg:px-8 lg:py-6 space-y-4 lg:space-y-5">
        <HomeV2Header viewModel={viewModel} />

        <HeroSection presentation={presentation} />

        <PrimaryNav activeArea={activeArea} onSelect={setActiveArea} />

        <HomeV2ContextPanel area={activeArea} viewModel={viewModel} />
      </div>
    </div>
  );
}

function HomeV2Header({ viewModel }: { viewModel: HomeV2ViewModel }) {
  const { userSummary, currencies, progression } = viewModel;
  const xpPercent =
    progression.xpForNext > 0
      ? Math.min(100, Math.round((progression.xp / progression.xpForNext) * 100))
      : 0;

  return (
    <header className="glass-surface rounded-2xl px-4 py-2.5 lg:px-5 lg:py-2.5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <span
          className="font-display text-lg lg:text-xl tracking-wide shrink-0"
          style={{ color: '#c9a84c', textShadow: '0 0 18px rgba(201,168,76,0.45)' }}
        >
          World Legends
        </span>
        <div className="w-px h-7 bg-white/[0.06] shrink-0" />
        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
            <p className="text-parchment text-sm font-bold truncate">{userSummary.username}</p>
            <span className="text-[11px] font-bold text-gold-dim shrink-0">
              Nível {progression.level}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <div className="w-24 lg:w-32 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${xpPercent}%`,
                  background: 'linear-gradient(90deg, #8c6f27, #e6c85a)',
                }}
              />
            </div>
            <span className="text-[10px] text-white/55 tabular-nums font-semibold">
              {progression.xp}/{progression.xpForNext} XP
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="glass-gold rounded-full px-3 py-1.5 flex items-center gap-3">
          <span className="text-[12px] lg:text-sm text-parchment font-bold tabular-nums">
            {currencies.softCurrency.toLocaleString('pt-BR')}c
          </span>
          <span className="w-px h-3.5 bg-white/[0.08]" />
          <span className="text-[12px] lg:text-sm text-white/60 font-bold tabular-nums">
            {currencies.fragmentBalance.toLocaleString('pt-BR')} frag.
          </span>
        </div>
        <Link
          href="/settings"
          aria-label="Configurações"
          className="w-10 h-10 min-w-11 min-h-11 rounded-full glass flex items-center justify-center text-white/50 hover:text-parchment hover:border-white/20 transition-colors"
        >
          <NavIcon
            d="M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
            size={16}
          />
        </Link>
      </div>
    </header>
  );
}

// ─── Hero — cartas em destaque ──────────────────────────────────────────────

/**
 * Escala responsiva — dois níveis (mobile/desktop), nunca um valor fixo
 * só pra desktop. A proporção lateral/central fica sempre em exatos 78%
 * (dentro da faixa 72–82% pedida) nos dois níveis — só o valor central
 * muda. No mobile a escala é bem menor especificamente pra 3 cartas
 * caberem lado a lado sem overflow horizontal (390px de viewport,
 * ~358px de área útil após padding) — nunca corta/estica a carta, só
 * reduz a escala inteira.
 *
 * Sprint 43F.2 — reduzido de 0.85/1.55 pra 0.78/1.4 (± 12% de altura de
 * seção a menos, junto com o padding vertical reduzido logo abaixo)
 * pra expor mais do painel contextual acima da dobra, sem voltar ao
 * tamanho subdimensionado da Sprint 43F original.
 */
const HERO_SCALE = {
  mobile: { center: 0.78, side: 0.78 * 0.78 },
  desktop: { center: 1.4, side: 1.4 * 0.78 },
} as const;

function useIsDesktopViewport(): boolean {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isDesktop;
}

function scaledCardStyle(scale: number): React.CSSProperties {
  return { width: 148 * scale, height: 199 * scale, position: 'relative' };
}

export function HeroSection({
  presentation,
}: {
  presentation: ReturnType<typeof selectHeroPresentation>;
}) {
  const isDesktop = useIsDesktopViewport();
  const scale = isDesktop ? HERO_SCALE.desktop : HERO_SCALE.mobile;

  if (!presentation) {
    return (
      <section
        aria-label="Cartas em destaque"
        className="glass-surface rounded-2xl px-6 py-10 text-center space-y-3"
      >
        <p className="text-parchment text-base font-bold">Você ainda não tem cartas</p>
        <p className="text-white/50 text-xs">Abra seu primeiro pack pra começar sua coleção.</p>
        <Link
          href="/packs"
          className="inline-block mt-1 px-5 py-2.5 rounded-lg bg-gold-dim text-obsidian text-xs font-bold glow-gold-sm"
        >
          Abrir pacotes
        </Link>
      </section>
    );
  }

  const { center, flankLeft, flankRight } = presentation;

  return (
    <section
      aria-label="Cartas em destaque"
      className="glass-surface relative rounded-2xl overflow-hidden py-6 lg:py-7"
    >
      {/* Camada de fundo radial — separada do surface token pra nunca sobrescrever a borda/fundo compartilhados com header/painel. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 80% at 50% 35%, rgba(140,111,39,0.16) 0%, transparent 65%)',
        }}
      />
      {/* Spotlight ambiente — respeita prefers-reduced-motion (motion-safe:) */}
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] rounded-full pointer-events-none motion-safe:animate-[glowBreathe_5s_ease-in-out_infinite]"
        style={{ background: 'rgba(201,168,76,0.16)', filter: 'blur(60px)' }}
      />
      {/* Brilho de piso sob as cartas */}
      <div
        aria-hidden="true"
        className="absolute left-1/2 bottom-4 -translate-x-1/2 w-[70%] h-8 rounded-full pointer-events-none"
        style={{ background: 'rgba(201,168,76,0.22)', filter: 'blur(28px)' }}
      />

      <div className="relative z-10 flex items-end justify-center gap-2 lg:gap-5">
        {flankLeft && (
          <HeroCard card={flankLeft} scale={scale.side} depth="side" label="2ª carta em destaque" />
        )}
        <HeroCard
          card={center}
          scale={scale.center}
          depth="center"
          label="Carta principal em destaque"
        />
        {flankRight && (
          <HeroCard
            card={flankRight}
            scale={scale.side}
            depth="side"
            label="3ª carta em destaque"
          />
        )}
      </div>
    </section>
  );
}

function HeroCard({
  card,
  scale,
  depth,
  label,
}: {
  card: CollectionCard;
  scale: number;
  depth: 'center' | 'side';
  label: string;
}) {
  return (
    <Link
      href={`/collection/${encodeURIComponent(card.cardId)}`}
      aria-label={`${label}: ${card.displayName}`}
      className={`shrink-0 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-dim transition-transform hover:scale-[1.03] ${
        depth === 'side' ? 'mb-2 opacity-85' : 'z-10'
      }`}
      style={{
        filter:
          depth === 'center'
            ? 'drop-shadow(0 18px 34px rgba(0,0,0,0.55)) drop-shadow(0 0 24px rgba(201,168,76,0.25))'
            : 'drop-shadow(0 10px 20px rgba(0,0,0,0.45))',
      }}
    >
      <div style={scaledCardStyle(scale)}>
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          <ResolvedWorldLegendsCard card={card} size="lg" density="standard" glow />
        </div>
      </div>
    </Link>
  );
}

// ─── Navegação primária ──────────────────────────────────────────────────────

function PrimaryNav({
  activeArea,
  onSelect,
}: {
  activeArea: PrimaryArea;
  onSelect: (area: PrimaryArea) => void;
}) {
  return (
    <nav
      aria-label="Navegação primária"
      className="flex gap-2 overflow-x-auto lg:grid lg:grid-cols-5 lg:overflow-visible pb-1 -mb-1"
    >
      {PRIMARY_AREAS.map((area) => {
        const selected = area.id === activeArea;
        return (
          <button
            key={area.id}
            type="button"
            aria-current={selected ? 'true' : undefined}
            onClick={() => onSelect(area.id)}
            className="shrink-0 min-w-[92px] lg:min-w-0 min-h-11 rounded-xl px-3 py-2.5 flex flex-col items-center gap-1 transition-colors"
            style={
              selected
                ? {
                    background: `${area.accent}18`,
                    border: `1px solid ${area.accent}55`,
                    boxShadow: `0 0 16px ${area.accent}30`,
                    color: area.accent,
                  }
                : {
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    color: 'rgba(255,255,255,0.5)',
                  }
            }
          >
            <NavIcon d={area.icon} size={18} />
            <span className="text-[10px] lg:text-[11px] font-bold whitespace-nowrap">
              {area.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
