'use client';

/**
 * components/dev/home-v2/HomeV2ContextPanel.tsx — Sprint 43F (Home V2
 * Prototype Behind an Internal Route) + Sprint 43F.1 (Visual Hierarchy
 * and Game Identity)
 *
 * UM painel por área selecionada — nunca os 5 simultâneos. Sprint
 * 43F.1 troca o parágrafo de texto por uma composição de duas zonas
 * (info/ação primária + área visual de apoio, reusando o padrão de
 * "stat chip" já usado em QuickStats.tsx) — mas continua só dado real,
 * honesto sobre indisponibilidade (Mercado, inventário de packs).
 */

import type { HomeV2ViewModel } from '@/lib/home-v2/view-model';
import Link from 'next/link';
import { NavIcon, PLAY_ICON_PATH, type PrimaryArea } from './HomeV2Experience';

export function HomeV2ContextPanel({
  area,
  viewModel,
}: {
  area: PrimaryArea;
  viewModel: HomeV2ViewModel;
}) {
  return (
    <section aria-live="polite" className="glass-surface rounded-2xl p-4 lg:p-6 min-h-[220px]">
      {area === 'jogar' && <JogarPanel viewModel={viewModel} />}
      {area === 'squad' && <SquadPanel viewModel={viewModel} />}
      {area === 'collection' && <CollectionPanel viewModel={viewModel} />}
      {area === 'market' && <MarketPanel viewModel={viewModel} />}
      {area === 'packs' && <PacksPanel viewModel={viewModel} />}
    </section>
  );
}

function PanelHeading({ children, accent }: { children: React.ReactNode; accent: string }) {
  return (
    <h2
      className="text-[11px] uppercase tracking-[0.18em] font-bold mb-4"
      style={{ color: accent }}
    >
      {children}
    </h2>
  );
}

function PrimaryActionLink({
  href,
  accent,
  children,
}: {
  href: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-obsidian text-sm font-bold min-h-11 leading-none transition-transform hover:scale-[1.02]"
      style={{ background: accent, boxShadow: `0 8px 24px ${accent}40` }}
    >
      {children}
    </Link>
  );
}

