import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Álbum' };
import { AlbumPage } from '@/components/collection/album-page';
export default function Page() { return <AlbumPage />; }
