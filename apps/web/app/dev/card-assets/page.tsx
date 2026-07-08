/**
 * app/dev/card-assets/page.tsx — Sprint 18.6.5 (Asset Production Pipeline)
 *
 * Página interna de inspeção do pipeline de assets das cartas. Não é uma
 * funcionalidade de jogo — é uma ferramenta pra time/artistas conferirem o
 * que já existe, o que falta, e pré-visualizarem qualquer combinação
 * raridade × seleção × arte de jogador usando o PlayerCard real, sem
 * modificar o componente em nada.
 */
import { CardAssetsInspector } from '@/components/dev/CardAssetsInspector';
import { ALL_RARITY_CODES } from '@/lib/card-asset-loader';
import { buildAllCardAssetDiagnostics } from '@/lib/dev/card-asset-diagnostics';
import { allKitNationalities, allPlayers } from '@/lib/dev/card-asset-expectations';

export const dynamic = 'force-dynamic';

export default function CardAssetsDevPage() {
  const categories = buildAllCardAssetDiagnostics();
  const nationalities = allKitNationalities();
  const players = allPlayers();

  return (
    <CardAssetsInspector
      categories={categories}
      rarityCodes={ALL_RARITY_CODES}
      nationalities={nationalities}
      players={players}
    />
  );
}
