import type { Metadata } from 'next';
import { DashboardView } from '@/components/layout/dashboard-view';

export const metadata: Metadata = { title: 'Início' };

export default function DashboardPage() {
  return <DashboardView />;
}
