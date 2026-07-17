'use client';

/**
 * components/dev/home-v2-shell/HomeV2ShellExperience.tsx — Sprint 43G
 * (AppShell Integration)
 *
 * Segunda variante do conteúdo da Home V2, isolada em `/dev/home-v2-shell`.
 * QA do dono aprovou o conteúdo/experiência visual da Sprint 43F.2
 * (`HomeV2Experience.tsx`, protótipo fullscreen em `/dev/home-v2`) mas
 * pediu que a versão final não tenha shell própria — deve viver DENTRO da
 * AppShell compartilhada (a mesma Sidebar/GameTopBar/MobileHeader/
 * PremiumBottomNav que Coleção/Álbum/Conquistas/Squad já usam), nunca uma
 * segunda casca de header + navegação de 5 abas competindo com a real.
 *
 * O que muda em relação ao protótipo fullscreen:
 *   - Nenhum cabeçalho de identidade/nível/XP/moedas/configurações próprio
 *     é renderizado aqui — esses dados já vêm de graça da casca global
 *     compartilhada (mesmo `headerSummary` real que toda outra página
 *     autenticada já recebe do RootLayout).
 *   - A faixa de 5 abas grandes do protótipo fullscreen foi trocada por
 *     `HomeV2AreaSwitcher`, uma faixa de abas fina (conteúdo, não
 *     navegação global).
 *
 * O que NÃO muda (preservado exatamente):
 *   - `HeroSection` — mesmo componente exportado de `HomeV2Experience.tsx`,
 *     nunca reimplementado. Cartas em destaque, escala responsiva,
 *     `selectHeroPresentation()` sobre `selectTopCards()` — tudo idêntico.
 *   - `HomeV2ContextPanel` — mesmo componente dos 5 painéis (Jogar/Meu
 *     Squad/Coleção/Mercado/Packs), reusado sem nenhuma alteração.
 *   - Dado real, view-model idêntico, nenhuma fonte nova.
 */

import { HomeV2ContextPanel } from '@/components/dev/home-v2/HomeV2ContextPanel';
import { HeroSection, type PrimaryArea } from '@/components/dev/home-v2/HomeV2Experience';
import { selectHeroPresentation } from '@/lib/home-v2/select-hero-presentation';
import type { HomeV2ViewModel } from '@/lib/home-v2/view-model';
import { useMemo, useState } from 'react';
import { HomeV2AreaSwitcher } from './HomeV2AreaSwitcher';

export function HomeV2ShellExperience({ viewModel }: { viewModel: HomeV2ViewModel }) {
  const [activeArea, setActiveArea] = useState<PrimaryArea>('jogar');
  const presentation = useMemo(
    () => selectHeroPresentation(viewModel.highlightedCards),
    [viewModel.highlightedCards],
  );

  return (
    <div className="max-w-5xl mx-auto space-y-4 lg:space-y-5">
      <HeroSection presentation={presentation} />

      <div className="glass-surface rounded-2xl px-2 pt-1">
        <HomeV2AreaSwitcher activeArea={activeArea} onSelect={setActiveArea} />
      </div>

      <HomeV2ContextPanel area={activeArea} viewModel={viewModel} />
    </div>
  );
}