/** Faixa de "stat chips" — mesmo padrão visual de components/home/QuickStats.tsx, sem duplicar o componente (dados diferentes por painel). */
function StatChipRow({
  stats,
}: {
  stats: Array<{ label: string; value: string | number; color: string }>;
}) {
  return (
    <div className="glass-card rounded-xl overflow-hidden flex items-stretch">
      {stats.map((s, i) => (
        <div
          key={s.label}
          className="flex-1 flex flex-col items-center justify-center py-3 gap-1"
          style={i < stats.length - 1 ? { borderRight: '1px solid rgba(255,255,255,0.06)' } : {}}
        >
          <p
            className="font-display text-[22px] leading-none tabular-nums"
            style={{ color: s.color, textShadow: `0 0 12px ${s.color}55` }}
          >
            {s.value}
          </p>
          <p className="text-[9px] uppercase tracking-wider text-white/40">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

/** Layout de 2 zonas: info/ação primária à esquerda, apoio visual à direita (desktop) — empilhado em mobile. */
function TwoZonePanel({
  primary,
  support,
}: {
  primary: React.ReactNode;
  support: React.ReactNode;
}) {
  return (
    <div className="lg:grid lg:grid-cols-[1fr_auto] lg:gap-8 lg:items-center space-y-5 lg:space-y-0">
      <div>{primary}</div>
      <div className="lg:w-[220px]">{support}</div>
    </div>
  );
}

/** Composição de estado vazio/indisponível — nunca uma frase solta flutuando num painel grande. */
function UnavailableState({
  icon,
  title,
  description,
  accent,
}: {
  icon: string;
  title: string;
  description: string;
  accent: string;
}) {
  return (
    <div className="flex flex-col items-center text-center gap-2 py-6">
      <span
        className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
        style={{ background: `${accent}14`, border: `1px solid ${accent}30` }}
        aria-hidden="true"
      >
        {icon}
      </span>
      <p className="text-parchment text-sm font-bold">{title}</p>
      <p className="text-white/45 text-xs max-w-xs">{description}</p>
    </div>
  );
}

/**
 * Nunca restaura o EventBanner mock nem contagem de eventos (Sprint
 * 43E confirmou que ambos vêm de dado fabricado). Estatísticas reais
 * como chips de jogo, não parágrafo.
 */
function JogarPanel({ viewModel }: { viewModel: HomeV2ViewModel }) {
  const { wins, draws, losses, winRate, recentResult } = viewModel.playSummary;
  const accent = '#10b981';
  return (
    <TwoZonePanel
      primary={
        <>
          <PanelHeading accent={accent}>Jogar</PanelHeading>
          <StatChipRow
            stats={[
              { label: 'Vitórias', value: wins, color: accent },
              { label: 'Empates', value: draws, color: '#c9a84c' },
              { label: 'Derrotas', value: losses, color: '#ef4444' },
              { label: 'Aproveitamento', value: `${Math.round(winRate * 100)}%`, color: '#3b82f6' },
            ]}
          />
          {recentResult ? (
            <p className="text-white/50 text-xs mt-4">
              Última partida:{' '}
              <span className="text-parchment font-semibold">
                {recentResult.outcome === 'win'
                  ? 'vitória'
                  : recentResult.outcome === 'draw'
                    ? 'empate'
                    : 'derrota'}
              </span>{' '}
              {recentResult.homeScore}-{recentResult.awayScore} vs {recentResult.opponent}
            </p>
          ) : (
            <p className="text-white/40 text-xs mt-4">Nenhuma partida jogada ainda.</p>
          )}
          <p className="text-white/45 text-[10px] mt-2 leading-relaxed">
            Liga WL e Copa do Mundo ainda não têm rota própria — só a Partida Rápida está disponível
            hoje.
          </p>
        </>
      }
      support={
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-full rounded-xl px-3 py-2.5 text-center"
            style={{ background: `${accent}12`, border: `1px solid ${accent}30` }}
          >
            <p className="text-[9px] uppercase tracking-wider text-white/45 mb-0.5">
              Modo disponível
            </p>
            <p className="text-parchment text-xs font-bold">Partida Rápida</p>
          </div>
          <PrimaryActionLink href="/match" accent={accent}>
            <NavIcon d={PLAY_ICON_PATH} size={16} />
            Jogar agora
          </PrimaryActionLink>
        </div>
      }
    />
  );
}

function SquadPanel({ viewModel }: { viewModel: HomeV2ViewModel }) {
  const { squadSummary } = viewModel;
  const accent = '#3b82f6';

  if (!squadSummary) {
    return (
      <>
        <PanelHeading accent={accent}>Meu Squad</PanelHeading>
        <UnavailableState
          icon="⚔️"
          title="Você ainda não montou um squad"
          description="Escale seus 11 titulares pra ver OVR e química reais aqui."
          accent={accent}
        />
        <div className="flex justify-center">
          <PrimaryActionLink href="/squad" accent={accent}>
            Montar squad
          </PrimaryActionLink>
        </div>
      </>
    );
  }

  return (
    <TwoZonePanel
      primary={
        <>
          <PanelHeading accent={accent}>Meu Squad</PanelHeading>
          <p className="text-parchment text-sm font-bold mb-3">Formação {squadSummary.formation}</p>
          <StatChipRow
            stats={[
              { label: 'OVR', value: squadSummary.overall, color: '#c9a84c' },
              { label: 'Química', value: `${squadSummary.chemistry}%`, color: accent },
            ]}
          />
        </>
      }
      support={
        <PrimaryActionLink href="/squad" accent={accent}>
          Editar squad
        </PrimaryActionLink>
      }
    />
  );
}

function CollectionPanel({ viewModel }: { viewModel: HomeV2ViewModel }) {
  const { ownedCount, catalogCount, completionPercent } = viewModel.collectionSummary;
  const accent = '#f59e0b';
  return (
    <TwoZonePanel
      primary={
        <>
          <PanelHeading accent={accent}>Coleção</PanelHeading>
          <p className="text-parchment text-sm font-bold mb-2">{ownedCount} cartas possuídas</p>
          <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden mb-1.5">
            <div
              className="h-full rounded-full"
              style={{
                width: `${completionPercent}%`,
                background: `linear-gradient(90deg, ${accent}88, ${accent})`,
              }}
            />
          </div>
          <p className="text-white/45 text-xs">
            {completionPercent}% do catálogo ({ownedCount}/{catalogCount})
          </p>
        </>
      }
      support={
        <PrimaryActionLink href="/collection" accent={accent}>
          Abrir coleção
        </PrimaryActionLink>
      }
    />
  );
}

/** Sempre somente-leitura — nunca listagem/preço/atividade (nenhuma fonte real existe hoje, ver view-model.ts). */
function MarketPanel({ viewModel }: { viewModel: HomeV2ViewModel }) {
  const accent = '#c084fc';
  return (
    <>
      <PanelHeading accent={accent}>Mercado</PanelHeading>
      <UnavailableState
        icon="🔒"
        title="Mercado em modo somente-leitura"
        description={
          viewModel.marketplaceSummary.readOnly
            ? 'Compra e venda entre jogadores ainda não estão disponíveis nesta versão.'
            : ''
        }
        accent={accent}
      />
      <div className="flex justify-center">
        <button
          type="button"
          disabled
          aria-disabled="true"
          title="Transações de mercado ainda não estão disponíveis"
          className="px-5 py-3 rounded-xl bg-white/5 text-white/35 text-sm font-bold min-h-11 cursor-not-allowed border border-white/10"
        >
          Comprar/vender — indisponível
        </button>
      </div>
    </>
  );
}

function PacksPanel({ viewModel }: { viewModel: HomeV2ViewModel }) {
  const { availablePackNames, canPurchase } = viewModel.packSummary;
  const accent = '#e6c85a';

  if (!canPurchase) {
    return (
      <>
        <PanelHeading accent={accent}>Packs</PanelHeading>
        <UnavailableState
          icon="📦"
          title="Nenhum pack disponível"
          description="Não há pacotes à venda no momento."
          accent={accent}
        />
      </>
    );
  }

  return (
    <TwoZonePanel
      primary={
        <>
          <PanelHeading accent={accent}>Packs</PanelHeading>
          <div className="flex flex-wrap gap-2 mb-3">
            {availablePackNames.map((name) => (
              <span
                key={name}
                className="px-3 py-1.5 rounded-full text-xs font-bold glass-gold text-parchment"
              >
                {name}
              </span>
            ))}
          </div>
          <p className="text-white/35 text-[10px]">
            Packs são abertos imediatamente na compra — não existe inventário de packs guardados
            hoje.
          </p>
        </>
      }
      support={
        <PrimaryActionLink href="/packs" accent={accent}>
          Abrir pacotes
        </PrimaryActionLink>
      }
    />
  );
}
