import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Packs' };
import { PacksPage } from '@/components/packs/packs-page';
export default function Page() { return <PacksPage />; }
