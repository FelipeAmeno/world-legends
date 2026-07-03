import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Ranking' };
import { RankingPage } from '@/components/ranking/ranking-page';
export default function Page() { return <RankingPage />; }
