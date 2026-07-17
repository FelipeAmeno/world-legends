'use client';

/**
 * components/dev/home-v2-shell/HomeV2AreaSwitcher.tsx — Sprint 43G (AppShell
 * Integration)
 *
 * Substitui o `PrimaryNav` de 5 abas grandes (`HomeV2Experience.tsx`) — que
 * o QA do dono apontou como uma segunda navegação primária competindo com
 * a Sidebar/GameTopBar (desktop) e MobileHeader/PremiumBottomNav (mobile)
 * já compartilhados por Coleção/Álbum/Conquistas/Squad. Aqui é uma faixa de
 * abas fina, de uma linha só, sem caixas de glow por item — claramente um
 * controle de conteúdo secundário (como abas de uma página de perfil),
 * nunca uma barra de navegação global.
 *
 * Reusa `PRIMARY_AREAS`/`NavIcon`/`PrimaryArea` de `HomeV2Experience.tsx`
 * (exportados na Sprint 43G especificamente pra isso) — nenhuma config de
 * ícone/cor/rótulo duplicada.
 */

import { NavIcon, PRIMARY_AREAS, type PrimaryArea } from '../home-v2/HomeV2Experience';

export function HomeV2AreaSwitcher({
  activeArea,
  onSelect,
}: {
  activeArea: PrimaryArea;
  onSelect: (area: PrimaryArea) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Áreas da Home"
      className="flex items-stretch gap-1 overflow-x-auto"
    >
      {PRIMARY_AREAS.map((area) => {
        const selected = area.id === activeArea;
        return (
          <button
            key={area.id}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-current={selected ? 'true' : undefined}
            onClick={() => onSelect(area.id)}
            className="shrink-0 min-h-11 flex items-center gap-1.5 px-3 border-b-2 text-xs font-bold transition-colors"
            style={{
              borderColor: selected ? area.accent : 'transparent',
              color: selected ? area.accent : 'rgba(255,255,255,0.45)',
            }}
          >
            <NavIcon d={area.icon} size={15} />
            {area.label}
          </button>
        );
      })}
    </div>
  );
}
