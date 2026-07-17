'use client';

/**
 * components/dev/home-v2/HomeV2Experience.tsx — Sprint 43F (Home V2
 * Prototype Behind an Internal Route)
 *
 * Shell do protótipo: header restrito (só dado real), destaque das 3
 * cartas (via `selectTopCards`, já integrado no view-model), navegação
 * primária de 5 áreas, e UM painel contextual por vez (nunca 5
 * dashboards simultâneos). Nunca chama Gemini, nunca toca Asset
 * Studio, nunca escreve em gameplay/economia — é só leitura do
 * `HomeV2ViewModel` já montado pela rota.
 */

import { ResolvedWorldLegendsCard } from '@/components/cards/ResolvedWorldLegendsCard';
import type { HomeV2ViewModel } from '@/lib/home-v2/view-model';
import Link from 'next/link';
import { useState } from 'react';
import { HomeV2ContextPanel } from './HomeV2ContextPanel';

export type PrimaryArea = 'jogar' | 'squad' | 'collection' | 'market' | 'packs';

const PRIMARY_AREAS: Array<{ id: PrimaryArea; label: string }> = [
  { id: 'jogar', label: 'Jogar' },
  { id: 'squad', label: 'Meu Squad' },
  { id: 'collection', label: 'Coleção' },
  { id: 'market', label: 'Mercado' },
  { id: 'packs', label: 'Packs' },
];

export function HomeV2Experience({ viewModel }: { viewModel: HomeV2ViewModel }) {
  const [activeArea, setActiveArea] = useState<PrimaryArea>('jogar');

  return (
    <div className="min-h-screen bg-obsidian text-parchment">
      <div className="mx-auto max-w-6xl px-4 py-4 lg:px-8 lg:py-6 space-y-5 lg:space-y-6">
        <HomeV2Header viewModel={viewModel} />

        <HighlightedCards cards={viewModel.highlightedCards} />

        <nav aria-label="Navegação primária" className="grid grid-cols-5 gap-1.5 lg:gap-3">
          {PRIMARY_AREAS.map((area) => {
            const selected = area.id === activeArea;
            return (
              <button
                key={area.id}
                type="button"
                aria-current={selected ? 'true' : undefined}
                onClick={() => setActiveArea(area.id)}
                className={`min-h-11 rounded-xl px-2 py-2.5 text-[11px] lg:text-sm font-bold transition-colors ${
                  selected
                    ? 'bg-gold-dim text-obsidian'
                    : 'bg-white/5 text-muted hover:bg-white/10 hover:text-parchment'
                }`}
              >
                {area.label}
              </button>
            );
          })}
        </nav>

        <HomeV2ContextPanel area={activeArea} viewModel={viewModel} />
      </div>
    </div>
  );
}

function HomeV2Header({ viewModel }: { viewModel: HomeV2ViewModel }) {
  const { userSummary, currencies, progression } = viewModel;
  return (
    <header className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <span className="font-display text-lg lg:text-xl text-gold-dim shrink-0">
          World Legends
        </span>
        <div className="min-w-0">
          <p className="text-parchment text-sm font-bold truncate">{userSummary.username}</p>
          <p className="text-muted text-[10px]">
            Nível {progression.level} · {progression.xp}/{progression.xpForNext} XP
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-[11px] lg:text-xs text-parchment font-bold">
          {currencies.softCurrency.toLocaleString('pt-BR')}c
        </span>
        <span className="text-[11px] lg:text-xs text-muted font-bold">
          {currencies.fragmentBalance.toLocaleString('pt-BR')} frag.
        </span>
        <Link
          href="/settings"
          aria-label="Configurações"
          className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-muted hover:text-parchment"
        >
          ⚙
        </Link>
      </div>
    </header>
  );
}

/**
 * Central = ranking[0], flanqueada por ranking[1]/ranking[2] — igual
 * especificado em docs/design/09 §4. Nunca pré-carrega `showcase`
 * (density="standard" fixo aqui, igual o resto do app usa em contextos
 * de destaque/hero — ver BestCardShowcase.tsx). Clique abre a rota real
 * de detalhe (`/collection/[cardId]`), nunca um modal novo.
 */
function HighlightedCards({ cards }: { cards: HomeV2ViewModel['highlightedCards'] }) {
  if (cards.length === 0) {
    return (
      <section
        aria-label="Cartas em destaque"
        className="glass rounded-xl p-6 text-center space-y-2"
      >
        <p className="text-parchment text-sm font-bold">Você ainda não tem cartas</p>
        <p className="text-muted text-xs">Abra seu primeiro pack pra começar sua coleção.</p>
        <Link
          href="/packs"
          className="inline-block mt-2 px-4 py-2 rounded-lg bg-gold-dim text-obsidian text-xs font-bold"
        >
          Abrir pacotes
        </Link>
      </section>
    );
  }

  const [top, second, third] = cards;
  // 1 carta: só a central. 2 cartas: central + uma flanqueando. 3+: central com 2ª/3ª nas laterais.
  const flanks = [second, third].filter((c): c is NonNullable<typeof c> => Boolean(c));

  return (
    <section
      aria-label="Cartas em destaque"
      className="flex items-end justify-center gap-2 lg:gap-4"
    >
      {flanks[0] && (
        <HighlightedCardLink
          card={flanks[0]}
          size="sm"
          label={`2ª carta em destaque: ${flanks[0].displayName}`}
        />
      )}
      {top && (
        <HighlightedCardLink
          card={top}
          size="lg"
          label={`Carta principal em destaque: ${top.displayName}`}
        />
      )}
      {flanks[1] && (
        <HighlightedCardLink
          card={flanks[1]}
          size="sm"
          label={`3ª carta em destaque: ${flanks[1].displayName}`}
        />
      )}
    </section>
  );
}

function HighlightedCardLink({
  card,
  size,
  label,
}: {
  card: HomeV2ViewModel['highlightedCards'][number];
  size: 'sm' | 'lg';
  label: string;
}) {
  return (
    <Link
      href={`/collection/${encodeURIComponent(card.cardId)}`}
      aria-label={label}
      className="shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-dim rounded-lg"
    >
      <ResolvedWorldLegendsCard card={card} size={size === 'lg' ? 'lg' : 'sm'} density="standard" />
    </Link>
  );
}
