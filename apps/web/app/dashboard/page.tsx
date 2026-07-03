import { getCollection } from '@/lib/collection-data';
import { SQUAD_CHEMISTRY, SQUAD_RATING, USER_PROFILE } from '@/lib/mock-data';
import { calculateChemistry } from '@world-legends/chemistry';
/**
 * app/dashboard/page.tsx — Debug Dashboard
 *
 * Painel de desenvolvimento para inspecionar o estado interno do engine.
 * Consome packages de domínio diretamente — zero abstração intermediária.
 */
import { BASE_RARITY_WEIGHTS, CLASSIC_PACK, ELITE_PACK, LEGEND_PACK } from '@world-legends/packs';

import { BuffsPanel } from '@/components/dashboard/BuffsPanel';
import { ChemDebugPanel } from '@/components/dashboard/ChemDebugPanel';
import { DropRatesPanel } from '@/components/dashboard/DropRatesPanel';
import { LogPanel } from '@/components/dashboard/LogPanel';
import { RngInspector } from '@/components/dashboard/RngInspector';
import { TraitsPanel } from '@/components/dashboard/TraitsPanel';

export default function DashboardPage() {
  const collection = getCollection();

  // Drop rate data — ler direto dos packs de domínio
  const packData = [
    { pack: CLASSIC_PACK, id: 'classic', slots: CLASSIC_PACK.dropTable.slots },
    { pack: ELITE_PACK, id: 'elite', slots: ELITE_PACK.dropTable.slots },
    { pack: LEGEND_PACK, id: 'legend', slots: LEGEND_PACK.dropTable.slots },
  ];

  // Chemistry input para debug
  const chemPlayers = collection.slice(0, 11).map((c) => ({
    userCardId: c.cardId,
    nationality: c.nationality,
    // biome-ignore lint/suspicious/noExplicitAny: chemistry input types use branded string enums
    competition: 'brasileirao' as any,
    // biome-ignore lint/suspicious/noExplicitAny: era is already a valid string value
    era: c.era as any,
  }));
  const chemResult = calculateChemistry({ players: chemPlayers });

  // Traits da coleção
  const allTraits = collection.flatMap((c) =>
    c.traits.map((t) => ({
      name: t.name,
      tier: t.tier,
      cardName: c.displayName,
      rarityCode: c.rarityCode,
      overall: c.overall,
    })),
  );

  return (
    <div className="max-w-7xl mx-auto space-y-4 animate-[fadeIn_0.3s_ease-out]">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className="font-display text-3xl text-parchment tracking-wider">DEBUG DASHBOARD</h1>
          <p className="text-muted text-xs font-mono mt-0.5">
            world-legends · engine v{process.env.npm_package_version ?? '0.0.0'}·{' '}
            {collection.length} cards · {allTraits.length} trait assignments
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2 text-emerald-400 text-xs font-mono bg-emerald-900/20 border border-emerald-800/50 rounded-lg px-3 py-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          ENGINE ONLINE
        </div>
      </div>

      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Coluna 1: RNG + Log */}
        <div className="space-y-4">
          <RngInspector />
          <LogPanel />
        </div>

        {/* Coluna 2: Drop Rates + Traits */}
        <div className="space-y-4">
          <DropRatesPanel packs={packData} baseWeights={BASE_RARITY_WEIGHTS} />
          <TraitsPanel traits={allTraits} />
        </div>

        {/* Coluna 3: Chemistry + Buffs */}
        <div className="space-y-4">
          <ChemDebugPanel
            chemistry={chemResult}
            squadRating={SQUAD_RATING}
            players={chemPlayers.map((p, i) => ({
              ...p,
              name: collection[i]?.displayName ?? '?',
            }))}
          />
          <BuffsPanel cards={collection} />
        </div>
      </div>
    </div>
  );
}
