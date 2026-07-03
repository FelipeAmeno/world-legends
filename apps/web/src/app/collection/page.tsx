import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Coleção' };
import { CollectionPage } from '@/components/collection/collection-page';
export default function Page() { return <CollectionPage />; }
