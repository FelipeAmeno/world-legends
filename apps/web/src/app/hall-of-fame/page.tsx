import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Hall da Fama' };
import { HallOfFamePage } from '@/components/ranking/hall-of-fame-page';
export default function Page() { return <HallOfFamePage />; }
