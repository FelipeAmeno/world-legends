/**
 * app/dev/pack-reveal-qa/page.tsx — Sprint 34 (Official Art Pack
 * Integration, item 7: Pack Reveal — modo de QA protegido).
 *
 * Protegida pelo mesmo middleware de auth que qualquer rota não-pública
 * (ver `middleware.ts`), igual `/dev/card-assets` e `/dev/card-v3-gallery`.
 */
import { PackRevealQaHarness } from '@/components/dev/PackRevealQaHarness';

export const dynamic = 'force-dynamic';

export default function PackRevealQaPage() {
  return <PackRevealQaHarness />;
}
