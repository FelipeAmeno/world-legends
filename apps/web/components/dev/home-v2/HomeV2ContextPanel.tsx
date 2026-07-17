'use client';

/**
 * components/dev/home-v2/HomeV2ContextPanel.tsx — Sprint 43F (Home V2
 * Prototype Behind an Internal Route)
 *
 * UM painel por área selecionada — nunca os 5 simultâneos. Cada painel
 * só mostra dado real (`HomeV2ViewModel`, já montado sem mock) e é
 * honesto sobre indisponibilidade (Mercado transacional, inventário de
 * packs) em vez de fabricar ou omitir silenciosamente.
 */

import type { HomeV2ViewModel } from '@/lib/home-v2/view-model';
import Link from 'next/link';
import type { PrimaryArea } from './HomeV2Experience';

export function HomeV2ContextPanel({
  area,
  viewModel,
}: {
  area: PrimaryArea;
  viewModel: HomeV2ViewModel;
}) {
  return (
    <section aria-live="polite" className="glass rounded-xl p-4 lg:p-5 min-h-[180px]">
      {area === 'jogar' && <JogarPanel viewModel={viewModel} />}
      {area === 'squad' && <SquadPanel viewModel={viewModel} />}
      {area === 'collection' && <CollectionPanel viewModel={viewModel} />}
      {area === 'market' && <MarketPanel viewModel={viewModel} />}
      {area === 'packs' && <PacksPanel viewModel={viewModel} />}
    </section>
  );
}

function PanelHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[10px] uppercase tracking-widest text-muted mb-3">{children}</h2>;
}

function PrimaryActionLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-block px-4 py-2.5 rounded-lg bg-gold-dim text-obsidian text-xs font-bold min-h-11 leading-[1.6]"
    >
      {children}
    </Link>
  );
}

/**
 * Nunca mostra o carrossel EventBanner mock nem contagem de eventos —
 * a Sprint 43E confirmou que ambos vêm de `mock-events.ts`. Só o
 * resultado recente REAL (se existir) e a ação real de jogar.
 */
function JogarPanel({ viewModel }: { viewModel: HomeV2ViewModel }) {
  const { recentResult } = viewModel.playSummary;
  return (
    <div className="space-y-3">
      <PanelHeading>Jogar</PanelHeading>
      <p className="text-parchment text-sm">
        {viewModel.playSummary.wins}V · {viewModel.playSummary.draws}E ·{' '}
        {viewModel.playSummary.losses}D · {Math.round(viewModel.playSummary.winRate * 100)}% de
        vitórias
      </p>
      {recentResult ? (
        <p className="text-muted text-xs">
          Última partida:{' '}
          {recentResult.outcome === 'win'
            ? 'vitória'
            : recentResult.outcome === 'draw'
              ? 'empate'
              : 'derrota'}{' '}
          {recentResult.homeScore}-{recentResult.awayScore} vs {recentResult.opponent}
        </p>
      ) : (
        <p className="text-muted text-xs">Nenhuma partida jogada ainda.</p>
      )}
      <p className="text-muted text-[10px]">
        Liga WL e Copa do Mundo ainda não têm rota própria — só a Partida Rápida está disponível
        hoje.
      </p>
      <PrimaryActionLink href="/match">Jogar agora</PrimaryActionLink>
    </div>
  );
}

function SquadPanel({ viewModel }: { viewModel: HomeV2ViewModel }) {
  const { squadSummary } = viewModel;
  return (
    <div className="space-y-3">
      <PanelHeading>Meu Squad</PanelHeading>
      {squadSummary ? (
        <>
          <p className="text-parchment text-sm">Formação {squadSummary.formation}</p>
          <p className="text-muted text-xs">
            OVR {squadSummary.overall} · Química {squadSummary.chemistry}%
          </p>
          <PrimaryActionLink href="/squad">Editar squad</PrimaryActionLink>
        </>
      ) : (
        <>
          <p className="text-muted text-xs">Você ainda não montou um squad.</p>
          <PrimaryActionLink href="/squad">Montar squad</PrimaryActionLink>
        </>
      )}
    </div>
  );
}

function CollectionPanel({ viewModel }: { viewModel: HomeV2ViewModel }) {
  const { ownedCount, catalogCount, completionPercent } = viewModel.collectionSummary;
  return (
    <div className="space-y-3">
      <PanelHeading>Coleção</PanelHeading>
      <p className="text-parchment text-sm">{ownedCount} cartas possuídas</p>
      <p className="text-muted text-xs">
        {completionPercent}% do catálogo ({ownedCount}/{catalogCount})
      </p>
      <PrimaryActionLink href="/collection">Abrir coleção</PrimaryActionLink>
    </div>
  );
}

/** Sempre somente-leitura — nunca mostra listagem/preço/atividade (nenhuma fonte real existe hoje, ver view-model.ts). */
function MarketPanel({ viewModel }: { viewModel: HomeV2ViewModel }) {
  return (
    <div className="space-y-3">
      <PanelHeading>Mercado</PanelHeading>
      <p className="text-muted text-xs">
        {viewModel.marketplaceSummary.readOnly
          ? 'Mercado em modo somente-leitura — compra e venda ainda não estão disponíveis.'
          : ''}
      </p>
      <button
        type="button"
        disabled
        aria-disabled="true"
        title="Transações de mercado ainda não estão disponíveis"
        className="px-4 py-2.5 rounded-lg bg-white/5 text-muted text-xs font-bold min-h-11 cursor-not-allowed"
      >
        Comprar/vender — indisponível
      </button>
    </div>
  );
}

function PacksPanel({ viewModel }: { viewModel: HomeV2ViewModel }) {
  const { availablePackNames, canPurchase } = viewModel.packSummary;
  return (
    <div className="space-y-3">
      <PanelHeading>Packs</PanelHeading>
      {availablePackNames.length > 0 && (
        <ul className="text-parchment text-xs space-y-1">
          {availablePackNames.map((name) => (
            <li key={name}>· {name}</li>
          ))}
        </ul>
      )}
      <p className="text-muted text-[10px]">
        Packs são abertos imediatamente na compra — não existe inventário de packs guardados hoje.
      </p>
      {canPurchase ? (
        <PrimaryActionLink href="/packs">Abrir pacotes</PrimaryActionLink>
      ) : (
        <p className="text-muted text-xs">Nenhum pack disponível no momento.</p>
      )}
    </div>
  );
}
