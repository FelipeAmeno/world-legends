import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Elenco' };
import { TeamPage } from '@/components/team/team-page';
export default function Page() { return <TeamPage />; }
