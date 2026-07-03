import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Craft' };
import { CraftPage } from '@/components/collection/craft-page';
export default function Page() { return <CraftPage />; }
