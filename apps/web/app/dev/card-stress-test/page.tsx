/**
 * app/dev/card-stress-test/page.tsx — Sprint 18.9 (Premium Card Engine —
 * Final Assembly, item 6: Asset Stress Test)
 *
 * Ferramenta interna: renderiza N `PlayerCard` reais simultaneamente (1,
 * 10, 50, 200) e mede FPS ao vivo — não é uma tela de jogo. Protegida pelo
 * mesmo middleware de auth que qualquer rota não-pública (ver
 * `middleware.ts`), igual `/dev/card-assets`.
 */
import { CardStressTestGrid } from '@/components/dev/CardStressTestGrid';
import { ALL_RARITY_CODES } from '@/lib/card-asset-loader';
import { allPlayers } from '@/lib/dev/card-asset-expectations';

export const dynamic = 'force-dynamic';

export default function CardStressTestPage() {
  const players = allPlayers();

  return <CardStressTestGrid players={players} rarityCodes={ALL_RARITY_CODES} />;
}
