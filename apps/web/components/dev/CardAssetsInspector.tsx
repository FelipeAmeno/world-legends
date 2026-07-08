'use client';

/**
 * components/dev/CardAssetsInspector.tsx — Sprint 18.6.5 (Asset Production Pipeline)
 *
 * Ferramenta interna: mostra o que o pipeline de assets encontrou/não
 * encontrou em disco, com diagnóstico por arquivo (resolução, aspect
 * ratio, transparência, tamanho, metadata aplicada), e um preview ao vivo
 * do PlayerCard real (sem alterar o componente) pra qualquer combinação.
 */

import { CARD_ASPECT_RATIO, RECOMMENDED_MIN_WIDTH } from '@/lib/dev/card-asset-constants';
import type { AssetDiagnostic, CategoryDiagnostics } from '@/lib/dev/card-asset-diagnostics';
import type { RarityCode } from '@world-legends/types';
import { useState } from 'react';
import { CardPreviewPanel } from './CardPreviewPanel';

type Props = {
  categories: CategoryDiagnostics[];
  rarityCodes: readonly RarityCode[];
  nationalities: readonly string[];
  players: ReadonlyArray<{ id: string; knownAs: string; nationality: string }>;
};

export function CardAssetsInspector({ categories, rarityCodes, nationalities, players }: Props) {
  return (
    <div className="min-h-screen bg-[#07080f] text-white/90 px-4 py-8 sm:px-8">
      <header className="mb-8 max-w-5xl mx-auto">
        <h1 className="font-display text-2xl text-parchment mb-1">Card Assets Inspector</h1>
        <p className="text-white/40 text-sm">
          Ferramenta interna (Sprint 18.6.5) — não é uma tela de jogo. Mostra o que o pipeline de
          assets encontra em <code className="text-white/60">public/assets/cards/</code>, o que
          falta, e um preview ao vivo do <code className="text-white/60">PlayerCard</code> real, sem
          alterar o componente.
        </p>
        <p className="text-white/30 text-xs mt-2">
          Resolução recomendada: proporção {CARD_ASPECT_RATIO.toFixed(3)} (a mesma do card), largura
          mínima {RECOMMENDED_MIN_WIDTH}px.
        </p>
      </header>

      <div className="max-w-5xl mx-auto space-y-8">
        <CardPreviewPanel
          rarityCodes={rarityCodes}
          nationalities={nationalities}
          players={players}
        />

        <section>
          <h2 className="font-display text-lg text-parchment mb-3">Resumo por categoria</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {categories.map((cat) => (
              <SummaryCard key={cat.category} category={cat} />
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-lg text-parchment">Diagnóstico por asset</h2>
          {categories.map((cat) => (
            <CategoryTable key={cat.category} category={cat} />
          ))}
        </section>
      </div>
    </div>
  );
}

function SummaryCard({ category }: { category: CategoryDiagnostics }) {
  const pct =
    category.expectedCount > 0
      ? Math.round((category.foundCount / category.expectedCount) * 100)
      : 0;
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">{category.category}</p>
      <p className="font-display text-xl text-parchment">
        {category.foundCount}
        <span className="text-white/30 text-sm"> / {category.expectedCount}</span>
      </p>
      <div className="h-1 rounded-full bg-white/10 mt-2 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: pct === 100 ? '#10b981' : '#c9a84c' }}
        />
      </div>
    </div>
  );
}

function CategoryTable({ category }: { category: CategoryDiagnostics }) {
  const [open, setOpen] = useState(category.foundCount > 0);
  const missing = category.assets.filter((a) => !a.found);
  const found = category.assets.filter((a) => a.found);

  return (
    <div className="rounded-xl border border-white/10 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white/[0.03] hover:bg-white/[0.05] transition-colors text-left"
      >
        <span className="font-semibold text-sm">{category.category}</span>
        <span className="text-white/40 text-xs">
          {category.foundCount} encontrados · {missing.length} faltando {open ? '▲' : '▼'}
        </span>
      </button>

      {open && (
        <div className="max-h-[420px] overflow-y-auto">
          {found.length > 0 && (
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-[#0b0d16] text-white/40">
                <tr>
                  <th className="text-left px-3 py-2 font-normal">Chave</th>
                  <th className="text-left px-3 py-2 font-normal">Arquivo</th>
                  <th className="text-left px-3 py-2 font-normal">Resolução</th>
                  <th className="text-left px-3 py-2 font-normal">Aspect ratio</th>
                  <th className="text-left px-3 py-2 font-normal">Alpha</th>
                  <th className="text-left px-3 py-2 font-normal">KB</th>
                  <th className="text-left px-3 py-2 font-normal">Metadata</th>
                </tr>
              </thead>
              <tbody>
                {found.map((a) => (
                  <AssetRow key={a.key} asset={a} />
                ))}
              </tbody>
            </table>
          )}

          {missing.length > 0 && (
            <div className="px-3 py-2 border-t border-white/5">
              <p className="text-white/30 text-[10px] uppercase tracking-wider mb-1.5">
                Faltando ({missing.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {missing.map((a) => (
                  <span
                    key={a.key}
                    className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-300/70 text-[10px]"
                  >
                    {a.key}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AssetRow({ asset: a }: { asset: AssetDiagnostic }) {
  return (
    <tr className="border-t border-white/5">
      <td className="px-3 py-2 text-white/70">{a.key}</td>
      <td className="px-3 py-2 text-white/50">{a.filename}</td>
      <td className="px-3 py-2">
        {a.width && a.height ? (
          <span className={a.resolutionOk ? 'text-emerald-400' : 'text-yellow-400'}>
            {a.width}×{a.height}
          </span>
        ) : (
          '—'
        )}
      </td>
      <td className="px-3 py-2">
        <AspectRatioCell aspectRatioOk={a.aspectRatioOk} />
      </td>
      <td className="px-3 py-2">
        <AlphaCell hasAlpha={a.hasAlpha} />
      </td>
      <td className="px-3 py-2 text-white/50">{a.sizeKb ?? '—'}</td>
      <td className="px-3 py-2 text-white/40">
        {a.meta && Object.keys(a.meta).length > 0 ? JSON.stringify(a.meta) : 'padrão'}
      </td>
    </tr>
  );
}

function AspectRatioCell({ aspectRatioOk }: { aspectRatioOk: boolean | undefined }) {
  if (aspectRatioOk === undefined) return <>—</>;
  return aspectRatioOk ? (
    <span className="text-emerald-400">OK</span>
  ) : (
    <span className="text-red-400">fora do padrão</span>
  );
}

function AlphaCell({ hasAlpha }: { hasAlpha: boolean | undefined }) {
  if (hasAlpha === undefined) return <>—</>;
  return hasAlpha ? (
    <span className="text-emerald-400">sim</span>
  ) : (
    <span className="text-yellow-400">não</span>
  );
}
