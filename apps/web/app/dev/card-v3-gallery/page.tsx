/**
 * app/dev/card-v3-gallery/page.tsx — Sprint 34 (Official Art Pack
 * Integration)
 *
 * Ferramenta interna: 5 cartas de validação lado a lado, nas 3
 * densidades, com toggle de camada e comparação com a referência oficial.
 * Protegida pelo mesmo middleware de auth que qualquer rota não-pública
 * (ver `middleware.ts`), igual `/dev/card-assets`.
 */
import { CardV3Gallery } from '@/components/dev/CardV3Gallery';

export const dynamic = 'force-dynamic';

export default function CardV3GalleryPage() {
  return <CardV3Gallery />;
}
