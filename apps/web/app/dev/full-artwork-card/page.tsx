/**
 * app/dev/full-artwork-card/page.tsx — Sprint 35D (Full Card Artwork
 * Pipeline Reset)
 *
 * Única rota que expõe `FullArtworkWorldLegendsCard` (item 10 do
 * brief). Protegida pelo mesmo middleware de auth que qualquer rota
 * não-pública, igual `/dev/card-assets`.
 */
import { FullArtworkCardPage } from '@/components/dev/FullArtworkCardPage';

export const dynamic = 'force-dynamic';

export default function FullArtworkCardRoute() {
  return <FullArtworkCardPage />;
}
