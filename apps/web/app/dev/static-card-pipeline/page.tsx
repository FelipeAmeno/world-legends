/**
 * app/dev/static-card-pipeline/page.tsx — Sprint 35B (Static Card
 * Pipeline Foundation)
 *
 * Único lugar onde `StaticWorldLegendsCard` é exposto (item 11 do
 * brief). Protegida pelo mesmo middleware de auth que qualquer rota
 * não-pública, igual `/dev/card-assets`.
 */
import { StaticCardPipelineComparison } from '@/components/dev/StaticCardPipelineComparison';

export const dynamic = 'force-dynamic';

export default function StaticCardPipelinePage() {
  return <StaticCardPipelineComparison />;
}
